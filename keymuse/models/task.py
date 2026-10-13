"""Task Orchestration and Execution State models."""

from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskProgress(BaseModel):
    stage: str = Field(default="init", description="Current pipeline stage")
    percent: float = Field(default=0.0, ge=0.0, le=100.0, description="Completion percentage")
    message: str = Field(default="", description="Status detail message")
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TaskResult(BaseModel):
    task_id: str
    status: TaskStatus
    project_id: Optional[str] = None
    project_path: Optional[str] = None
    audio_path: Optional[str] = None
    midi_path: Optional[str] = None
    report_path: Optional[str] = None
    error: Optional[str] = None
    duration_seconds: float = 0.0


class TaskState(BaseModel):
    task_id: str
    status: TaskStatus = TaskStatus.QUEUED
    progress: TaskProgress = Field(default_factory=TaskProgress)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[TaskResult] = None
    cancel_requested: bool = False
