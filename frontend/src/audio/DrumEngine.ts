import { DrumSound } from '../types';
import { AudioEngine } from './AudioEngine';

export class DrumEngine {
  private audioEngine: AudioEngine;
  public outputNode: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  public initOutput(destination: AudioNode) {
    const ctx = this.audioEngine.init();
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(0.9, ctx.currentTime);
    this.outputNode.connect(destination);
    this.generateNoiseBuffer(ctx);
  }

  private generateNoiseBuffer(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds white noise
    this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Triggers a drum sound immediately
   */
  public trigger(sound: DrumSound, velocity: number = 0.8) {
    const ctx = this.audioEngine.init();
    this.schedule(sound, ctx.currentTime, velocity);
  }

  /**
   * Schedules a drum sound at a precise Web Audio clock time
   */
  public schedule(sound: DrumSound, time: number, velocity: number = 0.8) {
    const ctx = this.audioEngine.init();
    if (!this.outputNode) {
      this.initOutput(this.audioEngine.masterGain || ctx.destination);
    }
    if (!this.noiseBuffer) {
      this.generateNoiseBuffer(ctx);
    }

    switch (sound) {
      case 'kick':
        this.playKick(ctx, time, velocity);
        break;
      case 'snare':
        this.playSnare(ctx, time, velocity);
        break;
      case 'hihat_closed':
        this.playHiHat(ctx, time, velocity, 0.05);
        break;
      case 'hihat_open':
        this.playHiHat(ctx, time, velocity, 0.35);
        break;
      case 'clap':
        this.playClap(ctx, time, velocity);
        break;
      case 'tom':
        this.playTom(ctx, time, velocity);
        break;
      case 'perc':
        this.playPerc(ctx, time, velocity);
        break;
    }
  }

  private playKick(ctx: AudioContext, time: number, velocity: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch sweep: 150Hz -> 38Hz
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

    // Amplitude envelope
    gain.gain.setValueAtTime(velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.outputNode!);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  private playSnare(ctx: AudioContext, time: number, velocity: number) {
    // 1. Noise transient
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, time);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.outputNode!);

    // 2. Body tonal oscillator
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(velocity * 0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.outputNode!);

    noiseSource.start(time);
    noiseSource.stop(time + 0.23);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playHiHat(ctx: AudioContext, time: number, velocity: number, decay: number) {
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7500, time);
    filter.Q.setValueAtTime(3.0, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode!);

    noiseSource.start(time);
    noiseSource.stop(time + decay + 0.01);
  }

  private playClap(ctx: AudioContext, time: number, velocity: number) {
    // Triple clap transient burst
    [0, 0.012, 0.024].forEach((offset, idx) => {
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, time + offset);
      filter.Q.setValueAtTime(1.5, time + offset);

      const gain = ctx.createGain();
      const burstVol = idx === 2 ? velocity * 0.9 : velocity * 0.45;
      gain.gain.setValueAtTime(burstVol, time + offset);
      const burstDecay = idx === 2 ? 0.25 : 0.025;
      gain.gain.exponentialRampToValueAtTime(0.0001, time + offset + burstDecay);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.outputNode!);

      noiseSource.start(time + offset);
      noiseSource.stop(time + offset + burstDecay + 0.01);
    });
  }

  private playTom(ctx: AudioContext, time: number, velocity: number) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(65, time + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    osc.connect(gain);
    gain.connect(this.outputNode!);

    osc.start(time);
    osc.stop(time + 0.31);
  }

  private playPerc(ctx: AudioContext, time: number, velocity: number) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(450, time);
    osc.frequency.exponentialRampToValueAtTime(220, time + 0.06);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputNode!);

    osc.start(time);
    osc.stop(time + 0.09);
  }
}
