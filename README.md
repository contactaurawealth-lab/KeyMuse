# KeyMuse 🎵🎹
> *Your Keyboard. Your Orchestra. Your AI Music Autopilot.*

[![GitHub Repository](https://img.shields.io/badge/GitHub-contactaurawealth--lab%2FKeyMuse-181717?style=flat&logo=github)](https://github.com/contactaurawealth-lab/KeyMuse)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-keymuse--agent.vercel.app-black?logo=vercel)](https://keymuse-agent.vercel.app)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-94%2F94%20Passing-brightgreen)]()
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.13%20%7C%203.14-blue)]()
[![MCP Ready](https://img.shields.io/badge/MCP-2.3%20Compatible-purple)]()
[![License](https://img.shields.io/badge/License-MIT-amber)]()

**KeyMuse** is a comprehensive, Python-first music composition platform, browser-based musical instrument studio, and autonomous AI Music Autopilot with dedicated Agent Orchestration.

🌐 **Live Web Studio & Agent Hub**: [https://keymuse-agent.vercel.app](https://keymuse-agent.vercel.app)

---

## 🚀 Quick Navigation

- [🌐 Phase 3: Web Studio & Agent Setup Hub](#-phase-3-web-studio--agent-setup-hub)
- [🌟 Phase 2: AI Music Autopilot](#-phase-2-ai-music-autopilot)
- [🤖 Model Context Protocol (MCP) Server](#-model-context-protocol-mcp-server)
- [🎬 End-to-End Cinematic Example](#-end-to-end-cinematic-example)
- [🎹 Phase 1: Browser Studio & Web Audio](#-phase-1-browser-studio--web-audio)
- [🏗️ Architectural Architecture](#-architectural-architecture)
- [🧪 Automated Test Suite](#-automated-test-suite)
- [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
- [📄 License & Limitations](#-license--limitations)

---

## 🌐 Phase 3: Web Studio & Agent Setup Hub

KeyMuse Phase 3 delivers an end-to-end web experience combining a **Human AI Music Studio** and a dedicated **Connect Your AI Agent** self-service hub, deployed in production on Vercel at **[https://keymuse-agent.vercel.app](https://keymuse-agent.vercel.app)**.

### 1. Human AI Music Studio (`AiStudio.tsx`)
- **Natural Language Briefs**: Describe desired music in plain English with 4 preconfigured style presets (*Cinematic Sci-Fi*, *Cyberpunk Pulse*, *Lofi Ambient Chill*, *Epic Orchestral Climax*).
- **Musical Controls**: Fine-tune tempo (40–240 BPM), key root (`C` to `B`), musical mode (*major*, *minor*, *dorian*, *mixolydian*, *lydian*, *phrygian*, *locrian*, *pentatonic*, *blues*), target duration (5–300s), deterministic seed, and 6 active voice toggles.
- **Real Audio Previewer**: Transport controls (Play, Pause, Replay, Scrubber, Volume) with real-time waveform visualizer bars driven by true 16-bit PCM WAV rendering.
- **Empirical Audio Quality Inspector**: Displays exact measurable parameters directly from the backend analysis engine:
  - Peak dBFS & headroom safety indicator
  - RMS loudness level
  - Real-time clipping risk assessment (0 clips / safe limiter guarantee)
  - Silence boundary measurements (initial lead-in & trailing decay in seconds)
- **Arrangement & Track Structure**: Visual section timelines (*Intro*, *Build*, *Climax*, *Resolution*) with dynamic energy percentages, instrument role tags, and per-track isolated stem WAV downloads.
- **Closed-Loop Revision Suite**: Apply targeted post-composition edits (gain adjustments in dB, tempo rescaling in BPM, and custom musical instructions) without regenerating from scratch.
- **Export Suite**: One-click download of Master Mixdown (WAV), Standard MIDI File Type 0, Canonical Project Schema (JSON), and Audit Manifest (`report.json`).

### 2. Dedicated "Connect Your AI Agent" Setup Hub (`AgentSetupHub.tsx`)
- **Interactive Onboarding Wizard**: Filter setup guides by target Operating System (**Linux**, **macOS**, **Windows**).
- **Verified Coding Agent Configurations**: Exact, copyable setup configurations and verification commands for:
  - **Google Antigravity**: Configuration file `~/.gemini/config/mcp_config.json` with stdio transport.
  - **Claude Code / Claude Desktop**: `claude_desktop_config.json` or `~/.claude.json`.
  - **OpenAI Codex**: `codex_tools.json` / command-line agent invocations.
  - **Cursor IDE**: `~/.cursor/mcp.json`.
  - **VSCode / Cline**: `cline_mcp_settings.json`.
- **Live 15-Tool MCP Directory**: Dynamic tool introspection querying `keymuse.mcp.server.MCPServer` in real-time. Includes instantaneous text search filter, categorized badges (*Planning*, *Project*, *Harmonics*, *Arrangement*, *Rendering*, *Quality*, *Revisions*, *Export*, *Orchestration*), complete argument schemas, and one-click copyable tool call payloads.
- **Python SDK Documentation**: Installation instructions (`pip install keymuse`), synchronous quickstart, non-blocking asynchronous execution, and task polling examples.
- **Expandable Troubleshooting FAQ**: Solutions for missing packages, custom virtual environments, audio backend questions, and stdio execution.
- **Sandboxed Security Overview**: Sandboxed filesystem isolation (`resolve_safe_path`), resource ceilings, and stdio execution protection.
- **Interactive Connection Checklist**: 7-point progress tracker with persistent `localStorage` state.

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
- **12 Instrument Sound Models with Physical Acoustic Modeling**: Concert Grand Piano (16ms hammer transient impulse, dynamic lowpass decay sweep, 3-string unison beating, 8 inharmonic string partials, pitch-dependent decay, soundboard resonance), Rhodes Electric Piano (tine bell + chorus), Tonewheel Organ (drawbars + Leslie rotary chorus), Synth Lead, Analog Bass, Atmospheric Pad, Orchestral Strings (dual ensemble detuning + dual formants + delayed vibrato), Acoustic Guitar (pluck transient + dual strings), Violin, Flute, Marimba, and Drums.
- **Musical Intelligence**: 9 musical scales, scale lock quantization, 1-finger chords, arpeggiator.
- **16-Step Drum Machine**: 7 procedural voices with swing and genre presets.
- **Mixer & DSP Effects Rack**: Convolution reverb, stereo delay, biquad filter, distortion, and master limiter at -2.0 dBFS.
- **Multi-Track Loop Station**: Live capture, overdubbing, WAV/MIDI export.
- **100% Offline PWA**: Service Worker caching and IndexedDB persistence.

---

## 🧪 Automated Test Suite

KeyMuse maintains comprehensive testing across frontend Web Audio, backend API, pure Python synthesis, and AI Autopilot:

```bash
# 1. Run Python Autopilot & Backend Tests (40 tests)
pytest tests/ backend/tests/

# 2. Run Frontend Web Studio & Agent Hub Tests (54 tests)
cd frontend && npm test
```

| Test Suite | Modules | Tests | Outcome |
| :--- | :--- | :--- | :--- |
| **Autopilot Unit & DSP Tests** | 12 files | 34 tests | ✅ 34 PASSED |
| **FastAPI Backend & Autopilot API** | 3 files | 6 tests | ✅ 6 PASSED |
| **Frontend Web Audio & Phase 3 UI** | 14 files | 54 tests | ✅ 54 PASSED |
| **Total Automated Tests** | **29 files** | **94 tests** | **100% PASS** |

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
