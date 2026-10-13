import { InstrumentType, SynthSettings } from '../types';

export interface InstrumentConfig {
  id: InstrumentType;
  name: string;
  category: 'keys' | 'synths' | 'acoustic' | 'percussion';
  description: string;
  iconName: string;
  defaultSynth: SynthSettings;
}

export const INSTRUMENTS: InstrumentConfig[] = [
  {
    id: 'piano',
    name: 'Acoustic Piano',
    category: 'keys',
    description: 'Dynamic concert grand piano with multi-harmonic resonance',
    iconName: 'Piano',
    defaultSynth: {
      waveform: 'triangle',
      envelope: { attack: 0.005, decay: 1.5, sustain: 0.15, release: 0.6 },
      filterCutoff: 4500,
      filterResonance: 1.5,
      filterType: 'lowpass',
      detune: 0,
      vibratoRate: 0,
      vibratoDepth: 0,
      volume: 0.85
    }
  },
  {
    id: 'electric_piano',
    name: 'Electric Piano',
    category: 'keys',
    description: 'Warm vintage tine electric piano with chime bell tone',
    iconName: 'Sparkles',
    defaultSynth: {
      waveform: 'sine',
      envelope: { attack: 0.01, decay: 1.2, sustain: 0.35, release: 0.5 },
      filterCutoff: 5500,
      filterResonance: 2.0,
      filterType: 'lowpass',
      detune: 4,
      vibratoRate: 4.5,
      vibratoDepth: 8,
      volume: 0.8
    }
  },
  {
    id: 'organ',
    name: 'Tonewheel Organ',
    category: 'keys',
    description: 'Full drawbar jazz organ with rich sustained harmonics',
    iconName: 'Layers',
    defaultSynth: {
      waveform: 'sawtooth',
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.08 },
      filterCutoff: 3800,
      filterResonance: 2.5,
      filterType: 'lowpass',
      detune: -5,
      vibratoRate: 6.0,
      vibratoDepth: 12,
      volume: 0.75
    }
  },
  {
    id: 'synth_lead',
    name: 'Analog Synth Lead',
    category: 'synths',
    description: 'Punchy saw lead with resonant lowpass filter bite',
    iconName: 'Zap',
    defaultSynth: {
      waveform: 'sawtooth',
      envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.3 },
      filterCutoff: 3200,
      filterResonance: 6.0,
      filterType: 'lowpass',
      detune: 8,
      vibratoRate: 5.5,
      vibratoDepth: 18,
      volume: 0.8
    }
  },
  {
    id: 'synth_bass',
    name: 'Sub Synth Bass',
    category: 'synths',
    description: 'Deep punchy monophonic bass with low-end weight',
    iconName: 'Disc',
    defaultSynth: {
      waveform: 'square',
      envelope: { attack: 0.008, decay: 0.35, sustain: 0.4, release: 0.15 },
      filterCutoff: 1200,
      filterResonance: 4.0,
      filterType: 'lowpass',
      detune: 0,
      vibratoRate: 0,
      vibratoDepth: 0,
      volume: 0.9
    }
  },
  {
    id: 'ambient_pad',
    name: 'Ambient Pad',
    category: 'synths',
    description: 'Lush atmospheric evolving soundscape with slow bloom',
    iconName: 'Cloud',
    defaultSynth: {
      waveform: 'triangle',
      envelope: { attack: 0.45, decay: 1.8, sustain: 0.7, release: 1.4 },
      filterCutoff: 2200,
      filterResonance: 2.0,
      filterType: 'lowpass',
      detune: 6,
      vibratoRate: 3.0,
      vibratoDepth: 15,
      volume: 0.7
    }
  },
  {
    id: 'plucked_strings',
    name: 'Plucked Strings',
    category: 'acoustic',
    description: 'Acoustic harp and pizzicato string pluck transient',
    iconName: 'Music',
    defaultSynth: {
      waveform: 'triangle',
      envelope: { attack: 0.003, decay: 0.6, sustain: 0.05, release: 0.3 },
      filterCutoff: 6000,
      filterResonance: 3.0,
      filterType: 'lowpass',
      detune: 0,
      vibratoRate: 0,
      vibratoDepth: 0,
      volume: 0.85
    }
  },
  {
    id: 'guitar',
    name: 'Nylon Guitar',
    category: 'acoustic',
    description: 'Warm acoustic guitar with metallic attack and natural body',
    iconName: 'Activity',
    defaultSynth: {
      waveform: 'sawtooth',
      envelope: { attack: 0.008, decay: 0.8, sustain: 0.12, release: 0.4 },
      filterCutoff: 4000,
      filterResonance: 1.8,
      filterType: 'lowpass',
      detune: 2,
      vibratoRate: 0,
      vibratoDepth: 0,
      volume: 0.8
    }
  },
  {
    id: 'violin',
    name: 'Solo Violin',
    category: 'acoustic',
    description: 'Expressive bowed string with warmth and natural vibrato',
    iconName: 'Feather',
    defaultSynth: {
      waveform: 'sawtooth',
      envelope: { attack: 0.12, decay: 0.3, sustain: 0.85, release: 0.35 },
      filterCutoff: 4200,
      filterResonance: 3.5,
      filterType: 'lowpass',
      detune: -3,
      vibratoRate: 5.2,
      vibratoDepth: 20,
      volume: 0.75
    }
  },
  {
    id: 'flute',
    name: 'Wooden Flute',
    category: 'acoustic',
    description: 'Pure airy woodwind with gentle breath timbre',
    iconName: 'Wind',
    defaultSynth: {
      waveform: 'sine',
      envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 0.25 },
      filterCutoff: 3000,
      filterResonance: 1.2,
      filterType: 'lowpass',
      detune: 0,
      vibratoRate: 5.0,
      vibratoDepth: 14,
      volume: 0.8
    }
  },
  {
    id: 'marimba',
    name: 'Concert Marimba',
    category: 'percussion',
    description: 'Resonant wooden mallet percussion with warm bass thump',
    iconName: 'Grid',
    defaultSynth: {
      waveform: 'triangle',
      envelope: { attack: 0.002, decay: 0.7, sustain: 0.04, release: 0.3 },
      filterCutoff: 3500,
      filterResonance: 1.5,
      filterType: 'lowpass',
      detune: 0,
      vibratoRate: 0,
      vibratoDepth: 0,
      volume: 0.9
    }
  },
  {
    id: 'drum_kit',
    name: 'Studio Drum Kit',
    category: 'percussion',
    description: 'Multi-piece acoustic and electronic drum kit layout',
    iconName: 'Drum',
    defaultSynth: {
      waveform: 'square',
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.1 },
      filterCutoff: 8000,
      filterResonance: 1.0,
      filterType: 'lowpass',
      detune: 0,
      vibratoRate: 0,
      vibratoDepth: 0,
      volume: 0.9
    }
  }
];
