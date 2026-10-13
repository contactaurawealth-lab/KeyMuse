/**
 * Web Audio API mock for test environments (JSDOM / Node.js)
 */
export class MockAudioParam {
  public value: number = 0;
  setValueAtTime(val: number, _time: number) { this.value = val; return this; }
  exponentialRampToValueAtTime(val: number, _time: number) { this.value = val; return this; }
  linearRampToValueAtTime(val: number, _time: number) { this.value = val; return this; }
  setTargetAtTime(val: number, _time: number, _constant: number) { this.value = val; return this; }
  cancelScheduledValues(_time: number) { return this; }
}

export class MockAudioNode {
  public connectedTo: any[] = [];
  connect(dest: any) { this.connectedTo.push(dest); return dest; }
  disconnect() { this.connectedTo = []; }
}

export class MockGainNode extends MockAudioNode {
  public gain = new MockAudioParam();
}

export class MockOscillatorNode extends MockAudioNode {
  public frequency = new MockAudioParam();
  public detune = new MockAudioParam();
  public type: OscillatorType = 'sine';
  start(_time?: number) {}
  stop(_time?: number) {}
}

export class MockBiquadFilterNode extends MockAudioNode {
  public frequency = new MockAudioParam();
  public Q = new MockAudioParam();
  public type: BiquadFilterType = 'lowpass';
}

export class MockDynamicsCompressorNode extends MockAudioNode {
  public threshold = new MockAudioParam();
  public knee = new MockAudioParam();
  public ratio = new MockAudioParam();
  public attack = new MockAudioParam();
  public release = new MockAudioParam();
}

export class MockBufferSourceNode extends MockAudioNode {
  public buffer: any = null;
  public loop = false;
  start(_time?: number) {}
  stop(_time?: number) {}
}

export class MockDelayNode extends MockAudioNode {
  public delayTime = new MockAudioParam();
}

export class MockConvolverNode extends MockAudioNode {
  public buffer: any = null;
}

export class MockWaveShaperNode extends MockAudioNode {
  public curve: Float32Array | null = null;
  public oversample: OverSampleType = 'none';
}

export class MockAnalyserNode extends MockAudioNode {
  public fftSize = 256;
  public smoothingTimeConstant = 0.8;
  getByteFrequencyData(arr: Uint8Array) { arr.fill(128); }
  getByteTimeDomainData(arr: Uint8Array) { arr.fill(128); }
}

export class MockAudioContext {
  public currentTime: number = 0;
  public state: AudioContextState = 'suspended';
  public sampleRate: number = 44100;
  public destination = new MockAudioNode();
  public onstatechange: (() => void) | null = null;

  resume() {
    this.state = 'running';
    if (this.onstatechange) this.onstatechange();
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    if (this.onstatechange) this.onstatechange();
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    if (this.onstatechange) this.onstatechange();
    return Promise.resolve();
  }

  createGain() { return new MockGainNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createDynamicsCompressor() { return new MockDynamicsCompressorNode(); }
  createAnalyser() { return new MockAnalyserNode(); }
  createDelay() { return new MockDelayNode(); }
  createConvolver() { return new MockConvolverNode(); }
  createWaveShaper() { return new MockWaveShaperNode(); }
  createBufferSource() { return new MockBufferSourceNode(); }

  createBuffer(channels: number, length: number, sampleRate: number) {
    const channelData = new Float32Array(length);
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (_c: number) => channelData
    };
  }

  createMediaStreamDestination() {
    return {
      ...new MockAudioNode(),
      stream: {} as MediaStream
    };
  }
}

export function installMockAudioContext() {
  (globalThis as any).AudioContext = MockAudioContext;
  (globalThis as any).webkitAudioContext = MockAudioContext;
}
