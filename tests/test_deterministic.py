"""Tests for Deterministic Composition Workflow."""

import pytest
from keymuse import MusicAutopilot, MusicBrief


def test_deterministic_reproducibility(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    brief_text = "Compose a 15-second sci-fi theme in D minor at 90 BPM with pads and lead melody."

    # First run with seed 42
    brief1 = autopilot.parse_brief(brief_text)
    brief1.seed = 42
    plan1 = autopilot.plan_composition(brief1)
    proj1 = autopilot.generate_project(plan1)

    # Second run with seed 42
    brief2 = autopilot.parse_brief(brief_text)
    brief2.seed = 42
    plan2 = autopilot.plan_composition(brief2)
    proj2 = autopilot.generate_project(plan2)

    # Assert plan identity
    assert plan1.total_beats == plan2.total_beats
    assert len(plan1.sections) == len(plan2.sections)
    assert len(plan1.tracks) == len(plan2.tracks)

    # Assert exact note sequence identity across all tracks
    assert len(proj1.tracks) == len(proj2.tracks)
    for t1, t2 in zip(proj1.tracks, proj2.tracks):
        assert len(t1.notes) == len(t2.notes)
        for n1, n2 in zip(t1.notes, t2.notes):
            assert n1.pitch == n2.pitch
            assert n1.start_beat == n2.start_beat
            assert n1.duration_beats == n2.duration_beats
            assert n1.velocity == n2.velocity


def test_seed_variance(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    brief_text = "Compose a 15-second sci-fi theme in D minor at 90 BPM with pads and lead melody."

    brief1 = autopilot.parse_brief(brief_text)
    brief1.seed = 100
    plan1 = autopilot.plan_composition(brief1)
    proj1 = autopilot.generate_project(plan1)

    brief2 = autopilot.parse_brief(brief_text)
    brief2.seed = 200
    plan2 = autopilot.plan_composition(brief2)
    proj2 = autopilot.generate_project(plan2)

    lead1 = next(t for t in proj1.tracks if "lead" in t.id)
    lead2 = next(t for t in proj2.tracks if "lead" in t.id)

    # Pitches should vary between different seeds
    pitches1 = [n.pitch for n in lead1.notes]
    pitches2 = [n.pitch for n in lead2.notes]
    assert pitches1 != pitches2
