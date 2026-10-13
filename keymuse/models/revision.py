"""Targeted Revision and EditAction models."""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from keymuse.models.analysis import AudioAnalysisResult


class EditAction(BaseModel):
    """A discrete, surgical edit applied to a KeyMuseProject."""
    action_type: str = Field(
        ...,
        pattern="^(adjust_volume|adjust_duration|add_track|remove_track|modify_notes|add_ending|correct_tempo|rescale_energy)$",
        description="Type of modification"
    )
    target: str = Field(..., description="Target entity ID or scope (e.g. track_pad, master, section_climax)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Modification parameters (e.g. gain_factor: 0.85)")


class RevisionPlan(BaseModel):
    """Plan detailing changes required to address detected musical or audio defects."""
    iteration: int = Field(default=1, ge=1, description="Iteration sequence number")
    reason: str = Field(..., description="High-level motivation for this revision pass")
    detected_issues: List[str] = Field(default_factory=list, description="List of problems detected during analysis")
    edits: List[EditAction] = Field(..., min_length=1, description="Targeted edits to perform")


class RevisionRecord(BaseModel):
    """Historical trace of a revision pass and comparative before/after results."""
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    iteration: int
    previous_version: int
    new_version: int
    reason: str
    edits_applied: List[EditAction]
    pre_analysis: Optional[AudioAnalysisResult] = None
    post_analysis: Optional[AudioAnalysisResult] = None
