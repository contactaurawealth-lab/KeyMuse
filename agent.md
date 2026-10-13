# KeyMuse — Agent & Architecture Specification

## 1. Executive Overview & Architecture Decisions
KeyMuse is a responsive, browser-based musical instrument studio that transforms every physical keyboard key (letters, numbers, symbols, function, arrows, spacebar) and mobile touchscreen into musical instruments, synthesizers, drum pads, and loop controllers.

### Core Architectural Decisions:
1. **Zero-Latency Audio Generation in Browser**:
   - Keystroke note triggering and Web Audio synthesis are handled entirely in the browser client using the Web Audio API. Keystrokes are NEVER proxied or processed through the backend.
   - A single shared audio context (`AudioContext`) is utilized across the application to prevent browser thread saturation and audio glitching.
   - Master compression/limiting safeguards prevent digital clipping.
2. **Deterministic Input Mapping & Event Pipeline**:
   - Physical keys are mapped via `KeyboardEvent.code` to maintain physical layout consistency regardless of OS keymaps.
   - Repeated keydown events (`event.repeat === true`) are filtered out to prevent unintended note retriggering.
   - Window blur, tab hidden (`visibilitychange`), and modifier interrupts trigger automatic note release sweeps to prevent stuck notes.
   - Form inputs (`<input>`, `<textarea>`, `contenteditable`) automatically suspend keyboard-to-music triggering.
3. **Dual Layer Architecture (Base & Shift)**:
   - Base Layer: Standard key mappings for lower/mid octave melodic and percussive performance.
   - Shift Layer: Alternate key mappings providing higher octaves, extended scales, chords, and auxiliary controls.
   - Dedicated mobile touchscreen toggles for Shift layer, ensuring mobile parity without physical keys.
4. **Offline-First & Local Persistence**:
   - IndexedDB is the primary datastore for recorded audio buffers, multi-track stems, and custom user presets.
   - Small preferences (theme, default octave, master volume) persist in `localStorage`.
   - Complete project export/import via schema-validated JSON with Base64 audio stems.
5. **Decoupled, Optional Python FastAPI Backend**:
   - Backend provides optional cloud/sync endpoints (`/api/health`, `/api/presets`).
   - The application functions seamlessly 100% offline or with backend disabled.
   - Pydantic models guarantee strict request sanitization with zero arbitrary file execution.

---

## 2. Coding Standards
- **TypeScript**: Strict mode enabled (`noImplicitAny`, `strictNullChecks`). No `any` without explicit justification.
- **React**: Functional components with hooks, clear separation of concerns between stateful stores, audio logic, and presentation.
- **Audio DSP**: Modular Web Audio nodes (`AudioNode`). Gain nodes for envelopes must ramp with `cancelScheduledValues` and exponential/linear ramps (`setTargetAtTime` / `exponentialRampToValueAtTime`) to eliminate audible clicks/pops.
- **Styles**: Custom CSS tokens (dark charcoal studio theme, clean high-contrast light theme, cyan/amber highlights). Responsive down to 320px mobile screens without horizontal scroll.
- **Python Backend**: Python 3.12+ / 3.13, FastAPI, Pydantic v2, SQLite with SQLModel/SQLAlchemy, Pytest suite.

---

## 3. Folder Responsibilities

```
keymuse/
├── frontend/
│   ├── src/
│   │   ├── audio/              # Core Web Audio synthesis, effects, sequencer, recorder, MIDI
│   │   │   ├── AudioEngine.ts     # Master AudioContext, bus routing, master compressor
│   │   │   ├── SynthEngine.ts     # Polyphonic synth, oscillator voices, ADSR envelopes
│   │   │   ├── DrumEngine.ts      # Procedural & sampled drum voices (kick, snare, hats, clap, tom, perc)
│   │   │   ├── SampleEngine.ts    # Multi-instrument sound generator with procedural fallbacks
│   │   │   ├── EffectsChain.ts    # Reverb, stereo delay, biquad filter, distortion, bypass
│   │   │   ├── AudioRecorder.ts   # Live MediaRecorder, multi-track loop station, WAV/export
│   │   │   ├── MidiEngine.ts      # Web MIDI input listener, Standard MIDI File (SMF) generator
│   │   │   └── Metronome.ts       # Web Audio lookahead clock scheduler for sequencer & metronome
│   │   ├── components/         # Modular React UI components
│   │   │   ├── Header.tsx         # Studio navigation, audio status, volume, theme toggle
│   │   │   ├── VirtualPiano.tsx   # Multi-octave interactive touch/mouse piano
│   │   │   ├── KeyboardVisualizer.tsx # QWERTY visual mapping and active key feedback
│   │   │   ├── InstrumentSelector.tsx # 12 instrument sound presets selection
│   │   │   ├── SynthControls.tsx  # Waveform, ADSR, filter cutoff/resonance controls
│   │   │   ├── ScaleChordPanel.tsx # Scale lock, chord mode, arpeggiator controls
│   │   │   ├── DrumMachine.tsx    # 16-step sequencer matrix & drum pads
│   │   │   ├── MixerEffects.tsx   # Effects parameters, dry/wet, bypass toggles
│   │   │   ├── LoopStation.tsx    # Multi-track looper, overdub, mute/solo, export
│   │   │   ├── MappingEditor.tsx  # Custom physical key to note/action binding editor
│   │   │   ├── MidiModal.tsx      # MIDI device enumeration & velocity configuration
│   │   │   └── SettingsModal.tsx  # Storage management, JSON project backup/restore
│   │   ├── constants/          # Instruments, scales, chord intervals, default keymaps
│   │   ├── context/            # Audio state provider & UI integration
│   │   ├── db/                 # IndexedDB schema & persistence repository
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   └── styles/             # Studio theme tokens and responsive layouts
│   ├── public/                 # PWA manifest, service worker, sample audio files
│   ├── tests/                  # Frontend unit and audio DSP tests
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, CORS configuration
│   │   ├── database.py         # SQLite connection & session
│   │   ├── models.py           # SQLModel database tables
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   └── routers/            # Health, Presets, Projects
│   └── tests/                  # Pytest backend test suite
├── agent.md                    # This document
├── feature.md                  # Comprehensive feature checklist and status
└── implementation-plan.md      # Detailed phase execution tracking & verification logs
```

---

## 4. Audio Engine & DSP Rules
1. **AudioContext Lifecycle**:
   - `AudioContext` starts in suspended state until explicit user interaction (click/touch/keypress).
   - Audio resume modal / banner provides 1-tap activation.
2. **Click Prevention**:
   - All note on/off transitions use envelopes with minimum 2ms ramp times. No abrupt setting of `gainNode.gain.value = 0` at instantaneous time.
3. **Voice Allocation**:
   - Polyphonic synthesizer supports up to 32 simultaneous voices with graceful voice stealing (oldest voice stealing with quick fadeout) when limit is exceeded.
4. **Precise Scheduling**:
   - Step sequencer and metronome use the standard Web Audio lookahead scheduling pattern (25ms timer interval looking ahead 100ms) to ensure sample-accurate timing independent of UI thread jank.

---

## 5. Input Handling Rules
1. **Physical Keyboard**:
   - Map `KeyboardEvent.code` to musical actions.
   - Ignore repeated events (`e.repeat`).
   - Track active keys in a `Set<string>` to release notes on keyup.
   - Auto-release all notes on `blur`, `visibilitychange`, and context switch.
2. **Touch & Pointer Events**:
   - Use `pointerdown`, `pointerup`, `pointercancel`, `pointerleave`.
   - Prevent default behavior on touch surfaces to avoid unwanted viewport zooming/scrolling while playing.
   - Support multi-touch for polyphonic chords on mobile screens.

---

## 6. Safety & Security Requirements
1. **Backend Validation**:
   - Strict Pydantic models for preset and project schema.
   - Max body size limits (10MB for projects with audio metadata).
   - Strict CORS origin whitelisting.
2. **Local Storage Integrity**:
   - JSON imports validated against schema before parsing into state or IndexedDB.
   - Never use `eval()` or dynamically construct scripts from user data.

---

---

## 7. Phase Orchestration Rules
- Sequential execution from Phase 1 through Phase 17.
- Automatically wait 50 seconds (`await new Promise(...)` / system sleep) between consecutive phases.
- Perform automated verification, file inspections, and update `implementation-plan.md` and `feature.md`.
- Never stop after planning; complete all phases through final delivery.

---

## 8. Phase 2 — AI Music Autopilot Architecture Specification

### 8.1 Modular Core Architecture
1. **Music Brief Interpreter** (`keymuse.autopilot.interpreter`):
   - Ingests natural language briefs (e.g. "60-second cinematic sci-fi in D minor at 90 BPM").
   - Extracts structured parameters (`MusicBrief`): genre, mood, duration, BPM, key, mode, instrumentation, structure, explicit constraints.
   - Includes robust rule-based deterministic parser with optional LLM provider adapter.

2. **Composition Planner** (`keymuse.autopilot.planner`):
   - Computes bar/beat alignment based on target duration and BPM.
   - Plans musical sections (intro, tension build, climax, resolution) with energy curves (0.0 - 1.0).
   - Assigns tracks, roles (pad, bass, lead, percussion), registers, polyphony limits, and transitions.

3. **Composition & Arrangement Engine** (`keymuse.autopilot.generator`):
   - Realizes the plan into a canonical `KeyMuseProject`.
   - Generates chord progressions aligned to mode/key.
   - Generates motifs, rhythmic basslines, arpeggios, and multi-track percussion patterns.

4. **Pure Python Audio Synthesis & Rendering** (`keymuse.core.synth`, `keymuse.core.render`):
   - Real DSP synthesis engine utilizing `numpy` for high performance.
   - Wavetable/analog oscillators (sine, square, saw, triangle), ADSR volume envelopes with click-free ramps.
   - Procedural drum synthesis (kick, snare, hats, tom, perc).
   - Stereo panning, master limiter, and 16-bit PCM WAV rendering via Python `wave` + `numpy`.
   - Standard MIDI File (SMF Type 0/1) binary generator (`keymuse.core.midi`).

5. **Audio & Music Quality Inspector** (`keymuse.core.analyzer`):
   - Inspects rendered audio waveforms: duration, sample rate, channels, peak amplitude, RMS level, clipping risk.
   - Detects leading/trailing/unexpected silence and gaps.
   - Measures track and note coverage, pitch boundaries, and section alignment.

6. **Targeted Revision Loop** (`keymuse.autopilot.reviser`):
   - Closed-loop optimization: detects actionable defects from analysis results.
   - Generates targeted edits (e.g. gain adjustment for clipping, note extension for duration mismatch, tail decay for cutoffs).
   - Re-renders audio and verifies improvement with revision history tracking.

7. **Task Orchestrator & Safe Agent API** (`keymuse.autopilot.orchestrator`, `keymuse.autopilot.autopilot`):
   - Manages asynchronous tasks with states (queued, running, completed, failed, cancelled).
   - Exposes clean high-level API: `from keymuse import MusicAutopilot`.

8. **Model Context Protocol (MCP) Server** (`keymuse.mcp.server`):
   - Implements official MCP SDK (`mcp>=2.3.0`) tool server.
   - Exposes safe, validated tools for AI coding agents (`keymuse_plan_composition`, `keymuse_render_preview`, `keymuse_analyze_audio`, `keymuse_revise_project`, etc.).

---

## 9. Phase 3 — Web Studio & Agent Setup Hub Specification

### 9.1 Human AI Music Studio (`frontend/src/components/AiStudio.tsx`)
1. **Interactive Prompt Composer**:
   - Natural language brief input textarea with 4 instant musical style presets.
   - Granular musical controls: Tempo (BPM), Key, Mode (9 diatonic and modern modes), Target Duration slider (5-300s), Deterministic Seed input, and 6 active voice toggles.
2. **Audio Transport & Waveform Display**:
   - HTML5 `<audio>` playback with interactive scrub bar, play/pause, time/duration labels, volume fader, and real-time visualizer waveform.
3. **Objective Audio Quality Inspector**:
   - Renders exact metrics: Peak dBFS, RMS level, clipping risk detection (0 clips / safe headroom guarantee), and silence boundaries (lead-in & trailing decay in seconds).
4. **Arrangement & Track Structure View**:
   - Dynamic energy progression bars for each structural section (Intro, Build, Climax, Resolution).
   - Per-track metadata tags with individual stem WAV download buttons.
5. **Closed-Loop Surgical Revision Suite**:
   - Direct controls for gain adjustments (dB), tempo adjustments (BPM), and custom revision instructions calling `POST /api/autopilot/revise`.
6. **Multi-Format Export Suite**:
   - Direct download links for Master Mixdown (WAV), Standard MIDI File (SMF Type 0), Project Schema (JSON), and Audit Manifest (`report.json`).

### 9.2 Dedicated "Connect Your AI Agent" Setup Hub (`frontend/src/components/AgentSetupHub.tsx`)
1. **Cross-Platform Compatibility**:
   - Interactive OS selector (Linux, macOS, Windows) dynamically adapting command syntax, paths, and environment activation.
2. **Supported Coding Agent Setup Guides**:
   - Step-by-step setup and verified configuration snippets for Google Antigravity, Claude Code / Desktop, OpenAI Codex, Cursor IDE, and VSCode / Cline.
3. **Dynamic MCP Tool Reference**:
   - Real-time tool introspection connecting to `keymuse.mcp.server.MCPServer` via `GET /api/autopilot/tools`.
   - Real-time search filter across all 15 MCP tools, argument schemas, categorized badges, and copyable JSON tool call snippets.
4. **Python SDK Guide & Troubleshooting**:
   - Complete package installation, synchronous composition, async tasks, and FAQ accordion.
5. **Sandboxed Security & Persistent Checklist**:
   - Path traversal isolation (`resolve_safe_path`), resource ceilings (600s, 32 tracks, 50k notes).
   - 7-point interactive verification checklist persisted in `localStorage`.

### 9.3 Backend Autopilot Router & Serverless Architecture
1. **Router Endpoints (`backend/app/routers/autopilot.py`)**:
   - `GET /api/autopilot/metadata`: Dynamic package version, Git repository URL, supported agents.
   - `GET /api/autopilot/tools`: Dynamic introspection of 15 MCP tools.
   - `POST /api/autopilot/compose`: Executes pure Python DSP audio composition.
   - `POST /api/autopilot/revise`: Surgical closed-loop revisions and audio re-synthesis.
   - `GET /api/autopilot/projects/{id}/audio`: 16-bit PCM WAV streaming.
   - `GET /api/autopilot/projects/{id}/midi`: SMF Type 0 binary download.
   - `GET /api/autopilot/projects/{id}/stems/{stem}`: Isolated stem WAV downloads.
   - `GET /api/autopilot/projects/{id}/manifest`: Audit report and metrics manifest.
   - `GET /api/autopilot/projects/{id}/project`: Canonical project JSON schema.
2. **Vercel Serverless Production Deployment**:
   - Live URL: `https://keymuse-agent.vercel.app`
   - Entrypoint: `api/index.py` with `/tmp` sandboxing (`/tmp/keymuse_output`).

---

## 10. Physical Acoustic Modeling & Instrument Synthesis Architecture

KeyMuse replaces flat, buzzy synth waveforms with physical acoustic modeling across both the browser Web Audio client (`SampleEngine.ts`) and the backend DSP engine (`synth.py`):

### 10.1 Concert Grand Piano Physical Model
Real acoustic pianos differ fundamentally from electronic synthesizers in six acoustic behaviors:
1. **Felt-on-Steel Hammer Impact Transient**:
   - *Acoustic principle*: The initial 5–16ms mechanical shock of the felt hammer striking steel strings produces a high-energy, broad-spectrum percussive burst.
   - *Implementation*: Procedural hammer buffer transient (`AudioBufferSourceNode` with lowpass-shaped noise burst in browser; windowed transient impulse in Python).
2. **Dynamic Brightness Damping (Filter Sweep)**:
   - *Acoustic principle*: High-frequency harmonics dissipate far faster than low-frequency fundamentals due to internal string friction and soundboard impedance.
   - *Implementation*: Biquad lowpass filter sweeps from strike brightness (`freq * (3.8 + vel * 3.0)`) down to warm singing resonance within 160ms.
3. **3-String Unison Beating (Chorus)**:
   - *Acoustic principle*: Mid and treble keys strike a trichord of 3 strings, which are slightly detuned (±1.0–1.8 cents), creating subtle acoustic beating.
   - *Implementation*: Triple-string detuned oscillator cluster (center +1.4c and -1.4c detuning).
4. **Inharmonic String Partials**:
   - *Acoustic principle*: String stiffness causes higher overtones to shift sharp according to the inharmonicity formula $f_k = k \cdot f \cdot \sqrt{1 + B k^2}$, with frequency-dependent decay ($\alpha_k = \alpha_0 \cdot k^{1.35}$).
   - *Implementation*: 8-partial inharmonic summation with independent exponential envelopes in Python; 4-partial summation in Web Audio.
5. **Pitch-Dependent Decay Time**:
   - *Acoustic principle*: Heavy bass strings vibrate for up to 5–7 seconds, whereas short treble strings damp out in under 1.5 seconds.
   - *Implementation*: Exponential decay time scaling: $T_{decay} = 1.0 + 3.8 \cdot \exp(-f / 350)$.
6. **Spruce Soundboard Cabinet Resonance**:
   - *Acoustic principle*: The piano's spruce soundboard amplifies warm body resonances around 200–220 Hz.
   - *Implementation*: Peaking body resonance filter at 210 Hz with +2.8 dB gain.

### 10.2 Other Acoustic & Vintage Instruments
- **Rhodes Electric Piano**: Metallic tine chime transient + dual sine body + stereo tremolo/chorus.
- **Tonewheel Organ**: Fluted drawbar sine organ chords (8', 4', 2 2/3', 2') + simulated Leslie rotating speaker phase chorus.
- **Acoustic Guitar**: Fast pluck transient + dual detuned strings + body cabinet resonance.
- **Orchestral Violin & Strings**: Dual detuned string ensemble + dual formant body filters (500 Hz & 2400 Hz) + delayed vibrato.
- **Flute & Marimba**: Breathy turbulence + soft sinusoidal core / woody percussive resonator envelope.


