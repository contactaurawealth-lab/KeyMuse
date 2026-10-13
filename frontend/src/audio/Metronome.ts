import { AudioEngine } from './AudioEngine';

export class Metronome {
  private audioEngine: AudioEngine;
  private isRunning: boolean = false;
  private bpm: number = 120;
  private current16thNote: number = 0; // 0 to 15
  private nextNoteTime: number = 0.0;
  private timerId: number | null = null;
  private lookaheadMs: number = 25.0; // How frequently to call scheduling function
  private scheduleAheadSec: number = 0.1; // How far ahead to schedule audio (sec)

  public isMuted: boolean = false;
  public onStepCallback: ((stepIndex: number, time: number) => void) | null = null;

  constructor(audioEngine: AudioEngine, initialBpm: number = 120) {
    this.audioEngine = audioEngine;
    this.bpm = initialBpm;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(30, Math.min(300, newBpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public start() {
    if (this.isRunning) return;
    const ctx = this.audioEngine.init();

    this.isRunning = true;
    this.current16thNote = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.scheduler();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.current16thNote = 0;
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private nextNote() {
    // 60.0 / bpm = length of a quarter note
    // 0.25 * (60.0 / bpm) = length of a 16th note
    const secondsPer16th = 0.25 * (60.0 / this.bpm);
    this.nextNoteTime += secondsPer16th;
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  private scheduler() {
    if (!this.isRunning) return;
    const ctx = this.audioEngine.ctx;
    if (!ctx) return;

    // While there are notes that will need to play before the next interval, schedule them
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }

    this.timerId = window.setTimeout(() => this.scheduler(), this.lookaheadMs);
  }

  private scheduleNote(beatNumber: number, time: number) {
    // Trigger external sequencer step listeners
    if (this.onStepCallback) {
      this.onStepCallback(beatNumber, time);
    }

    // Play metronome click on quarter beats (beat 0, 4, 8, 12)
    if (!this.isMuted && beatNumber % 4 === 0) {
      const ctx = this.audioEngine.ctx;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Downbeat (beat 0) has a higher pitch (1200Hz) vs other quarter notes (800Hz)
      const freq = beatNumber === 0 ? 1200 : 800;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

      osc.connect(gain);
      gain.connect(this.audioEngine.masterGain || ctx.destination);

      osc.start(time);
      osc.stop(time + 0.05);
    }
  }
}
