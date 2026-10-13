import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiStudio } from './AiStudio';

describe('AiStudio Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders studio header, preset buttons, and composition form controls', () => {
    render(<AiStudio />);
    expect(screen.getByText('KeyMuse AI Music Autopilot')).toBeDefined();
    expect(screen.getByText('REAL DSP AUDIO ENGINE')).toBeDefined();
    expect(screen.getByText('Cinematic Sci-Fi')).toBeDefined();
    expect(screen.getByText('Cyberpunk Pulse')).toBeDefined();
    expect(screen.getByText('Lofi Ambient Chill')).toBeDefined();
    expect(screen.getByText('Epic Orchestral Climax')).toBeDefined();
    expect(screen.getByRole('button', { name: /Compose Music Autopilot/i })).toBeDefined();
  });

  it('populates musical parameters when clicking a preset brief pill', () => {
    render(<AiStudio />);

    const cyberpunkPill = screen.getByText('Cyberpunk Pulse');
    fireEvent.click(cyberpunkPill);

    const textarea = screen.getByPlaceholderText(/Describe your desired soundtrack/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('cyberpunk');
    expect(screen.getByText('128 BPM')).toBeDefined();
    expect(screen.getByText('45s')).toBeDefined();
  });

  it('allows toggling instrument voices', () => {
    render(<AiStudio />);

    const padBtn = screen.getByRole('button', { name: 'Atmospheric Pad' });
    expect(padBtn).toBeDefined();

    // Toggle off
    fireEvent.click(padBtn);
    // Toggle back on
    fireEvent.click(padBtn);
    expect(screen.getByText(/Active Track Voices \(4\)/i)).toBeDefined();
  });

  it('handles composition submission, displays real audio preview and inspection metrics', async () => {
    const mockResponse = {
      status: 'success',
      project_id: 'proj_test123',
      title: 'Neon Odyssey',
      bpm: 90,
      key: 'D',
      mode: 'minor',
      duration_seconds: 60,
      total_tracks: 4,
      total_notes: 434,
      tracks: [
        { id: 't_pad', name: 'Pad', instrument: 'atmospheric_pad', volume: 0.8, pan: -0.2, note_count: 64 },
        { id: 't_bass', name: 'Bass', instrument: 'bass_pulse', volume: 0.85, pan: 0.0, note_count: 120 }
      ],
      sections: [
        { name: 'Intro', start_beat: 0, length_beats: 16, energy: 0.3, description: 'Mysterious opening' },
        { name: 'Climax', start_beat: 16, length_beats: 32, energy: 0.9, description: 'Full climax' }
      ],
      analysis: {
        actual_duration: 60.5,
        peak_dbfs: -2.0,
        rms_dbfs: -18.2,
        clipping_detected: false,
        start_silence_seconds: 0.01,
        end_silence_seconds: 1.1
      },
      audio_url: '/api/autopilot/projects/proj_test123/audio',
      midi_url: '/api/autopilot/projects/proj_test123/midi',
      stems: [],
      manifest_url: '/api/autopilot/projects/proj_test123/manifest',
      project_json_url: '/api/autopilot/projects/proj_test123/project'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<AiStudio />);

    const composeBtn = screen.getByRole('button', { name: /Compose Music Autopilot/i });
    fireEvent.click(composeBtn);

    await waitFor(() => {
      expect(screen.getByText('Neon Odyssey')).toBeDefined();
      expect(screen.getByText('-2.00 dBFS')).toBeDefined();
      expect(screen.getByText('SAFE (0 CLIPS)')).toBeDefined();
      expect(screen.getByText('Master WAV')).toBeDefined();
      expect(screen.getByText('MIDI (SMF 0)')).toBeDefined();
      expect(screen.getByText('Apply Targeted Revision')).toBeDefined();
    });
  });
});
