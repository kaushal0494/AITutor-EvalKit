from __future__ import annotations

import argparse
import json
from collections import defaultdict
from typing import Dict, Any, List

# Map input task names -> canonical output keys
TASK_KEY_MAP = {
    "mistake_identification": "Mistake_Identification",
    "mistake-location": "Mistake_Location",        # tolerate dash variants
    "mistake_location": "Mistake_Location",
    "providing_guidance": "Providing_Guidance",
    "providing-guidance": "Providing_Guidance",
    "actionability": "Actionability",
}

# Canonical task list used for default-filling
CANON_TASKS = ["Actionability", "Mistake_Location", "Providing_Guidance", "Mistake_Identification"]

# Tutor renames for output keys
TUTOR_RENAME_MAP = {
    "Llama31405B": "Llama-3.1-405B",
    "Llama318B": "Llama-3.1-8B",
}

PASSTHROUGH_FIELDS = [
    "Data",
    "Split",
    "Topic",
    "Problem_topic",
    "Ground_Truth_Solution",
]

DEFAULT_PASSTHROUGH = {
    "Data": "Not Available",
    "Split": "Not Available",
    "Topic": "Not Available",
    "Problem_topic": "Not Available",
    "Ground_Truth_Solution": "Not Available",
}

# Always include these in llm_annotation, defaulting to "Not Available"
LLM_ANNOTATION_DEFAULTS = {
    "Mistake_Location/GPT5": "Not Available",
    "Mistake_Identification/GPT5": "Not Available",
    "Actionability/GPT5": "Not Available",
    "Providing_Guidance/GPT5": "Not Available",
    "Mistake_Location/Prometheus": "Not Available",
    "Mistake_Identification/Prometheus": "Not Available",
    "Actionability/Prometheus": "Not Available",
    "Providing_Guidance/Prometheus": "Not Available",
}


def yn_normalize(val: Any) -> str:
    """
    Normalize to 'Yes'/'No' when obvious; 'Not Available' for empty/None;
    otherwise keep the original string (e.g. 'To some extent').
    """
    if val is None:
        return "Not Available"
    s = str(val).strip()
    if not s:
        return "Not Available"
    sl = s.lower()
    if sl in {"yes", "y", "true", "1"}:
        return "Yes"
    if sl in {"no", "n", "false", "0"}:
        return "No"
    return s  # keep unusual strings like "To some extent"


def normalize_task_key(k: str) -> str | None:
    """
    Map arbitrary incoming task-like strings to canonical keys.
    """
    if not isinstance(k, str):
        return None
    raw = k.strip().lower().replace(" ", "_")
    return TASK_KEY_MAP.get(raw)


def transform(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Group rows by conversation id
    groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for r in rows:
        cid = r.get("id")
        if cid is None:
            continue  # skip rows without an id
        groups[cid].append(r)

    output: List[Dict[str, Any]] = []

    for cid, items in groups.items():
        # First non-empty history
        history = ""
        for it in items:
            h = it.get("history")
            if isinstance(h, str) and h.strip():
                history = h
                break

        convo: Dict[str, Any] = {
            "conversation_id": cid,
            "conversation_history": history,
            **DEFAULT_PASSTHROUGH,
            "anno_llm_responses": {},
        }

        # Passthroughs: first non-empty value across the group's rows, else keep defaults
        for f in PASSTHROUGH_FIELDS:
            for it in items:
                val = it.get(f)
                if val is not None and str(val).strip():
                    convo[f] = val
                    break

        # tutor_name -> {"response": str, "annotation": {...}, "auto_annotation": {...}, "llm_annotation": {...}}
        tutors: Dict[str, Dict[str, Any]] = {}

        for it in items:
            raw_tutor = it.get("tutor", "Unknown")
            tutor_name = TUTOR_RENAME_MAP.get(raw_tutor, raw_tutor)

            task_key = normalize_task_key((it.get("task") or ""))

            if tutor_name not in tutors:
                tutors[tutor_name] = {
                    "response": it.get("response", ""),
                    # IMPORTANT: force all gold labels to "Not Available"
                    "annotation": {t: "Not Available" for t in CANON_TASKS},
                    "auto_annotation": {},
                    "llm_annotation": dict(LLM_ANNOTATION_DEFAULTS),  # preset with Not Available
                }
            else:
                # Prefer the latest non-empty response
                resp = it.get("response")
                if isinstance(resp, str) and resp.strip():
                    tutors[tutor_name]["response"] = resp

            # DO NOT read or set gold labels from input anymore.
            # 'annotation' remains all "Not Available" for every tutor.

            # PREDICTION -> auto_annotation under the canonical task key
            if task_key:
                pred_val = it.get("prediction")
                if pred_val is not None:
                    tutors[tutor_name]["auto_annotation"][task_key] = yn_normalize(pred_val)

            # Accept explicit per-task prediction columns (e.g., "Actionability", "mistake-location")
            # These complement/override the 'prediction' value above if present.
            for k, v in it.items():
                canon = normalize_task_key(k)
                if canon:
                    tutors[tutor_name]["auto_annotation"][canon] = yn_normalize(v)

            # LLM model-specific columns like "Providing_Guidance/Prometheus", "Actionability/GPT5"
            for k, v in it.items():
                if not isinstance(k, str) or "/" not in k:
                    continue
                left, right = k.split("/", 1)
                left_key = normalize_task_key(left)
                right = right.strip()
                if left_key and right:
                    tutors[tutor_name]["llm_annotation"][f"{left_key}/{right}"] = yn_normalize(v)

        # ---- Ensure defaults for missing dimensions per tutor ----
        for tname, block in tutors.items():
            # Make sure all canonical tasks exist in preds
            for task in CANON_TASKS:
                block["auto_annotation"].setdefault(task, "Not Available")

            # Ensure llm_annotation has all predefined keys
            for k, v in LLM_ANNOTATION_DEFAULTS.items():
                block["llm_annotation"].setdefault(k, v)

        convo["anno_llm_responses"] = tutors
        output.append(convo)

    # Stable order by conversation_id
    output.sort(key=lambda d: str(d.get("conversation_id", "")))
    return output


def main():
    ap = argparse.ArgumentParser(description="Aggregate tutor-task JSON into conversation-level structure.")
    ap.add_argument("input", help="Path to input JSON file (list of rows).")
    ap.add_argument("output", help="Path to write transformed JSON.")
    ap.add_argument(
        "--indent",
        type=int,
        default=2,
        help="Indentation spaces for pretty JSON (default: 2). Use 0 for compact.",
    )
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("Input JSON must be a list of row objects.")

    transformed = transform(data)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(transformed, f, ensure_ascii=False, indent=(args.indent or None))

    print(f"Wrote {len(transformed)} conversations to {args.output}")


if __name__ == "__main__":
    main()
