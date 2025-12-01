#!/usr/bin/env bash
# ============================================================================
# LoRA Evaluation & Prediction Runner
# 
# ============================================================================
# This script evaluates or predicts using a fine-tuned LoRA model via
# `evaluation.py`. It generated the response and save it to the output directory.
# It accepts both CSV and JSON input files.

# Notes:
# - chmod +x lora_evaluation_runner.sh
# - Set HF_HOME / HF_TOKEN in your shell if needed for private models.
# ==============================================================================

# ------------------------------- GPU/Compile ---------------------------------
# GPU selection (e.g., "0" or "0,1"). Set per your machine.
export CUDA_VISIBLE_DEVICES=0

# Disable torch.compile to avoid potential warmup overhead unless you need it.
export TORCH_COMPILE_DISABLE=1

# ----------------------------- Core Paths & Config ----------------------------
FOLDER_NAME="model" # Folder where your fine-tuned LoRA model is saved.
NUM_EXAMPLES=-1 # -1 means use all examples.
ENABLE_LORA="True" # Set to "False" if evaluating base model only.
MAX_LENGTH=1024 # Maximum sequence length during evaluation.


# Base model + adapter paths.
MODEL_NAME="google/gemma-2-2b-it"
ADAPTER_PATH="../../assets/${FOLDER_NAME}/lora_model"

# Evaluation / prediction input.
# Choose one of the following depending on data format:
PREDICT_FILE="../../assets/data/test_data/test_sample.json" # JSON mode
# PREDICT_FILE="../../assets/data/test_data/all_test.csv" # CSV mode

# Directory to store outputs (predictions, logs, metrics).
OUTPUT_DIR="../../assets/${FOLDER_NAME}"

# ------------------------------ Generation knobs -----------------------------
# Temperature controls randomness. Higher = more diverse outputs.
# Top-K and Top-P (nucleus) sampling further refine output diversity.
DIMENSIONS=(
"Mistake_Identification"
"Mistake_Location"
"Providing_Guidance"
"Actionability"
)

TEMPERATURE=1.0
TOP_K=50
TOP_P=1.0

# ----------------------------- Run Evaluation --------------------------------
python evaluation.py \
    --model_name "$MODEL_NAME" \
    --dimensions "${DIMENSIONS[@]}" \
    --adapter_path "$ADAPTER_PATH" \
    --eval_file "$PREDICT_FILE" \
    --output_dir "$OUTPUT_DIR" \
    --num_examples "$NUM_EXAMPLES" \
    --enable_lora "$ENABLE_LORA" \
    --max_length "$MAX_LENGTH" \
    --temperature "$TEMPERATURE" \
    --top_k "$TOP_K" \
    --top_p "$TOP_P" \
    --include_label_definitions \
    # --do_sample \

# ------------------------------ Notes ----------------------------------------
# • Adjust TEMPERATURE, TOP_K, TOP_P to balance creativity and determinism.
# • Use NUM_EXAMPLES to limit evaluation size for quick sanity checks.
# • Keep ENABLE_LORA=True for LoRA model evaluation.
# • OUTPUT_DIR will contain logs, metrics, and generated outputs.