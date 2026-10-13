import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoothingAudioPlayer } from './SoothingAudioPlayer';

describe('SoothingAudioPlayer Component', () => {
  beforeEach(() => {
    // Mock HTMLMediaElement methods
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.load = vi.fn();
  });

  it('renders title, badges, instrument summary, and transport controls', () => {
    render(<SoothingAudioPlayer />);

    expect(screen.getByText('60s Soothing Acoustic Lullaby')).toBeDefined();
    expect(screen.getByText('Physical Model')).toBeDefined();
    expect(screen.getByText(/Concert Grand Piano \(Hammer Impulses\)/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Play Soothing Tune/i })).toBeDefined();
    expect(screen.getByTitle('Replay from start')).toBeDefined();
  });

  it('renders download links for WAV, MIDI, and Audit JSON', () => {
    render(<SoothingAudioPlayer />);

    const wavLink = screen.getByTitle(/Download full quality 16-bit PCM WAV/i);
    expect(wavLink).toBeDefined();
    expect(wavLink.getAttribute('href')).toBe('/audio/soothing_tune_60s.wav');

    const midiLink = screen.getByTitle(/Download Standard MIDI File/i);
    expect(midiLink).toBeDefined();
    expect(midiLink.getAttribute('href')).toBe('/audio/soothing_tune_60s.mid');

    const auditLink = screen.getByTitle(/Inspect quality manifest JSON/i);
    expect(auditLink).toBeDefined();
    expect(auditLink.getAttribute('href')).toBe('/audio/soothing_tune_60s.json');
  });

  it('toggles playback and switches button label', () => {
    render(<SoothingAudioPlayer />);

    const playBtn = screen.getByRole('button', { name: /Play Soothing Tune/i });
    fireEvent.click(playBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('cycles playback speeds when speed button is clicked', () => {
    render(<SoothingAudioPlayer />);

    const speedBtn = screen.getByTitle('Playback speed');
    expect(speedBtn.textContent).toBe('1x');

    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toBe('1.25x');

    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toBe('0.75x');

    fireEvent.click(speedBtn);
    expect(speedBtn.textContent).toBe('1x');
  });

  it('triggers onOpenAiStudio callback when remix button is clicked', () => {
    const handleOpenAiStudio = vi.fn();
    render(<SoothingAudioPlayer onOpenAiStudio={handleOpenAiStudio} />);

    const remixBtn = screen.getByTitle(/Open this project in AI Studio to inspect tracks or revise/i);
    expect(remixBtn).toBeDefined();
    fireEvent.click(remixBtn);
    expect(handleOpenAiStudio).toHaveBeenCalledTimes(1);
  });

  it('renders acoustic metrics breakdown when not in compact mode', () => {
    render(<SoothingAudioPlayer compact={false} />);

    expect(screen.getByText('16ms Felt Hammer + Unison Beating')).toBeDefined();
    expect(screen.getByText('-2.00 dBFS (0 Clips Guaranteed)')).toBeDefined();
    expect(screen.getByText(/162 Notes/i)).toBeDefined();
    expect(screen.getByText('1.27s Natural Acoustic Tail')).toBeDefined();
  });
});
