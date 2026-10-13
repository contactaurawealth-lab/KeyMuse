import { EffectsSettings } from '../types';
import { AudioEngine } from './AudioEngine';

export class EffectsChain {
  private audioEngine: AudioEngine;
  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;

  // Distortion nodes
  private waveShaper: WaveShaperNode | null = null;
  private distortionDryGain: GainNode | null = null;
  private distortionWetGain: GainNode | null = null;

  // Filter nodes
  private filterNode: BiquadFilterNode | null = null;

  // Delay nodes
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private delayDryGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Reverb nodes
  private convolver: ConvolverNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private reverbWetGain: GainNode | null = null;

  private settings: EffectsSettings;

  constructor(audioEngine: AudioEngine, initialSettings: EffectsSettings) {
    this.audioEngine = audioEngine;
    this.settings = { ...initialSettings };
  }

  public initGraph(destination: AudioNode): { input: GainNode; output: GainNode } {
    const ctx = this.audioEngine.init();

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();

    // 1. Distortion Stage
    this.waveShaper = ctx.createWaveShaper();
    this.waveShaper.oversample = '4x';
    this.distortionDryGain = ctx.createGain();
    this.distortionWetGain = ctx.createGain();
    this.updateDistortionCurve(this.settings.distortionDrive);

    // 2. Filter Stage
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = this.settings.filterType;
    this.filterNode.frequency.setValueAtTime(this.settings.filterCutoff, ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.5, ctx.currentTime);

    // 3. Delay Stage
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(this.settings.delayTime, ctx.currentTime);
    this.delayFeedbackGain = ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(this.settings.delayFeedback, ctx.currentTime);
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(3500, ctx.currentTime); // Damp high frequencies in delay echoes
    this.delayDryGain = ctx.createGain();
    this.delayWetGain = ctx.createGain();

    // Feedback loop: delay -> delayFilter -> feedbackGain -> delay
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);

    // 4. Reverb Stage
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.generateImpulseResponse(ctx, this.settings.reverbDecay);
    this.reverbDryGain = ctx.createGain();
    this.reverbWetGain = ctx.createGain();

    // Graph Construction:
    // Input -> [Distortion Dry/Wet] -> Filter -> [Delay Dry/Wet] -> [Reverb Dry/Wet] -> Output

    // Stage 1: Distortion
    const distMixBus = ctx.createGain();
    this.inputNode.connect(this.distortionDryGain);
    this.distortionDryGain.connect(distMixBus);
    this.inputNode.connect(this.waveShaper);
    this.waveShaper.connect(this.distortionWetGain);
    this.distortionWetGain.connect(distMixBus);

    // Stage 2: Filter
    const filterMixBus = ctx.createGain();
    distMixBus.connect(this.filterNode);
    this.filterNode.connect(filterMixBus);

    // Stage 3: Delay
    const delayMixBus = ctx.createGain();
    filterMixBus.connect(this.delayDryGain);
    this.delayDryGain.connect(delayMixBus);
    filterMixBus.connect(this.delayNode);
    this.delayFilter.connect(this.delayWetGain);
    this.delayWetGain.connect(delayMixBus);

    // Stage 4: Reverb
    delayMixBus.connect(this.reverbDryGain);
    this.reverbDryGain.connect(this.outputNode);
    delayMixBus.connect(this.convolver);
    this.convolver.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.outputNode);

    // Connect to external destination (Master Limiter)
    this.outputNode.connect(destination);

    this.applySettings(this.settings);

    return { input: this.inputNode, output: this.outputNode };
  }

  public applySettings(s: Partial<EffectsSettings>) {
    this.settings = { ...this.settings, ...s };
    if (!this.audioEngine.ctx) return;
    const now = this.audioEngine.ctx.currentTime;

    // Distortion
    if (this.distortionDryGain && this.distortionWetGain) {
      if (this.settings.distortionBypass) {
        this.distortionDryGain.gain.setTargetAtTime(1.0, now, 0.02);
        this.distortionWetGain.gain.setTargetAtTime(0.0, now, 0.02);
      } else {
        this.distortionDryGain.gain.setTargetAtTime(1.0 - this.settings.distortionWet, now, 0.02);
        this.distortionWetGain.gain.setTargetAtTime(this.settings.distortionWet, now, 0.02);
      }
    }
    if (s.distortionDrive !== undefined) {
      this.updateDistortionCurve(this.settings.distortionDrive);
    }

    // Filter
    if (this.filterNode) {
      if (this.settings.filterBypass) {
        this.filterNode.frequency.setTargetAtTime(20000, now, 0.02);
      } else {
        this.filterNode.type = this.settings.filterType;
        this.filterNode.frequency.setTargetAtTime(this.settings.filterCutoff, now, 0.02);
      }
    }

    // Delay
    if (this.delayNode && this.delayFeedbackGain && this.delayDryGain && this.delayWetGain) {
      this.delayNode.delayTime.setTargetAtTime(this.settings.delayTime, now, 0.02);
      this.delayFeedbackGain.gain.setTargetAtTime(this.settings.delayFeedback, now, 0.02);

      if (this.settings.delayBypass) {
        this.delayDryGain.gain.setTargetAtTime(1.0, now, 0.02);
        this.delayWetGain.gain.setTargetAtTime(0.0, now, 0.02);
      } else {
        this.delayDryGain.gain.setTargetAtTime(1.0 - this.settings.delayWet * 0.5, now, 0.02);
        this.delayWetGain.gain.setTargetAtTime(this.settings.delayWet, now, 0.02);
      }
    }

    // Reverb
    if (this.reverbDryGain && this.reverbWetGain) {
      if (this.settings.reverbBypass) {
        this.reverbDryGain.gain.setTargetAtTime(1.0, now, 0.02);
        this.reverbWetGain.gain.setTargetAtTime(0.0, now, 0.02);
      } else {
        this.reverbDryGain.gain.setTargetAtTime(1.0 - this.settings.reverbWet * 0.4, now, 0.02);
        this.reverbWetGain.gain.setTargetAtTime(this.settings.reverbWet, now, 0.02);
      }
    }
    if (s.reverbDecay !== undefined && this.convolver && this.audioEngine.ctx) {
      this.convolver.buffer = this.generateImpulseResponse(this.audioEngine.ctx, this.settings.reverbDecay);
    }
  }

  private updateDistortionCurve(drive: number) {
    if (!this.waveShaper) return;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    const k = drive <= 0 ? 0 : drive;

    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    this.waveShaper.curve = curve;
  }

  private generateImpulseResponse(ctx: AudioContext, duration: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * duration));
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const decay = Math.exp(-n * (4.0 / duration));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    return impulse;
  }
}
