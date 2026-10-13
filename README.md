# KeyMuse 🎵🎹
> *Your Keyboard. Your Orchestra.*

[![GitHub Repository](https://img.shields.io/badge/GitHub-contactaurawealth--lab%2FKeyMuse-181717?style=flat&logo=github)](https://github.com/contactaurawealth-lab/KeyMuse)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/Tests-47%2F47%20Passing-brightgreen)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-blue)]()
[![License](https://img.shields.io/badge/License-MIT-amber)]()

**KeyMuse** is a complete, responsive, browser-based musical instrument studio that transforms physical computer keyboard keys, mobile touchscreens, and MIDI controllers into expressive virtual musical instruments.

Built with a modular Web Audio synthesis graph, high-precision lookahead step sequencer, studio-grade DSP effects rack, multi-track loop station, standard MIDI file binary exporter, 16-bit PCM WAV exporter, and an optional Python FastAPI cloud synchronization service.

---

## 🌟 Key Features

### 🎹 Universal Physical Keyboard Mapping & Visualizer
- **Complete Physical Key Support**: Map letters `A–Z`, numbers `0–9`, punctuation/symbol keys, arrow keys, and Spacebar.
- **Physical Layout Consistency**: Driven by `KeyboardEvent.code` to maintain deterministic spatial positioning across international keyboard layouts.
- **Machine-Gun Retrigger Filter**: Strict `event.repeat` suppression prevents machine-gun retriggering while holding down keys.
- **Zero Hung Notes Guarantee**: Active note tracking with automatic release sweeps on `window.onblur`, tab visibility change (`visibilitychange`), and context switches.
- **Input Field Isolation**: Typing inside `<input>`, `<textarea>`, and `contenteditable` elements automatically suppresses note triggering.
- **Real-Time Visualizer & Editor**: Interactive QWERTY keyboard display with glowing note active states and in-app key remapping editor with default reset.

### ⚡ Shift Note Layers & Mobile Parity
- **Base Layer**: Standard mapping for natural diatonic scales, base octave notes, and percussion.
- **Shift Layer**: Alternate key mapping providing accidentals, higher octaves, harmonies, and secondary sounds.
- **Dedicated Mobile Layer Toggle**: Touch-friendly Shift toggle for mobile devices so physical Shift keys are not required.

### 🎼 Expressive Virtual Piano & MPC Drum Pads
- **25-Key Dual-Octave Piano**: Mathematically accurate white and black key geometry with responsive key widths.
- **Multi-Touch Polyphony**: Track individual pointer events without duplicate mouse/touch triggers.
- **Customizable Note Labels**: Toggle between note names (C4, D4), Solfège (Do, Re), or physical key bindings.
- **MPC Drum Pad Mode**: 8 velocity-sensitive percussion pads with live visual strike feedback.

### 🎻 12 Distinct Sound Presets
1. **Acoustic Piano**: Resonant multi-harmonic acoustic piano model with warm decay.
2. **Electric Piano (Rhodes)**: Bell-like tone with subtle tremolo and mellow body.
3. **Church Organ**: Harmonic pipe organ drawbars with rich sustained chorus.
4. **Synth Lead**: Sawtooth/square dual-oscillator with resonant filter sweep.
5. **Synth Bass**: Punchy analog bass with fast attack envelope and sub-oscillator warmth.
6. **Ambient Pad**: Slow-attack atmospheric pad with shimmering detune.
7. **Plucked Strings**: Fast transient pluck with exponential decay.
8. **Acoustic Guitar**: Warm nylon/steel hybrid acoustic tone.
9. **Solo Violin**: Expressive string body with subtle vibrato modulation.
10. **Concert Flute**: Breathy acoustic woodwind timbre with gentle overtone flutter.
11. **Marimba**: Woody percussive mallet strike with rapid initial transient.
12. **Studio Drum Kit**: Complete percussion kit with procedural synthesis fallback.

*Note: All instruments include procedural synthesis fallbacks to guarantee 100% offline functionality without external network sample dependencies.*

### 🧠 Musical Intelligence (Scales, Chords & Arpeggiator)
- **9 Musical Modes**: Chromatic, Major, Minor, Pentatonic Major, Pentatonic Minor, Blues, Harmonic Minor, Dorian, Mixolydian.
- **Scale Lock**: Nearest-pitch quantization in absolute MIDI semitone space—no out-of-key notes or octave-wrapping anomalies.
- **Harmonic Chord Mode**: One-finger chord performance across Major, Minor, 7th, Dominant 7th, Diminished, Augmented, Sus2, and Sus4 harmonies.
- **BPM-Synced Arpeggiator**: Configurable patterns (Up, Down, Up/Down, Random) with 1/16, 1/8, and 1/4 note rates and 1–3 octave span.

### 🥁 16-Step Drum Machine & Sequencer
- **7 Procedural Percussion Voices**: Kick (pitch-envelope sine), Snare (dual-tone body + bandpass noise), Closed Hi-Hat (crisp metallic noise burst), Open Hi-Hat (decaying noise tail), Hand Clap (triple-burst transient), Tom (resonant downward sweep), Percussion (metallic chime).
- **Lookahead Audio Clock**: Web Audio `currentTime` sample-accurate scheduler independent of UI frame-rate fluctuations.
- **Groove & Track Controls**: Variable swing percentage (0–50%), tempo (40–240 BPM), per-track mute and solo buttons, and pattern clear.
- **Genre Presets**: 1-click genre rhythms including Rock, House, Boom Bap, and Trap.

### 🎛️ Studio Mixer & DSP Effects Rack
- **Master Level**: Master volume slider with real-time decibel (dB) readout and master mute.
- **Real-Time Spectrum Analyzer**: 48-band canvas frequency visualizer powered by Web Audio `AnalyserNode`.
- **Master Limiter**: Dynamics compressor configured at -2.0 dB threshold to protect against digital clipping and inter-sample peaks.
- **Algorithmic Convolution Reverb**: Procedurally generated impulse responses simulating studio rooms, halls, and ambient spaces.
- **Stereo Delay**: Tempo-synced delay subdivisions (1/16, 1/8, 1/8d, 1/4) with feedback damping and stereo ping-pong widening.
- **Biquad Tone Filter**: Low-Pass and High-Pass filters with frequency cutoff (20 Hz – 20 kHz) and resonance (Q).
- **Overdrive / Distortion**: Sigmoid soft-clipping waveshaping with 4x anti-aliasing oversampling.

### 🔴 Multi-Track Loop Station & Audio Exporter
- **Live Take Recording**: Direct audio stream recording via `MediaRecorder` connected to the master limiter output.
- **Layered Stems**: Unlimited overdubbing takes, individual stem volume faders, mute/solo controls, and take deletion.
- **16-Bit PCM Stereo WAV Export**: Generates authentic RIFF WAVE audio files playable on any device.
- **Standard MIDI File (SMF Type 0) Export**: Generates compliant binary `.mid` files with `MThd` and `MTrk` chunks.
- **Project Backup / Restore**: Export entire project state including recorded stems and sequencer patterns as a validated JSON archive.

### 🎚️ Hardware Web MIDI Support
- **Hardware Controller Plug-and-Play**: Automatic detection and enumeration of connected USB/Bluetooth MIDI keyboards.
- **Velocity Sensitivity**: Responsive dynamics mapped from MIDI NoteOn velocity (0–127).
- **Activity Monitor**: Live input indicator displaying incoming note and velocity values.

### 📱 Progressive Web App (PWA) & Accessibility
- **Offline First**: Service worker caching shell and audio assets (`sw.js` with `keymuse-v1.0.0` stale-while-revalidate strategy).
- **Web App Manifest**: Installable as a standalone app on iOS, Android, macOS, and Windows.
- **Responsive Layout**: Fluid design down to 320px screens with zero horizontal overflow.
- **WCAG AA Compliance**: High-contrast dark and light studio themes with visible `:focus-visible` keyboard rings.
- **Motion Reduction**: Full `@media (prefers-reduced-motion: reduce)` support.

---

## 🏗️ System Architecture

```
[ Physical Keyboard / Touchscreen / Web MIDI ]
                       │
                       ▼
       ┌───────────────────────────────┐
       │   KeyMuse Input Coordinator   │
       │  (Keycode, Repeat, Focus)    │
       └───────────────┬───────────────┘
                       │
       ┌───────────────▼───────────────┐
       │   Musical Theory & Quantize   │
       │   (Scale Lock, Chord, Arp)    │
       └───────────────┬───────────────┘
                       │
       ┌───────────────▼───────────────┐
       │     Modular Audio Engine      │
       │ ┌───────────────────────────┐ │
       │ │ Polyphonic Synth Engine   │ │
       │ │ (32-voice voice stealing) │ │
       │ ├───────────────────────────┤ │
       │ │ Sample & Instrument Model │ │
       │ ├───────────────────────────┤ │
       │ │ 16-Step Drum Synthesizer  │ │
       │ └─────────────┬─────────────┘ │
       └───────────────┼───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │     Studio DSP Effects Rack   │
       │   Filter ➔ Drive ➔ Delay ➔   │
       │   Reverb ➔ Master Limiter    │
       └───────────────┬───────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    [ Audio Destination ]    [ Loop Station ]
    (Speakers / Headphones)  (WAV / MIDI Export)
```

---

## ⌨️ Keyboard Shortcuts Reference

| Key / Combination | Function |
| :--- | :--- |
| `A – Z`, `0 – 9`, `Punctuation` | Trigger mapped musical notes / drums |
| `Shift` + Key | Trigger alternate Shift Layer note / harmony |
| `[ ` / ` ]` | Shift Octave Down / Up (-3 to +3) |
| `-` / `=` | Transpose Down / Up (-12 to +12 semitones) |
| `Space` | Toggle Sustain Pedal Lock / Trigger Hold |
| `Escape` | **PANIC**: Instantly silence all active notes and voices |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo studio state changes |
| `Tab` | Cycle through interactive studio controls |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- Python 3.12+ (optional, for cloud backend sync)

### Frontend (Browser Studio)
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To run the automated Vitest test suite:
```bash
npm test
# or: npx vitest run
```

To create a production build:
```bash
npm run build
```

### Backend (Optional Cloud API)
```bash
# Navigate to the backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

To run backend tests:
```bash
pytest
```

---

## 🧪 Verification & Automated Testing

| Test Suite | Files | Tests | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Vitest** | 12 files | 44 tests | 44 Passed / 0 Failed | ✅ VERIFIED |
| **Backend Pytest** | 2 files | 3 tests | 3 Passed / 0 Failed | ✅ VERIFIED |
| **Vite Production Build** | TypeScript | Clean Bundle | 0 Errors | ✅ VERIFIED |
| **Total Automated Tests** | **14 files** | **47 tests** | **47 Passed** | **100% PASS** |

---

## 📄 License

MIT License. Designed and engineered for musicians, sound designers, and developers.
Copyright (c) 2026 KeyMuse Project.
