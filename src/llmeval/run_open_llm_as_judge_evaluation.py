import os

# =============================================================================
# LLM-as-Judge Evaluation Script
# -----------------------------------------------------------------------------
# This script runs evaluation using the open_llmeval library with a chosen LLM
# evaluator model such as Prometheus. 
# =============================================================================

# --------------------------- Environment Setup -------------------------------
# Select the GPU to use for evaluation.
os.environ["CUDA_VISIBLE_DEVICES"] = "0"

# ----------------------------- Imports ---------------------------------------
from open_llmeval import LLMEvaluator


# --------------------------- Evaluator Configuration --------------------------
# Instantiate the LLMEvaluator with your desired model and configuration.
# Adjust parameters as needed for evaluation scale or LLM type.
evaluator = LLMEvaluator(
    llm_model_name="prometheus-eval/prometheus-7b-v2.0", # LLM model used for evaluation
    llm_model_parama={
    "max_tokens": 1024, # Maximum tokens to generate per evaluation example
    "temperature": 0.0 # Sampling temperature (0 = deterministic outputs)
    },
    evaluation_type='absolute', # 'absolute' for standalone evaluation; 'relative' for comparisons
    prompting_type='zero-shot', # Evaluation prompting style ('zero-shot' or 'few-shot')
    file_names=["../../assets/outputs/auto_model_predictions.json"], # Input json prediction files to score
    output_data_dir='../../assets/outputs', # Directory to save LLM-based evaluation results
    with_ref=False, # Whether reference answers are provided
    ngpus=1, # Number of GPUs to use (parallelism)
    num_conv_examples=100, # Number of conversation examples for evaluation
)

# --------------------------- Run Evaluation ----------------------------------
# Generate the evaluation annotations and save to the output directory.
# By it annotates across all tutors and examples in the input prediction files.
# evaluator.get_llm_evaluation_report(
#     tutor_models = [                                                                               # List of tutor models to evaluate
#             "Expert", "Novice", "Llama-3.1-405B", "GPT4", 
#             "Sonnet", "Phi3", "Llama-3.1-8B", "Mistral", "Gemini"
#         ],
#     dimensions = [                                                                                 # Evaluation dimensions to score on
#             'Mistake_Identification', 'Mistake_Location',  'Providing_Guidance', 'Actionability', 
#         ],
#     eval_file_name="prometheus_model_predictions.json"                                             # Name of the output report JSON file
# )

evaluator.get_llm_evaluation_report(
    tutor_models = [                                                                               # List of tutor models to evaluate
            "Expert"
        ],
    dimensions = [                                                                                 # Evaluation dimensions to score on
            'Mistake_Identification', 
        ],
    eval_file_name="prometheus_model_predictions.json"                                             # Name of the output report JSON file
)