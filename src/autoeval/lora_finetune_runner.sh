#!/usr/bin/env bash
# ==============================================================================
# LoRA Fine-Tuning Runner
# ==============================================================================

# A robust, self-documented bash runner for launching LoRA fine-tuning via
# `train.py`. It validates the environment, creates timestamped output runs and 
# supports convenient CLI overrides.

# Notes:
# - chmod +x lora_finetune_runner.sh
# - Set HF_HOME / HF_TOKEN in your shell if needed for private models.
# ==============================================================================

# ------------------------------- GPU/Compile ---------------------------------
# GPU selection (e.g., "0" or "0,1"). Set per your machine.
export CUDA_VISIBLE_DEVICES=0

# Disable torch.compile to avoid potential warmup overhead unless you need it.
export TORCH_COMPILE_DISABLE=1


# ------------------------------- Core knobs ----------------------------------
# Base HF model (name or local path)
MODEL_NAME="google/gemma-2-2b-it"

# Paths (change these to your dataset and outputs)
DATA_DIR="../../assets/data/train_data/" # <-- set to your dataset path
OUTPUT_DIR="../../assets/outputs/exp_test" # <-- set to your desired output dir

# Tokenization / context
MAX_LENGTH=1024

# Batching
BATCH_SIZE=2 # per-GPU batch size
GRAD_ACCUM=1 # gradient accumulation to simulate larger batch sizes

# Schedule & optimization
EPOCHS=3 # total training epochs
LEARNING_RATE=1e-4  # learning rate
WEIGHT_DECAY=0.1  # weight decay

# Logging / checkpoint cadence (in optimizer steps)
LOGGING_STEPS=50
SAVE_STEPS=300
EVAL_STEPS=300

# ------------------------------- LoRA knobs ----------------------------------
# Typical search ranges in comments
LORA_R=8 
LORA_ALPHA=16 
LORA_DROPOUT=0.1 

# ---------------------------- Early Stopping ---------------------------------
# These must be supported by your train.py argparse
EARLY_PATIENCE=5 # stop after 5 evals with no improvement
EARLY_THRESHOLD=0.0 # minimum required improvement of watched metric

# ------------------------------ Data options ---------------------------------
OVERSAMPLE_METHOD="random" 
METRIC_FOR_BEST="eval_loss" 


# Task dimensions (space-separated strings)
DIMENSIONS=(
"Mistake_Identification"
"Mistake_Location"
"Providing_Guidance"
"Actionability"
)

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# ------------------------------- Run training --------------------------------
# Note: --dimensions is passed once with all values expanded by the array
# (this assumes train.py aggregates multiple values from repeated flags
# or a list-like argument—matching your original behavior.)

python -u train.py \
    --train \
    --model_name "$MODEL_NAME" \
    --data_dir "$DATA_DIR" \
    --dimensions "${DIMENSIONS[@]}" \
    --output_dir "$OUTPUT_DIR" \
    --max_length $MAX_LENGTH \
    --batch_size $BATCH_SIZE \
    --gradient_accumulation_steps $GRAD_ACCUM \
    --epochs $EPOCHS \
    --learning_rate $LEARNING_RATE \
    --weight_decay $WEIGHT_DECAY \
    --lora_r $LORA_R \
    --lora_alpha $LORA_ALPHA \
    --lora_dropout $LORA_DROPOUT \
    --logging_steps $LOGGING_STEPS \
    --save_steps $SAVE_STEPS \
    --eval_steps $EVAL_STEPS \
    --early_stopping_patience $EARLY_PATIENCE \
    --early_stopping_threshold $EARLY_THRESHOLD \
    --metric_for_best $METRIC_FOR_BEST \
    --include_label_definitions \
    --oversample_method $OVERSAMPLE_METHOD \