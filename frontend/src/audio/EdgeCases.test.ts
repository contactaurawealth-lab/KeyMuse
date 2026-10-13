import { describe, it, expect, beforeEach } from 'vitest';
import { installMockAudioContext, MockAudioContext } from './testAudioContext';
import { AudioEngine } from './AudioEngine';
import { SynthEngine } from './SynthEngine';
import { noteToFrequency, quantizeNoteToScale } from './MusicTheory';
import { AudioRecorder } from './AudioRecorder';
import { DEFAULT_EFFECTS } from '../context/AudioStateContext';
import { INSTRUMENTS } from '../constants/instruments';

describe('KeyMuse Studio QA Edge Cases & Resilience', () => {
  beforeEach(() => {
    installMockAudioContext();
  });

  it('handles extreme pitch transpose and octave shifts safely', () => {
    // Standard A4 = 440Hz
    const standardA4 = noteToFrequency('A4', 0, 0);
    expect(standardA4).toBeCloseTo(440, 1);

    // Extreme upper limit: Octave +3, Transpose +12 semitones
    const extremeHigh = noteToFrequency('B5', 3, 12);
    expect(extremeHigh).toBeGreaterThan(4000);
    expect(isFinite(extremeHigh)).toBe(true);

    // Extreme lower limit: Octave -3, Transpose -12 semitones
    const extremeLow = noteToFrequency('C2', -3, -12);
    expect(extremeLow).toBeGreaterThan(0);
    expect(isFinite(extremeLow)).toBe(true);
  });

  it('enforces 32-voice polyphony limit with oldest-voice stealing under extreme pressure', () => {
    const engine = AudioEngine.getInstance();
    const synth = new SynthEngine(engine, INSTRUMENTS[0].defaultSynth);
    const ctx = new MockAudioContext();
    synth.initOutput(ctx.createGain() as any);

    // Trigger 40 simultaneous distinct notes (exceeding 32 limit)
    for (let i = 0; i < 40; i++) {
      synth.noteOn(`N${i}`, 0.8);
    }

    // Voice count must be capped at 32
    expect(synth.getActiveVoiceCount()).toBeLessThanOrEqual(32);
    expect(synth.getActiveVoiceCount()).toBe(32);

    // Panic button must immediately purge all 32 voices
    synth.stopAllNotes();
    expect(synth.getActiveVoiceCount()).toBe(0);
  });

  it('quantizes chromatic pitches smoothly across scale boundaries', () => {
    // Under C Major, F# (66) should snap to F (65) or G (67)
    const snapped = quantizeNoteToScale('F#4', 'C', 'major');
    expect(['F4', 'G4']).toContain(snapped);

    // Under Chromatic, notes remain unchanged
    const chromatic = quantizeNoteToScale('D#3', 'C', 'chromatic');
    expect(chromatic).toBe('D#3');
  });

  it('encodes ultra-short audio bursts into valid WAV buffers without header corruption', () => {
    const ctx = new MockAudioContext();
    const rate = 44100;
    // 10 samples (sub-millisecond burst)
    const audioBuffer = ctx.createBuffer(2, 10, rate);
    const wavBuffer = AudioRecorder.encodeWavBuffer(audioBuffer as unknown as AudioBuffer);

    expect(wavBuffer.byteLength).toBe(44 + 10 * 4); // 44 header + 40 data bytes

    const view = new DataView(wavBuffer);
    expect(view.getUint32(0, false)).toBe(0x52494646); // 'RIFF' in big-endian
    expect(view.getUint32(8, false)).toBe(0x57415645); // 'WAVE' in big-endian
    expect(view.getUint32(36, false)).toBe(0x64617461); // 'data' in big-endian
  });
});
