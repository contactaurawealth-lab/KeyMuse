from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_preset_crud_lifecycle():
    # 1. Create a preset
    payload = {
        "name": "Dream Ambient",
        "category": "pad",
        "instrument": "pad",
        "bpm": 95,
        "scale": "pentatonic_major",
        "root_note": "F",
        "octave": 3,
        "synth_settings": {"waveform": "sine", "attack": 0.4},
        "effects_settings": {"reverb": 0.6, "delay": 0.3},
        "drum_pattern": {"kick": [1, 0, 0, 0]}
    }
    create_res = client.post("/api/presets", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    preset_id = created_data["id"]
    assert created_data["name"] == "Dream Ambient"
    assert created_data["bpm"] == 95

    # 2. Get preset by id
    get_res = client.get(f"/api/presets/{preset_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Dream Ambient"

    # 3. List presets
    list_res = client.get("/api/presets")
    assert list_res.status_code == 200
    assert any(p["id"] == preset_id for p in list_res.json())

    # 4. Update preset
    update_res = client.put(f"/api/presets/{preset_id}", json={"name": "Dream Ambient V2", "bpm": 100})
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Dream Ambient V2"
    assert update_res.json()["bpm"] == 100

    # 5. Delete preset
    del_res = client.delete(f"/api/presets/{preset_id}")
    assert del_res.status_code == 204

    # 6. Verify 404
    get_deleted = client.get(f"/api/presets/{preset_id}")
    assert get_deleted.status_code == 404

def test_preset_validation_error():
    # Invalid BPM (< 30)
    bad_payload = {
        "name": "Invalid Preset",
        "bpm": 10
    }
    res = client.post("/api/presets", json=bad_payload)
    assert res.status_code == 422
