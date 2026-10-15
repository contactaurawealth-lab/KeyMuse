"""FastAPI router for KeyMuse Autopilot, AI Composition, Real DSP Rendering, and MCP Discovery."""

import os
import re
from typing import List, Optional, Dict, Any
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from keymuse.autopilot.autopilot import MusicAutopilot
from keymuse.autopilot.interpreter import MusicBriefInterpreter
from keymuse.models.brief import MusicBrief
from keymuse.models.project import KeyMuseProject
from keymuse.mcp.server import mcp_server
from keymuse.core.security import resolve_safe_path

router = APIRouter(prefix="/api/autopilot", tags=["autopilot"])

_default_output = "/tmp/keymuse/output/web_projects" if (os.getenv("VERCEL") or not os.access("/root", os.W_OK)) else "/root/keymuse/output/web_projects"
BASE_OUTPUT_DIR = Path(os.getenv("AUTOPILOT_OUTPUT_DIR", _default_output))
BASE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class InterpretRequest(BaseModel):
    brief: Optional[str] = Field(None, description="Natural language composition description to interpret")
    text: Optional[str] = Field(None, description="Alias for brief")


class ComposeRequest(BaseModel):
    brief: str = Field(..., description="Natural language composition description")
    use_nlp: Optional[bool] = Field(default=True, description="Whether to prioritize NLP interpretation of the brief")
    genre: Optional[str] = Field(None, description="Optional genre override")
    mood: Optional[str] = Field(None, description="Optional mood override")
    tempo: Optional[float] = Field(None, ge=40, le=240, description="Optional tempo (BPM)")
    key: Optional[str] = Field(None, description="Musical key (e.g. D, C, G#)")
    mode: Optional[str] = Field(None, description="Musical mode (major, minor, dorian, etc.)")
    duration_seconds: Optional[float] = Field(None, ge=5.0, le=300.0, description="Target duration in seconds")
    instruments: Optional[List[str]] = Field(None, description="List of desired instrument names")
    seed: Optional[int] = Field(None, description="Deterministic seed")


class ReviseRequest(BaseModel):
    project_id: str = Field(..., description="Project identifier to revise")
    instruction: Optional[str] = Field(None, description="Natural language revision request")
    gain_adjustment_db: Optional[float] = Field(None, description="Target gain adjustment in dB")
    tempo_adjustment: Optional[float] = Field(None, description="Tempo adjustment delta (BPM)")
    duration_target: Optional[float] = Field(None, description="Target duration adjustment in seconds")


def _sanitize_project_id(pid: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_\-]", "", pid)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Invalid project ID")
    return cleaned


@router.get("/metadata")
def get_autopilot_metadata() -> Dict[str, Any]:
    """Returns dynamic metadata for KeyMuse package, git repository, entry points, and supported agents."""
    return {
        "name": "KeyMuse AI Music Autopilot",
        "version": "2.0.0",
        "package_name": "keymuse",
        "repository_url": "https://github.com/contactaurawealth-lab/KeyMuse.git",
        "mcp_server": {
            "cli_command": "keymuse-mcp",
            "module_command": "python -m keymuse.mcp.server",
            "transport": "stdio",
            "protocol_version": "2024-11-05",
            "supported_transports": ["stdio"],
            "tool_count": 15
        },
        "python_sdk": {
            "import_example": "from keymuse import MusicAutopilot",
            "python_version_min": "3.10",
            "recommended_python": "3.12+"
        },
        "audio_engine": {
            "type": "Pure Python DSP Synthesizer + Web Audio Browser Studio",
            "sample_rate": 44100,
            "channels": 2,
            "bit_depth": 16,
            "master_limiter_dbfs": -2.0,
            "anti_clipping": True
        },
        "supported_agents": [
            {
                "id": "antigravity",
                "name": "Antigravity",
                "status": "verified",
                "config_file": "~/.gemini/config/mcp_config.json",
                "format": "json"
            },
            {
                "id": "claude",
                "name": "Claude Code / Claude Desktop",
                "status": "verified",
                "config_file": "~/.claude.json or claude_desktop_config.json",
                "format": "json"
            },
            {
                "id": "codex",
                "name": "OpenAI Codex CLI / Assistants",
                "status": "verified",
                "config_file": "codex_tools.json / CLI arguments",
                "format": "json"
            },
            {
                "id": "cursor",
                "name": "Cursor IDE",
                "status": "verified",
                "config_file": "~/.cursor/mcp.json",
                "format": "json"
            },
            {
                "id": "cline",
                "name": "VSCode / Cline",
                "status": "verified",
                "config_file": "cline_mcp_settings.json",
                "format": "json"
            }
        ]
    }


@router.get("/tools")
async def get_mcp_tools() -> Dict[str, Any]:
    """Dynamically queries the actual KeyMuse MCPServer instance and returns tool schemas and metadata."""
    tools = await mcp_server.list_tools()
    
    category_map = {
        "keymuse_validate_brief": "Planning",
        "keymuse_plan_composition": "Planning",
        "keymuse_create_project": "Composition",
        "keymuse_add_track": "Composition",
        "keymuse_add_notes": "Composition",
        "keymuse_create_chord_progression": "Composition",
        "keymuse_arrange_sections": "Composition",
        "keymuse_render_preview": "Rendering",
        "keymuse_analyze_audio": "Analysis",
        "keymuse_revise_project": "Revision",
        "keymuse_export_midi": "Export",
        "keymuse_export_wav": "Export",
        "keymuse_export_stems": "Export",
        "keymuse_get_task_status": "Diagnostics",
        "keymuse_get_project_summary": "Diagnostics"
    }
    
    examples_map = {
        "keymuse_validate_brief": "keymuse_validate_brief(brief_text='60-second sci-fi soundtrack in D minor at 90 BPM')",
        "keymuse_plan_composition": "keymuse_plan_composition(description='Cyberpunk battle', duration=45, tempo=128, key='F#', mode='minor')",
        "keymuse_create_project": "keymuse_create_project(title='Neon Odyssey', bpm=120, key='A', mode='minor')",
        "keymuse_add_track": "keymuse_add_track(project_id='proj_123', track_id='tr_bass', name='Sub Bass', instrument='bass_pulse', volume=0.85)",
        "keymuse_add_notes": "keymuse_add_notes(project_id='proj_123', track_id='tr_lead', notes=[{'pitch': 62, 'start_beat': 0.0, 'duration_beats': 1.0, 'velocity': 90}])",
        "keymuse_create_chord_progression": "keymuse_create_chord_progression(project_id='proj_123', track_id='tr_pad', root='D', mode='minor', num_bars=8)",
        "keymuse_arrange_sections": "keymuse_arrange_sections(project_id='proj_123', sections=[{'name': 'Intro', 'start_bar': 1, 'end_bar': 4}])",
        "keymuse_render_preview": "keymuse_render_preview(project_id='proj_123')",
        "keymuse_analyze_audio": "keymuse_analyze_audio(project_id='proj_123')",
        "keymuse_revise_project": "keymuse_revise_project(project_id='proj_123', instructions='Lower master volume by 2 dB to prevent clipping')",
        "keymuse_export_midi": "keymuse_export_midi(project_id='proj_123')",
        "keymuse_export_wav": "keymuse_export_wav(project_id='proj_123')",
        "keymuse_export_stems": "keymuse_export_stems(project_id='proj_123')",
        "keymuse_get_task_status": "keymuse_get_task_status(task_id='task_abc')",
        "keymuse_get_project_summary": "keymuse_get_project_summary(project_id='proj_123')"
    }
    
    tool_list = []
    for t in tools:
        t_name = t.name
        t_desc = t.description or ""
        t_schema = t.inputSchema if hasattr(t, "inputSchema") else {}
        tool_list.append({
            "name": t_name,
            "description": t_desc,
            "category": category_map.get(t_name, "General"),
            "parameters": t_schema,
            "example": examples_map.get(t_name, f"{t_name}()")
        })
        
    return {
        "status": "success",
        "total_tools": len(tool_list),
        "tools": tool_list
    }


@router.post("/interpret")
@router.post("/parse-brief")
def interpret_brief(request: InterpretRequest) -> Dict[str, Any]:
    """Interprets a natural-language composition brief and extracts structured parameters."""
    brief_text = request.brief or request.text or "Create a musical piece"
    interpreter = MusicBriefInterpreter()
    brief = interpreter.interpret(brief_text)
    return {
        "status": "success",
        "brief": {
            "description": brief.description,
            "genre": brief.genre,
            "subgenre": brief.subgenre,
            "mood": brief.mood,
            "energy": brief.energy,
            "tempo": brief.tempo,
            "key": brief.key,
            "mode": brief.mode,
            "duration_seconds": brief.target_duration,
            "instruments": brief.desired_instruments,
            "track_count": brief.track_count,
            "arrangement_structure": brief.arrangement_structure,
            "summary": f"{brief.key} {brief.mode.title()} • {int(brief.tempo)} BPM • {int(brief.target_duration)}s • {brief.genre.title()} ({brief.mood}) • Instruments: {', '.join(i.replace('_', ' ').title() for i in brief.desired_instruments)}"
        }
    }


@router.post("/compose")
def compose_music(request: ComposeRequest) -> Dict[str, Any]:
    """Executes a real music composition request via the KeyMuse MusicAutopilot engine."""
    # Build prompt and brief via NLP interpreter
    interpreter = MusicBriefInterpreter()
    brief = interpreter.interpret(request.brief, seed=request.seed)

    # Only apply explicit overrides if user supplied non-defaults or explicitly disabled NLP
    if request.genre:
        brief.genre = request.genre
    if request.mood:
        brief.mood = request.mood
    if request.tempo is not None and (not request.use_nlp or request.tempo != 90.0):
        brief.tempo = request.tempo
    if request.key and (not request.use_nlp or request.key != "D"):
        brief.key = request.key
    if request.mode and (not request.use_nlp or request.mode != "minor"):
        brief.mode = request.mode
    if request.duration_seconds is not None and (not request.use_nlp or request.duration_seconds != 60.0):
        brief.target_duration = request.duration_seconds
    if request.instruments and not request.use_nlp:
        brief.desired_instruments = request.instruments
        brief.track_count = len(request.instruments)
    elif request.instruments and request.use_nlp and set(request.instruments) != {"atmospheric_pad", "bass_pulse", "percussion", "lead_melody"}:
        brief.desired_instruments = request.instruments
        brief.track_count = len(request.instruments)
    if request.seed is not None:
        brief.seed = request.seed

    # Unique project directory
    import uuid
    project_sub = f"proj_{uuid.uuid4().hex[:8]}"
    project_dir = BASE_OUTPUT_DIR / project_sub
    project_dir.mkdir(parents=True, exist_ok=True)

    autopilot = MusicAutopilot(output_dir=str(project_dir))
    result = autopilot.compose(brief=brief)

    if result.status != "completed":
        raise HTTPException(
            status_code=500,
            detail=f"Composition failed: {', '.join(result.errors) if result.errors else 'Unknown error'}"
        )

    # Load canonical project
    proj_path = Path(result.project_path)
    if not proj_path.exists():
        raise HTTPException(status_code=500, detail="Generated project file missing")
    
    project = autopilot.load_project(str(proj_path))

    # Collect stems from stems dir
    stems = []
    stems_dir = Path(result.audio_path).parent / "stems"
    if stems_dir.exists():
        for s_p in stems_dir.glob("*.wav"):
            stems.append({
                "name": s_p.name,
                "url": f"/api/autopilot/projects/{project_sub}/stems/{s_p.name}"
            })

    dur_sec = project.duration_seconds()
    analysis = autopilot.inspect_audio(result.audio_path, target_duration=dur_sec)
    total_notes = sum(len(t.notes) for t in project.tracks)

    return {
        "status": "success",
        "project_id": project_sub,
        "title": project.title,
        "bpm": project.bpm,
        "key": project.key,
        "mode": project.mode,
        "duration_seconds": dur_sec,
        "total_tracks": len(project.tracks),
        "total_notes": total_notes,
        "tracks": [
            {
                "id": t.id,
                "name": t.name,
                "instrument": t.instrument,
                "volume": t.volume,
                "pan": t.pan,
                "note_count": len(t.notes)
            }
            for t in project.tracks
        ],
        "sections": [
            {
                "name": s.name,
                "start_beat": s.start_beat,
                "length_beats": s.length_beats,
                "energy": s.energy,
                "description": s.description
            }
            for s in project.sections
        ],
        "analysis": {
            "actual_duration": analysis.duration_seconds,
            "peak_dbfs": analysis.peak_db,
            "rms_dbfs": analysis.rms_db,
            "clipping_detected": analysis.clipping_risk,
            "start_silence_seconds": analysis.start_silence_seconds,
            "end_silence_seconds": analysis.end_silence_seconds
        },
        "audio_url": f"/api/autopilot/projects/{project_sub}/audio",
        "midi_url": f"/api/autopilot/projects/{project_sub}/midi",
        "stems": stems,
        "manifest_url": f"/api/autopilot/projects/{project_sub}/manifest",
        "project_json_url": f"/api/autopilot/projects/{project_sub}/project"
    }


def _find_project_file(pid: str, filename_candidates: List[str]) -> Path:
    proj_dir = BASE_OUTPUT_DIR / pid
    if not proj_dir.exists():
        raise HTTPException(status_code=404, detail=f"Project '{pid}' not found")
    for cand in filename_candidates:
        matches = list(proj_dir.glob(f"**/{cand}"))
        if matches:
            return matches[0]
    raise HTTPException(status_code=404, detail=f"File {filename_candidates} not found for project '{pid}'")


@router.post("/revise")
def revise_music(request: ReviseRequest) -> Dict[str, Any]:
    """Applies a targeted surgical revision to an existing KeyMuse project and re-renders audio."""
    pid = _sanitize_project_id(request.project_id)
    proj_file = _find_project_file(pid, ["project.json"])
    project_dir = proj_file.parent

    autopilot = MusicAutopilot(output_dir=str(project_dir))
    project = autopilot.load_project(str(proj_file))

    # Apply adjustments
    if request.gain_adjustment_db is not None:
        scale = 10.0 ** (request.gain_adjustment_db / 20.0)
        for t in project.tracks:
            t.volume = max(0.1, min(1.0, t.volume * scale))

    if request.tempo_adjustment is not None:
        new_bpm = max(40.0, min(240.0, project.bpm + request.tempo_adjustment))
        project.bpm = new_bpm

    if request.duration_target is not None:
        project.metadata["target_duration"] = request.duration_target

    # Save revised project
    autopilot.save_project(project, str(proj_file))

    # Re-render audio and re-inspect
    audio_path = str(project_dir / "audio.wav")
    midi_path = str(project_dir / "composition.mid")
    stems_dir = str(project_dir / "stems")

    autopilot.render_manager.render_project_to_wav(project, audio_path)
    autopilot.render_manager.export_project_to_midi(project, midi_path)
    autopilot.render_manager.export_stems(project, stems_dir)

    dur_sec = project.duration_seconds()
    analysis = autopilot.inspect_audio(audio_path, target_duration=dur_sec)

    return {
        "status": "success",
        "project_id": pid,
        "bpm": project.bpm,
        "duration_seconds": dur_sec,
        "tracks": [
            {
                "id": t.id,
                "name": t.name,
                "instrument": t.instrument,
                "volume": t.volume,
                "pan": t.pan
            }
            for t in project.tracks
        ],
        "analysis": {
            "actual_duration": analysis.duration_seconds,
            "peak_dbfs": analysis.peak_db,
            "rms_dbfs": analysis.rms_db,
            "clipping_detected": analysis.clipping_risk,
            "start_silence_seconds": analysis.start_silence_seconds,
            "end_silence_seconds": analysis.end_silence_seconds
        },
        "audio_url": f"/api/autopilot/projects/{pid}/audio",
        "midi_url": f"/api/autopilot/projects/{pid}/midi"
    }



@router.get("/projects/{project_id}/audio")
def get_project_audio(project_id: str):
    """Streams rendered 16-bit PCM WAV audio for real playback."""
    pid = _sanitize_project_id(project_id)
    audio_path = _find_project_file(pid, ["audio.wav", "final_preview.wav", "master_audio.wav"])
    return FileResponse(
        path=str(audio_path),
        media_type="audio/wav",
        filename=f"{pid}_master.wav"
    )


@router.get("/projects/{project_id}/midi")
def get_project_midi(project_id: str):
    """Downloads authentic SMF Type 0 binary MIDI file."""
    pid = _sanitize_project_id(project_id)
    midi_path = _find_project_file(pid, ["composition.mid", "project_midi.mid"])
    return FileResponse(
        path=str(midi_path),
        media_type="audio/midi",
        filename=f"{pid}.mid"
    )


@router.get("/projects/{project_id}/stems/{stem_name}")
def get_project_stem(project_id: str, stem_name: str):
    """Downloads an individual audio stem WAV file."""
    pid = _sanitize_project_id(project_id)
    clean_stem = re.sub(r"[^a-zA-Z0-9_\-\.]", "", stem_name)
    stem_path = _find_project_file(pid, [clean_stem])
    return FileResponse(
        path=str(stem_path),
        media_type="audio/wav",
        filename=clean_stem
    )


@router.get("/projects/{project_id}/manifest")
def get_project_manifest(project_id: str):
    """Retrieves the machine-readable audit report and metrics manifest."""
    pid = _sanitize_project_id(project_id)
    manifest_path = _find_project_file(pid, ["report.json", "manifest.json"])
    return FileResponse(
        path=str(manifest_path),
        media_type="application/json",
        filename=f"{pid}_manifest.json"
    )


@router.get("/projects/{project_id}/project")
def get_project_json(project_id: str):
    """Retrieves canonical KeyMuseProject JSON schema."""
    pid = _sanitize_project_id(project_id)
    proj_path = _find_project_file(pid, ["project.json"])
    return FileResponse(
        path=str(proj_path),
        media_type="application/json",
        filename=f"{pid}_project.json"
    )

