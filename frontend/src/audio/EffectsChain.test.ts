import { describe, it, expect, beforeEach } from 'vitest';
import { installMockAudioContext, MockAudioContext } from './testAudioContext';
import { AudioEngine } from './AudioEngine';
import { EffectsChain } from './EffectsChain';
import { DEFAULT_EFFECTS } from '../context/AudioStateContext';

describe('EffectsChain and Mixer DSP', () => {
  beforeEach(() => {
    installMockAudioContext();
  });

  it('initializes the full audio DSP effects graph', () => {
    const engine = AudioEngine.getInstance();
    const effects = new EffectsChain(engine, DEFAULT_EFFECTS);
    const ctx = new MockAudioContext();
    const destination = ctx.createGain();

    const graph = effects.initGraph(destination as unknown as AudioNode);

    expect(graph.input).toBeDefined();
    expect(graph.output).toBeDefined();
    expect(effects.inputNode).toBe(graph.input);
    expect(effects.outputNode).toBe(graph.output);
  });

  it('applies effect parameter updates and bypass toggles', () => {
    const engine = AudioEngine.getInstance();
    const effects = new EffectsChain(engine, DEFAULT_EFFECTS);
    const ctx = new MockAudioContext();
    const destination = ctx.createGain();

    effects.initGraph(destination as unknown as AudioNode);

    // Update Reverb settings
    effects.applySettings({
      reverbWet: 0.65,
      reverbDecay: 3.5,
      reverbBypass: false
    });

    // Update Delay settings
    effects.applySettings({
      delayTime: 0.5,
      delayFeedback: 0.6,
      delayWet: 0.4,
      delayBypass: false
    });

    // Update Filter settings
    effects.applySettings({
      filterType: 'highpass',
      filterCutoff: 1200,
      filterBypass: false
    });

    // Update Distortion settings
    effects.applySettings({
      distortionDrive: 25,
      distortionWet: 0.5,
      distortionBypass: false
    });

    // Toggle all to bypass mode
    effects.applySettings({
      reverbBypass: true,
      delayBypass: true,
      filterBypass: true,
      distortionBypass: true
    });

    expect(effects.outputNode).toBeDefined();
  });

  it('controls master volume with clamping on AudioEngine', () => {
    const engine = AudioEngine.getInstance();
    engine.init();

    engine.setMasterVolume(0.75);
    expect(engine.masterGain?.gain.value).toBe(0.75);

    // Volume clamps between 0.0 and 1.0
    engine.setMasterVolume(1.5);
    expect(engine.masterGain?.gain.value).toBe(1.0);

    engine.setMasterVolume(-0.2);
    expect(engine.masterGain?.gain.value).toBe(0.0);
  });
});
