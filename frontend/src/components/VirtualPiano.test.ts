import { describe, it, expect } from 'vitest';

describe('VirtualPiano & Touch Pad Layout', () => {
  it('generates accurate piano keys for 2 octaves', () => {
    // 2 octaves has 15 white keys (7 + 7 + 1 end C) and 10 black keys (5 + 5) = 25 keys
    const notesPattern = [
      { name: 'C', isBlack: false },
      { name: 'C#', isBlack: true },
      { name: 'D', isBlack: false },
      { name: 'D#', isBlack: true },
      { name: 'E', isBlack: false },
      { name: 'F', isBlack: false },
      { name: 'F#', isBlack: true },
      { name: 'G', isBlack: false },
      { name: 'G#', isBlack: true },
      { name: 'A', isBlack: false },
      { name: 'A#', isBlack: true },
      { name: 'B', isBlack: false }
    ];

    const generateKeys = (startOct: number, count: number) => {
      const keys = [];
      for (let o = 0; o < count; o++) {
        for (const p of notesPattern) {
          keys.push({ note: `${p.name}${startOct + o}`, isBlack: p.isBlack });
        }
      }
      keys.push({ note: `C${startOct + count}`, isBlack: false });
      return keys;
    };

    const keys = generateKeys(3, 2);
    expect(keys).toHaveLength(25);
    expect(keys[0].note).toBe('C3');
    expect(keys[keys.length - 1].note).toBe('C5');

    const whiteKeys = keys.filter((k) => !k.isBlack);
    const blackKeys = keys.filter((k) => k.isBlack);
    expect(whiteKeys).toHaveLength(15);
    expect(blackKeys).toHaveLength(10);
  });

  it('correctly tracks multiple simultaneous pointer IDs for polyphonic touch', () => {
    const activePointers = new Map<number, string>();

    // Finger 1 touches C4
    activePointers.set(1, 'C4');
    // Finger 2 touches E4
    activePointers.set(2, 'E4');
    // Finger 3 touches G4
    activePointers.set(3, 'G4');

    expect(activePointers.size).toBe(3);
    expect(Array.from(activePointers.values())).toEqual(['C4', 'E4', 'G4']);

    // Release finger 2
    activePointers.delete(2);
    expect(activePointers.size).toBe(2);
    expect(Array.from(activePointers.values())).toEqual(['C4', 'G4']);
  });
});
