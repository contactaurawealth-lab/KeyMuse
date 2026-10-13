# KeyMuse 🎵🎹
> *Your Keyboard. Your Orchestra. Your AI Music Autopilot.*

[![GitHub Repository](https://img.shields.io/badge/GitHub-contactaurawealth--lab%2FKeyMuse-181717?style=flat&logo=github)](https://github.com/contactaurawealth-lab/KeyMuse)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-81%2F81%20Passing-brightgreen)]()
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.13-blue)]()
[![MCP Ready](https://img.shields.io/badge/MCP-2.3%20Compatible-purple)]()
[![License](https://img.shields.io/badge/License-MIT-amber)]()

**KeyMuse** is a comprehensive, Python-first music composition platform, browser-based musical instrument studio, and autonomous AI Music Autopilot.

---

## 🚀 Quick Navigation

- [🌟 Phase 2: AI Music Autopilot](#-phase-2-ai-music-autopilot)
- [🤖 Model Context Protocol (MCP) Server](#-model-context-protocol-mcp-server)
- [🎬 End-to-End Cinematic Example](#-end-to-end-cinematic-example)
- [🎹 Phase 1: Browser Studio & Web Audio](#-phase-1-browser-studio--web-audio)
- [🏗️ Architectural Architecture](#-architectural-architecture)
- [🧪 Automated Test Suite](#-automated-test-suite)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [📄 License & Limitations](#-license--limitations)

---

## 🌟 Phase 2: AI Music Autopilot

KeyMuse Phase 2 introduces an autonomous **closed-loop composition engine** that lets AI coding agents and developers compose complete, multi-track musical works from natural-language briefs.

```
Natural Language Brief
       │
       ▼
┌───────────────────────────────┐
│   Music Brief Interpreter     │ (Extracts genre, tempo, key, duration, instruments)
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│     Composition Planner       │ (Plans sections, energy curves, track roles, bar alignment)
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│   Canonical Project Engine    │ (Realizes chords, basslines, motifs, procedural percussion)
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│     Real DSP Audio Render     │ (16-bit stereo PCM WAV via local Web Audio synthesis)
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│    Audio Quality Inspector    │ (Measures duration, peak dBFS, RMS, clipping, silence)
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│   Targeted Revision Loop      │ (Applies surgical edits, adjusts gain, rescales tempo, adds tails)
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│    Production Deliverables    │ (Master WAV, Standard MIDI File, Stems, JSON Report)
└───────────────────────────────┘
```

### Python SDK Quickstart

```python
from keymuse import MusicAutopilot

# Initialize autopilot with output directory
autopilot = MusicAutopilot(output_dir="output")

# Compose complete multi-track musical piece from natural language
result = autopilot.compose(
    brief=(
        "Compose a 60-second cinematic sci-fi soundtrack in D minor at 90 BPM. "
        "Start mysteriously, gradually build tension, introduce a powerful climax, "
        "and end with a clean, resolved finish. Use atmospheric pads, pulsing bass, "
        "percussion, and a memorable lead melody."
    )
)

print(f"Status   : {result.status}")
print(f"Project  : {result.project_path}")
print(f"Audio WAV: {result.audio_path}")
print(f"MIDI SMF : {result.midi_path}")
print(f"Report   : {result.report_path}")
```

### Asynchronous Execution & Task Management

```python
# Launch long-running composition without blocking
task = autopilot.compose_async(
    brief="30-second ambient piece in C major at 120 BPM",
    idempotency_key="job-ambient-001"
)

# Query live progress
status = autopilot.get_task_status(task.task_id)
print(f"Stage: {status.progress.stage} ({status.progress.percent}%)")

# Request safe cancellation if needed
autopilot.cancel_task(task.task_id)
```

---

## 🤖 Model Context Protocol (MCP) Server

KeyMuse provides a standardized tool server built on the official `mcp>=2.3.0` Python SDK (`MCPServer`), exposing 15 granular operations for AI coding agents (Cursor, Claude Desktop, Antigravity, OpenCode):

### Available MCP Tools

| Tool Name | Description |
| :--- | :--- |
| `keymuse_validate_brief` | Validates natural language or JSON composition brief. |
| `keymuse_plan_composition` | Generates bar-aligned CompositionPlan with section energy curves. |
| `keymuse_create_project` | Creates a new KeyMuseProject in session store. |
| `keymuse_add_track` | Adds instrument track (pad, bass, lead, percussion, piano). |
| `keymuse_add_notes` | Appends discrete note events to a track. |
| `keymuse_create_chord_progression` | Synthesizes triad chords on a track. |
| `keymuse_arrange_sections` | Configures structural timeline and dynamic regions. |
| `keymuse_render_preview` | Renders 16-bit PCM WAV audio preview. |
| `keymuse_analyze_audio` | Measures empirical waveform properties (peak, RMS, duration, clipping). |
| `keymuse_revise_project` | Inspects audio and applies surgical project modifications. |
| `keymuse_export_midi` | Exports Standard MIDI File (SMF Type 0) binary. |
| `keymuse_export_wav` | Exports master audio mixdown to WAV. |
| `keymuse_export_stems` | Exports isolated multi-track audio stems. |
| `keymuse_get_task_status` | Queries asynchronous pipeline progress. |
| `keymuse_get_project_summary` | Inspects project note count, tracks, sections, and duration. |

### Running the MCP Server

```bash
# Run over stdio transport
keymuse-mcp
# or:
python -m keymuse.mcp.server
```

#### Claude Desktop / Cursor Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "keymuse": {
      "command": "/root/keymuse/backend/venv/bin/keymuse-mcp",
      "env": {
        "KEYMUSE_OUTPUT_DIR": "/root/keymuse/output"
      }
    }
  }
}
```

---

## 🎬 End-to-End Cinematic Example

Run the included demonstration script to observe the complete closed-loop pipeline in action:

```bash
python examples/cinematic_autopilot.py
```

Outputs produced in `output/cinematic_demo/`:
- `audio.wav`: 60.67s stereo 16-bit PCM master mixdown (10.45 MB)
- `composition.mid`: Standard MIDI File containing 434 notes across 4 channels
- `project.json`: Canonical KeyMuse project schema
- `stems/`: Isolated stems (`track_pad.wav`, `track_bass.wav`, `track_percussion.wav`, `track_lead.wav`)
- `report.json`: Comprehensive machine manifest including initial analysis, revision plan, and comparative final metrics

---

## 🎹 Phase 1: Browser Studio & Web Audio

KeyMuse also features a full-featured browser-based musical instrument studio:
- **Physical Keyboard Engine**: Maps `A–Z`, `0–9`, symbols, spacebar, arrows with repeat filtering and stuck-note protection.
- **Shift Layers**: Diatonic base layer and accidental/harmony Shift layer with mobile touch controls.
- **25-Key Virtual Piano & MPC Pads**: Multi-touch polyphony with velocity response.
- **12 Instrument Sound Models**: Acoustic Piano, Rhodes, Organ, Synth Lead, Synth Bass, Pad, Strings, Guitar, Violin, Flute, Marimba, Drums.
- **Musical Intelligence**: 9 musical scales, scale lock quantization, 1-finger chords, arpeggiator.
- **16-Step Drum Machine**: 7 procedural voices with swing and genre presets.
- **Mixer & DSP Effects Rack**: Convolution reverb, stereo delay, biquad filter, distortion, and master limiter at -2.0 dBFS.
- **Multi-Track Loop Station**: Live capture, overdubbing, WAV/MIDI export.
- **100% Offline PWA**: Service Worker caching and IndexedDB persistence.

---

## 🧪 Automated Test Suite

KeyMuse maintains comprehensive testing across frontend Web Audio, backend API, pure Python synthesis, and AI Autopilot:

```bash
# 1. Run Python Autopilot & Backend Tests (37 tests)
pytest tests/ backend/tests/

# 2. Run Frontend Web Studio Tests (44 tests)
cd frontend && npm test
```

| Test Suite | Modules | Tests | Outcome |
| :--- | :--- | :--- | :--- |
| **Autopilot Unit & DSP Tests** | 12 files | 34 tests | ✅ 34 PASSED |
| **FastAPI Backend Tests** | 2 files | 3 tests | ✅ 3 PASSED |
| **Frontend Web Audio Tests** | 12 files | 44 tests | ✅ 44 PASSED |
| **Total Automated Tests** | **26 files** | **81 tests** | **100% PASS** |

---

## 🔒 Security & Resource Limits

- **Safe Directory Resolution**: `keymuse.core.security.resolve_safe_path` enforces strict sandbox containment, preventing path traversal attacks (`../../`).
- **Resource Ceilings**: Maximum 600s (10 min) composition length, 32 tracks, and 50,000 notes per track.
- **Zero Arbitrary Execution**: No dynamic evaluation (`eval()`, `exec()`, or arbitrary shell calls).
- **Anti-Clipping Protection**: Master limiter ceiling at -2.0 dBFS (amplitude 0.794) eliminates digital clipping.

---

## 📄 License & Limitations

- **License**: MIT License. Free for developers and musicians worldwide.
- **Deterministic Fallback**: When an external LLM provider is not configured, KeyMuse uses its built-in rule-based composition engine (`deterministic-rule-engine`), ensuring 100% offline functionality.
- **Subjective Musicality**: The quality inspector evaluates objective acoustic parameters (duration, peak, RMS, clipping, silence, note density); subjective aesthetic appeal remains artistic.
