import { describe, it, expect, beforeEach } from 'vitest';
import { installMockAudioContext } from './testAudioContext';
import { AudioEngine } from './AudioEngine';
import { SampleEngine } from './SampleEngine';
import { INSTRUMENTS } from '../constants/instruments';

installMockAudioContext();

describe('SampleEngine Multi-Instrument Synthesis', () => {
  let audioEngine: AudioEngine;
  let sampleEngine: SampleEngine;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    audioEngine.init();
    sampleEngine = new SampleEngine(audioEngine);
    sampleEngine.initOutput((audioEngine.ctx as any).destination);
  });

  it('contains all 12 distinct instrument configurations', () => {
    expect(INSTRUMENTS).toHaveLength(12);
    const instrumentIds = INSTRUMENTS.map((i) => i.id);

    expect(instrumentIds).toContain('piano');
    expect(instrumentIds).toContain('electric_piano');
    expect(instrumentIds).toContain('organ');
    expect(instrumentIds).toContain('synth_lead');
    expect(instrumentIds).toContain('synth_bass');
    expect(instrumentIds).toContain('ambient_pad');
    expect(instrumentIds).toContain('plucked_strings');
    expect(instrumentIds).toContain('guitar');
    expect(instrumentIds).toContain('violin');
    expect(instrumentIds).toContain('flute');
    expect(instrumentIds).toContain('marimba');
    expect(instrumentIds).toContain('drum_kit');
  });

  it('successfully triggers acoustic and synthesized notes for each instrument', () => {
    INSTRUMENTS.forEach((inst) => {
      sampleEngine.setInstrument(inst.id);
      expect(sampleEngine.currentInstrument).toBe(inst.id);

      const voiceId = sampleEngine.noteOn('C4', 0.8);
      expect(voiceId).toBeDefined();

      sampleEngine.noteOff('C4');
    });

    sampleEngine.stopAllNotes();
  });

  it('handles octave and transpose pitch offsets', () => {
    sampleEngine.setInstrument('piano');
    const normalVoice = sampleEngine.noteOn('C4', 0.8, 0, 0);
    const octaveUpVoice = sampleEngine.noteOn('C4', 0.8, 1, 0);
    const transposedVoice = sampleEngine.noteOn('C4', 0.8, 0, 5);

    expect(normalVoice).toBeDefined();
    expect(octaveUpVoice).toBeDefined();
    expect(transposedVoice).toBeDefined();

    sampleEngine.stopAllNotes();
  });
});
