import os
import json
import logging
from collections import defaultdict

import pandas as pd
import torch
from colorama import Fore, init as colorama_init
from peft import PeftModel
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from tqdm import tqdm
from transformers import AutoTokenizer, AutoModelForCausalLM, set_seed

from utils.argparse import parse_args
from utils.constants import LABEL_LIST, SEED, TARGET_MODULES_MAP
from utils.prompt import EvaluationDatasetFormatter

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

set_seed(SEED)

# Initialize colorama
colorama_init(autoreset=True)

# Configure logging
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


def load_model_and_tokenizer(base_model_name, adapter_path=None, enable_lora=False):
    """Load base model and optionally merge LoRA adapters"""
    logger.info(f"Loading base model: {base_model_name}")
    
    tokenizer = AutoTokenizer.from_pretrained(base_model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.bfloat16,
    )

    if enable_lora and adapter_path:
        logger.info(f"Loading LoRA adapters from: {adapter_path}")
        model = PeftModel.from_pretrained(model, adapter_path)
        try:
            model = model.merge_and_unload()
            logger.info("Successfully merged LoRA adapters")
        except Exception as e:
            logger.error(f"Adapter merging failed: {str(e)}")
            logger.info("Proceeding with unmerged adapters")
    else:
        logger.info("No LoRA adapters to load")

    return model.to(device), tokenizer

def load_conversations(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def evaluate(args):
    logger.info(Fore.CYAN + "\n========== Starting Evaluation ==========\n")
    model, tokenizer = load_model_and_tokenizer(
        args.model_name, args.adapter_path, args.enable_lora == "True"
    )
    
    # ==== CASE 1: JSON / JSONL ====
    if args.eval_file.endswith((".json", ".jsonl")):
        if not os.path.exists(args.eval_file):
            raise FileNotFoundError(f"Eval file not found: {args.eval_file}")
        
        eval_data = load_conversations(args.eval_file)

        if args.num_examples > 0:
            eval_data = eval_data[:args.num_examples]

        for conv in tqdm(eval_data, desc="Evaluating conversations", unit="conv"):
            conv_txt = conv["conversation_history"]

            # Take a static snapshot of the keys to avoid resizing during iteration
            response_ids = list(conv.get("anno_llm_responses", {}).keys())

            for res in response_ids:
                current_response = conv["anno_llm_responses"][res]["response"]
                for task in args.dimensions:
                    input_formatted = EvaluationDatasetFormatter.prepare_input(
                        tokenizer=tokenizer,
                        conv=conv_txt,
                        resp=current_response,
                        task=task,
                        label_definitions=args.include_label_definitions,
                        flag="eval",
                    )
                    with torch.no_grad():
                        torch.cuda.empty_cache()
                        inputs = tokenizer(input_formatted["text"], return_tensors="pt").to(device)
                        outs = model.generate(
                            **inputs,
                            max_new_tokens=args.max_new_tokens,
                            do_sample=args.do_sample,
                            temperature=(args.temperature if args.do_sample else None),
                            top_k=args.top_k,
                            top_p=args.top_p,
                            pad_token_id=tokenizer.eos_token_id,
                            eos_token_id=tokenizer.eos_token_id,
                        )
                        decoded = tokenizer.decode(outs[0], skip_special_tokens=True)
                        pred = decoded.strip().split("model")[-1].strip().split("\n")[0]

                    # Write per-response annotations under 'auto_annotation'
                    conv["anno_llm_responses"][res].setdefault("auto_annotation", {})
                    conv["anno_llm_responses"][res]["auto_annotation"][task] = pred

        results = eval_data

        # Save results as JSON in args.output_dir
        os.makedirs(args.output_dir, exist_ok=True)
        output_json = os.path.join(args.output_dir, f"{os.path.basename(args.output_dir)}_predictions.json")

        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=4)

        logger.info(Fore.YELLOW + f"Saved predictions to {output_json}")

    # ==== CASE 2: CSV ====
    elif args.eval_file.endswith(".csv"):
        if args.num_examples <= 0:
            eval_df = pd.read_csv(args.eval_file)
        else:
            eval_df = pd.read_csv(args.eval_file, nrows=args.num_examples)

        eval_dataset = EvaluationDatasetFormatter.create_dataset(
            eval_df,
            tokenizer,
            max_length=args.max_length,
            include_label_definitions=args.include_label_definitions,
        )

        logger.info(f"Loaded {len(eval_dataset)} evaluation samples")
        logger.info(f"Debugging sample: {eval_dataset[0]}")

        results = []
        logger.info("Running inference...")

        for example in tqdm(eval_dataset, desc="Evaluating", unit="sample"):
            with torch.no_grad():
                torch.cuda.empty_cache()

                inputs = tokenizer(example["text"], return_tensors="pt").to(device)
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=args.max_new_tokens,
                    do_sample=args.do_sample,
                    temperature=args.temperature if args.do_sample else None,
                    top_k=args.top_k,
                    top_p=args.top_p,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )

                decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
                generated_part = decoded.strip().split("model")[-1].strip().split("\n")[0]

                results.append({
                    "id": example["conversation_id"],
                    "history": example["conversation_history"],
                    "response": example["current_response"],
                    "task": example["task_type"],
                    "prediction": generated_part,
                    "gold_label": example["gold_labels"],
                })

        
        # Save results as JSON in args.output_dir
        os.makedirs(args.output_dir, exist_ok=True)
        output_json = os.path.join(args.output_dir, f"{os.path.basename(args.output_dir)}_predictions.json")

        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=4)

        logger.info(Fore.YELLOW + f"Saved predictions to {output_json}")

        # === Prepare output file ===
        output_file = os.path.join(args.output_dir, f"{os.path.basename(args.output_dir)}_results.txt")
        with open(output_file, "w", encoding="utf-8") as f:

            # === Overall Metrics ===
            preds = [r["prediction"] for r in results]
            labels = [r["gold_label"] for r in results]

            acc = accuracy_score(labels, preds)
            macro_f1 = f1_score(labels, preds, labels=LABEL_LIST, average="macro", zero_division=0)
            report = classification_report(labels, preds, labels=LABEL_LIST, zero_division=0, digits=4)
            cm = confusion_matrix(labels, preds, labels=LABEL_LIST)

            header = "\n" + "="*30 + " Overall Evaluation " + "="*30
            overall_str = (
                f"{header}\n"
                f"Accuracy: {acc:.4f}\n"
                f"Macro F1: {macro_f1:.4f}\n\n"
                f"Classification Report:\n{report}\n\n"
                f"Labels: {LABEL_LIST}\n\n"
                f"Confusion Matrix (rows=true, cols=pred):\n{cm}\n"
            )

            logger.info(Fore.GREEN + overall_str)
            f.write(overall_str + "\n")

            # === Per-Task Metrics ===
            task_groups = defaultdict(list)
            for r in results:
                task_groups[r["task"]].append(r)

            for task, task_results in task_groups.items():
                task_preds = [r["prediction"] for r in task_results]
                task_labels = [r["gold_label"] for r in task_results]

                task_acc = accuracy_score(task_labels, task_preds)
                task_macro_f1 = f1_score(task_preds, task_labels, labels=LABEL_LIST, average="macro", zero_division=0)
                task_report = classification_report(task_labels, task_preds, labels=LABEL_LIST, zero_division=0, digits=4)
                task_cm = confusion_matrix(task_labels, task_preds, labels=LABEL_LIST)

                task_header = "\n" + "-"*25 + f" Task: {task} " + "-"*25
                task_str = (
                    f"{task_header}\n"
                    f"Accuracy: {task_acc:.4f}\n"
                    f"Macro F1: {task_macro_f1:.4f}\n\n"
                    f"Classification Report:\n{task_report}\n\n"
                    f"Labels: {LABEL_LIST}\n\n"
                    f"Confusion Matrix (rows=true, cols=pred):\n{task_cm}\n"
                )

                logger.info(Fore.CYAN + task_str)
                f.write(task_str + "\n")

        logger.info(Fore.YELLOW + f"\nSaved evaluation results to {output_file}")

    else:
        raise ValueError("Unsupported file format. Please provide .csv, .json, or .jsonl file.")
 
if __name__ == "__main__":
    args = parse_args()
    evaluate(args)