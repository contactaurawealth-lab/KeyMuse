import { describe, it, expect, beforeEach } from 'vitest';
import { installMockAudioContext, MockAudioContext } from './testAudioContext';
import { AudioEngine } from './AudioEngine';
import { AudioRecorder } from './AudioRecorder';
import { MidiEngine, MidiNoteEvent } from './MidiEngine';

describe('AudioRecorder and Loop Station DSP', () => {
  beforeEach(() => {
    installMockAudioContext();
  });

  it('encodes an AudioBuffer into a compliant 16-bit PCM RIFF WAV Blob', async () => {
    const ctx = new MockAudioContext();
    const sampleRate = 44100;
    const durationSec = 0.5;
    const numSamples = Math.floor(sampleRate * durationSec);
    const audioBuffer = ctx.createBuffer(2, numSamples, sampleRate);

    // Fill buffer with a simple sine test signal
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    for (let i = 0; i < numSamples; i++) {
      left[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
      right[i] = Math.sin((2 * Math.PI * 880 * i) / sampleRate);
    }

    const wavBuffer = AudioRecorder.encodeWavBuffer(audioBuffer as unknown as AudioBuffer);

    expect(wavBuffer).toBeDefined();

    // Expected size: 44 bytes header + (numSamples * 2 channels * 2 bytes/sample)
    const expectedSize = 44 + numSamples * 2 * 2;
    expect(wavBuffer.byteLength).toBe(expectedSize);

    // Verify RIFF and WAVE magic headers in binary array
    const view = new DataView(wavBuffer);

    // RIFF check (ASCII: 0x52, 0x49, 0x46, 0x46)
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    expect(riff).toBe('RIFF');

    // WAVE check (ASCII: 0x57, 0x41, 0x56, 0x45)
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    expect(wave).toBe('WAVE');

    // PCM format check (AudioFormat === 1)
    expect(view.getUint16(20, true)).toBe(1);

    // Channel count (2)
    expect(view.getUint16(22, true)).toBe(2);

    // Sample rate (44100)
    expect(view.getUint32(24, true)).toBe(44100);

    // Bit depth (16 bits)
    expect(view.getUint16(34, true)).toBe(16);

    // 'data' chunk marker
    const dataMarker = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
    expect(dataMarker).toBe('data');

    // Also verify encodeWav creates a Blob
    const wavBlob = AudioRecorder.encodeWav(audioBuffer as unknown as AudioBuffer);
    expect(wavBlob).toBeDefined();
    expect(wavBlob.type).toBe('audio/wav');
  });

  it('generates a valid Standard MIDI File (SMF Type 0) binary Blob', () => {
    const events: MidiNoteEvent[] = [
      { note: 'C4', midi: 60, velocity: 0.8, timeMs: 0, durationMs: 250 },
      { note: 'E4', midi: 64, velocity: 0.85, timeMs: 250, durationMs: 250 },
      { note: 'G4', midi: 67, velocity: 0.9, timeMs: 500, durationMs: 500 }
    ];

    const bytes = MidiEngine.createStandardMidiBytes(events, 120);

    expect(bytes).toBeDefined();
    expect(bytes.length).toBeGreaterThan(20);

    // Header Chunk 'MThd'
    const headerStr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    expect(headerStr).toBe('MThd');

    // Track Chunk 'MTrk' starts at offset 14
    const trackStr = String.fromCharCode(bytes[14], bytes[15], bytes[16], bytes[17]);
    expect(trackStr).toBe('MTrk');

    // File ends with End of Track meta event: 0xFF 0x2F 0x00
    const len = bytes.length;
    expect(bytes[len - 3]).toBe(0xff);
    expect(bytes[len - 2]).toBe(0x2f);
    expect(bytes[len - 1]).toBe(0x00);

    // Also verify createStandardMidiFile creates a Blob
    const midiBlob = MidiEngine.createStandardMidiFile(events, 120);
    expect(midiBlob).toBeDefined();
    expect(midiBlob.type).toBe('audio/midi');
  });

  it('manages AudioRecorder recorder instance lifecycle', () => {
    const engine = AudioEngine.getInstance();
    const recorder = new AudioRecorder(engine);

    expect(recorder.isRecording).toBe(false);
  });
});
