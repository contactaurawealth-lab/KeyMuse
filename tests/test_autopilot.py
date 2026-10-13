"""Tests for high-level MusicAutopilot API."""

import os
import wave
import pytest
from keymuse import MusicAutopilot, MusicBrief


def test_autopilot_initialization(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    assert os.path.exists(autopilot.output_dir)
    assert autopilot.sample_rate == 44100


def test_autopilot_compose_short_track(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    brief_text = "Create a 10-second ambient piece in C major at 120 BPM with pads and lead melody."

    result = autopilot.compose(brief=brief_text)

    assert result.status == "completed"
    assert result.project_path is not None
    assert os.path.exists(result.project_path)

    assert result.audio_path is not None
    assert os.path.exists(result.audio_path)

    assert result.midi_path is not None
    assert os.path.exists(result.midi_path)

    assert result.report_path is not None
    assert os.path.exists(result.report_path)

    # Verify WAV file is valid 16-bit stereo PCM
    with wave.open(result.audio_path, "rb") as wf:
        assert wf.getnchannels() == 2
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == 44100
        frames = wf.getnframes()
        duration = frames / 44100.0
        # Duration should be close to 10 seconds + decay tail
        assert duration >= 9.0

    # Verify MIDI file starts with MThd
    with open(result.midi_path, "rb") as mf:
        header = mf.read(4)
        assert header == b"MThd"


def test_autopilot_methods(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))

    brief = autopilot.parse_brief("20-second sci-fi track in D minor at 90 BPM")
    assert brief.target_duration == 20.0
    assert brief.key == "D"

    plan = autopilot.plan_composition(brief)
    assert len(plan.sections) >= 2
    assert len(plan.tracks) >= 3

    project = autopilot.generate_project(plan)
    assert len(project.tracks) == len(plan.tracks)
    assert project.total_note_count() > 0

    wav_path = os.path.join(str(tmp_path), "test_preview.wav")
    rendered_path = autopilot.render_preview(project, wav_path)
    assert os.path.exists(rendered_path)

    analysis = autopilot.inspect_audio(rendered_path, target_duration=20.0)
    assert analysis.channels == 2
    assert analysis.peak_amplitude > 0.0
    assert analysis.rms_level > 0.0
    assert len(analysis.checks) > 0

    revised_project, rev_plan = autopilot.apply_revision(project, analysis, target_duration=20.0)
    assert revised_project.version == project.version + 1
    assert len(rev_plan.edits) > 0
