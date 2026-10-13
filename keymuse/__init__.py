"""KeyMuse: Python-first Music Composition Engine, AI Music Autopilot, and Agent Orchestration."""

from keymuse.autopilot.autopilot import MusicAutopilot
from keymuse.models.brief import MusicBrief, UserConstraints
from keymuse.models.plan import CompositionPlan, SectionPlan, TrackPlan
from keymuse.models.project import KeyMuseProject, Track, Note, Section
from keymuse.models.analysis import AudioAnalysisResult, QualityCheck
from keymuse.models.revision import RevisionPlan, EditAction
from keymuse.models.task import TaskState, TaskStatus, TaskResult

__version__ = "2.0.0"

__all__ = [
    "MusicAutopilot",
    "MusicBrief",
    "UserConstraints",
    "CompositionPlan",
    "SectionPlan",
    "TrackPlan",
    "KeyMuseProject",
    "Track",
    "Note",
    "Section",
    "AudioAnalysisResult",
    "QualityCheck",
    "RevisionPlan",
    "EditAction",
    "TaskState",
    "TaskStatus",
    "TaskResult",
    "__version__",
]
