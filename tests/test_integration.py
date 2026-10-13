"""Comprehensive Integration Tests for KeyMuse AI Music Autopilot."""

import os
import json
import wave
import pytest
from keymuse import MusicAutopilot, KeyMuseProject, MusicBrief


def test_end_to_end_closed_loop_integration(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    prompt = (
        "Compose a 12-second cinematic sci-fi soundtrack in D minor at 90 BPM. "
        "Start mysteriously, gradually build tension, introduce a powerful climax, "
        "and end with a clean, resolved finish. Use atmospheric pads, pulsing bass, "
        "percussion, and a memorable lead melody."
    )

    result = autopilot.compose(brief=prompt)

    # 1. Pipeline success
    assert result.status == "completed"
    assert result.error is None
    assert result.duration_seconds > 0.0

    # 2. Project verification
    assert os.path.exists(result.project_path)
    with open(result.project_path, "r", encoding="utf-8") as f:
        proj_data = json.load(f)
    project = KeyMuseProject(**proj_data)
    assert project.bpm == 90.0
    assert project.key == "D"
    assert project.mode == "minor"
    assert len(project.sections) == 4
    track_names = {t.name.lower() for t in project.tracks}
    assert any("pad" in name for name in track_names)
    assert any("bass" in name for name in track_names)
    assert any("percussion" in name for name in track_names)
    assert any("lead" in name for name in track_names)

    # 3. Audio WAV verification
    assert os.path.exists(result.audio_path)
    with wave.open(result.audio_path, "rb") as wf:
        assert wf.getnchannels() == 2
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == 44100
        duration = wf.getnframes() / 44100.0
        # 12s target + tail
        assert duration >= 11.0

    # 4. MIDI file verification
    assert os.path.exists(result.midi_path)
    with open(result.midi_path, "rb") as mf:
        assert mf.read(4) == b"MThd"

    # 5. Stems verification
    stems_dir = os.path.join(os.path.dirname(result.project_path), "stems")
    assert os.path.exists(stems_dir)
    stem_files = [f for f in os.listdir(stems_dir) if f.endswith(".wav")]
    assert len(stem_files) >= 4

    # 6. Report manifest verification
    assert os.path.exists(result.report_path)
    with open(result.report_path, "r", encoding="utf-8") as f:
        report = json.load(f)
    assert report["status"] == "completed"
    assert "initial_analysis" in report
    assert "final_analysis" in report
    assert report["final_analysis"]["clipping_risk"] is False
    for check in report["final_analysis"]["checks"]:
        assert check["status"] in ("passed", "warning")


def test_graceful_error_handling(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    # Unparseable/unsupported input type
    result = autopilot.compose(brief=12345)  # type: ignore
    assert result.status == "failed"
    assert "Unsupported brief input type" in result.error
