import logging
import random
from collections import Counter, defaultdict, deque

import torch
from torch.utils.data import Sampler
from tqdm import tqdm

# Set up logging
logger = logging.getLogger(__name__)
if not logger.hasHandlers():
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(message)s",
        level=logging.INFO
    )

def split_by_task(dataset, task_col="task"):
    """Group dataset indices by task name."""
    task_groups = {}
    for i, ex in enumerate(dataset):
        task = ex[task_col].lower()
        task_groups.setdefault(task, []).append(i)
    return task_groups

class MultiTaskBatchSampler(Sampler):
    """
    Each batch contains an equal number of samples from every task.

    Args:
        dataset: your dataset
        tasks (List[str]): list of task names to include
        batch_size (int): must be a multiple of len(tasks)
        task_col (str): column/key in dataset used by split_by_task
    """
    def __init__(self, dataset, tasks, batch_size, task_col="task"):
        self.dataset = dataset
        self.tasks = [t.lower() for t in tasks]
        self.batch_size = int(batch_size)
        if self.batch_size <= 0:
            raise ValueError("batch_size must be a positive integer.")

        if self.batch_size % len(self.tasks) != 0:
            raise ValueError(
                f"batch_size ({self.batch_size}) must be a multiple of the number of tasks ({len(self.tasks)})."
            )

        # group indices by task
        all_groups = split_by_task(dataset, task_col)  # {task_name: [idx, ...]}
        # validate tasks and keep only those we requested (lowercased)
        for t in self.tasks:
            if t not in all_groups:
                raise ValueError(f"Task {t} not found in dataset.")

        # store only the requested task groups
        self.task_groups = {t: all_groups[t] for t in self.tasks}

        self.per_task = self.batch_size // len(self.tasks)

    def __iter__(self):
        # shuffle indices inside each task group and put into deques
        pools = {
            t: deque(random.sample(idxs, k=len(idxs)))
            for t, idxs in self.task_groups.items()
        }

        while True:
            # stop if any task cannot provide enough samples for a full batch
            if any(len(pools[t]) < self.per_task for t in self.tasks):
                return

            batch = []
            # shuffle the order in which we draw tasks (optional)
            tasks_shuffled = self.tasks[:]
            random.shuffle(tasks_shuffled)

            # draw per_task items from each task
            for t in tasks_shuffled:
                for _ in range(self.per_task):
                    batch.append(pools[t].popleft())

            # optionally shuffle within-batch to mix tasks further
            random.shuffle(batch)
            yield batch

    def __len__(self):
        # number of FULL batches possible before any task runs out
        return min(len(idxs) // self.per_task for idxs in self.task_groups.values())

def inspect_batches(dataloader, tokenizer, num_batches=3):
    """
    Print all decoded examples in each batch (full text).
    Works for dict or list batches.
    """
    for i, batch in enumerate(dataloader):
        print(f"\n=== Batch {i+1} ===")

        # --- extract input_ids ---
        input_ids = None
        if isinstance(batch, dict) and "input_ids" in batch:
            input_ids = batch["input_ids"]
        elif isinstance(batch, (list, tuple)) and len(batch) > 0:
            input_ids = batch[0]
        elif hasattr(batch, "input_ids"):
            input_ids = batch.input_ids

        if input_ids is None:
            print("No input_ids found in batch.")
            continue

        # --- decode all examples ---
        if isinstance(input_ids, torch.Tensor):
            input_ids = input_ids.cpu().tolist()

        for j, ids in enumerate(input_ids):
            text = tokenizer.decode(ids, skip_special_tokens=True)
            print(f"\nExample {j+1}:\n{text}\n{'-'*80}")

        if i + 1 >= num_batches:
            break