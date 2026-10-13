import { SynthSettings } from '../types';
import { AudioEngine } from './AudioEngine';
import { noteToFrequency } from './MusicTheory';

export interface ActiveVoice {
  id: string;
  note: string;
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  startTime: number;
  released: boolean;
}

export class SynthEngine {
  private audioEngine: AudioEngine;
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private maxPolyphony: number = 32;
  private settings: SynthSettings;
  public outputNode: GainNode | null = null;

  constructor(audioEngine: AudioEngine, initialSettings: SynthSettings) {
    this.audioEngine = audioEngine;
    this.settings = { ...initialSettings };
  }

  public initOutput(destination: AudioNode) {
    const ctx = this.audioEngine.init();
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(this.settings.volume, ctx.currentTime);
    this.outputNode.connect(destination);
  }

  public updateSettings(newSettings: Partial<SynthSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.outputNode && this.audioEngine.ctx && newSettings.volume !== undefined) {
      this.outputNode.gain.setTargetAtTime(newSettings.volume, this.audioEngine.ctx.currentTime, 0.02);
    }
  }

  /**
   * Triggers a musical note on
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
    const freq = noteToFrequency(note, octaveOffset, transposeSemitones);

    // Enforce polyphony limit with voice stealing
    if (this.activeVoices.size >= this.maxPolyphony) {
      this.stealOldestVoice();
    }

    // Create voice nodes
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = this.settings.waveform;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(this.settings.detune, now);

    // Setup filter
    filter.type = this.settings.filterType || 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 3, this.settings.filterCutoff), now);
    filter.Q.setValueAtTime(this.settings.filterResonance, now);

    // Setup vibrato LFO if configured
    let lfo: OscillatorNode | undefined;
    let lfoGain: GainNode | undefined;
    if (this.settings.vibratoRate > 0 && this.settings.vibratoDepth > 0) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(this.settings.vibratoRate, now);
      lfoGain.gain.setValueAtTime(this.settings.vibratoDepth, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start(now);
    }

    // Setup ADSR Envelope on Gain
    const env = this.settings.envelope;
    const attack = Math.max(0.003, env.attack);
    const decay = Math.max(0.01, env.decay);
    const sustainLevel = Math.max(0.0, Math.min(1.0, env.sustain * velocity));

    gain.gain.setValueAtTime(0.0001, now);
    // Attack phase: ramp from 0 to peak
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, velocity), now + attack);
    // Decay phase: ramp from peak to sustain level
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustainLevel), now + attack + decay);

    // Routing: osc -> filter -> gain -> outputNode
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode!);

    osc.start(now);

    const voiceId = `${note}_${Date.now()}_${Math.random()}`;
    const voice: ActiveVoice = {
      id: voiceId,
      note,
      osc,
      filter,
      gain,
      lfo,
      lfoGain,
      startTime: now,
      released: false
    };

    this.activeVoices.set(voiceId, voice);
    return voiceId;
  }

  /**
   * Releases note off for all active voices with the specified note name
   */
  public noteOff(note: string) {
    if (!this.audioEngine.ctx) return;
    const now = this.audioEngine.ctx.currentTime;
    const releaseTime = Math.max(0.01, this.settings.envelope.release);

    this.activeVoices.forEach((voice, id) => {
      if (voice.note === note && !voice.released) {
        this.releaseVoice(voice, id, now, releaseTime);
      }
    });
  }

  /**
   * Immediately stops and cleans up all active voices (panic/focus loss)
   */
  public stopAllNotes() {
    if (!this.audioEngine.ctx) return;
    const now = this.audioEngine.ctx.currentTime;

    this.activeVoices.forEach((voice, id) => {
      this.releaseVoice(voice, id, now, 0.01);
    });
  }

  private releaseVoice(voice: ActiveVoice, id: string, now: number, releaseTime: number) {
    voice.released = true;
    const gain = voice.gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(0.0001, gain.value), now);
    gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    // Stop and disconnect nodes after release
    setTimeout(() => {
      try {
        voice.osc.stop();
        if (voice.lfo) voice.lfo.stop();
        voice.osc.disconnect();
        voice.filter.disconnect();
        voice.gain.disconnect();
        if (voice.lfo) voice.lfo.disconnect();
        if (voice.lfoGain) voice.lfoGain.disconnect();
      } catch (e) {
        // Voice might already be disconnected
      }
      this.activeVoices.delete(id);
    }, (releaseTime + 0.05) * 1000);
  }

  private stealOldestVoice() {
    let oldestVoice: ActiveVoice | null = null;
    let oldestId = '';
    let earliestTime = Infinity;

    this.activeVoices.forEach((voice, id) => {
      if (!voice.released && voice.startTime < earliestTime) {
        earliestTime = voice.startTime;
        oldestVoice = voice;
        oldestId = id;
      }
    });

    if (oldestVoice && this.audioEngine.ctx) {
      this.releaseVoice(oldestVoice, oldestId, this.audioEngine.ctx.currentTime, 0.008);
    }
  }
}
