"""Tests for Task Orchestrator and Asynchronous Task Execution."""

import time
import pytest
from keymuse import MusicAutopilot
from keymuse.autopilot.orchestrator import TaskOrchestrator
from keymuse.models.task import TaskStatus, TaskResult


def test_orchestrator_lifecycle():
    orch = TaskOrchestrator()
    task = orch.create_task()
    assert task.status == TaskStatus.QUEUED

    orch.update_progress(task.task_id, "planning", 25.0, "Planning composition")
    assert orch.get_task(task.task_id).status == TaskStatus.RUNNING
    assert orch.get_task(task.task_id).progress.percent == 25.0

    res = TaskResult(task_id=task.task_id, status=TaskStatus.COMPLETED, duration_seconds=1.5)
    orch.complete_task(task.task_id, res)
    assert orch.get_task(task.task_id).status == TaskStatus.COMPLETED


def test_idempotency_key_deduplication():
    orch = TaskOrchestrator()
    task1 = orch.create_task(idempotency_key="request-abc-123")
    task2 = orch.create_task(idempotency_key="request-abc-123")
    # Same task returned
    assert task1.task_id == task2.task_id


def test_cancellation():
    orch = TaskOrchestrator()
    task = orch.create_task()
    assert orch.is_cancelled(task.task_id) is False

    success = orch.request_cancellation(task.task_id)
    assert success is True
    assert orch.is_cancelled(task.task_id) is True
    assert orch.get_task(task.task_id).status == TaskStatus.CANCELLED


def test_compose_async_execution(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    brief_text = "5-second quick ambient piece in C major at 120 BPM"

    task_state = autopilot.compose_async(brief=brief_text)
    assert task_state.task_id is not None
    assert task_state.status in (TaskStatus.QUEUED, TaskStatus.RUNNING)

    # Poll until completed (with timeout)
    start_wait = time.time()
    while time.time() - start_wait < 15.0:
        updated = autopilot.get_task_status(task_state.task_id)
        if updated.status in (TaskStatus.COMPLETED, TaskStatus.FAILED):
            break
        time.sleep(0.2)

    final_state = autopilot.get_task_status(task_state.task_id)
    assert final_state.status == TaskStatus.COMPLETED
    assert final_state.result is not None
    assert final_state.result.audio_path is not None
