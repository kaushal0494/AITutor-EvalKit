# args_parser.py
"""
Argument parser for LoRA Fine-Tuning on Pedagogical Response Classification.

Provides all configurable hyperparameters and training/evaluation options.
"""

import argparse

def parse_args():
    """Parse command-line arguments for training, evaluation, and model configuration."""

    parser = argparse.ArgumentParser(
        description="LoRA Fine-Tuning"
    )

    # ----------------------
    # General options
    # ----------------------
    parser.add_argument(
        "--train", action="store_true",
        help="Run training pipeline"
    )
    parser.add_argument(
        "--model_name", type=str, required=True,
        help="Base model to fine-tune (HuggingFace model name)"
    )
    parser.add_argument(
        "--data_dir", type=str, default=None,
        help="Directory containing train/dev/test CSV files (for training)"
    )
    parser.add_argument(
        "--eval_file", type=str, default=None,
        help="CSV file for evaluation/prediction"
    )
    parser.add_argument(
        "--dimensions", nargs="+", default=None,
        help="Tuples of dimensions to include (e.g., MI ML PG AC)"
    )
    parser.add_argument(
        "--output_dir", type=str, default="./outputs",
        help="Directory to save trained model, outputs, and checkpoints"
    )
    parser.add_argument(
        "--max_length", type=int, default=512,
        help="Maximum sequence length for tokenization"
    )
    parser.add_argument(
        "--batch_size", type=int, default=1,
        help="Training batch size per device"
    )
    parser.add_argument(
        "--gradient_accumulation_steps", type=int, default=16,
        help="Number of gradient accumulation steps"
    )
    parser.add_argument(
        "--epochs", type=int, default=3,
        help="Number of training epochs"
    )
    parser.add_argument(
        "--learning_rate", type=float, default=2e-5,
        help="Learning rate"
    )
    parser.add_argument(
        "--warmup_steps", type=int, default=100,
        help="Number of warmup steps"
    )
    parser.add_argument(
        "--weight_decay", type=float, default=0.01,
        help="Weight decay coefficient"
    )

    parser.add_argument(
        "--early_stopping_patience", type=int, default=3,
        help="value to look previous losses"
    )
    parser.add_argument(
        "--early_stopping_threshold", type=float, default=0.0,
        help="termnation condition"
    )

    parser.add_argument(
        "--metric_for_best",
        type=str,
        default="eval_loss",
        help="Metric to monitor for early stopping and best model saving."
    )

    # ----------------------
    # LoRA configuration
    # ----------------------
    parser.add_argument(
        "--lora_r", type=int, default=8,
        help="LoRA rank r"
    )
    parser.add_argument(
        "--lora_alpha", type=int, default=32,
        help="LoRA alpha"
    )
    parser.add_argument(
        "--lora_dropout", type=float, default=0.05,
        help="LoRA dropout probability"
    )
    parser.add_argument(
        "--enable_lora", type=str, default="True",
        help="Enable LoRA adapters (True/False)"
    )
    parser.add_argument(
        "--adapter_path", type=str, default=None,
        help="Path to pre-trained LoRA adapter for evaluation"
    )
    parser.add_argument(
        "--oversample_method", type=str, default=None,
        help="Oversampling method to use (e.g., 'random', 'smote', 'adasyn')"
    )

    # ----------------------
    # Prompting related
    # ----------------------
    parser.add_argument(
        "--include_label_definitions", action="store_true",
        help="Include label definitions in the prompt (True/False)"
    )

    # ----------------------
    # Logging and checkpointing
    # ----------------------
    parser.add_argument(
        "--logging_steps", type=int, default=100,
        help="Steps interval between logging training metrics"
    )
    parser.add_argument(
        "--save_steps", type=int, default=500,
        help="Steps interval between saving checkpoints"
    )
    parser.add_argument(
        "--eval_steps", type=int, default=500,
        help="Steps interval between evaluation"
    )

    # ----------------------
    # Evaluation / Generation options
    # ----------------------
    parser.add_argument(
        "--num_examples", type=int, default=100,
        help="Number of examples to evaluate"
    )
    parser.add_argument(
        "--max_new_tokens", type=int, default=10,
        help="Maximum number of new tokens to generate during evaluation"
    )
    parser.add_argument(
        "--do_sample",
        action="store_true",
        help="Whether to use sampling for text generation"
    )
    parser.add_argument(
        "--temperature", type=float, default=1.0,
        help="Sampling temperature if do_sample=True"
    )
    parser.add_argument(
        "--top_k", type=int, default=50,
        help="Top-k sampling parameter"
    )
    parser.add_argument(
        "--top_p", type=float, default=1.0,
        help="Top-p (nucleus) sampling parameter"
    )
    parser.add_argument(
        "--pad_token_id", type=int, default=None,
        help="Pad token ID (default: tokenizer.eos_token_id)"
    )
    parser.add_argument(
        "--eos_token_id", type=int, default=None,
        help="End-of-sequence token ID (default: tokenizer.eos_token_id)"
    )

    return parser.parse_args()