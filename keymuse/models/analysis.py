"""Audio and Musical Analysis Models."""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class QualityCheck(BaseModel):
    """An individual objective assertion or quality evaluation."""
    name: str = Field(..., description="Name of the check (e.g. DurationCheck, AntiClippingCheck)")
    status: str = Field(..., pattern="^(passed|warning|failed|not_evaluated)$", description="Evaluation outcome")
    message: str = Field(..., description="Actionable diagnostic message")
    measured_value: Optional[Any] = Field(default=None, description="Observed measurement")
    expected_value: Optional[Any] = Field(default=None, description="Target or limit constraint")


class AudioAnalysisResult(BaseModel):
    """Empirical measurements extracted from rendered audio file."""
    duration_seconds: float = Field(..., ge=0.0, description="Actual rendered length in seconds")
    sample_rate: int = Field(default=44100, description="Sampling rate (e.g. 44100 or 48000 Hz)")
    channels: int = Field(default=2, ge=1, le=2, description="Channel count (1=Mono, 2=Stereo)")
    peak_amplitude: float = Field(..., ge=0.0, le=1.5, description="Peak linear amplitude (0.0 to 1.0+)")
    peak_db: float = Field(..., description="Peak amplitude in dBFS (0.0 dB is digital ceiling)")
    rms_level: float = Field(..., ge=0.0, description="Root Mean Square energy")
    rms_db: float = Field(..., description="RMS level in dBFS")
    clipping_risk: bool = Field(default=False, description="True if peak amplitude reaches or exceeds 0.999 (0 dBFS)")
    start_silence_seconds: float = Field(default=0.0, description="Leading silence duration before first audio transient")
    end_silence_seconds: float = Field(default=0.0, description="Trailing silence after final audio transient")
    unexpected_gaps: List[Dict[str, float]] = Field(default_factory=list, description="Internal audio gaps/dropouts detected")
    checks: List[QualityCheck] = Field(default_factory=list, description="List of quality assertions")

    @property
    def is_passed(self) -> bool:
        """True if all mandatory checks passed with no failures."""
        return all(c.status != "failed" for c in self.checks)


class MusicalAnalysisResult(BaseModel):
    """Structural and musical integrity analysis of project note data."""
    track_count: int = Field(..., ge=0)
    note_count: int = Field(..., ge=0)
    total_beats: float = Field(..., ge=0.0)
    detected_sections: List[str] = Field(default_factory=list)
    missing_instruments: List[str] = Field(default_factory=list)
    checks: List[QualityCheck] = Field(default_factory=list)

    @property
    def is_passed(self) -> bool:
        return all(c.status != "failed" for c in self.checks)
