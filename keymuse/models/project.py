"""Canonical KeyMuseProject and Note/Track/Section models."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class Note(BaseModel):
    """An individual musical note event."""
    pitch: int = Field(..., ge=0, le=127, description="MIDI note number (0 to 127)")
    start_beat: float = Field(..., ge=0.0, description="Start time in musical beats from timeline start")
    duration_beats: float = Field(..., gt=0.0, description="Duration in beats")
    velocity: int = Field(default=90, ge=1, le=127, description="Note strike velocity (1 to 127)")


class Track(BaseModel):
    """A distinct instrument or voice layer containing note sequences."""
    id: str = Field(..., description="Unique track identifier")
    name: str = Field(..., description="Descriptive track name")
    instrument: str = Field(..., description="Instrument voice/timbre type")
    volume: float = Field(default=0.8, ge=0.0, le=1.0, description="Track fader level")
    pan: float = Field(default=0.0, ge=-1.0, le=1.0, description="Stereo pan position")
    notes: List[Note] = Field(default_factory=list, description="Array of musical notes")


class Section(BaseModel):
    """Structural marker and energy region within the composition."""
    name: str = Field(..., description="Section title (e.g. Intro, Build, Climax)")
    start_beat: float = Field(..., ge=0.0, description="Start beat")
    length_beats: float = Field(..., ge=1.0, description="Length in beats")
    energy: float = Field(default=0.5, ge=0.0, le=1.0, description="Relative musical energy")
    description: str = Field(default="", description="Narrative purpose of the section")


class KeyMuseProject(BaseModel):
    """Canonical representation of a complete musical composition."""
    id: str = Field(..., description="Unique project ID or slug")
    title: str = Field(default="Untitled", description="Composition title")
    bpm: float = Field(default=120.0, ge=30.0, le=300.0, description="Beats per minute")
    key: str = Field(default="C", description="Key root note")
    mode: str = Field(default="major", description="Scale mode")
    time_signature: str = Field(default="4/4", description="Time signature")
    version: int = Field(default=1, ge=1, description="Project revision version")
    sections: List[Section] = Field(default_factory=list, description="Musical timeline sections")
    tracks: List[Track] = Field(default_factory=list, description="Multi-track stems and note sequences")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata, author, brief references")

    def duration_seconds(self) -> float:
        """Calculate total duration of the project based on the latest note or section."""
        max_beat = 0.0
        for s in self.sections:
            end_beat = s.start_beat + s.length_beats
            if end_beat > max_beat:
                max_beat = end_beat
        for t in self.tracks:
            for n in t.notes:
                end_beat = n.start_beat + n.duration_beats
                if end_beat > max_beat:
                    max_beat = end_beat
        if max_beat <= 0:
            return 0.0
        seconds_per_beat = 60.0 / self.bpm
        return max_beat * seconds_per_beat

    def total_note_count(self) -> int:
        """Total notes across all tracks."""
        return sum(len(t.notes) for t in self.tracks)
