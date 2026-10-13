from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class PresetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(default="user", max_length=50)
    instrument: str = Field(default="piano", max_length=50)
    bpm: int = Field(default=120, ge=30, le=300)
    scale: str = Field(default="major", max_length=50)
    root_note: str = Field(default="C", max_length=10)
    octave: int = Field(default=4, ge=1, le=7)
    synth_settings: Optional[Dict[str, Any]] = None
    effects_settings: Optional[Dict[str, Any]] = None
    drum_pattern: Optional[Dict[str, Any]] = None

class PresetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[str] = Field(default=None, max_length=50)
    instrument: Optional[str] = Field(default=None, max_length=50)
    bpm: Optional[int] = Field(default=None, ge=30, le=300)
    scale: Optional[str] = Field(default=None, max_length=50)
    root_note: Optional[str] = Field(default=None, max_length=10)
    octave: Optional[int] = Field(default=None, ge=1, le=7)
    synth_settings: Optional[Dict[str, Any]] = None
    effects_settings: Optional[Dict[str, Any]] = None
    drum_pattern: Optional[Dict[str, Any]] = None

class PresetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category: str
    instrument: str
    bpm: int
    scale: str
    root_note: str
    octave: int
    synth_settings_json: str
    effects_settings_json: str
    drum_pattern_json: str
    created_at: datetime
    updated_at: datetime

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime
