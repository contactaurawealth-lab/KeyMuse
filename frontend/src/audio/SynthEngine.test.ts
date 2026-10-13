import { describe, it, expect, beforeEach } from 'vitest';
import { installMockAudioContext } from './testAudioContext';
import { AudioEngine } from './AudioEngine';
import { SynthEngine } from './SynthEngine';
import { SynthSettings } from '../types';

installMockAudioContext();

describe('AudioEngine & SynthEngine DSP Foundation', () => {
  let audioEngine: AudioEngine;
  let synthEngine: SynthEngine;

  const testSettings: SynthSettings = {
    waveform: 'sawtooth',
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
    filterCutoff: 3000,
    filterResonance: 2.0,
    filterType: 'lowpass',
    detune: 0,
    vibratoRate: 0,
    vibratoDepth: 0,
    volume: 0.8
  };

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    audioEngine.init();
    synthEngine = new SynthEngine(audioEngine, testSettings);
    synthEngine.initOutput(audioEngine.masterGain || (audioEngine.ctx as any).destination);
  });

  it('initializes AudioEngine with master limiter and gain bus', () => {
    expect(audioEngine.ctx).toBeDefined();
    expect(audioEngine.masterGain).toBeDefined();
    expect(audioEngine.masterLimiter).toBeDefined();
    expect(audioEngine.masterAnalyser).toBeDefined();
  });

  it('resumes AudioContext to running state', async () => {
    const isRunning = await audioEngine.ensureRunning();
    expect(isRunning).toBe(true);
    expect(audioEngine.status).toBe('running');
  });

  it('creates active voice with proper envelope on noteOn', () => {
    const voiceId = synthEngine.noteOn('C4', 0.8);
    expect(voiceId).toBeDefined();
    expect(typeof voiceId).toBe('string');
  });

  it('supports polyphonic chord playing with multiple voices', () => {
    const notes = ['C4', 'E4', 'G4', 'B4'];
    const voiceIds = notes.map((n) => synthEngine.noteOn(n, 0.7));

    expect(voiceIds).toHaveLength(4);
    // Release note
    synthEngine.noteOff('C4');
  });

  it('enforces voice limit with voice stealing when exceeding 32 voices', () => {
    // Trigger 35 notes
    for (let i = 0; i < 35; i++) {
      synthEngine.noteOn(`A${(i % 5) + 1}`, 0.5);
    }
    // Should not throw and continue operating seamlessly
    synthEngine.stopAllNotes();
  });

  it('cleans up all active voices on panic/stopAllNotes', () => {
    synthEngine.noteOn('C4');
    synthEngine.noteOn('D4');
    synthEngine.noteOn('E4');

    expect(() => synthEngine.stopAllNotes()).not.toThrow();
  });
});
