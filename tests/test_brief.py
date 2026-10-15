"""Tests for MusicBrief schema and validation."""

import pytest
from pydantic import ValidationError
from keymuse.models.brief import MusicBrief, UserConstraints


def test_music_brief_defaults():
    brief = MusicBrief(description="Test cinematic soundtrack")
    assert brief.target_duration == 60.0
    assert brief.tempo == 90.0
    assert brief.key == "D"
    assert brief.mode == "minor"
    assert "atmospheric_pad" in brief.desired_instruments
    assert len(brief.arrangement_structure) == 4
    assert brief.seed == 42


def test_music_brief_custom_values():
    brief = MusicBrief(
        description="A fast 30s electro beat in A minor at 128 BPM",
        genre="electronic",
        target_duration=30.0,
        tempo=128.0,
        key="a",
        mode="minor",
        desired_instruments=["bass_pulse", "percussion"],
        seed=101
    )
    assert brief.key == "A"
    assert brief.mode == "minor"
    assert brief.tempo == 128.0
    assert brief.target_duration == 30.0
    assert brief.seed == 101


def test_music_brief_constraints_enforcement():
    constraints = UserConstraints(
        min_duration=45.0,
        max_duration=120.0,
        required_instruments=["orchestral_strings"],
        banned_instruments=["percussion"]
    )
    brief = MusicBrief(
        description="Short track with percussion",
        target_duration=20.0,
        desired_instruments=["percussion", "synth_lead"],
        constraints=constraints
    )
    # Target duration elevated to min_duration
    assert brief.target_duration == 45.0
    # Percussion banned
    assert "percussion" not in brief.desired_instruments
    # Orchestral strings injected
    assert "orchestral_strings" in brief.desired_instruments


def test_music_brief_invalid_tempo():
    with pytest.raises(ValidationError):
        MusicBrief(description="Invalid tempo", tempo=500.0)


def test_interpreter_cinematic_brief():
    from keymuse.autopilot.interpreter import MusicBriefInterpreter
    interpreter = MusicBriefInterpreter()
    text = (
        "Compose a 60-second cinematic sci-fi soundtrack in D minor at 90 BPM. "
        "Start mysteriously, gradually build tension, introduce a powerful climax, "
        "and end with a clean, resolved finish. Use atmospheric pads, pulsing bass, "
        "percussion, and a memorable lead melody."
    )
    brief = interpreter.interpret(text)
    assert brief.target_duration == 60.0
    assert brief.tempo == 90.0
    assert brief.key == "D"
    assert brief.mode == "minor"
    assert brief.genre == "cinematic"
    assert brief.subgenre == "sci-fi"
    assert "atmospheric_pad" in brief.desired_instruments
    assert "bass_pulse" in brief.desired_instruments
    assert "percussion" in brief.desired_instruments
    assert "lead_melody" in brief.desired_instruments
    assert brief.arrangement_structure == ["intro", "build", "climax", "resolution"]


def test_interpreter_negative_constraints():
    from keymuse.autopilot.interpreter import MusicBriefInterpreter
    interpreter = MusicBriefInterpreter()
    text = "compose a 45 second lofi chillhop track in Eb major at 82 bpm without drums"
    brief = interpreter.interpret(text)

    assert brief.target_duration == 45.0
    assert brief.tempo == 82.0
    assert brief.key == "Eb"
    assert brief.mode == "major"
    assert brief.genre == "lofi"
    assert brief.subgenre == "chillhop"
    assert "percussion" not in brief.desired_instruments
    assert "percussion" in brief.constraints.banned_instruments


def test_interpreter_word_durations():
    from keymuse.autopilot.interpreter import MusicBriefInterpreter
    interpreter = MusicBriefInterpreter()
    brief = interpreter.interpret("two minute orchestral battle theme in C minor")
    assert brief.target_duration == 120.0
    assert brief.key == "C"
    assert brief.mode == "minor"
    assert brief.genre == "orchestral"


def test_interpreter_soothing_tune():
    from keymuse.autopilot.interpreter import MusicBriefInterpreter
    interpreter = MusicBriefInterpreter()
    brief = interpreter.interpret("make a 30s soothing tune in G major with piano and violin")
    assert brief.target_duration == 30.0
    assert brief.key == "G"
    assert brief.mode == "major"
    assert brief.tempo == 70.0
    assert "piano" in brief.desired_instruments
    assert "orchestral_strings" in brief.desired_instruments


def test_interpreter_upbeat_pop():
    from keymuse.autopilot.interpreter import MusicBriefInterpreter
    interpreter = MusicBriefInterpreter()
    brief = interpreter.interpret("happy upbeat pop song at 128 bpm")
    assert brief.tempo == 128.0
    assert brief.mode == "major"
    assert brief.genre == "pop"
    assert "piano" in brief.desired_instruments
    assert "bass_pulse" in brief.desired_instruments
    assert "percussion" in brief.desired_instruments
    assert "lead_melody" in brief.desired_instruments


def test_interpreter_cyberpunk_high_energy():
    from keymuse.autopilot.interpreter import MusicBriefInterpreter
    interpreter = MusicBriefInterpreter()
    brief = interpreter.interpret("dark cyberpunk electronic beat at 140bpm in F# minor with aggressive bass")
    assert brief.tempo == 140.0
    assert brief.key == "F#"
    assert brief.mode == "minor"
    assert brief.genre == "electronic"
    assert brief.subgenre == "cyberpunk"
    assert "bass_pulse" in brief.desired_instruments
    assert "lead_melody" in brief.desired_instruments
    assert brief.energy >= 0.70

