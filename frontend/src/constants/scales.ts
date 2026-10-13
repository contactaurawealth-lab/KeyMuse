import { ScaleType } from '../types';

export interface ScaleDefinition {
  id: ScaleType;
  name: string;
  intervals: number[]; // semitone offsets from root note
  description: string;
}

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const SCALES: Record<ScaleType, ScaleDefinition> = {
  chromatic: {
    id: 'chromatic',
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: 'All 12 semitones without constraint'
  },
  major: {
    id: 'major',
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'Bright, uplifting natural major scale'
  },
  minor: {
    id: 'minor',
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'Reflective, moody natural minor'
  },
  pentatonic_major: {
    id: 'pentatonic_major',
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    description: 'Harmonious five-note scale with no dissonances'
  },
  pentatonic_minor: {
    id: 'pentatonic_minor',
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    description: 'Classic rock, soul, and blues soloing scale'
  },
  blues: {
    id: 'blues',
    name: 'Blues Scale',
    intervals: [0, 3, 5, 6, 7, 10],
    description: 'Minor pentatonic with added diminished 5th blue note'
  },
  harmonic_minor: {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Exotic eastern flavor with natural 7th leading tone'
  },
  dorian: {
    id: 'dorian',
    name: 'Dorian Mode',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Minor mode with a raised 6th for jazz and funk'
  },
  custom: {
    id: 'custom',
    name: 'Custom User Scale',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'User-customized musical scale'
  }
};
