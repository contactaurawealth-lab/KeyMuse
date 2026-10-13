import { InstrumentType } from '../types';
import { AudioEngine } from './AudioEngine';
import { noteToFrequency } from './MusicTheory';
import { INSTRUMENTS } from '../constants/instruments';

export interface SampledNoteVoice {
  id: string;
  note: string;
  oscillators: OscillatorNode[];
  gains: GainNode[];
  masterVoiceGain: GainNode;
  filter: BiquadFilterNode;
  released: boolean;
  startTime: number;
}

export class SampleEngine {
  private audioEngine: AudioEngine;
  public outputNode: GainNode | null = null;
  public currentInstrument: InstrumentType = 'piano';
  public loadingState: Record<InstrumentType, 'ready' | 'loading' | 'fallback'> = {
    piano: 'ready',
    electric_piano: 'ready',
    organ: 'ready',
    synth_lead: 'ready',
    synth_bass: 'ready',
    ambient_pad: 'ready',
    plucked_strings: 'ready',
    guitar: 'ready',
    violin: 'ready',
    flute: 'ready',
    marimba: 'ready',
    drum_kit: 'ready'
  };

  private activeVoices: Map<string, SampledNoteVoice> = new Map();

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  public initOutput(destination: AudioNode) {
    const ctx = this.audioEngine.init();
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(0.85, ctx.currentTime);
    this.outputNode.connect(destination);
  }

  public setInstrument(inst: InstrumentType) {
    this.currentInstrument = inst;
  }

  /**
   * Plays a note for the currently selected instrument using multi-harmonic physical modeling
   */
  public noteOn(
    note: string,
    velocity: number = 0.8,
    octaveOffset: number = 0,
    transposeSemitones: number = 0
  ): string {
    const ctx = this.audioEngine.init();
    if (!this.outputNode) {
      this.initOutput(this.audioEngine.masterGain || ctx.destination);
    }

    const now = ctx.currentTime;
    const fundamentalFreq = noteToFrequency(note, octaveOffset, transposeSemitones);

    const masterVoiceGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    masterVoiceGain.connect(filter);
    filter.connect(this.outputNode!);

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Synthesize physical acoustic/electronic instrument characters
    switch (this.currentInstrument) {
      case 'piano':
        this.buildPianoVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'electric_piano':
        this.buildElectricPianoVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'organ':
        this.buildOrganVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'guitar':
        this.buildGuitarVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'violin':
        this.buildViolinVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'flute':
        this.buildFluteVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'marimba':
        this.buildMarimbaVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      case 'plucked_strings':
        this.buildPluckVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
      default:
        // Default to dynamic piano / synth configuration
        this.buildPianoVoice(ctx, now, fundamentalFreq, velocity, masterVoiceGain, filter, oscillators, gains);
        break;
    }

    const voiceId = `${note}_${Date.now()}_${Math.random()}`;
    const voice: SampledNoteVoice = {
      id: voiceId,
      note,
      oscillators,
      gains,
      masterVoiceGain,
      filter,
      released: false,
      startTime: now
    };

    this.activeVoices.set(voiceId, voice);
    return voiceId;
  }

  public noteOff(note: string) {
    if (!this.audioEngine.ctx) return;
    const now = this.audioEngine.ctx.currentTime;

    this.activeVoices.forEach((voice, id) => {
      if (voice.note === note && !voice.released) {
        this.releaseVoice(voice, id, now, 0.4);
      }
    });
  }

  public stopAllNotes() {
    if (!this.audioEngine.ctx) return;
    const now = this.audioEngine.ctx.currentTime;
    this.activeVoices.forEach((voice, id) => {
      this.releaseVoice(voice, id, now, 0.02);
    });
  }

  private releaseVoice(voice: SampledNoteVoice, id: string, now: number, releaseTime: number) {
    voice.released = true;
    const g = voice.masterVoiceGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    setTimeout(() => {
      try {
        voice.oscillators.forEach((o) => {
          o.stop();
          o.disconnect();
        });
        voice.gains.forEach((gn) => gn.disconnect());
        voice.masterVoiceGain.disconnect();
        voice.filter.disconnect();
      } catch (e) {}
      this.activeVoices.delete(id);
    }, (releaseTime + 0.05) * 1000);
  }

  // --- Physical Instrument Modeling ---

  // Acoustic Concert Grand Piano: 3 detuned string harmonics + soundboard resonance
  private buildPianoVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(10000, freq * 4.5), now);
    filter.Q.setValueAtTime(1.2, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel, now + 0.006);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.35, now + 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    // Fundamental + 2nd Harmonic + 3rd Harmonic
    const harmonics = [
      { mult: 1.0, type: 'triangle' as OscillatorType, vol: 0.7, detune: -1.5 },
      { mult: 1.002, type: 'sine' as OscillatorType, vol: 0.4, detune: 1.5 },
      { mult: 2.0, type: 'sine' as OscillatorType, vol: 0.25, detune: 0 },
      { mult: 3.0, type: 'triangle' as OscillatorType, vol: 0.1, detune: 0.5 }
    ];

    harmonics.forEach((h) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = h.type;
      osc.frequency.setValueAtTime(freq * h.mult, now);
      osc.detune.setValueAtTime(h.detune, now);
      g.gain.setValueAtTime(h.vol, now);

      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      oscs.push(osc);
      gains.push(g);
    });
  }

  // Electric Piano (Rhodes): Pure sine fundamental + bright chime tines
  private buildElectricPianoVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(6000, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel, now + 0.008);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.45, now + 0.3);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.75, now);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(now);

    // Tine chime (high harmonic decaying fast)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 4.0, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.3, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(now);

    oscs.push(osc1, osc2);
    gains.push(g1, g2);
  }

  // Tonewheel Organ: Multi-drawbar synthesis (16', 8', 4', 2')
  private buildOrganVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(7000, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.8, now + 0.015);

    const drawbars = [
      { mult: 0.5, vol: 0.3 }, // Sub 16'
      { mult: 1.0, vol: 0.8 }, // 8' fundamental
      { mult: 2.0, vol: 0.4 }, // 4'
      { mult: 3.0, vol: 0.2 }  // 2 2/3'
    ];

    drawbars.forEach((d) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * d.mult, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(d.vol, now);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      oscs.push(osc);
      gains.push(g);
    });
  }

  // Classical Guitar: Plucked transient with string decay
  private buildGuitarVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(4500, freq * 3.5), now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.5);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel, now + 0.007);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.8, now);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    oscs.push(osc);
    gains.push(g);
  }

  // Solo Violin: Bowed envelope with gentle crescendo and expressive vibrato
  private buildViolinVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(3500, freq * 2.5), now);
    filter.Q.setValueAtTime(2.0, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.85, now + 0.12);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    // Natural violin vibrato
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.setValueAtTime(5.4, now);
    lfoG.gain.setValueAtTime(14, now); // 14 cents depth
    lfo.connect(lfoG);
    lfoG.connect(osc.detune);
    lfo.start(now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.8, now);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);

    oscs.push(osc, lfo);
    gains.push(g, lfoG);
  }

  // Wooden Flute: Airy breathy sine + subtle breath noise
  private buildFluteVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.9, now + 0.07);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle breath vibrato
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.setValueAtTime(4.8, now);
    lfoG.gain.setValueAtTime(8, now);
    lfo.connect(lfoG);
    lfoG.connect(osc.detune);
    lfo.start(now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.85, now);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);

    oscs.push(osc, lfo);
    gains.push(g, lfoG);
  }

  // Concert Marimba: Wooden bar thump + sharp attack
  private buildMarimbaVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, now);
    filter.Q.setValueAtTime(2.5, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel, now + 0.003);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, now);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    oscs.push(osc);
    gains.push(g);
  }

  // Plucked Strings / Harp
  private buildPluckVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: OscillatorNode[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4.0, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.4);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel, now + 0.004);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.85, now);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    oscs.push(osc);
    gains.push(g);
  }
}
