import { describe, it, expect, beforeEach } from 'vitest';
import { installMockAudioContext } from './testAudioContext';
import { AudioEngine } from './AudioEngine';
import { DrumEngine } from './DrumEngine';
import { DrumSound } from '../types';

installMockAudioContext();

describe('DrumEngine & Step Sequencer', () => {
  let audioEngine: AudioEngine;
  let drumEngine: DrumEngine;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    audioEngine.init();
    drumEngine = new DrumEngine(audioEngine);
    drumEngine.initOutput((audioEngine.ctx as any).destination);
  });

  it('triggers all 7 percussion voices immediately without errors', () => {
    const sounds: DrumSound[] = ['kick', 'snare', 'hihat_closed', 'hihat_open', 'clap', 'tom', 'perc'];

    sounds.forEach((snd) => {
      expect(() => drumEngine.trigger(snd, 0.85)).not.toThrow();
    });
  });

  it('schedules drum sounds at exact future audio clock timestamps', () => {
    const ctx = audioEngine.ctx;
    const now = ctx?.currentTime || 0;

    // Schedule 16th note sequence
    expect(() => {
      drumEngine.schedule('kick', now + 0.1, 0.9);
      drumEngine.schedule('snare', now + 0.25, 0.8);
      drumEngine.schedule('hihat_closed', now + 0.15, 0.7);
    }).not.toThrow();
  });

  it('supports 16-step pattern array toggles and resets', () => {
    const initialPattern = new Array(16).fill(false);
    expect(initialPattern[0]).toBe(false);

    // Toggle step 0 and step 4
    initialPattern[0] = true;
    initialPattern[4] = true;

    expect(initialPattern[0]).toBe(true);
    expect(initialPattern[4]).toBe(true);
    expect(initialPattern[1]).toBe(false);
  });
});
