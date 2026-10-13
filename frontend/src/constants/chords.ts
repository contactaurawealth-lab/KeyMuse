import { ChordType } from '../types';

export interface ChordDefinition {
  id: ChordType;
  name: string;
  intervals: number[]; // semitone offsets from root note
  symbol: string;
}

export const CHORDS: Record<ChordType, ChordDefinition> = {
  single: {
    id: 'single',
    name: 'Single Note',
    intervals: [0],
    symbol: ''
  },
  major: {
    id: 'major',
    name: 'Major Triad',
    intervals: [0, 4, 7],
    symbol: 'maj'
  },
  minor: {
    id: 'minor',
    name: 'Minor Triad',
    intervals: [0, 3, 7],
    symbol: 'min'
  },
  diminished: {
    id: 'diminished',
    name: 'Diminished Triad',
    intervals: [0, 3, 6],
    symbol: 'dim'
  },
  augmented: {
    id: 'augmented',
    name: 'Augmented Triad',
    intervals: [0, 4, 8],
    symbol: 'aug'
  },
  maj7: {
    id: 'maj7',
    name: 'Major 7th',
    intervals: [0, 4, 7, 11],
    symbol: 'maj7'
  },
  min7: {
    id: 'min7',
    name: 'Minor 7th',
    intervals: [0, 3, 7, 10],
    symbol: 'm7'
  },
  dom7: {
    id: 'dom7',
    name: 'Dominant 7th',
    intervals: [0, 4, 7, 10],
    symbol: '7'
  },
  sus2: {
    id: 'sus2',
    name: 'Suspended 2nd',
    intervals: [0, 2, 7],
    symbol: 'sus2'
  },
  sus4: {
    id: 'sus4',
    name: 'Suspended 4th',
    intervals: [0, 5, 7],
    symbol: 'sus4'
  }
};
