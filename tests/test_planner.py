"""Tests for CompositionPlanner."""

import pytest
from keymuse.models.brief import MusicBrief
from keymuse.autopilot.planner import CompositionPlanner


def test_composition_planner_bar_alignment():
    brief = MusicBrief(
        description="60s track in D minor at 90 BPM",
        target_duration=60.0,
        tempo=90.0,
        key="D",
        mode="minor"
    )
    planner = CompositionPlanner()
    plan = planner.plan(brief)

    # At 90 BPM: 1 beat = 60/90 = 0.6667s.
    # 4 beats per bar = 2.6667s.
    # 60s / 2.6667s = 22.5 bars -> rounded to 23 bars = 92 beats -> 61.33s.
    assert plan.total_beats % 4.0 == 0.0
    assert abs(plan.total_duration_seconds - 60.0) < 3.0
    assert plan.key == "D"
    assert plan.mode == "minor"
    assert plan.tempo == 90.0


def test_composition_planner_sections_and_energy():
    brief = MusicBrief(
        description="Cinematic piece with intro, build, climax, resolution",
        target_duration=60.0,
        tempo=90.0,
        desired_instruments=["atmospheric_pad", "bass_pulse", "percussion", "lead_melody"]
    )
    planner = CompositionPlanner()
    plan = planner.plan(brief)

    assert len(plan.sections) == 4
    section_names = [s.name.lower() for s in plan.sections]
    assert "intro" in section_names
    assert "build" in section_names
    assert "climax" in section_names
    assert "resolution" in section_names

    # Check continuous timeline
    total_planned_beats = 0.0
    for s in plan.sections:
        assert s.start_beat == total_planned_beats
        total_planned_beats += s.length_beats
    assert total_planned_beats == plan.total_beats

    # Energy curve verification
    intro_sec = next(s for s in plan.sections if "intro" in s.name.lower())
    climax_sec = next(s for s in plan.sections if "climax" in s.name.lower())
    res_sec = next(s for s in plan.sections if "resolution" in s.name.lower())

    assert climax_sec.energy > intro_sec.energy
    assert climax_sec.energy > res_sec.energy
    assert len(climax_sec.active_track_ids) == len(plan.tracks)


def test_composition_planner_track_roles():
    brief = MusicBrief(
        description="Sci-fi track",
        desired_instruments=["atmospheric_pad", "bass_pulse", "percussion", "lead_melody"]
    )
    planner = CompositionPlanner()
    plan = planner.plan(brief)

    roles = {t.role for t in plan.tracks}
    assert "harmony" in roles
    assert "bass" in roles
    assert "percussion" in roles
    assert "melody" in roles
