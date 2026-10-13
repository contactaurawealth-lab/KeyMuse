import { ROOT_NOTES, SCALES } from '../constants/scales';
import { CHORDS } from '../constants/chords';
import { ChordType, ScaleType } from '../types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Parses note string into note name and octave number, e.g. "C#4" -> { noteName: "C#", octave: 4 }
 */
export function parseNote(noteStr: string): { noteName: string; octave: number } | null {
  if (!noteStr) return null;
  const match = noteStr.trim().match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return null;

  let noteName = match[1].toUpperCase();
  // Normalize flats to sharps
  if (noteName === 'DB') noteName = 'C#';
  else if (noteName === 'EB') noteName = 'D#';
  else if (noteName === 'GB') noteName = 'F#';
  else if (noteName === 'AB') noteName = 'G#';
  else if (noteName === 'BB') noteName = 'A#';

  const octave = parseInt(match[2], 10);
  return { noteName, octave };
}

/**
 * Calculates standard MIDI note number (C4 = 60, A4 = 69)
 */
export function noteToMidi(noteStr: string): number {
  const parsed = parseNote(noteStr);
  if (!parsed) return 60; // Default C4

  const noteIndex = NOTE_NAMES.indexOf(parsed.noteName as any);
  if (noteIndex === -1) return 60;

  return (parsed.octave + 1) * 12 + noteIndex;
}

/**
 * Converts MIDI note number back to note string (e.g. 60 -> "C4")
 */
export function midiToNote(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Converts note string with optional octave and transpose offsets to audio frequency in Hz
 * A4 = 440 Hz standard concert pitch
 */
export function noteToFrequency(
  noteStr: string,
  octaveOffset: number = 0,
  transposeSemitones: number = 0
): number {
  let midi = noteToMidi(noteStr);
  midi += octaveOffset * 12 + transposeSemitones;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Builds note string array for a chord starting from root note
 */
export function buildChordNotes(rootNoteStr: string, chordType: ChordType): string[] {
  const chordDef = CHORDS[chordType];
  if (!chordDef || chordType === 'single') {
    return [rootNoteStr];
  }

  const baseMidi = noteToMidi(rootNoteStr);
  return chordDef.intervals.map((interval) => midiToNote(baseMidi + interval));
}

/**
 * Returns note names (without octave) in the given scale and root
 */
export function getScaleNoteNames(rootNote: string, scaleType: ScaleType): string[] {
  const scaleDef = SCALES[scaleType] || SCALES.major;
  const rootIndex = NOTE_NAMES.indexOf(rootNote as any);
  if (rootIndex === -1) return [...NOTE_NAMES];

  return scaleDef.intervals.map((interval) => {
    const idx = (rootIndex + interval) % 12;
    return NOTE_NAMES[idx];
  });
}

/**
 * Checks if a note is in the specified scale
 */
export function isNoteInScale(noteStr: string, rootNote: string, scaleType: ScaleType): boolean {
  if (scaleType === 'chromatic') return true;
  const parsed = parseNote(noteStr);
  if (!parsed) return true;

  const validNotes = getScaleNoteNames(rootNote, scaleType);
  return validNotes.includes(parsed.noteName);
}

/**
 * Quantizes a note to the nearest note in scale if scaleLock is enabled
 */
export function quantizeNoteToScale(
  noteStr: string,
  rootNote: string,
  scaleType: ScaleType
): string {
  if (scaleType === 'chromatic') return noteStr;
  const parsed = parseNote(noteStr);
  if (!parsed) return noteStr;

  const validNoteNames = getScaleNoteNames(rootNote, scaleType);
  if (validNoteNames.includes(parsed.noteName)) {
    return noteStr;
  }

  const targetMidi = noteToMidi(noteStr);
  let bestMidi = targetMidi;
  let minDiff = 100;

  // Search within +/- 6 semitones for the closest note in the scale
  for (let offset = -6; offset <= 6; offset++) {
    const candidateMidi = targetMidi + offset;
    const candidateNote = midiToNote(candidateMidi);
    const candidateParsed = parseNote(candidateNote);
    if (candidateParsed && validNoteNames.includes(candidateParsed.noteName)) {
      const diff = Math.abs(offset);
      if (diff < minDiff) {
        minDiff = diff;
        bestMidi = candidateMidi;
      }
    }
  }

  return midiToNote(bestMidi);
}
