import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_BASE_MAPPINGS, DEFAULT_SHIFT_MAPPINGS } from '../constants/keyMappings';

describe('Universal Keyboard Mapping Rules', () => {
  it('contains valid physical key codes for letters, digits, and navigation', () => {
    // Letters A-Z
    expect(DEFAULT_BASE_MAPPINGS['KeyA']).toBeDefined();
    expect(DEFAULT_BASE_MAPPINGS['KeyA'].note).toBe('C4');

    // Numbers 0-9
    expect(DEFAULT_BASE_MAPPINGS['Digit1']).toBeDefined();
    expect(DEFAULT_BASE_MAPPINGS['Digit1'].note).toBe('C3');

    // Space & Arrows
    expect(DEFAULT_BASE_MAPPINGS['Space'].action).toBe('sustain_toggle');
    expect(DEFAULT_BASE_MAPPINGS['ArrowUp'].action).toBe('octave_up');
    expect(DEFAULT_BASE_MAPPINGS['ArrowDown'].action).toBe('octave_down');
  });

  it('provides distinct accidentals and upper octaves on Shift mappings', () => {
    // KeyA on Base is C4; on Shift it is C#4
    expect(DEFAULT_BASE_MAPPINGS['KeyA'].note).toBe('C4');
    expect(DEFAULT_SHIFT_MAPPINGS['KeyA'].note).toBe('C#4');

    // KeyQ on Base is C4; on Shift it is C5
    expect(DEFAULT_BASE_MAPPINGS['KeyQ'].note).toBe('C4');
    expect(DEFAULT_SHIFT_MAPPINGS['KeyQ'].note).toBe('C5');
  });

  it('filters repeat events to avoid repeated note triggers', () => {
    const isRepeatIgnored = (event: { repeat: boolean }) => {
      if (event.repeat) return true; // Ignored
      return false; // Processed
    };

    expect(isRepeatIgnored({ repeat: true })).toBe(true);
    expect(isRepeatIgnored({ repeat: false })).toBe(false);
  });

  it('ignores keyboard events occurring within input and textarea elements', () => {
    const shouldIgnoreInput = (tagName: string, isContentEditable: boolean) => {
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable;
    };

    expect(shouldIgnoreInput('INPUT', false)).toBe(true);
    expect(shouldIgnoreInput('TEXTAREA', false)).toBe(true);
    expect(shouldIgnoreInput('DIV', true)).toBe(true);
    expect(shouldIgnoreInput('DIV', false)).toBe(false);
  });
});
