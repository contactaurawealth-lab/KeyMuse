import { describe, it, expect } from 'vitest';
import { StorageService } from './indexedDb';

describe('StorageService and Presets Persistence', () => {
  it('exports and validates StudioProject JSON round-trip correctly', () => {
    const mockProject: any = {
      id: 'proj_test_123',
      name: 'Ambient Session',
      bpm: 128,
      selectedInstrument: 'piano',
      octave: 0,
      transpose: 2,
      scale: 'major',
      rootNote: 'G',
      scaleLock: true,
      chordType: 'major',
      arpSettings: { enabled: true, direction: 'up', rate: '1/16', octaves: 2 },
      effects: {
        masterVolume: 0.9,
        reverbWet: 0.3,
        reverbDecay: 2.0,
        reverbBypass: false,
        delayTime: 0.25,
        delayFeedback: 0.4,
        delayWet: 0.2,
        delayBypass: false,
        filterCutoff: 10000,
        filterType: 'lowpass',
        filterBypass: false,
        distortionDrive: 5,
        distortionWet: 0.1,
        distortionBypass: true
      },
      drumPattern: { name: 'House', steps: {} },
      tracks: []
    };

    const exportedJson = StorageService.exportProjectJSON(mockProject);
    expect(exportedJson).toBeDefined();

    const parsed = StorageService.validateAndParseProjectJSON(exportedJson);
    expect(parsed.id).toBe('proj_test_123');
    expect(parsed.bpm).toBe(128);
    expect(parsed.scale).toBe('major');
    expect(parsed.rootNote).toBe('G');
    expect(parsed.scaleLock).toBe(true);
  });

  it('rejects invalid project JSON files during import', () => {
    expect(() => {
      StorageService.validateAndParseProjectJSON('{ "random": "data" }');
    }).toThrow('Invalid KeyMuse project file format');

    expect(() => {
      StorageService.validateAndParseProjectJSON('invalid json string');
    }).toThrow('Project import validation failed');
  });

  it('handles backend sync gracefully with offline fallback message', async () => {
    // When backend is unreachable, syncWithBackendApi returns offline message without throwing
    const result = await StorageService.syncWithBackendApi('http://127.0.0.1:9999/nonexistent');
    expect(result.success).toBe(true);
    expect(result.offline).toBe(true);
    expect(result.message).toContain('Offline mode');
  });
});
