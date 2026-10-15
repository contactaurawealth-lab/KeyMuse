"""Validated MusicBrief Model and User Constraints."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class UserConstraints(BaseModel):
    """Explicit restrictions and rules supplied by the user."""
    min_duration: Optional[float] = Field(default=None, description="Minimum acceptable duration in seconds")
    max_duration: Optional[float] = Field(default=None, description="Maximum acceptable duration in seconds")
    required_instruments: List[str] = Field(default_factory=list, description="Instruments that MUST be present")
    banned_instruments: List[str] = Field(default_factory=list, description="Instruments that MUST NOT be used")
    max_tracks: int = Field(default=16, ge=1, le=32, description="Upper bound on total tracks")
    required_sections: List[str] = Field(default_factory=list, description="Structural sections that must be included")
    max_peak_db: float = Field(default=-0.5, description="Peak ceiling in decibels (anti-clipping)")
    target_lufs: float = Field(default=-14.0, description="Target integrated loudness estimate")


class InferredChoices(BaseModel):
    """Creative musical choices inferred by the system when omitted from the brief."""
    inferred_tempo: bool = False
    inferred_key: bool = False
    inferred_mode: bool = False
    inferred_structure: bool = False
    inferred_instruments: bool = False
    inferred_duration: bool = False
    provider_used: str = "deterministic-rule-engine"


class MusicBrief(BaseModel):
    """Validated specification defining a music composition request."""
    # Description & Intended Use
    description: str = Field(..., min_length=3, max_length=1000, description="Natural language description of the piece")
    intended_use: Optional[str] = Field(default="soundtrack", description="Intended application (film, game, podcast, ambient)")
    
    # Genre & Subgenre
    genre: str = Field(default="cinematic", max_length=50, description="Primary musical genre")
    subgenre: Optional[str] = Field(default="sci-fi", max_length=50, description="Specific subgenre or style")
    
    # Mood & Energy
    mood: str = Field(default="mysterious, tense, powerful", max_length=100, description="Emotional descriptor")
    energy: float = Field(default=0.7, ge=0.0, le=1.0, description="Energy level from 0.0 (calm) to 1.0 (explosive)")
    
    # Tempo & Timing
    target_duration: float = Field(default=60.0, ge=5.0, le=600.0, description="Target duration in seconds")
    tempo: float = Field(default=90.0, ge=40.0, le=240.0, description="Tempo in Beats Per Minute (BPM)")
    tempo_range: Optional[tuple[float, float]] = Field(default=None, description="Optional min/max tempo tolerance")
    time_signature: str = Field(default="4/4", pattern=r"^\d+/\d+$", description="Time signature, e.g. 4/4 or 3/4")
    
    # Key & Tonality
    key: str = Field(default="D", max_length=5, description="Root tonic note (C, C#, Db, D, D#, Eb, etc.)")
    mode: str = Field(default="minor", max_length=30, description="Scale mode (major, minor, dorian, mixolydian, etc.)")
    
    # Instrumentation & Tracks
    desired_instruments: List[str] = Field(
        default_factory=lambda: ["atmospheric_pad", "bass_pulse", "percussion", "lead_melody"],
        description="List of requested instrument voices"
    )
    track_count: int = Field(default=4, ge=1, le=16, description="Target track count")
    
    # Structure & Progression
    arrangement_structure: List[str] = Field(
        default_factory=lambda: ["intro", "build", "climax", "resolution"],
        description="Chronological section names"
    )
    opening: str = Field(default="mysterious, atmospheric introduction", max_length=150)
    ending: str = Field(default="clean, resolved finish", max_length=150)
    
    # Musical References & Complexity
    references: List[str] = Field(default_factory=list, description="General stylistic references (e.g., Blade Runner, Hans Zimmer)")
    complexity: str = Field(default="moderate", pattern="^(simple|moderate|complex)$", description="Harmonic and rhythmic complexity")
    
    # Export & Delivery
    export_formats: List[str] = Field(default_factory=lambda: ["wav", "midi"], description="Deliverable file formats")
    
    # Constraints & Restrictions
    explicit_restrictions: List[str] = Field(default_factory=list, description="User-supplied negative constraints")
    constraints: UserConstraints = Field(default_factory=UserConstraints)
    inferred: InferredChoices = Field(default_factory=InferredChoices)
    
    # Determinism
    seed: Optional[int] = Field(default=42, description="Random seed for reproducible composition")

    @field_validator("key")
    @classmethod
    def normalize_key(cls, v: str) -> str:
        clean = v.strip().capitalize()
        valid_notes = {"C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"}
        if clean not in valid_notes:
            # Fallback to C if unrecognized
            return "C"
        return clean

    @field_validator("mode")
    @classmethod
    def normalize_mode(cls, v: str) -> str:
        clean = v.strip().lower()
        valid_modes = {"major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian", "blues", "pentatonic"}
        if clean not in valid_modes:
            return "minor" if "min" in clean else "major"
        return clean

    @model_validator(mode="after")
    def apply_constraints(self) -> "MusicBrief":
        # Synchronize constraints with desired duration and instruments
        if self.constraints.min_duration and self.target_duration < self.constraints.min_duration:
            self.target_duration = self.constraints.min_duration
        if self.constraints.max_duration and self.target_duration > self.constraints.max_duration:
            self.target_duration = self.constraints.max_duration
        
        # Ensure required instruments are in desired_instruments
        for inst in self.constraints.required_instruments:
            if inst not in self.desired_instruments:
                self.desired_instruments.append(inst)
        
        # Remove banned instruments
        self.desired_instruments = [
            inst for inst in self.desired_instruments 
            if inst not in self.constraints.banned_instruments
        ]
        if not self.desired_instruments:
            self.desired_instruments = ["atmospheric_pad", "synth_lead"]
            
        self.track_count = max(len(self.desired_instruments), self.track_count)
        return self
