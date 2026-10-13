import { describe, it, expect } from 'vitest';
import { CHORDS } from '../constants/chords';
import { SCALES } from '../constants/scales';
import { buildChordNotes, getScaleNoteNames, quantizeNoteToScale } from '../audio/MusicTheory';

describe('Musical Intelligence & Harmony Engine', () => {
  it('accurately constructs harmonic intervals for all chord formulas', () => {
    // Major triad: [0, 4, 7]
    expect(CHORDS.major.intervals).toEqual([0, 4, 7]);
    // Minor triad: [0, 3, 7]
    expect(CHORDS.minor.intervals).toEqual([0, 3, 7]);
    // Diminished: [0, 3, 6]
    expect(CHORDS.diminished.intervals).toEqual([0, 3, 6]);
    // Augmented: [0, 4, 8]
    expect(CHORDS.augmented.intervals).toEqual([0, 4, 8]);
    // Maj7: [0, 4, 7, 11]
    expect(CHORDS.maj7.intervals).toEqual([0, 4, 7, 11]);
    // Min7: [0, 3, 7, 10]
    expect(CHORDS.min7.intervals).toEqual([0, 3, 7, 10]);
    // Dom7: [0, 4, 7, 10]
    expect(CHORDS.dom7.intervals).toEqual([0, 4, 7, 10]);
    // Sus2: [0, 2, 7]
    expect(CHORDS.sus2.intervals).toEqual([0, 2, 7]);
    // Sus4: [0, 5, 7]
    expect(CHORDS.sus4.intervals).toEqual([0, 5, 7]);
  });

  it('correctly calculates chords in multiple root keys', () => {
    // A Minor: A4, C5, E5
    expect(buildChordNotes('A4', 'minor')).toEqual(['A4', 'C5', 'E5']);
    // G Dominant 7: G4, B4, D5, F5
    expect(buildChordNotes('G4', 'dom7')).toEqual(['G4', 'B4', 'D5', 'F5']);
    // D Suspended 4: D4, G4, A4
    expect(buildChordNotes('D4', 'sus4')).toEqual(['D4', 'G4', 'A4']);
  });

  it('validates scale intervals and note names for non-diatonic scales', () => {
    // Blues scale: root, min3, 4th, dim5, 5th, min7
    expect(SCALES.blues.intervals).toEqual([0, 3, 5, 6, 7, 10]);
    const aBlues = getScaleNoteNames('A', 'blues');
    expect(aBlues).toEqual(['A', 'C', 'D', 'D#', 'E', 'G']);

    // Harmonic minor: [0, 2, 3, 5, 7, 8, 11]
    expect(SCALES.harmonic_minor.intervals).toEqual([0, 2, 3, 5, 7, 8, 11]);
    const aHarmonicMinor = getScaleNoteNames('A', 'harmonic_minor');
    expect(aHarmonicMinor).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
  });

  it('snaps out-of-scale notes to the nearest in-scale note under scale lock', () => {
    // In A Minor, G#4 should snap to G4 or A4
    const snapped = quantizeNoteToScale('G#4', 'A', 'minor');
    expect(['G4', 'A4']).toContain(snapped);

    // In C Major Pentatonic (C, D, E, G, A), F4 should snap to E4 or G4
    const snappedPent = quantizeNoteToScale('F4', 'C', 'pentatonic_major');
    expect(['E4', 'G4']).toContain(snappedPent);
  });
});
