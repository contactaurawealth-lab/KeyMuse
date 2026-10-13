import { describe, it, expect } from 'vitest';
import {
  parseNote,
  noteToMidi,
  midiToNote,
  noteToFrequency,
  buildChordNotes,
  getScaleNoteNames,
  isNoteInScale,
  quantizeNoteToScale
} from './MusicTheory';

describe('MusicTheory Engine', () => {
  it('correctly parses note strings', () => {
    expect(parseNote('C4')).toEqual({ noteName: 'C', octave: 4 });
    expect(parseNote('C#4')).toEqual({ noteName: 'C#', octave: 4 });
    expect(parseNote('Db4')).toEqual({ noteName: 'C#', octave: 4 });
    expect(parseNote('A0')).toEqual({ noteName: 'A', octave: 0 });
    expect(parseNote('invalid')).toBeNull();
  });

  it('correctly calculates MIDI note numbers and roundtrips', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C-1')).toBe(0);

    expect(midiToNote(60)).toBe('C4');
    expect(midiToNote(69)).toBe('A4');
  });

  it('calculates standard concert pitch frequencies accurately', () => {
    // A4 = 440 Hz standard
    expect(noteToFrequency('A4')).toBeCloseTo(440, 2);
    // A5 = 880 Hz
    expect(noteToFrequency('A5')).toBeCloseTo(880, 2);
    // A3 = 220 Hz
    expect(noteToFrequency('A3')).toBeCloseTo(220, 2);
    // Middle C4 = ~261.63 Hz
    expect(noteToFrequency('C4')).toBeCloseTo(261.63, 1);
    // Transpose +12 semitones equals 1 octave up
    expect(noteToFrequency('A4', 0, 12)).toBeCloseTo(880, 2);
    // Octave offset +1 equals 1 octave up
    expect(noteToFrequency('A4', 1, 0)).toBeCloseTo(880, 2);
  });

  it('builds chord note arrays for musical triads and 7ths', () => {
    // C Major: C4, E4, G4
    expect(buildChordNotes('C4', 'major')).toEqual(['C4', 'E4', 'G4']);
    // C Minor: C4, D#4, G4
    expect(buildChordNotes('C4', 'minor')).toEqual(['C4', 'D#4', 'G4']);
    // C Maj7: C4, E4, G4, B4
    expect(buildChordNotes('C4', 'maj7')).toEqual(['C4', 'E4', 'G4', 'B4']);
    // Single note
    expect(buildChordNotes('C4', 'single')).toEqual(['C4']);
  });

  it('correctly determines notes in scale', () => {
    const cMajor = getScaleNoteNames('C', 'major');
    expect(cMajor).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

    expect(isNoteInScale('C4', 'C', 'major')).toBe(true);
    expect(isNoteInScale('E4', 'C', 'major')).toBe(true);
    expect(isNoteInScale('C#4', 'C', 'major')).toBe(false);

    // Chromatic allows everything
    expect(isNoteInScale('C#4', 'C', 'chromatic')).toBe(true);
  });

  it('quantizes accidental notes to scale when scale lock is active', () => {
    // C#4 quantized in C Major should snap to C4 or D4
    const quantized = quantizeNoteToScale('C#4', 'C', 'major');
    expect(['C4', 'D4']).toContain(quantized);

    // Natural note in scale remains unchanged
    expect(quantizeNoteToScale('G4', 'C', 'major')).toBe('G4');
  });
});
