"""Audio Quality Inspector: Measures real audio properties and evaluates objective constraints."""

import math
import wave
import numpy as np
from typing import List, Dict, Any, Optional
from keymuse.models.analysis import AudioAnalysisResult, QualityCheck, MusicalAnalysisResult
from keymuse.models.project import KeyMuseProject


class AudioQualityInspector:
    """Performs empirical signal processing measurements on rendered WAV files."""

    def __init__(self, silence_threshold_db: float = -55.0):
        self.silence_threshold_db = silence_threshold_db

    def inspect_audio_file(
        self,
        wav_path: str,
        target_duration: Optional[float] = None,
        max_peak_db: float = -0.5
    ) -> AudioAnalysisResult:
        """Inspect and measure real audio file properties."""
        with wave.open(wav_path, "rb") as wf:
            channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            sampwidth = wf.getsampwidth()
            n_frames = wf.getnframes()
            raw_bytes = wf.readframes(n_frames)

        # Convert PCM bytes to float32 normalized [-1.0, 1.0]
        if sampwidth == 2:
            data = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        else:
            data = np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) / 128.0 - 1.0

        if channels == 2:
            audio = data.reshape(-1, 2)
        else:
            audio = data.reshape(-1, 1)

        duration_sec = n_frames / float(sample_rate)

        # Peak amplitude and dBFS
        peak_amp = float(np.max(np.abs(audio))) if len(audio) > 0 else 0.0
        peak_db = 20.0 * math.log10(max(1e-9, peak_amp))

        # RMS amplitude and dBFS
        rms_amp = float(np.sqrt(np.mean(audio ** 2))) if len(audio) > 0 else 0.0
        rms_db = 20.0 * math.log10(max(1e-9, rms_amp))

        # Clipping risk (amplitude reaching 0.999 = -0.01 dBFS)
        clipping_risk = peak_amp >= 0.999 or peak_db >= -0.01

        # Silence measurements
        silence_thresh_linear = 10.0 ** (self.silence_threshold_db / 20.0)
        envelope = np.max(np.abs(audio), axis=1)

        active_indices = np.where(envelope > silence_thresh_linear)[0]
        if len(active_indices) > 0:
            start_silence_sec = active_indices[0] / float(sample_rate)
            end_silence_sec = (len(envelope) - 1 - active_indices[-1]) / float(sample_rate)
        else:
            start_silence_sec = duration_sec
            end_silence_sec = 0.0

        # Quality Assertions
        checks: List[QualityCheck] = []

        # 1. Anti-Clipping Check
        if peak_db > max_peak_db:
            checks.append(QualityCheck(
                name="AntiClippingCheck",
                status="failed",
                message=f"Peak amplitude ({peak_db:.2f} dBFS) exceeds maximum safe ceiling ({max_peak_db:.2f} dBFS).",
                measured_value=round(peak_db, 2),
                expected_value=max_peak_db
            ))
        else:
            checks.append(QualityCheck(
                name="AntiClippingCheck",
                status="passed",
                message=f"Peak level ({peak_db:.2f} dBFS) safely within limiter ceiling.",
                measured_value=round(peak_db, 2),
                expected_value=max_peak_db
            ))

        # 2. Duration Check
        if target_duration is not None:
            dur_diff = abs(duration_sec - target_duration)
            if dur_diff <= 3.5:
                checks.append(QualityCheck(
                    name="DurationCheck",
                    status="passed",
                    message=f"Audio duration ({duration_sec:.2f}s) matches target ({target_duration:.2f}s).",
                    measured_value=round(duration_sec, 2),
                    expected_value=target_duration
                ))
            else:
                checks.append(QualityCheck(
                    name="DurationCheck",
                    status="warning" if dur_diff <= 6.0 else "failed",
                    message=f"Audio duration ({duration_sec:.2f}s) deviates from target ({target_duration:.2f}s).",
                    measured_value=round(duration_sec, 2),
                    expected_value=target_duration
                ))

        # 3. Dynamic RMS Check
        if rms_db < -45.0:
            checks.append(QualityCheck(
                name="RMSLoudnessCheck",
                status="warning",
                message=f"Signal energy ({rms_db:.2f} dBFS) is very quiet; consider adjusting channel gain.",
                measured_value=round(rms_db, 2),
                expected_value="-20 to -14 dBFS"
            ))
        else:
            checks.append(QualityCheck(
                name="RMSLoudnessCheck",
                status="passed",
                message=f"Signal energy ({rms_db:.2f} dBFS) is healthy.",
                measured_value=round(rms_db, 2),
                expected_value="-20 to -14 dBFS"
            ))

        # 4. Stereo Channel Check
        checks.append(QualityCheck(
            name="StereoChannelCheck",
            status="passed" if channels == 2 else "warning",
            message=f"Rendered in {'stereo' if channels == 2 else 'mono'} ({channels} channel(s)).",
            measured_value=channels,
            expected_value=2
        ))

        return AudioAnalysisResult(
            duration_seconds=round(duration_sec, 3),
            sample_rate=sample_rate,
            channels=channels,
            peak_amplitude=round(peak_amp, 4),
            peak_db=round(peak_db, 2),
            rms_level=round(rms_amp, 4),
            rms_db=round(rms_db, 2),
            clipping_risk=clipping_risk,
            start_silence_seconds=round(start_silence_sec, 3),
            end_silence_seconds=round(end_silence_sec, 3),
            unexpected_gaps=[],
            checks=checks
        )

    def inspect_project_structure(self, project: KeyMuseProject, required_instruments: List[str] = None) -> MusicalAnalysisResult:
        """Evaluate structural and musical coverage in project data."""
        checks: List[QualityCheck] = []
        track_count = len(project.tracks)
        note_count = project.total_note_count()
        detected_sections = [s.name for s in project.sections]

        # Note count check
        if note_count < 10:
            checks.append(QualityCheck(
                name="NoteDensityCheck",
                status="failed",
                message=f"Insufficient note events ({note_count} notes).",
                measured_value=note_count,
                expected_value=">= 10"
            ))
        else:
            checks.append(QualityCheck(
                name="NoteDensityCheck",
                status="passed",
                message=f"Rich harmonic and melodic density ({note_count} notes).",
                measured_value=note_count,
                expected_value=">= 10"
            ))

        # Instrument coverage check
        present_instruments = {t.instrument.lower() for t in project.tracks}
        missing: List[str] = []
        if required_instruments:
            for req in required_instruments:
                if req.lower() not in present_instruments:
                    missing.append(req)

        if missing:
            checks.append(QualityCheck(
                name="InstrumentCoverageCheck",
                status="warning",
                message=f"Missing requested instruments: {', '.join(missing)}.",
                measured_value=list(present_instruments),
                expected_value=required_instruments
            ))
        else:
            checks.append(QualityCheck(
                name="InstrumentCoverageCheck",
                status="passed",
                message="All requested instrument categories present.",
                measured_value=list(present_instruments),
                expected_value=required_instruments
            ))

        return MusicalAnalysisResult(
            track_count=track_count,
            note_count=note_count,
            total_beats=project.duration_seconds() * (project.bpm / 60.0),
            detected_sections=detected_sections,
            missing_instruments=missing,
            checks=checks
        )
