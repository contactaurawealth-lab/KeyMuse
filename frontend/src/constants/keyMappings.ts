import { KeyMapping, LayerMapping } from '../types';

export const DEFAULT_BASE_MAPPINGS: Record<string, KeyMapping> = {
  // Number row: Digits 1-0 for drum triggers and low bass
  'Digit1': { code: 'Digit1', label: '1', note: 'C3' },
  'Digit2': { code: 'Digit2', label: '2', note: 'D3' },
  'Digit3': { code: 'Digit3', label: '3', note: 'E3' },
  'Digit4': { code: 'Digit4', label: '4', note: 'F3' },
  'Digit5': { code: 'Digit5', label: '5', note: 'G3' },
  'Digit6': { code: 'Digit6', label: '6', note: 'A3' },
  'Digit7': { code: 'Digit7', label: '7', note: 'B3' },
  'Digit8': { code: 'Digit8', label: '8', note: 'C4' },
  'Digit9': { code: 'Digit9', label: '9', note: 'D4' },
  'Digit0': { code: 'Digit0', label: '0', note: 'E4' },
  'Minus':  { code: 'Minus',  label: '-', note: '', action: 'octave_down' },
  'Equal':  { code: 'Equal',  label: '=', note: '', action: 'octave_up' },

  // Top QWERTY row: Upper octave chromatic / pentatonic
  'KeyQ': { code: 'KeyQ', label: 'Q', note: 'C4' },
  'KeyW': { code: 'KeyW', label: 'W', note: 'C#4' },
  'KeyE': { code: 'KeyE', label: 'E', note: 'D4' },
  'KeyR': { code: 'KeyR', label: 'R', note: 'D#4' },
  'KeyT': { code: 'KeyT', label: 'T', note: 'E4' },
  'KeyY': { code: 'KeyY', label: 'Y', note: 'F4' },
  'KeyU': { code: 'KeyU', label: 'U', note: 'F#4' },
  'KeyI': { code: 'KeyI', label: 'I', note: 'G4' },
  'KeyO': { code: 'KeyO', label: 'O', note: 'G#4' },
  'KeyP': { code: 'KeyP', label: 'P', note: 'A4' },
  'BracketLeft':  { code: 'BracketLeft',  label: '[', note: 'A#4' },
  'BracketRight': { code: 'BracketRight', label: ']', note: 'B4' },

  // Home row ASDF: Piano white keys (middle octave)
  'KeyA': { code: 'KeyA', label: 'A', note: 'C4' },
  'KeyS': { code: 'KeyS', label: 'S', note: 'D4' },
  'KeyD': { code: 'KeyD', label: 'D', note: 'E4' },
  'KeyF': { code: 'KeyF', label: 'F', note: 'F4' },
  'KeyG': { code: 'KeyG', label: 'G', note: 'G4' },
  'KeyH': { code: 'KeyH', label: 'H', note: 'A4' },
  'KeyJ': { code: 'KeyJ', label: 'J', note: 'B4' },
  'KeyK': { code: 'KeyK', label: 'K', note: 'C5' },
  'KeyL': { code: 'KeyL', label: 'L', note: 'D5' },
  'Semicolon': { code: 'Semicolon', label: ';', note: 'E5' },
  'Quote':     { code: 'Quote',     label: "'", note: 'F5' },

  // Bottom row ZXCV: Lower octave notes
  'KeyZ': { code: 'KeyZ', label: 'Z', note: 'C3' },
  'KeyX': { code: 'KeyX', label: 'X', note: 'D3' },
  'KeyC': { code: 'KeyC', label: 'C', note: 'E3' },
  'KeyV': { code: 'KeyV', label: 'V', note: 'F3' },
  'KeyB': { code: 'KeyB', label: 'B', note: 'G3' },
  'KeyN': { code: 'KeyN', label: 'N', note: 'A3' },
  'KeyM': { code: 'KeyM', label: 'M', note: 'B3' },
  'Comma':  { code: 'Comma',  label: ',', note: 'C4' },
  'Period': { code: 'Period', label: '.', note: 'D4' },
  'Slash':  { code: 'Slash',  label: '/', note: 'E4' },

  // Spacebar and Controls
  'Space':      { code: 'Space',      label: 'SPACE', note: '', action: 'sustain_toggle' },
  'ArrowUp':    { code: 'ArrowUp',    label: '▲',     note: '', action: 'octave_up' },
  'ArrowDown':  { code: 'ArrowDown',  label: '▼',     note: '', action: 'octave_down' },
  'ArrowLeft':  { code: 'ArrowLeft',  label: '◄',     note: '', action: 'layer_toggle' },
  'ArrowRight': { code: 'ArrowRight', label: '►',     note: '', action: 'panic' }
};

export const DEFAULT_SHIFT_MAPPINGS: Record<string, KeyMapping> = {
  // Number row: Accidental sharps/flats & drum percussion
  'Digit1': { code: 'Digit1', label: '!', note: 'C#3' },
  'Digit2': { code: 'Digit2', label: '@', note: 'D#3' },
  'Digit3': { code: 'Digit3', label: '#', note: 'F#3' },
  'Digit4': { code: 'Digit4', label: '$', note: 'G#3' },
  'Digit5': { code: 'Digit5', label: '%', note: 'A#3' },
  'Digit6': { code: 'Digit6', label: '^', note: 'C#4' },
  'Digit7': { code: 'Digit7', label: '&', note: 'D#4' },
  'Digit8': { code: 'Digit8', label: '*', note: 'F#4' },
  'Digit9': { code: 'Digit9', label: '(', note: 'G#4' },
  'Digit0': { code: 'Digit0', label: ')', note: 'A#4' },
  'Minus':  { code: 'Minus',  label: '_', note: '', action: 'octave_down' },
  'Equal':  { code: 'Equal',  label: '+', note: '', action: 'octave_up' },

  // Top QWERTY row (Shift): Upper Octave 5
  'KeyQ': { code: 'KeyQ', label: 'Q', note: 'C5' },
  'KeyW': { code: 'KeyW', label: 'W', note: 'C#5' },
  'KeyE': { code: 'KeyE', label: 'E', note: 'D5' },
  'KeyR': { code: 'KeyR', label: 'R', note: 'D#5' },
  'KeyT': { code: 'KeyT', label: 'T', note: 'E5' },
  'KeyY': { code: 'KeyY', label: 'Y', note: 'F5' },
  'KeyU': { code: 'KeyU', label: 'U', note: 'F#5' },
  'KeyI': { code: 'KeyI', label: 'I', note: 'G5' },
  'KeyO': { code: 'KeyO', label: 'O', note: 'G#5' },
  'KeyP': { code: 'KeyP', label: 'P', note: 'A5' },
  'BracketLeft':  { code: 'BracketLeft',  label: '{', note: 'A#5' },
  'BracketRight': { code: 'BracketRight', label: '}', note: 'B5' },

  // Home row (Shift): Accidental black keys + harmonic extensions
  'KeyA': { code: 'KeyA', label: 'A', note: 'C#4' },
  'KeyS': { code: 'KeyS', label: 'S', note: 'D#4' },
  'KeyD': { code: 'KeyD', label: 'D', note: 'F#4' },
  'KeyF': { code: 'KeyF', label: 'F', note: 'G#4' },
  'KeyG': { code: 'KeyG', label: 'G', note: 'A#4' },
  'KeyH': { code: 'KeyH', label: 'H', note: 'C#5' },
  'KeyJ': { code: 'KeyJ', label: 'J', note: 'D#5' },
  'KeyK': { code: 'KeyK', label: 'K', note: 'F#5' },
  'KeyL': { code: 'KeyL', label: 'L', note: 'G#5' },
  'Semicolon': { code: 'Semicolon', label: ':', note: 'A#5' },
  'Quote':     { code: 'Quote',     label: '"', note: 'C6' },

  // Bottom row (Shift): Extended high range
  'KeyZ': { code: 'KeyZ', label: 'Z', note: 'C5' },
  'KeyX': { code: 'KeyX', label: 'X', note: 'D5' },
  'KeyC': { code: 'KeyC', label: 'C', note: 'E5' },
  'KeyV': { code: 'KeyV', label: 'V', note: 'F5' },
  'KeyB': { code: 'KeyB', label: 'B', note: 'G5' },
  'KeyN': { code: 'KeyN', label: 'N', note: 'A5' },
  'KeyM': { code: 'KeyM', label: 'M', note: 'B5' },
  'Comma':  { code: 'Comma',  label: '<', note: 'C6' },
  'Period': { code: 'Period', label: '>', note: 'D6' },
  'Slash':  { code: 'Slash',  label: '?', note: 'E6' },

  // Controls
  'Space':      { code: 'Space',      label: 'SPACE', note: '', action: 'sustain_toggle' },
  'ArrowUp':    { code: 'ArrowUp',    label: '▲',     note: '', action: 'octave_up' },
  'ArrowDown':  { code: 'ArrowDown',  label: '▼',     note: '', action: 'octave_down' },
  'ArrowLeft':  { code: 'ArrowLeft',  label: '◄',     note: '', action: 'layer_toggle' },
  'ArrowRight': { code: 'ArrowRight', label: '►',     note: '', action: 'panic' }
};

export const DEFAULT_LAYERS: LayerMapping[] = [
  { name: 'Base Layer', keys: DEFAULT_BASE_MAPPINGS },
  { name: 'Shift Layer', keys: DEFAULT_SHIFT_MAPPINGS }
];
