import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models import Preset
from app.schemas import PresetCreate, PresetUpdate, PresetResponse

router = APIRouter(prefix="/api/presets", tags=["presets"])

@router.get("", response_model=List[PresetResponse])
def list_presets(session: Session = Depends(get_session)):
    presets = session.exec(select(Preset)).all()
    return presets

@router.post("", response_model=PresetResponse, status_code=status.HTTP_201_CREATED)
def create_preset(data: PresetCreate, session: Session = Depends(get_session)):
    now = datetime.now(timezone.utc)
    preset = Preset(
        name=data.name,
        category=data.category,
        instrument=data.instrument,
        bpm=data.bpm,
        scale=data.scale,
        root_note=data.root_note,
        octave=data.octave,
        synth_settings_json=json.dumps(data.synth_settings or {}),
        effects_settings_json=json.dumps(data.effects_settings or {}),
        drum_pattern_json=json.dumps(data.drum_pattern or {}),
        created_at=now,
        updated_at=now,
    )
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset

@router.get("/{preset_id}", response_model=PresetResponse)
def get_preset(preset_id: int, session: Session = Depends(get_session)):
    preset = session.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    return preset

@router.put("/{preset_id}", response_model=PresetResponse)
def update_preset(preset_id: int, data: PresetUpdate, session: Session = Depends(get_session)):
    preset = session.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")

    update_dict = data.model_dump(exclude_unset=True)
    if "synth_settings" in update_dict:
        preset.synth_settings_json = json.dumps(update_dict.pop("synth_settings") or {})
    if "effects_settings" in update_dict:
        preset.effects_settings_json = json.dumps(update_dict.pop("effects_settings") or {})
    if "drum_pattern" in update_dict:
        preset.drum_pattern_json = json.dumps(update_dict.pop("drum_pattern") or {})

    for key, value in update_dict.items():
        setattr(preset, key, value)

    preset.updated_at = datetime.now(timezone.utc)
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset

@router.delete("/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_preset(preset_id: int, session: Session = Depends(get_session)):
    preset = session.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    session.delete(preset)
    session.commit()
    return None
