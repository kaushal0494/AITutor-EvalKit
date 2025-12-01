import os
import time
import json
import logging
import argparse
from typing import Dict, List
from colorama import Fore, init as colorama_init

from tqdm import tqdm
from openai import OpenAI

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.WARNING)

# CLI
parser = argparse.ArgumentParser(description="Run evaluation with GPT-based models")
parser.add_argument("-d", "--data_path", type=str, required=True,
                    help="Path to the input data (.json or .jsonl)")
parser.add_argument("-o", "--output_path", type=str, required=True,
                    help="Directory to write output JSON")
parser.add_argument("-n", "--num_examples", type=int, default=None,
                    help="Number of examples to evaluate (default: all)")
parser.add_argument("--model_name", type=str, default="gpt-5",
                    help="Model name to use for evaluation (default: gpt-5)")
parser.add_argument(
    "--dimensions",
    nargs="+",
    default=["Mistake_Identification", "Mistake_Location", "Providing_Guidance", "Actionability"],
    help="Dimensions to include (e.g., MI ML PG AC). Defaults to all."
)
args = parser.parse_args()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# # System prompt for single-dimension evaluation
SYSTEM_PROMPT_SINGLE_DIM = (
    "You are an expert evaluator of AI tutors. "
    "For the given ### Task, ### Task Definition, ### Label Definition, ### Conversation History "
    "and ### Tutor Response, assess the pedagogical appropriateness of the Tutor Response. "
    "Output exactly one label without additional text: Yes, No, or To some extent"
)

DEFINITIONS = {
    "Mistake_Identification": "Has the tutor identified/recognized a mistake in a student's response?",
    "Mistake_Location": "Does the tutor's response accurately point to a genuine mistake and its location?",
    "Providing_Guidance": "Does the tutor offer correct and relevant guidance, such as an explanation, elaboration, hint, examples, and so on?",
    "Actionability": "Is it clear from the tutor's feedback what the student should do next?",
}

LABEL_DEFINITIONS = {
    "Mistake_Identification": {
        "Yes": "The tutor correctly identified the mistake in the student's response.",
        "To some extent": "The tutor partially recognized the mistake but did not fully capture it.",
        "No": "The tutor failed to identify any mistake.",
    },
    "Mistake_Location": {
        "Yes": "The tutor accurately points to the exact mistake and its location.",
        "To some extent": "The tutor points to a mistake but imprecisely or partially.",
        "No": "The tutor fails to indicate the mistake or its location.",
    },
    "Providing_Guidance": {
        "Yes": "The tutor provides correct and relevant guidance, hints, examples, or explanation.",
        "To some extent": "The guidance is partially correct or not fully helpful.",
        "No": "The tutor fails to provide relevant guidance.",
    },
    "Actionability": {
        "Yes": "It is clear what the student should do next.",
        "To some extent": "The next steps are somewhat unclear or incomplete.",
        "No": "The feedback does not indicate any actionable steps.",
    },
}


def create_single_dim_prompt(
    task: str, conversation: str, response: str, include_label_definitions: bool = True
) -> List[Dict]:
    """
    Create a prompt for single-dimension evaluation.

    Args:
        task: One of the four task names (Mistake_Identification, Mistake_Location, etc.)
        conversation: The conversation history
        response: The tutor's response to evaluate
        include_label_definitions: Whether to include label definitions in the prompt

    Returns:
        List of message dictionaries for OpenAI API
    """
    task_def = DEFINITIONS.get(task.lower(), "No definition available for this task.")

    if include_label_definitions:
        label_defs = LABEL_DEFINITIONS.get(task, {})
        label_lines = [f"- {k}: {v}" for k, v in label_defs.items()]
        label_def_str = "\n".join(label_lines) + "\n\n"

        content = (
            f"{SYSTEM_PROMPT_SINGLE_DIM}\n\n"
            f"### Task: {task}\n"
            f"### Task Definition: {task_def}\n\n"
            f"### Label Definition:\n{label_def_str}"
            f"### Conversation History: {conversation.strip()}\n\n"
            f"### Tutor Response: {response.strip()}\n\n"
            f"Now provide the classification label:"
        )
    else:
        content = (
            f"{SYSTEM_PROMPT_SINGLE_DIM}\n\n"
            f"### Task: {task}\n"
            f"### Task Definition: {task_def}\n\n"
            f"### Conversation History: {conversation.strip()}\n\n"
            f"### Tutor Response: {response.strip()}\n\n"
            f"Now provide the classification label:"
        )

    return content


def get_gpt5_single_dim_prediction(messages: str = "", max_retries: int = 3, delay: float = 0.0) -> str:
    """
    Get single-dimension prediction from GPT-5 with retry logic.

    Args:
        messages: List of message dictionaries
        max_retries: Maximum number of retry attempts
        delay: Delay between retries in seconds

    Returns:
        Predicted label (Yes/No/To some extent) or None if failed
    """
    for attempt in range(max_retries):
        try:
            response = client.responses.create(model=args.model_name, input=messages, reasoning={"effort": "low"})
            prediction_str = response.output_text
            prediction = prediction_str.replace(".", "").strip()
            valid_labels = ["Yes", "No", "To some extent"]
            if prediction in valid_labels:
                return prediction
            else:
                for label in valid_labels:
                    if label.lower() in prediction.lower():
                        return label
                logger.warning(f"Invalid prediction: {prediction}")
                return prediction

        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                return None

    return None

def load_conversations(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    if args.data_path.endswith((".json", ".jsonl")):
        if not os.path.exists(args.data_path):
            raise FileNotFoundError(f"Eval file not found: {args.data_path}")
        
        eval_data = load_conversations(args.data_path)

        if args.num_examples > 0:
            eval_data = eval_data[:args.num_examples]

        for conv in tqdm(eval_data, desc="Evaluating conversations", unit="conv"):
            conv_txt = conv["conversation_history"]

            # Take a static snapshot of the keys to avoid resizing during iteration
            response_ids = list(conv.get("anno_llm_responses", {}).keys())

            for res in response_ids:
                current_response = conv["anno_llm_responses"][res]["response"]
                for task in args.dimensions:
                    messages = create_single_dim_prompt(
                        task=task, conversation=conv_txt, response=current_response, include_label_definitions=True
                        )
                    # Get prediction (single dimension)
                    prediction = get_gpt5_single_dim_prediction(messages)

                    # Write per-response annotations under 'auto_annotation'
                    conv["anno_llm_responses"][res].setdefault("llm_annotation", {})
                    conv["anno_llm_responses"][res]["llm_annotation"][task+"/gpt5"] = prediction

        results = eval_data

        # Save results as JSON in args.output_path
        os.makedirs(args.output_path, exist_ok=True)
        output_json = os.path.join(args.output_path, "gpt5_model_predictions.json")

        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=4)

        logger.info(Fore.YELLOW + f"Saved predictions to {output_json}")

if __name__ == "__main__":
    main()