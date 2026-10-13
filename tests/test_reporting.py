"""Tests for Project Versioning, Traceability, and Result Reporting."""

import os
import json
import pytest
from keymuse import MusicAutopilot, KeyMuseProject


def test_full_traceability_report(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))
    brief_text = "10-second sci-fi theme in D minor at 90 BPM with pads and lead melody."

    result = autopilot.compose(brief=brief_text)
    assert result.status == "completed"
    assert result.report_path is not None
    assert os.path.exists(result.report_path)

    with open(result.report_path, "r", encoding="utf-8") as f:
        report = json.load(f)

    # 1. Traceability fields
    assert "task_id" in report
    assert "brief" in report
    assert report["brief"]["tempo"] == 90.0
    assert report["brief"]["key"] == "D"
    assert "plan" in report
    assert "project_summary" in report
    assert report["project_summary"]["version"] >= 2

    # 2. Comparative Analysis
    assert "initial_analysis" in report
    assert "revision_plan" in report
    assert "final_analysis" in report
    assert len(report["revision_plan"]["edits"]) > 0

    # 3. Export Manifest
    assert "exports" in report
    assert os.path.exists(report["exports"]["audio"])
    assert os.path.exists(report["exports"]["midi"])
    assert os.path.exists(report["exports"]["project"])
    assert os.path.exists(report["exports"]["stems_dir"])


def test_revert_and_reload_version(tmp_path):
    autopilot = MusicAutopilot(output_dir=str(tmp_path))

    # Save version 1
    proj_v1 = KeyMuseProject(
        id="proj_ver_test",
        title="Version 1",
        version=1,
        bpm=100.0
    )
    v1_path = os.path.join(str(tmp_path), "proj_v1.json")
    autopilot.save_project(proj_v1, v1_path)

    # Save version 2
    proj_v2 = proj_v1.model_copy(deep=True)
    proj_v2.version = 2
    proj_v2.bpm = 110.0
    v2_path = os.path.join(str(tmp_path), "proj_v2.json")
    autopilot.save_project(proj_v2, v2_path)

    # Reload version 1 (revert capability)
    reloaded_v1 = autopilot.load_project(v1_path)
    assert reloaded_v1.version == 1
    assert reloaded_v1.bpm == 100.0

    # Reload version 2
    reloaded_v2 = autopilot.load_project(v2_path)
    assert reloaded_v2.version == 2
    assert reloaded_v2.bpm == 110.0
