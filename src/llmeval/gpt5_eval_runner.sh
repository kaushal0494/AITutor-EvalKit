#!/usr/bin/env bash
# ==============================================================================
# GPT-5 Evaluation Runner
# ------------------------------------------------------------------------------
# This script runs evaluation using the GPT-5 LLM evaluator.
# Configure your API key, evaluation dimensions, and file paths before execution.
# ==============================================================================

# --------------------------- Environment Setup --------------------------------
# Set your OpenAI API key (replace with your actual key or load from env file)
export OPENAI_API_KEY="add-your-openai-key-here"

#--------------------------- Evaluation Settings ------------------------------
# Define task dimensions for evaluation
DIMENSIONS=(
  "Mistake_Identification"
  "Mistake_Location"
  "Providing_Guidance"
  "Actionability"
)

# --------------------------- File Paths ---------------------------------------
# Path to the input prediction file
DATA_PATH="../../assets/outputs/prometheus_model_predictions.json"

# Directory to save evaluation outputs
OUTPUT_PATH="../../assets/outputs"

# Model Name
MODEL_NAME="gpt-5"

# --------------------------- Run Evaluation -----------------------------------
python gpt5_eval.py \
  --data_path "$DATA_PATH" \
  --output_path "$OUTPUT_PATH" \
  --model_name "$MODEL_NAME" \
  --num_examples 1 \
  --dimensions "${DIMENSIONS[@]}"