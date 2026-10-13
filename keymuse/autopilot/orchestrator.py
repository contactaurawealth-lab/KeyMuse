"""Task Orchestrator: Manages async task states, progress stages, and cancellations."""

import uuid
from typing import Dict, Optional, Callable, Any
from datetime import datetime, timezone
from keymuse.models.task import TaskState, TaskStatus, TaskProgress, TaskResult


class TaskOrchestrator:
    """Manages background composition jobs, tracking progress, and enabling cancellation."""

    def __init__(self):
        self._tasks: Dict[str, TaskState] = {}
        self._idempotency_keys: Dict[str, str] = {}

    def create_task(self, idempotency_key: Optional[str] = None) -> TaskState:
        """Create a new task or retrieve an existing one via idempotency key."""
        if idempotency_key and idempotency_key in self._idempotency_keys:
            task_id = self._idempotency_keys[idempotency_key]
            return self._tasks[task_id]

        task_id = f"task_{uuid.uuid4().hex[:12]}"
        state = TaskState(
            task_id=task_id,
            status=TaskStatus.QUEUED,
            progress=TaskProgress(stage="queued", percent=0.0, message="Task queued")
        )
        self._tasks[task_id] = state

        if idempotency_key:
            self._idempotency_keys[idempotency_key] = task_id

        return state

    def update_progress(self, task_id: str, stage: str, percent: float, message: str):
        """Update the progress stage and percentage of a running task."""
        if task_id in self._tasks:
            task = self._tasks[task_id]
            task.status = TaskStatus.RUNNING
            if task.started_at is None:
                task.started_at = datetime.now(timezone.utc).isoformat()
            task.progress = TaskProgress(stage=stage, percent=percent, message=message)

    def complete_task(self, task_id: str, result: TaskResult):
        """Mark task as successfully completed with final deliverable references."""
        if task_id in self._tasks:
            task = self._tasks[task_id]
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc).isoformat()
            task.progress = TaskProgress(stage="completed", percent=100.0, message="Task completed successfully")
            task.result = result

    def fail_task(self, task_id: str, error_message: str):
        """Mark task as failed with diagnostic error details."""
        if task_id in self._tasks:
            task = self._tasks[task_id]
            task.status = TaskStatus.FAILED
            task.completed_at = datetime.now(timezone.utc).isoformat()
            task.progress = TaskProgress(stage="failed", percent=100.0, message=f"Failed: {error_message}")
            task.result = TaskResult(
                task_id=task_id,
                status=TaskStatus.FAILED,
                error=error_message
            )

    def request_cancellation(self, task_id: str) -> bool:
        """Flag task for cancellation."""
        if task_id in self._tasks:
            task = self._tasks[task_id]
            task.cancel_requested = True
            if task.status in (TaskStatus.QUEUED, TaskStatus.RUNNING):
                task.status = TaskStatus.CANCELLED
                task.completed_at = datetime.now(timezone.utc).isoformat()
                task.progress = TaskProgress(stage="cancelled", percent=100.0, message="Task was cancelled")
                return True
        return False

    def is_cancelled(self, task_id: str) -> bool:
        """Check if task cancellation was requested."""
        if task_id in self._tasks:
            return self._tasks[task_id].cancel_requested
        return False

    def get_task(self, task_id: str) -> Optional[TaskState]:
        """Retrieve task state by task ID."""
        return self._tasks.get(task_id)

    def list_tasks(self) -> Dict[str, TaskState]:
        """Return all tracked task states."""
        return self._tasks
