"""CompositionPlan, SectionPlan, and TrackPlan models."""

from typing import List, Optional
from pydantic import BaseModel, Field


class TrackPlan(BaseModel):
    """Specification for an individual musical track in the composition plan."""
    track_id: str = Field(..., description="Unique track identifier (e.g., track_pad, track_bass)")
    name: str = Field(..., description="Display name for the track")
    instrument: str = Field(..., description="Sound/instrument type (atmospheric_pad, bass_pulse, lead_melody, percussion, etc.)")
    role: str = Field(default="harmony", description="Musical role: harmony, bass, melody, percussion, arpeggio")
    pitch_register: str = Field(default="mid", description="Pitch register: low, mid, high, full")
    polyphony_limit: int = Field(default=8, ge=1, le=32, description="Maximum simultaneous active voices")
    volume: float = Field(default=0.8, ge=0.0, le=1.0, description="Base channel volume")
    pan: float = Field(default=0.0, ge=-1.0, le=1.0, description="Stereo panning (-1.0 left to 1.0 right)")


class SectionPlan(BaseModel):
    """Specification for a musical section (e.g. Intro, Build, Climax, Resolution)."""
    name: str = Field(..., description="Section name")
    start_beat: float = Field(..., ge=0.0, description="Starting beat offset in the timeline")
    length_beats: float = Field(..., ge=1.0, description="Duration in musical beats")
    energy: float = Field(default=0.5, ge=0.0, le=1.0, description="Energy level curve (0.0 quiet to 1.0 maximum intensity)")
    dynamic_level: str = Field(default="mf", description="Dynamic marking: pp, p, mp, mf, f, ff")
    active_track_ids: List[str] = Field(default_factory=list, description="IDs of tracks actively playing in this section")
    transition_type: str = Field(default="normal", description="Transition behavior: fade_in, sudden, drop, swell, ritardando, normal")


class CompositionPlan(BaseModel):
    """Structured architectural plan for a musical piece before note generation."""
    brief_id: str = Field(default="brief-default", description="Reference to originating MusicBrief")
    title: str = Field(default="Untitled Composition", description="Title of the composition")
    tempo: float = Field(..., ge=40.0, le=240.0, description="Tempo in BPM")
    key: str = Field(default="D", description="Musical key tonic")
    mode: str = Field(default="minor", description="Musical mode/scale")
    time_signature: str = Field(default="4/4", description="Time signature")
    total_duration_seconds: float = Field(..., ge=1.0, description="Target total duration in seconds")
    total_beats: float = Field(..., ge=1.0, description="Total beats computed from duration and tempo")
    sections: List[SectionPlan] = Field(..., min_length=1, description="Sequential section arrangements")
    tracks: List[TrackPlan] = Field(..., min_length=1, description="Planned instruments and tracks")
    seed: Optional[int] = Field(default=42, description="RNG seed for deterministic realization")
