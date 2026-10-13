export type AudioEngineStatus = 'uninitialized' | 'suspended' | 'running' | 'interrupted';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public masterLimiter: DynamicsCompressorNode | null = null;
  public masterAnalyser: AnalyserNode | null = null;
  public recordStreamDestination: MediaStreamAudioDestinationNode | null = null;
  public status: AudioEngineStatus = 'uninitialized';
  private listeners: Set<(status: AudioEngineStatus) => void> = new Set();

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes the AudioContext upon first user interaction
   */
  public init(): AudioContext {
    if (this.ctx) {
      return this.ctx;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }

    this.ctx = new AudioContextClass({
      latencyHint: 'interactive'
    });

    // Master Limiter to prevent clipping distortion
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-2.0, this.ctx.currentTime); // -2dB
    this.masterLimiter.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(12.0, this.ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime); // 3ms attack
    this.masterLimiter.release.setValueAtTime(0.15, this.ctx.currentTime); // 150ms release

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Master Analyser
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Recording Stream Destination Node (captures live output for MediaRecorder)
    this.recordStreamDestination = this.ctx.createMediaStreamDestination();

    // Routing Graph:
    // masterGain -> masterLimiter -> masterAnalyser -> [ctx.destination, recordStreamDestination]
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
    this.masterAnalyser.connect(this.recordStreamDestination);

    this.status = this.ctx.state as AudioEngineStatus;
    this.ctx.onstatechange = () => {
      if (this.ctx) {
        this.status = this.ctx.state as AudioEngineStatus;
        this.notifyListeners();
      }
    };

    this.notifyListeners();
    return this.ctx;
  }

  /**
   * Resumes AudioContext on explicit user gesture
   */
  public async ensureRunning(): Promise<boolean> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.status = 'running';
        this.notifyListeners();
        return true;
      } catch (err) {
        console.error('Failed to resume AudioContext:', err);
        return false;
      }
    }
    return this.ctx?.state === 'running';
  }

  public setMasterVolume(volume: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1.0, volume));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  public subscribeStatus(listener: (status: AudioEngineStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.status));
  }
}
