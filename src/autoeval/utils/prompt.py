import logging

from colorama import Fore
from datasets import Dataset
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)

# -------------------------
# Shared helper / base class
# -------------------------
class BaseFormatter:
    """Base formatter with shared task/label definitions and prompt formatting."""

    SYSTEM_PROMPT_WITH_LABEL = (
        "You are an expert evaluator of AI tutors. "
        "For the given ### Task, ### Task Definition, ### Label Definition, ### Conversation History and ### Tutor Response, assess the pedagogical appropriateness of the Tutor Response. "
        "Output exactly one label without additional text: Yes, No, or To some extent"
    )

    SYSTEM_PROMPT = (
        "You are an expert evaluator of AI tutors. "
        "For the given ### Task, ### Task Definition, ### Conversation History and ### Tutor Response, assess the pedagogical appropriateness of the Tutor Response. "
        "Output exactly one label without additional text: Yes, No, or To some extent"
    )

    TASK_DEFINITIONS = {
        "mistake_identification": "Has the tutor identified or recognized a mistake in a student’s response?",
        "mistake_location": "Does the tutor’s response accurately pinpoint the location of a genuine mistake?",
        "providing_guidance": "Does the tutor offer correct and relevant guidance, such as an explanation, elaboration, hint, examples, and so on?",
        "actionability": "Is it clear from the tutor’s feedback what the student should do next?"
    }

    LABEL_DEFINITIONS = {
        "mistake_identification": {
            "Yes": "The tutor correctly identified the mistake in the student’s response.",
            "To some extent": "The tutor partially recognized the mistake but did not fully capture it.",
            "No": "The tutor failed to identify any mistake."
        },
        "mistake_location": {
            "Yes": "The tutor accurately points to the exact mistake and its location.",
            "To some extent": "The tutor points to a mistake but imprecisely or partially.",
            "No": "The tutor fails to indicate the mistake or its location."
        },
        "providing_guidance": {
            "Yes": "The tutor provides correct and relevant guidance, hints, examples, or explanation.",
            "To some extent": "The guidance is partially correct or not fully helpful.",
            "No": "The tutor fails to provide relevant guidance."
        },
        "actionability": {
            "Yes": "It is clear what the student should do next.",
            "To some extent": "The next steps are somewhat unclear or incomplete.",
            "No": "The feedback does not indicate any actionable steps."
        }
    }

    @classmethod
    def format_messages(cls, task: str, conversation: str, response: str, label: str=None, label_definitions: bool = True, flag: str = "train") -> str:
        """Return formatted text for a single sample."""
        task_def = cls.TASK_DEFINITIONS.get(task.lower(), "No definition available for this task.")

        if label_definitions is True:
            label_defs = cls.LABEL_DEFINITIONS.get(task.lower(), {})
            label_lines = [f"- {k}: {v}" for k, v in label_defs.items()]
            label_def_str = "\n".join(label_lines) + "\n\n"

            content = (
                f"{cls.SYSTEM_PROMPT_WITH_LABEL}\n\n"
                f"### Task: {task}\n"
                f"### Task Definition: {task_def}\n\n"
                f"### Label Definition: \n{label_def_str}\n\n"
                f"### Conversation History: {conversation.strip()}\n\n"
                f"### Tutor Response: {response.strip()}\n\n"
                f"Now provide the classification label:"
            )
        else:
            content = (
                    f"{cls.SYSTEM_PROMPT}\n\n"
                    f"### Task: {task}\n"
                    f"### Task Definition: {task_def}\n\n"
                    f"### Conversation History: {conversation.strip()}\n\n"
                    f"### Tutor Response: {response.strip()}\n\n"
                    f"Now provide the classification label:"
            )
        
        if flag == 'train':
            messages = [
                {"role": "user", "content": content},
                {"role": "assistant", "content": label}
            ]
        else:
            messages = [
                {"role": "user", "content": content}
            ]
        return messages

# -------------------------
# DatasetFormatter for training
# -------------------------
class DatasetFormatter(BaseFormatter):
    """Prepares tokenized datasets for model training."""

    @classmethod
    def create_dataset(cls, batch: dict, tokenizer: AutoTokenizer, max_length: int = 512, include_label_definitions: bool = False) -> dict:
        logger.debug(f"Formatting {len(batch['conversation'])} training samples.")
        
        texts = []
        for conv, resp, label, task in zip(batch["conversation"], batch["response"], batch["annotation"], batch["task"]):
            messages = cls.format_messages(task, conv, resp, label, label_definitions=include_label_definitions, flag='train')
            text = tokenizer.apply_chat_template(messages, tokenize=False)
            texts.append(text)

        tokenized = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt",
            return_attention_mask=True,
        )

        tokenized["labels"] = tokenized["input_ids"]
        return tokenized


# -------------------------
# EvaluationDatasetFormatter for evaluation
# -------------------------

class EvaluationDatasetFormatter(BaseFormatter):
    """Prepares raw text + metadata datasets for evaluation/prediction."""

    @classmethod
    def create_dataset(cls, batch: dict, tokenizer: AutoTokenizer, max_length: int = 2048, include_label_definitions: bool = False) -> Dataset:
        logger.debug(f"Formatting {len(batch['conversation'])} evaluation samples.")
        samples, gold_labels, conversation_id, conversation_history, current_response, task_type = [], [], [], [], [], []

        for cid, conv, resp, label, task in zip(
            batch["id"], batch["conversation"], batch["response"], batch["annotation"], batch["task"]
        ):
            messages = cls.format_messages(task, conv, resp, label, label_definitions=include_label_definitions, flag='eval')
            text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            samples.append(text)
            gold_labels.append(label)
            conversation_id.append(cid)
            conversation_history.append(conv)
            current_response.append(resp)
            task_type.append(task)

        return Dataset.from_dict({
            "text": samples,
            "gold_labels": gold_labels,
            "conversation_id": conversation_id,
            "conversation_history": conversation_history,
            "current_response": current_response,
            "task_type": task_type
        })
    
    @classmethod
    def prepare_input(
        cls,
        tokenizer: AutoTokenizer,
        conv: str,
        resp: str,
        task: str,
        label_definitions: bool = False,
        flag = "eval"
    ):
        messages = cls.format_messages(
            task, conv, resp,
            label_definitions=label_definitions,
            flag=flag
        )
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        return {
            "text": text
        }