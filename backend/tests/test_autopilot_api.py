"""Tests for KeyMuse FastAPI Autopilot router endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_autopilot_metadata():
    res = client.get("/api/autopilot/metadata")
    assert res.status_code == 200
    data = res.json()
    assert data["version"] == "2.0.0"
    assert "https://github.com/contactaurawealth-lab/KeyMuse.git" in data["repository_url"]
    assert data["mcp_server"]["cli_command"] == "keymuse-mcp"
    assert data["mcp_server"]["tool_count"] == 15
    assert len(data["supported_agents"]) >= 4
    agent_ids = [a["id"] for a in data["supported_agents"]]
    assert "antigravity" in agent_ids
    assert "claude" in agent_ids


def test_autopilot_tools():
    res = client.get("/api/autopilot/tools")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_tools"] == 15
    tools = {t["name"]: t for t in data["tools"]}
    assert "keymuse_validate_brief" in tools
    assert "keymuse_create_project" in tools
    assert "keymuse_render_preview" in tools
    assert "keymuse_analyze_audio" in tools
    assert "keymuse_revise_project" in tools
    assert "keymuse_export_wav" in tools


def test_autopilot_compose_and_workflow():
    payload = {
        "brief": "5-second ambient synth piece in C major at 100 BPM",
        "duration_seconds": 5.0,
        "tempo": 100.0,
        "key": "C",
        "mode": "major",
        "seed": 999
    }
    comp_res = client.post("/api/autopilot/compose", json=payload)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "success"
    pid = comp_data["project_id"]
    assert pid.startswith("proj_")
    assert comp_data["bpm"] > 0
    assert len(comp_data["tracks"]) >= 2
    assert len(comp_data["sections"]) >= 1
    assert comp_data["analysis"]["actual_duration"] > 0
    assert comp_data["analysis"]["peak_dbfs"] <= -1.9

    # 1. Fetch audio
    audio_res = client.get(f"/api/autopilot/projects/{pid}/audio")
    assert audio_res.status_code == 200
    assert audio_res.headers["content-type"] == "audio/wav"
    assert len(audio_res.content) > 1000

    # 2. Fetch MIDI
    midi_res = client.get(f"/api/autopilot/projects/{pid}/midi")
    assert midi_res.status_code == 200
    assert midi_res.headers["content-type"] == "audio/midi"
    assert midi_res.content[:4] == b"MThd"

    # 3. Fetch manifest
    man_res = client.get(f"/api/autopilot/projects/{pid}/manifest")
    assert man_res.status_code == 200
    man_data = man_res.json()
    assert man_data["status"] == "completed"

    # 4. Fetch project JSON
    proj_res = client.get(f"/api/autopilot/projects/{pid}/project")
    assert proj_res.status_code == 200
    proj_data = proj_res.json()
    assert proj_data["version"] >= 1

    # 5. Revise project
    initial_bpm = comp_data["bpm"]
    rev_payload = {
        "project_id": pid,
        "gain_adjustment_db": -2.0,
        "tempo_adjustment": 5.0
    }
    rev_res = client.post("/api/autopilot/revise", json=rev_payload)
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["status"] == "success"
    assert rev_data["bpm"] == initial_bpm + 5.0
    assert rev_data["analysis"]["peak_dbfs"] <= -1.9
