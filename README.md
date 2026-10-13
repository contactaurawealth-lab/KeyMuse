# KeyMuse 🎵🎹
> *Your Keyboard. Your Orchestra.*

A complete, responsive, browser-based musical instrument studio that transforms physical computer keyboard keys, mobile touchscreens, and MIDI controllers into expressive virtual musical instruments.

---

## 🌟 Key Features

- **Universal Physical Keyboard Mapping**:
  - Full support for keys `A–Z`, `0–9`, symbols, spacebar, and arrow keys.
  - Low-latency triggering using `KeyboardEvent.code`.
  - Native `e.repeat` filtering to prevent accidental machine-gun retriggering.
  - Automatic focus protection: ignores input while typing in text inputs and textareas.
  - Window blur and tab visibility change listeners preventing hung/stuck notes.
  - Interactive QWERTY visualizer with active note glow and full remapping editor.

- **Shift Note Layers & Dual Performance**:
  - Base layer for natural scales and Shift layer for accidentals, harmonies, and secondary sounds.
  - Dedicated mobile layer switch button (no physical Shift key required).

- **Expressive Virtual Piano & MPC Drum Pads**:
  - 25-key dual-octave keyboard with accurate black and white key geometry.
  - Multi-touch polyphony tracking individual pointer IDs without mouse/touch event duplication.
  - Switchable 8-pad velocity-sensitive MPC percussion layout.

- **12 Distinct Sound Presets**:
  - Acoustic Piano, Electric Piano (Rhodes), Church Organ, Synth Lead, Synth Bass, Ambient Pad, Plucked Strings, Acoustic Guitar, Solo Violin, Concert Flute, Marimba, Studio Drum Kit.
  - Procedural additive/FM synthesis fallbacks for 100% offline reliability.
  - Live ADSR envelope shaping (Attack, Decay, Sustain, Release) and filter modulation.

- **Musical Intelligence**:
  - 9 Musical Modes (Chromatic, Major, Minor, Pentatonic Major/Minor, Blues, Harmonic Minor, Dorian, Mixolydian).
  - Scale Lock with nearest-pitch quantization in absolute MIDI semitone space.
  - Chord Harmonies (Major, Minor, 7ths, Diminished, Augmented, Sus2, Sus4).
  - BPM-synced Arpeggiator (Up, Down, Up/Down, Random at 1/16, 1/8, 1/4 rates).

- **16-Step Drum Machine & Sequencer**:
  - 7 percussion tracks: Kick, Snare, Closed Hat, Open Hat, Clap, Tom, Percussion.
  - High-precision lookahead audio clock scheduler using Web Audio `currentTime`.
  - Swing groove factor and per-track mute and solo buttons.
  - Built-in genre presets: Rock, House, Boom Bap, Trap.

- **Studio Mixer & DSP Effects Rack**:
  - Master volume with decibel readout and real-time 48-band canvas spectrum analyzer.
  - Master Limiter: `DynamicsCompressorNode` at -2.0 dB peak threshold for clean anti-clipping protection.
  - Algorithmic Reverb with procedurally synthesized impulse response buffers.
  - Stereo Delay with tempo-synced subdivisions (1/16, 1/8, 1/8d, 1/4) and high-frequency damping.
  - Biquad Tone Filter (Low-pass, High-pass) with resonance (Q) control.
  - Overdrive / Distortion stage with 4x anti-aliasing oversampling and sigmoid soft-clipping curve.

- **Multi-Track Loop Station**:
  - Live audio take recording via `MediaRecorder` connected to master limiter output.
  - Layered overdubbing, stem volume faders, mute/solo, and take management.
  - **16-Bit PCM Stereo WAV Export**: Generates compliant RIFF WAVE audio files.
  - **Standard MIDI File (SMF Type 0) Export**: Generates binary `.mid` files with `MThd` and `MTrk` chunks.
  - Project state JSON backup export.

- **Web MIDI & Hardware Controllers**:
  - Native Web MIDI API input device enumeration.
  - Velocity sensitivity mapping.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Web Audio API, Canvas 2D, Lucide Icons, Vitest.
- **Backend**: Python 3.12+, FastAPI, SQLModel / SQLite, Pydantic v2, Pytest.
- **Audio DSP**: Modular Web Audio node graphs with zero-latency local synthesis.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20 & v26)
- Python 3.12+ (optional, for cloud preset sync)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To run the frontend test suite:
```bash
npm test
```

To build for production:
```bash
npm run build
```

### Backend Setup (Optional)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

To run backend tests:
```bash
pytest
```

---

## 📄 License
MIT License. Free and open source for musicians and developers worldwide.
