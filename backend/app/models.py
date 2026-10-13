from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class Preset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    category: str = Field(default="user", max_length=50)
    instrument: str = Field(default="piano", max_length=50)
    bpm: int = Field(default=120, ge=30, le=300)
    scale: str = Field(default="major", max_length=50)
    root_note: str = Field(default="C", max_length=10)
    octave: int = Field(default=4, ge=1, le=7)
    synth_settings_json: str = Field(default="{}")
    effects_settings_json: str = Field(default="{}")
    drum_pattern_json: str = Field(default="{}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
