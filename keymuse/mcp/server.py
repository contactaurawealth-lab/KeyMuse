"""Model Context Protocol (MCP) Server for KeyMuse AI Music Autopilot."""

import os
import json
from typing import Dict, Any, List, Optional
from mcp.server.mcpserver import MCPServer
from keymuse import (
    MusicAutopilot,
    MusicBrief,
    KeyMuseProject,
    Track,
    Note,
    Section
)
from keymuse.core.theory import get_chord_notes, note_name_to_midi


# Initialize shared Autopilot instance and MCPServer
autopilot = MusicAutopilot(output_dir=os.getenv("KEYMUSE_OUTPUT_DIR", "output"))
mcp_server = MCPServer("keymuse")

# In-memory session projects store
_projects_store: Dict[str, KeyMuseProject] = {}


def _get_project(project_id_or_json: str) -> KeyMuseProject:
    """Helper to resolve a KeyMuseProject from ID or raw JSON string."""
    if project_id_or_json in _projects_store:
        return _projects_store[project_id_or_json]
    try:
        data = json.loads(project_id_or_json)
        return KeyMuseProject(**data)
    except Exception:
        raise ValueError(f"Project '{project_id_or_json}' not found in active session and is not valid JSON.")


@mcp_server.tool()
def keymuse_validate_brief(brief_text: str) -> Dict[str, Any]:
    """Validate a natural-language composition brief and return structured parameters."""
    brief = autopilot.parse_brief(brief_text)
    return {
        "status": "valid",
        "brief": brief.model_dump()
    }


@mcp_server.tool()
def keymuse_plan_composition(
    description: str,
    duration: float = 60.0,
    tempo: float = 90.0,
    key: str = "D",
    mode: str = "minor"
) -> Dict[str, Any]:
    """Generate a bar-aligned CompositionPlan specifying sections, tracks, and energy progression."""
    brief = MusicBrief(
        description=description,
        target_duration=duration,
        tempo=tempo,
        key=key,
        mode=mode
    )
    plan = autopilot.plan_composition(brief)
    return {
        "status": "planned",
        "plan": plan.model_dump()
    }


@mcp_server.tool()
def keymuse_create_project(
    title: str = "New Composition",
    bpm: float = 120.0,
    key: str = "C",
    mode: str = "minor"
) -> Dict[str, Any]:
    """Create a new blank KeyMuseProject and store in session."""
    import uuid
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    project = KeyMuseProject(
        id=project_id,
        title=title,
        bpm=bpm,
        key=key,
        mode=mode,
        sections=[Section(name="Main", start_beat=0.0, length_beats=16.0, energy=0.7)],
        tracks=[]
    )
    _projects_store[project_id] = project
    return {
        "project_id": project_id,
        "summary": {
            "title": project.title,
            "bpm": project.bpm,
            "key": project.key,
            "mode": project.mode
        }
    }


@mcp_server.tool()
def keymuse_add_track(
    project_id: str,
    track_id: str,
    name: str,
    instrument: str,
    volume: float = 0.8,
    pan: float = 0.0
) -> Dict[str, Any]:
    """Add a new instrument track to an existing project."""
    project = _get_project(project_id)
    new_track = Track(
        id=track_id,
        name=name,
        instrument=instrument,
        volume=volume,
        pan=pan,
        notes=[]
    )
    project.tracks.append(new_track)
    return {
        "project_id": project.id,
        "track_id": track_id,
        "total_tracks": len(project.tracks)
    }


@mcp_server.tool()
def keymuse_add_notes(
    project_id: str,
    track_id: str,
    notes: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Add an array of note events {pitch, start_beat, duration_beats, velocity} to a track."""
    project = _get_project(project_id)
    track = next((t for t in project.tracks if t.id == track_id), None)
    if not track:
        raise ValueError(f"Track '{track_id}' not found in project '{project_id}'.")

    added = 0
    for n in notes:
        track.notes.append(Note(**n))
        added += 1

    return {
        "project_id": project.id,
        "track_id": track_id,
        "notes_added": added,
        "track_total_notes": len(track.notes)
    }


@mcp_server.tool()
def keymuse_create_chord_progression(
    project_id: str,
    track_id: str,
    chord_roots: List[str],
    chord_types: List[str],
    beats_per_chord: float = 4.0,
    start_beat: float = 0.0
) -> Dict[str, Any]:
    """Generate chord triad notes on a track following a list of chord roots and qualities."""
    project = _get_project(project_id)
    track = next((t for t in project.tracks if t.id == track_id), None)
    if not track:
        raise ValueError(f"Track '{track_id}' not found.")

    curr_beat = start_beat
    notes_added = 0
    for root_name, c_type in zip(chord_roots, chord_types):
        root_midi = note_name_to_midi(root_name, octave=4)
        triad = get_chord_notes(root_midi, chord_type=c_type)
        for pitch in triad:
            track.notes.append(Note(
                pitch=pitch,
                start_beat=curr_beat,
                duration_beats=beats_per_chord,
                velocity=85
            ))
            notes_added += 1
        curr_beat += beats_per_chord

    return {
        "project_id": project.id,
        "track_id": track_id,
        "notes_added": notes_added,
        "total_duration_beats": curr_beat
    }


@mcp_server.tool()
def keymuse_arrange_sections(
    project_id: str,
    sections: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Configure structural sections {name, start_beat, length_beats, energy} for a project."""
    project = _get_project(project_id)
    project.sections = [Section(**s) for s in sections]
    return {
        "project_id": project.id,
        "sections_count": len(project.sections),
        "sections": [s.name for s in project.sections]
    }


@mcp_server.tool()
def keymuse_render_preview(project_id: str, output_path: Optional[str] = None) -> Dict[str, Any]:
    """Render project audio into a real 16-bit PCM WAV preview."""
    project = _get_project(project_id)
    rendered_path = autopilot.render_preview(project, output_path=output_path)
    return {
        "project_id": project.id,
        "audio_path": rendered_path,
        "file_size_bytes": os.path.getsize(rendered_path)
    }


@mcp_server.tool()
def keymuse_analyze_audio(wav_path: str, target_duration: Optional[float] = None) -> Dict[str, Any]:
    """Inspect and measure real audio waveform metrics (duration, peak dBFS, RMS dBFS, clipping risk)."""
    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"Audio file '{wav_path}' does not exist.")
    analysis = autopilot.inspect_audio(wav_path, target_duration=target_duration)
    return analysis.model_dump()


@mcp_server.tool()
def keymuse_revise_project(
    project_id: str,
    wav_path: str,
    target_duration: float = 60.0
) -> Dict[str, Any]:
    """Inspect audio for defects and apply targeted surgical revisions to the project."""
    project = _get_project(project_id)
    analysis = autopilot.inspect_audio(wav_path, target_duration=target_duration)
    revised, rev_plan = autopilot.apply_revision(project, analysis, target_duration=target_duration)
    _projects_store[project_id] = revised
    return {
        "project_id": project.id,
        "previous_version": project.version,
        "new_version": revised.version,
        "revision_reason": rev_plan.reason,
        "edits_count": len(rev_plan.edits),
        "edits": [e.model_dump() for e in rev_plan.edits]
    }


@mcp_server.tool()
def keymuse_export_midi(project_id: str, output_path: str) -> Dict[str, Any]:
    """Export project note data to Standard MIDI File (SMF Type 0)."""
    project = _get_project(project_id)
    out_path = autopilot.render_manager.export_project_to_midi(project, output_path)
    return {
        "project_id": project.id,
        "midi_path": out_path,
        "file_size_bytes": os.path.getsize(out_path)
    }


@mcp_server.tool()
def keymuse_export_wav(project_id: str, output_path: str) -> Dict[str, Any]:
    """Export project master audio mixdown to 16-bit PCM WAV."""
    project = _get_project(project_id)
    out_path = autopilot.render_manager.render_project_to_wav(project, output_path)
    return {
        "project_id": project.id,
        "audio_path": out_path,
        "file_size_bytes": os.path.getsize(out_path)
    }


@mcp_server.tool()
def keymuse_export_stems(project_id: str, output_dir: str) -> Dict[str, Any]:
    """Export individual isolated track stems as WAV files."""
    project = _get_project(project_id)
    stems = autopilot.render_manager.export_stems(project, output_dir)
    return {
        "project_id": project.id,
        "stems": stems,
        "total_stems": len(stems)
    }


@mcp_server.tool()
def keymuse_get_task_status(task_id: str) -> Dict[str, Any]:
    """Retrieve current state, progress percentage, and results of an ongoing or completed task."""
    state = autopilot.get_task_status(task_id)
    if not state:
        raise ValueError(f"Task '{task_id}' not found.")
    return state.model_dump()


@mcp_server.tool()
def keymuse_get_project_summary(project_id: str) -> Dict[str, Any]:
    """Return comprehensive summary of project tracks, notes, sections, and estimated duration."""
    project = _get_project(project_id)
    return {
        "id": project.id,
        "title": project.title,
        "bpm": project.bpm,
        "key": project.key,
        "mode": project.mode,
        "version": project.version,
        "total_tracks": len(project.tracks),
        "total_notes": project.total_note_count(),
        "duration_seconds": project.duration_seconds(),
        "sections": [s.name for s in project.sections],
        "tracks": [
            {
                "id": t.id,
                "name": t.name,
                "instrument": t.instrument,
                "note_count": len(t.notes)
            }
            for t in project.tracks
        ]
    }


def main():
    """Run MCP server over stdio transport."""
    import asyncio
    from mcp.server.stdio import stdio_server

    async def _run():
        async with stdio_server() as (read_stream, write_stream):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options()
            )

    asyncio.run(_run())


if __name__ == "__main__":
    main()
