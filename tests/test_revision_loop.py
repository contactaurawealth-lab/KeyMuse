"""Tests for Closed-Loop Targeted Revision Engine."""

import os
import numpy as np
import pytest
from keymuse import MusicAutopilot, KeyMuseProject, Track, Note, Section
from keymuse.models.analysis import AudioAnalysisResult, QualityCheck
from keymuse.autopilot.reviser import RevisionPlanner


def test_revision_planner_clipping_repair():
    reviser = RevisionPlanner()

    project = KeyMuseProject(
        id="proj_clipping_test",
        title="Clipping Test",
        bpm=120.0,
        version=1,
        tracks=[
            Track(
                id="t_loud",
                name="Loud Track",
                instrument="synth_lead",
                volume=1.0,
                notes=[Note(pitch=60, start_beat=0.0, duration_beats=2.0, velocity=127)]
            )
        ]
    )

    # Simulated analysis indicating clipping
    clipped_analysis = AudioAnalysisResult(
        duration_seconds=10.0,
        sample_rate=44100,
        channels=2,
        peak_amplitude=1.0,
        peak_db=0.0,
        rms_level=0.4,
        rms_db=-7.96,
        clipping_risk=True,
        checks=[
            QualityCheck(
                name="AntiClippingCheck",
                status="failed",
                message="Signal reached digital ceiling",
                measured_value=0.0,
                expected_value=-0.5
            )
        ]
    )

    revised_proj, plan = reviser.evaluate_and_revise(
        project,
        clipped_analysis,
        iteration=1,
        max_peak_db=-0.5
    )

    assert revised_proj.version == 2
    assert len(plan.edits) > 0
    vol_edit = next(e for e in plan.edits if e.action_type == "adjust_volume")
    assert vol_edit.parameters["gain_factor"] < 1.0
    # Track volume lowered
    assert revised_proj.tracks[0].volume < 1.0


def test_revision_planner_duration_repair():
    reviser = RevisionPlanner()

    project = KeyMuseProject(
        id="proj_dur_test",
        title="Duration Test",
        bpm=120.0,
        version=1,
        tracks=[
            Track(
                id="t1",
                name="Track 1",
                instrument="piano",
                notes=[Note(pitch=60, start_beat=0.0, duration_beats=40.0, velocity=80)]
            )
        ]
    )

    # Simulated analysis: rendered 20s, but target was 30s
    short_analysis = AudioAnalysisResult(
        duration_seconds=20.0,
        sample_rate=44100,
        channels=2,
        peak_amplitude=0.6,
        peak_db=-4.44,
        rms_level=0.2,
        rms_db=-13.98,
        clipping_risk=False,
        checks=[]
    )

    revised_proj, plan = reviser.evaluate_and_revise(
        project,
        short_analysis,
        iteration=1,
        target_duration=30.0
    )

    assert revised_proj.version == 2
    dur_edit = next(e for e in plan.edits if e.action_type == "adjust_duration")
    assert dur_edit is not None
    # BPM decreased so that duration expands to hit 30s target
    assert revised_proj.bpm < 120.0


def test_closed_loop_execution_improves_metrics(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))

    brief_text = "Create a 10-second fast rhythm in A minor at 140 BPM with pads and lead."
    result = autopilot.compose(brief=brief_text)

    assert result.status == "completed"
    assert result.project_path is not None
    assert result.audio_path is not None
    assert result.report_path is not None

    # Load report and verify closed-loop comparative results
    import json
    with open(result.report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    assert "initial_analysis" in report
    assert "revision_plan" in report
    assert "final_analysis" in report
    assert report["project_summary"]["version"] >= 2
    assert report["final_analysis"]["clipping_risk"] is False
