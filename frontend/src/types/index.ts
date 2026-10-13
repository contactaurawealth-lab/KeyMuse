export type InstrumentType =
  | 'piano'
  | 'electric_piano'
  | 'organ'
  | 'synth_lead'
  | 'synth_bass'
  | 'ambient_pad'
  | 'plucked_strings'
  | 'guitar'
  | 'violin'
  | 'flute'
  | 'marimba'
  | 'drum_kit';

export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface EnvelopeSettings {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // 0.0 - 1.0 gain level
  release: number;  // seconds
}

export interface SynthSettings {
  waveform: WaveformType;
  envelope: EnvelopeSettings;
  filterCutoff: number;    // 20 - 20000 Hz
  filterResonance: number; // 0 - 20 Q
  filterType: BiquadFilterType;
  detune: number;          // cents (-1200 to +1200)
  vibratoRate: number;     // Hz (0 - 15)
  vibratoDepth: number;    // cents (0 - 100)
  volume: number;          // 0.0 - 1.0
}

export interface EffectsSettings {
  masterVolume: number;    // 0.0 - 1.0
  reverbWet: number;       // 0.0 - 1.0
  reverbDecay: number;     // seconds (0.1 - 5.0)
  reverbBypass: boolean;
  delayTime: number;       // seconds (0.01 - 1.0)
  delayFeedback: number;   // 0.0 - 0.95
  delayWet: number;        // 0.0 - 1.0
  delayBypass: boolean;
  filterCutoff: number;    // 20 - 20000 Hz
  filterType: 'lowpass' | 'highpass';
  filterBypass: boolean;
  distortionDrive: number; // 0.0 - 50.0
  distortionWet: number;   // 0.0 - 1.0
  distortionBypass: boolean;
}

export type ScaleType =
  | 'chromatic'
  | 'major'
  | 'minor'
  | 'pentatonic_major'
  | 'pentatonic_minor'
  | 'blues'
  | 'harmonic_minor'
  | 'dorian'
  | 'custom';

export type ChordType =
  | 'single'
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'maj7'
  | 'min7'
  | 'dom7'
  | 'sus2'
  | 'sus4';

export type ArpDirection = 'off' | 'up' | 'down' | 'updown' | 'random';

export interface ArpeggiatorSettings {
  enabled: boolean;
  direction: ArpDirection;
  rate: '1/4' | '1/8' | '1/16' | '1/32';
  octaves: number; // 1 - 3
}

export type DrumSound = 'kick' | 'snare' | 'hihat_closed' | 'hihat_open' | 'clap' | 'tom' | 'perc';

export interface DrumPattern {
  id?: string;
  name: string;
  steps: {
    [key in DrumSound]: boolean[]; // 16 steps boolean array
  };
}

export interface KeyMapping {
  code: string;       // KeyboardEvent.code (e.g. "KeyA", "Digit1")
  label: string;      // Visual key label (e.g. "A", "1")
  note: string;       // Note string (e.g. "C4", "D#4") or action code
  action?: 'octave_down' | 'octave_up' | 'layer_toggle' | 'sustain_toggle' | 'panic';
}

export interface LayerMapping {
  name: string;
  keys: Record<string, KeyMapping>;
}

export interface TrackRecording {
  id: string;
  name: string;
  blob?: Blob;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  durationSeconds: number;
  volume: number; // 0.0 - 1.0
  muted: boolean;
  solo: boolean;
  pan: number;    // -1.0 to 1.0
  createdAt: number;
}

export interface StudioProject {
  id: string;
  name: string;
  version: number;
  bpm: number;
  selectedInstrument: InstrumentType;
  octave: number;
  transpose: number;
  scale: ScaleType;
  rootNote: string;
  scaleLock: boolean;
  chordType: ChordType;
  arpSettings: ArpeggiatorSettings;
  effects: EffectsSettings;
  drumPattern: DrumPattern;
  tracks: TrackRecording[];
  updatedAt: number;
}
