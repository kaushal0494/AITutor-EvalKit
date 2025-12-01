import os
import logging

import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score, accuracy_score
from transformers import AutoTokenizer, AutoModelForCausalLM, set_seed, EarlyStoppingCallback
from peft import LoraConfig, get_peft_model
from trl import SFTConfig, SFTTrainer, DataCollatorForCompletionOnlyLM
from colorama import Fore, init as colorama_init

from utils.argparse import parse_args
from utils.constants import TARGET_MODULES_MAP, SEED
from utils.data_loader import load_datasets
from utils.prompt import DatasetFormatter
from utils.sampler import MultiTaskBatchSampler, inspect_batches

set_seed(SEED)

# Initialize colorama for colored console output
colorama_init(autoreset=True)

# Configure logging
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)
# Reduce verbosity for some libraries
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class FeatureFilterCollator:
    """Wraps a base collator and drops non-tensor features before collation."""

    def __init__(self, base_collator, keys_to_keep):
        self.base_collator = base_collator
        self.keys_to_keep = set(keys_to_keep)

        # expose tokenizer attribute if present so downstream code can access it
        if hasattr(base_collator, "tokenizer"):
            self.tokenizer = base_collator.tokenizer

    def __call__(self, features):
        filtered = [
            {k: v for k, v in feature.items() if k in self.keys_to_keep}
            for feature in features
        ]
        return self.base_collator(filtered)

class ModelTrainer:
    """Handles the complete model training pipeline"""

    def __init__(self, args):
        self.args = args
        self.tokenizer = None
        self.model = None
        self.trainer = None

    def _setup_logging(self):
        """Log training configuration"""
        logger.info(Fore.CYAN + "\n========== Starting LoRA Fine-Tuning ==========\n")
        logger.info(f"Model: {self.args.model_name}")
        logger.info(f"Input data directory: {self.args.data_dir}")
        logger.info(f"Selected evaluation dimensions: {self.args.dimensions}")
        logger.info(f"Output directory: {self.args.output_dir}")
        logger.info(f"Batch size: {self.args.batch_size}")
        logger.info(f"Epochs: {self.args.epochs}")
        logger.info(f"Learning rate: {self.args.learning_rate}")

    def _initialize_tokenizer(self):
        """Initialize and configure the tokenizer"""
        logger.info(f"Loading tokenizer: {self.args.model_name}")
        tokenizer = AutoTokenizer.from_pretrained(self.args.model_name, trust_remote_code=True)
        # Set up pad token for proper training
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            tokenizer.pad_token_id = tokenizer.eos_token_id
        tokenizer.padding_side = "right"  # Fix weird overflow issue with fp16 training
        logger.debug(f"Tokenizer vocab size: {len(tokenizer)}")
        return tokenizer

    def _initialize_model(self):
        """Initialize and configure the base model"""
        logger.info(f"Loading model: {self.args.model_name}")
        model = AutoModelForCausalLM.from_pretrained(
            self.args.model_name,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            attn_implementation="eager",
        )
        return model

    def _apply_lora(self, model, r=8, lora_alpha=32, lora_dropout=0.05):
        """Apply LoRA configuration to the model using parameters from args"""
        logger.info(f"Applying LoRA configuration: r={r}, alpha={lora_alpha}, dropout={lora_dropout}")
        peft_config = LoraConfig(
            r=r,
            lora_alpha=lora_alpha,
            lora_dropout=lora_dropout,
            target_modules=list(TARGET_MODULES_MAP.keys()),
            task_type="CAUSAL_LM",
        )

        model = get_peft_model(model, peft_config)

        # Freeze base model parameters
        for name, param in model.named_parameters():
            if "lora" not in name.lower():  # Only LoRA params remain trainable
                param.requires_grad = False

        total_params = sum(p.numel() for p in model.parameters())
        trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
        logger.info(f"Total params: {total_params:,}, Trainable params: {trainable_params:,} ({100*trainable_params/total_params:.2f}%)")

        return model

    def train(self):
        """Execute the complete training pipeline"""
        self._setup_logging()

        # Load and prepare data
        train_dataset, eval_dataset = load_datasets(self.args.data_dir, self.args.dimensions, oversample_method=self.args.oversample_method)
        self.tokenizer = self._initialize_tokenizer()

        # Format datasets
        logger.info("Formatting training dataset...")
        train_dataset = train_dataset.map(
            lambda x: DatasetFormatter.create_dataset(x, self.tokenizer, max_length=self.args.max_length, include_label_definitions=self.args.include_label_definitions),
            batched=True,
        )
        
        logger.info("Formatting evaluation dataset...")
        eval_dataset = eval_dataset.map(
            lambda x: DatasetFormatter.create_dataset(x, self.tokenizer, max_length=self.args.max_length, include_label_definitions=self.args.include_label_definitions),
            batched=True,
        )

        logger.info(f"Loaded {len(train_dataset)} training samples")
        logger.info(f"Loaded {len(eval_dataset)} evaluation samples")
        logger.info(f"Debugging sample: {train_dataset[0]}")
        

        # Initialize model
        self.model = self._initialize_model()
        self.model = self._apply_lora(
            self.model,
            r=self.args.lora_r,
            lora_alpha=self.args.lora_alpha,
            lora_dropout=self.args.lora_dropout
        )

        response_template = "Now provide the classification label:"
        base_collator = DataCollatorForCompletionOnlyLM(
            response_template=response_template,
            tokenizer=self.tokenizer,
            mlm=False
        )

        # Ensure only tensor-friendly keys reach the underlying collator
        token_keys = set(self.tokenizer.model_input_names or [])
        token_keys.update({"input_ids", "attention_mask", "labels"})
        token_keys.update(
            key for key in ("position_ids", "token_type_ids") if key in train_dataset.column_names
        )
        collator = FeatureFilterCollator(base_collator, keys_to_keep=token_keys)

        # Configure training arguments
        logger.info("Configuring training arguments...")
        training_args = SFTConfig(
            max_length=self.args.max_length,
            output_dir=self.args.output_dir,
            num_train_epochs=self.args.epochs,
            per_device_train_batch_size=self.args.batch_size,
            per_device_eval_batch_size=self.args.batch_size,
            gradient_accumulation_steps=self.args.gradient_accumulation_steps,
            learning_rate=self.args.learning_rate,
            warmup_ratio=0.1,   # 10% of total training steps
            lr_scheduler_type="cosine",
            weight_decay=self.args.weight_decay,
            logging_steps=self.args.logging_steps,
            save_steps=self.args.save_steps,
            eval_strategy="steps",
            eval_steps=self.args.eval_steps,
            save_total_limit=1,
            load_best_model_at_end=True,
            bf16=True,           # enable BF16 mixed precision
            fp16=False,          # ensure FP16 is off
            report_to="none",
            dataloader_num_workers=4,
            dataloader_pin_memory=True,
            resume_from_checkpoint=False,
            overwrite_output_dir=True,
            max_grad_norm=1.0,  # clip gradients
            logging_first_step=True,
            batch_eval_metrics=False,
            completion_only_loss=True,
            metric_for_best_model=self.args.metric_for_best,
            greater_is_better=False if self.args.metric_for_best in ["eval_loss", "loss"] else True,
        )
        
        # # Initialize trainer
        logger.info("Initializing SFTTrainer...")
        self.trainer = SFTTrainer(
            model=self.model,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            args=training_args,
            data_collator=collator,
            callbacks=[EarlyStoppingCallback(
                    early_stopping_patience=getattr(self.args, "early_stopping_patience", 5),      # wait for 3 evals without improvement
                    early_stopping_threshold=getattr(self.args, "early_stopping_threshold", 0.0)    # require strictly better metric
                )],
        )

        # Start training
        logger.info(Fore.YELLOW + "Starting training...")
        self.trainer.train()
        logger.info(Fore.GREEN + "Training completed.")

        # Save results
        self._save_model()

    def _save_model(self):
        """Save the trained model and tokenizer"""
        output_dir = os.path.join(self.args.output_dir, "lora_model")
        logger.info(f"Saving model and tokenizer to: {output_dir}")
        
        self.trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        
        logger.info(Fore.GREEN + f"LoRA model saved successfully at: {output_dir}")

def main():
    """Main execution function"""
    args = parse_args()
    
    if args.train:
        if not os.path.exists(args.output_dir):
            os.makedirs(args.output_dir)
            
        trainer = ModelTrainer(args)
        trainer.train()
    else:
        logger.warning("No action specified. Use --train to start training.")


if __name__ == "__main__":
    main()