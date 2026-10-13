import { InstrumentType } from '../types';
import { AudioEngine } from './AudioEngine';
import { noteToFrequency } from './MusicTheory';
import { INSTRUMENTS } from '../constants/instruments';

export interface SampledNoteVoice {
  id: string;
  note: string;
  oscillators: (OscillatorNode | AudioBufferSourceNode)[];
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

  // --- Physical Acoustic Instrument Modeling ---

  // Acoustic Concert Grand Piano:
  // 1. Felt hammer strike mechanical transient impulse (velocity-scaled)
  // 2. 3-string unison chorus (center, -1.4c, +1.4c) for singing grand piano resonance
  // 3. Dynamic acoustic filter sweep (bright initial hammer attack rapidly damping to warm fundamental)
  // 4. Inharmonic partials with independent decay rates (higher harmonics fade rapidly, fundamental rings)
  // 5. Soundboard body resonance (low-mid acoustic wooden warmth)
  // 6. Pitch-dependent decay duration (bass sustain 5.5s, treble 1.2s)
  private buildPianoVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
    gains: GainNode[]
  ) {
    // 1. Dynamic acoustic filter: starts bright and open, rapidly decays to warm singing string
    filter.type = 'lowpass';
    const velBright = 0.5 + vel * 0.7;
    const initialCutoff = Math.min(14000, Math.max(1400, freq * 5.0 * velBright));
    const warmCutoff = Math.min(3200, Math.max(380, freq * 1.6));
    const sustainCutoff = Math.min(1800, Math.max(220, freq * 1.08));

    filter.frequency.setValueAtTime(initialCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(warmCutoff, now + 0.16);
    filter.frequency.exponentialRampToValueAtTime(sustainCutoff, now + 1.8);
    filter.Q.setValueAtTime(1.1, now);

    // 2. Pitch-dependent natural string decay duration
    // Bass notes sustain longer (up to 5.5s), treble notes decay faster (~1.2s)
    const pitchFactor = Math.max(0.4, Math.min(1.8, 1.0 - Math.log2(Math.max(27.5, freq) / 261.63) * 0.22));
    const totalDecayTime = Math.max(1.2, Math.min(6.0, 3.2 * pitchFactor));

    // Master volume envelope: sharp hammer strike attack (4ms), fast initial pluck drop, singing sustain decay
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, vel * 0.95), now + 0.004);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, vel * 0.55), now + 0.12);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0005, vel * 0.28), now + 0.8);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDecayTime);

    // 3. Hammer strike mechanical transient impulse (felt hammer knock)
    try {
      const hammerLen = Math.floor(ctx.sampleRate * 0.016); // 16ms
      const hammerBuf = ctx.createBuffer(1, hammerLen, ctx.sampleRate);
      const hammerData = hammerBuf.getChannelData(0);
      const knockFreq = Math.min(1800, Math.max(650, freq * 2.2));
      for (let i = 0; i < hammerLen; i++) {
        const t = i / ctx.sampleRate;
        const tone = Math.sin(2 * Math.PI * knockFreq * t);
        const noise = Math.random() * 2 - 1;
        const env = Math.exp(-t / 0.0035);
        hammerData[i] = (0.65 * tone + 0.35 * noise) * env;
      }
      const hammerSrc = ctx.createBufferSource();
      hammerSrc.buffer = hammerBuf;
      const hammerG = ctx.createGain();
      hammerG.gain.setValueAtTime(vel * 0.45, now);
      hammerSrc.connect(hammerG);
      hammerG.connect(filter);
      hammerSrc.start(now);
      oscs.push(hammerSrc);
      gains.push(hammerG);
    } catch (e) {
      // Fallback
    }

    // 4. 3-String Unison Fundamental (chorus / beating of real piano strings)
    const unisonStrings = [
      { detune: -1.4, vol: 0.38, type: 'triangle' as OscillatorType }, // Left string (warm body)
      { detune: 0.0, vol: 0.48, type: 'sine' as OscillatorType },     // Center string (fundamental)
      { detune: 1.4, vol: 0.38, type: 'sine' as OscillatorType }      // Right string (acoustic chorus)
    ];

    unisonStrings.forEach((s) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = s.type;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(s.detune, now);
      g.gain.setValueAtTime(s.vol, now);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      oscs.push(osc);
      gains.push(g);
    });

    // 5. Inharmonic Harmonic Partials with independent fast exponential damping
    const partials = [
      { mult: 2.001, vol: 0.30, decaySec: 1.4, type: 'sine' as OscillatorType },
      { mult: 3.003, vol: 0.18, decaySec: 0.75, type: 'triangle' as OscillatorType },
      { mult: 4.006, vol: 0.10, decaySec: 0.35, type: 'sine' as OscillatorType },
      { mult: 5.010, vol: 0.05, decaySec: 0.18, type: 'sine' as OscillatorType }
    ];

    partials.forEach((p) => {
      const pFreq = freq * p.mult;
      if (pFreq < ctx.sampleRate / 2) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = p.type;
        osc.frequency.setValueAtTime(pFreq, now);

        g.gain.setValueAtTime(p.vol, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.decaySec * pitchFactor);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        oscs.push(osc);
        gains.push(g);
      }
    });

    // 6. Soundboard Acoustic Body Resonance (warm wooden cabinet fullness)
    try {
      const bodyOsc = ctx.createOscillator();
      const bodyG = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime(Math.min(260, Math.max(140, freq * 0.5)), now);
      bodyG.gain.setValueAtTime(vel * 0.14, now);
      bodyG.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      bodyOsc.connect(bodyG);
      bodyG.connect(filter);
      bodyOsc.start(now);
      oscs.push(bodyOsc);
      gains.push(bodyG);
    } catch (e) {}
  }

  // Electric Piano (Rhodes / Wurlitzer): Pure sine fundamental + chime tines + warm tremolo
  private buildElectricPianoVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(8000, freq * 4.0), now);
    filter.frequency.exponentialRampToValueAtTime(Math.min(3000, freq * 2.0), now + 0.4);
    filter.Q.setValueAtTime(0.8, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.9, now + 0.008);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.45, now + 0.25);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.75, now);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.25, now);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(now);

    // Tine chime (pure metallic tine ring at 4x freq)
    const tine = ctx.createOscillator();
    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 4.0, now);
    const tineG = ctx.createGain();
    tineG.gain.setValueAtTime(vel * 0.35, now);
    tineG.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    tine.connect(tineG);
    tineG.connect(filter);
    tine.start(now);

    oscs.push(osc1, osc2, tine);
    gains.push(g1, g2, tineG);
  }

  // Tonewheel Organ (Hammond B3): Rich warm sine drawbars with chorus/vibrato
  private buildOrganVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(6500, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.85, now + 0.012);

    const drawbars = [
      { mult: 0.5, vol: 0.40, type: 'sine' as OscillatorType },
      { mult: 1.0, vol: 0.75, type: 'sine' as OscillatorType },
      { mult: 1.498, vol: 0.22, type: 'sine' as OscillatorType },
      { mult: 2.0, vol: 0.45, type: 'triangle' as OscillatorType },
      { mult: 2.996, vol: 0.25, type: 'sine' as OscillatorType },
      { mult: 4.0, vol: 0.15, type: 'sine' as OscillatorType }
    ];

    drawbars.forEach((d) => {
      const osc = ctx.createOscillator();
      osc.type = d.type;
      osc.frequency.setValueAtTime(freq * d.mult, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(d.vol, now);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      oscs.push(osc);
      gains.push(g);
    });

    // Rotary chorus / Leslie simulation
    const leslie = ctx.createOscillator();
    const leslieG = ctx.createGain();
    leslie.frequency.setValueAtTime(6.0, now);
    leslieG.gain.setValueAtTime(5.0, now);
    leslie.connect(leslieG);
    oscs.slice(0, 3).forEach((o) => {
      if ('detune' in o) {
        leslieG.connect((o as OscillatorNode).detune);
      }
    });
    leslie.start(now);
    oscs.push(leslie);
    gains.push(leslieG);
  }

  // Acoustic Guitar: Crisp pluck transient with warm resonant string decay
  private buildGuitarVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(9000, freq * 6.0), now);
    filter.frequency.exponentialRampToValueAtTime(Math.min(1800, freq * 1.8), now + 0.18);
    filter.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 1.1), now + 1.2);
    filter.Q.setValueAtTime(1.5, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.9, now + 0.004);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.45, now + 0.15);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.detune.setValueAtTime(-1.5, now);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.65, now);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(1.5, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.35, now);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(now);

    try {
      const pLen = Math.floor(ctx.sampleRate * 0.01);
      const pBuf = ctx.createBuffer(1, pLen, ctx.sampleRate);
      const pData = pBuf.getChannelData(0);
      for (let i = 0; i < pLen; i++) {
        pData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.002));
      }
      const pSrc = ctx.createBufferSource();
      pSrc.buffer = pBuf;
      const pG = ctx.createGain();
      pG.gain.setValueAtTime(vel * 0.5, now);
      pSrc.connect(pG);
      pG.connect(filter);
      pSrc.start(now);
      oscs.push(pSrc);
      gains.push(pG);
    } catch (e) {}

    oscs.push(osc1, osc2);
    gains.push(g1, g2);
  }

  // Solo Violin & Strings: Dual detuned strings, natural bowed envelope, warm formant filter, delayed vibrato
  private buildViolinVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
    gains: GainNode[]
  ) {
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.min(3200, Math.max(500, freq * 1.8)), now);
    filter.Q.setValueAtTime(1.8, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.85, now + 0.045);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.detune.setValueAtTime(-2.5, now);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.5, now);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(2.5, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.5, now);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(now);

    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.setValueAtTime(5.2, now);
    lfoG.gain.setValueAtTime(0.001, now);
    lfoG.gain.exponentialRampToValueAtTime(14, now + 0.25);
    lfo.connect(lfoG);
    lfoG.connect(osc1.detune);
    lfoG.connect(osc2.detune);
    lfo.start(now);

    oscs.push(osc1, osc2, lfo);
    gains.push(g1, g2, lfoG);
  }

  // Wooden Flute: Airy breathy tone + subtle vibrato
  private buildFluteVoice(
    ctx: AudioContext,
    now: number,
    freq: number,
    vel: number,
    masterGain: GainNode,
    filter: BiquadFilterNode,
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
    gains: GainNode[]
  ) {
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(vel * 0.9, now + 0.05);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

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
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
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
    oscs: (OscillatorNode | AudioBufferSourceNode)[],
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

