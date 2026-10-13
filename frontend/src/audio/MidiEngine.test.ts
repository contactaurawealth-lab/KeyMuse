import { describe, it, expect, vi } from 'vitest';
import { MidiEngine, MidiNoteEvent } from './MidiEngine';

describe('MidiEngine Web MIDI & Hardware Controller Integration', () => {
  it('instantiates with supported status and clean device list', () => {
    const engine = new MidiEngine();
    expect(Array.isArray(engine.devices)).toBe(true);
    expect(engine.devices.length).toBe(0);
    expect(engine.selectedDeviceId).toBe('');
  });

  it('translates incoming raw MIDI NoteOn and NoteOff messages into studio notes', () => {
    const engine = new MidiEngine();
    const noteOnSpy = vi.fn();
    const noteOffSpy = vi.fn();
    engine.onNoteOn = noteOnSpy;
    engine.onNoteOff = noteOffSpy;

    // Simulate NoteOn for Middle C (MIDI pitch 60 = C4, velocity 100)
    // Access private handleMidiMessage via any cast
    (engine as any).handleMidiMessage({
      data: new Uint8Array([0x90, 60, 100])
    });

    expect(noteOnSpy).toHaveBeenCalledTimes(1);
    expect(noteOnSpy).toHaveBeenCalledWith('C4', expect.closeTo(100 / 127, 2));

    // Simulate NoteOff for Middle C (status 0x80)
    (engine as any).handleMidiMessage({
      data: new Uint8Array([0x80, 60, 0])
    });

    expect(noteOffSpy).toHaveBeenCalledTimes(1);
    expect(noteOffSpy).toHaveBeenCalledWith('C4');

    // Simulate NoteOn with velocity 0 (standard MIDI convention for NoteOff)
    (engine as any).handleMidiMessage({
      data: new Uint8Array([0x90, 64, 0]) // E4
    });

    expect(noteOffSpy).toHaveBeenCalledTimes(2);
    expect(noteOffSpy).toHaveBeenLastCalledWith('E4');
  });

  it('generates compliant Type 0 SMF binary bytes with tempo meta event', () => {
    const events: MidiNoteEvent[] = [
      { note: 'A4', midi: 69, velocity: 0.9, timeMs: 0, durationMs: 500 }
    ];

    const bytes = MidiEngine.createStandardMidiBytes(events, 140);
    expect(bytes).toBeInstanceOf(Uint8Array);

    // MThd Header
    expect(bytes[0]).toBe(0x4d); // M
    expect(bytes[1]).toBe(0x54); // T
    expect(bytes[2]).toBe(0x68); // h
    expect(bytes[3]).toBe(0x64); // d

    // MTrk Track Chunk
    expect(bytes[14]).toBe(0x4d); // M
    expect(bytes[15]).toBe(0x54); // T
    expect(bytes[16]).toBe(0x72); // r
    expect(bytes[17]).toBe(0x6b); // k

    // Contains Tempo Meta event: 0xFF 0x51 0x03
    let foundTempo = false;
    for (let i = 18; i < bytes.length - 2; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0x51 && bytes[i + 2] === 0x03) {
        foundTempo = true;
        break;
      }
    }
    expect(foundTempo).toBe(true);
  });
});
