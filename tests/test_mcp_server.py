"""Tests for Model Context Protocol (MCP) Server and Tool Handlers."""

import os
import pytest
from keymuse.mcp.server import (
    mcp_server,
    keymuse_validate_brief,
    keymuse_plan_composition,
    keymuse_create_project,
    keymuse_add_track,
    keymuse_add_notes,
    keymuse_create_chord_progression,
    keymuse_arrange_sections,
    keymuse_render_preview,
    keymuse_analyze_audio,
    keymuse_revise_project,
    keymuse_export_midi,
    keymuse_export_wav,
    keymuse_export_stems,
    keymuse_get_project_summary
)


@pytest.mark.anyio
async def test_mcp_tool_registration():
    tools = await mcp_server.list_tools()
    tool_names = {t.name for t in tools}
    expected = {
        "keymuse_validate_brief",
        "keymuse_plan_composition",
        "keymuse_create_project",
        "keymuse_add_track",
        "keymuse_add_notes",
        "keymuse_create_chord_progression",
        "keymuse_arrange_sections",
        "keymuse_render_preview",
        "keymuse_analyze_audio",
        "keymuse_revise_project",
        "keymuse_export_midi",
        "keymuse_export_wav",
        "keymuse_export_stems",
        "keymuse_get_task_status",
        "keymuse_get_project_summary"
    }
    for exp in expected:
        assert exp in tool_names, f"Missing MCP tool: {exp}"


def test_mcp_tool_execution(tmp_path):
    # 1. Validate brief
    val_res = keymuse_validate_brief(brief_text="60s sci-fi piece in D minor at 90 BPM")
    assert val_res["status"] == "valid"
    assert val_res["brief"]["key"] == "D"

    # 2. Plan composition
    plan_res = keymuse_plan_composition(
        description="Cinematic sci-fi",
        duration=15.0,
        tempo=90.0,
        key="D",
        mode="minor"
    )
    assert plan_res["status"] == "planned"
    assert len(plan_res["plan"]["sections"]) > 0

    # 3. Create project
    proj_res = keymuse_create_project(title="MCP Sci-Fi Track", bpm=90.0, key="D", mode="minor")
    p_id = proj_res["project_id"]
    assert p_id.startswith("proj_")

    # 4. Add tracks
    t1_res = keymuse_add_track(
        project_id=p_id,
        track_id="t_pad",
        name="Pad",
        instrument="atmospheric_pad",
        volume=0.8,
        pan=-0.2
    )
    assert t1_res["total_tracks"] == 1

    t2_res = keymuse_add_track(
        project_id=p_id,
        track_id="t_bass",
        name="Bass",
        instrument="bass_pulse",
        volume=0.85,
        pan=0.0
    )
    assert t2_res["total_tracks"] == 2

    # 5. Add notes
    notes_res = keymuse_add_notes(
        project_id=p_id,
        track_id="t_bass",
        notes=[
            {"pitch": 38, "start_beat": 0.0, "duration_beats": 1.0, "velocity": 90},
            {"pitch": 38, "start_beat": 2.0, "duration_beats": 1.0, "velocity": 90}
        ]
    )
    assert notes_res["notes_added"] == 2

    # 6. Create chord progression
    chords_res = keymuse_create_chord_progression(
        project_id=p_id,
        track_id="t_pad",
        chord_roots=["D", "F"],
        chord_types=["min", "maj"],
        beats_per_chord=4.0
    )
    assert chords_res["notes_added"] == 6

    # 7. Render preview
    wav_path = os.path.join(str(tmp_path), "mcp_preview.wav")
    render_res = keymuse_render_preview(project_id=p_id, output_path=wav_path)
    assert os.path.exists(render_res["audio_path"])

    # 8. Analyze audio
    analysis_res = keymuse_analyze_audio(wav_path=wav_path, target_duration=8.0)
    assert analysis_res["channels"] == 2
    assert analysis_res["peak_amplitude"] > 0.0

    # 9. Revise project
    rev_res = keymuse_revise_project(project_id=p_id, wav_path=wav_path, target_duration=8.0)
    assert rev_res["new_version"] >= 2

    # 10. Export MIDI, WAV, and Stems
    midi_out = os.path.join(str(tmp_path), "mcp_out.mid")
    midi_res = keymuse_export_midi(project_id=p_id, output_path=midi_out)
    assert os.path.exists(midi_res["midi_path"])

    wav_out = os.path.join(str(tmp_path), "mcp_out.wav")
    wav_export_res = keymuse_export_wav(project_id=p_id, output_path=wav_out)
    assert os.path.exists(wav_export_res["audio_path"])

    stems_out = os.path.join(str(tmp_path), "mcp_stems")
    stems_res = keymuse_export_stems(project_id=p_id, output_dir=stems_out)
    assert stems_res["total_stems"] == 2

    # 11. Project summary
    summary_res = keymuse_get_project_summary(project_id=p_id)
    assert summary_res["total_tracks"] == 2
    assert summary_res["total_notes"] > 0
