"""Tests for Audio and Music Quality Inspector."""

import os
import wave
import numpy as np
import pytest
from keymuse.core.analyzer import AudioQualityInspector
from keymuse.models.project import KeyMuseProject, Track, Note, Section


def test_audio_inspector_measurements(tmp_path):
    inspector = AudioQualityInspector()
    wav_path = os.path.join(str(tmp_path), "test_audio.wav")

    # Generate a known 2.0-second 44.1kHz stereo audio file
    # First 0.2s silent, 1.6s 440Hz sine wave (peak 0.5 = -6 dBFS), last 0.2s silent
    sr = 44100
    duration = 2.0
    t = np.linspace(0, duration, int(duration * sr), endpoint=False, dtype=np.float32)
    signal = np.zeros_like(t)

    active_start = int(0.2 * sr)
    active_end = int(1.8 * sr)
    signal[active_start:active_end] = 0.5 * np.sin(2 * np.pi * 440.0 * t[active_start:active_end])

    stereo_signal = np.column_stack([signal, signal])
    pcm16 = (stereo_signal * 32767.0).astype(np.int16)

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm16.tobytes())

    # Inspect
    analysis = inspector.inspect_audio_file(wav_path, target_duration=2.0)

    assert analysis.channels == 2
    assert analysis.sample_rate == 44100
    assert abs(analysis.duration_seconds - 2.0) < 0.05
    assert abs(analysis.peak_amplitude - 0.5) < 0.05
    # Peak dB should be roughly -6 dBFS
    assert abs(analysis.peak_db - (-6.02)) < 0.5
    assert analysis.clipping_risk is False

    # Start and end silence should be approximately 0.2s
    assert abs(analysis.start_silence_seconds - 0.2) < 0.05
    assert abs(analysis.end_silence_seconds - 0.2) < 0.05

    # Check assertions
    check_names = {c.name: c.status for c in analysis.checks}
    assert check_names["DurationCheck"] == "passed"
    assert check_names["AntiClippingCheck"] == "passed"
    assert check_names["StereoChannelCheck"] == "passed"


def test_audio_inspector_clipping_detection(tmp_path):
    inspector = AudioQualityInspector()
    wav_path = os.path.join(str(tmp_path), "clipped.wav")

    # Create signal with clipping at 1.0 (0 dBFS)
    sr = 44100
    signal = np.ones(sr, dtype=np.float32)  # 1 second of maximum amplitude
    stereo = np.column_stack([signal, signal])
    pcm16 = (stereo * 32767.0).astype(np.int16)

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm16.tobytes())

    analysis = inspector.inspect_audio_file(wav_path, max_peak_db=-0.5)
    assert analysis.clipping_risk is True
    clipping_check = next(c for c in analysis.checks if c.name == "AntiClippingCheck")
    assert clipping_check.status == "failed"


def test_project_structural_inspection():
    inspector = AudioQualityInspector()

    project = KeyMuseProject(
        id="test_struct",
        bpm=120.0,
        sections=[Section(name="Intro", start_beat=0.0, length_beats=4.0)],
        tracks=[
            Track(
                id="t_pad",
                name="Pad",
                instrument="atmospheric_pad",
                notes=[Note(pitch=60, start_beat=0.0, duration_beats=1.0, velocity=80) for _ in range(12)]
            )
        ]
    )

    result = inspector.inspect_project_structure(
        project,
        required_instruments=["atmospheric_pad", "percussion"]
    )

    assert result.track_count == 1
    assert result.note_count == 12
    assert "percussion" in result.missing_instruments
    inst_check = next(c for c in result.checks if c.name == "InstrumentCoverageCheck")
    assert inst_check.status == "warning"
