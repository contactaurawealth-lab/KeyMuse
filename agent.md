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

## 7. Phase Orchestration Rules
- Sequential execution from Phase 1 through Phase 17.
- Automatically wait 50 seconds (`await new Promise(...)` / system sleep) between consecutive phases.
- Perform automated verification, file inspections, and update `implementation-plan.md` and `feature.md`.
- Never stop after planning; complete all phases through final delivery.
