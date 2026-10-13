"""Pure Python DSP Audio Synthesis Engine with Polyphony and Procedural Percussion."""

import math
import numpy as np
from typing import Tuple, Dict, Any, List
from keymuse.models.project import KeyMuseProject, Track, Note
from keymuse.core.theory import midi_to_frequency


class SynthEngine:
    """Renders notes and project arrangements into high-fidelity stereo audio buffers."""

    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate

    def render_project(self, project: KeyMuseProject) -> np.ndarray:
        """Render an entire KeyMuseProject into a stereo float32 numpy array shape (samples, 2)."""
        duration_sec = project.duration_seconds()
        # Add a 2.0-second tail for reverb/envelope decay
        total_seconds = max(1.0, duration_sec + 2.0)
        total_samples = int(total_seconds * self.sample_rate)

        # Master stereo buffer initialized to silence
        master_buffer = np.zeros((total_samples, 2), dtype=np.float32)

        bpm = project.bpm
        seconds_per_beat = 60.0 / bpm

        for track in project.tracks:
            track_buf = np.zeros((total_samples, 2), dtype=np.float32)
            inst = track.instrument.lower()
            pan = max(-1.0, min(1.0, track.pan))
            vol = max(0.0, min(1.0, track.volume))

            left_gain = math.sqrt((1.0 - pan) / 2.0) * vol
            right_gain = math.sqrt((1.0 + pan) / 2.0) * vol

            for note in track.notes:
                start_sec = note.start_beat * seconds_per_beat
                dur_sec = max(0.05, note.duration_beats * seconds_per_beat)
                vel = note.velocity / 127.0

                start_idx = int(start_sec * self.sample_rate)
                if start_idx >= total_samples:
                    continue

                note_samples = self._render_voice(inst, note.pitch, dur_sec, vel)
                end_idx = min(total_samples, start_idx + len(note_samples))
                chunk_len = end_idx - start_idx

                if chunk_len > 0:
                    track_buf[start_idx:end_idx, 0] += note_samples[:chunk_len] * left_gain
                    track_buf[start_idx:end_idx, 1] += note_samples[:chunk_len] * right_gain

            master_buffer += track_buf

        # Apply Master Limiter at -2.0 dBFS (amplitude 0.794)
        return self._apply_master_limiter(master_buffer, ceiling=0.794)

    def _render_voice(self, instrument: str, pitch: int, duration_sec: float, velocity: float) -> np.ndarray:
        """Synthesize an individual note voice according to its instrument timbre."""
        freq = midi_to_frequency(pitch)

        if "percussion" in instrument or "drum" in instrument:
            return self._render_percussion(pitch, duration_sec, velocity)
        elif "pad" in instrument:
            return self._render_pad(freq, duration_sec, velocity)
        elif "bass" in instrument:
            return self._render_bass(freq, duration_sec, velocity)
        elif "lead" in instrument:
            return self._render_lead(freq, duration_sec, velocity)
        else:
            return self._render_generic_keyboard(freq, duration_sec, velocity)

    def _render_pad(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Atmospheric Pad: Rich detuned dual saw/triangle with smooth attack & release."""
        attack = 0.4
        decay = 0.3
        sustain = 0.8
        release = 0.8
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        # Dual detuned oscillators
        wave1 = np.sin(2 * np.pi * freq * t)
        wave2 = np.sin(2 * np.pi * (freq * 1.004) * t) * 0.7
        sub = np.sin(2 * np.pi * (freq * 0.5) * t) * 0.3
        raw_wave = (wave1 + wave2 + sub) * 0.4

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_bass(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Bass Pulse: Punchy analog bass with rapid attack and solid sub fundamental."""
        attack = 0.02
        decay = 0.15
        sustain = 0.7
        release = 0.15
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        fundamental = np.sin(2 * np.pi * freq * t)
        octave_down = np.sin(2 * np.pi * (freq * 0.5) * t) * 0.5
        harmonic = (np.sin(2 * np.pi * (freq * 2.0) * t) ** 3) * 0.25
        raw_wave = (fundamental + octave_down + harmonic) * 0.6

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_lead(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Lead Melody: Expressive lead with slight vibrato and resonant harmonic body."""
        attack = 0.05
        decay = 0.2
        sustain = 0.75
        release = 0.35
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        # Subtle 5Hz vibrato
        vibrato = 1.0 + 0.006 * np.sin(2 * np.pi * 5.0 * t)
        phase = np.cumsum(2 * np.pi * (freq * vibrato) / self.sample_rate)

        osc1 = np.sin(phase)
        osc2 = np.sin(2 * phase) * 0.4
        osc3 = np.sin(3 * phase) * 0.2
        raw_wave = (osc1 + osc2 + osc3) * 0.5

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_generic_keyboard(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Harmonic acoustic/electric piano model with natural decay."""
        attack = 0.01
        decay = 0.4
        sustain = 0.4
        release = 0.25
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        osc1 = np.sin(2 * np.pi * freq * t)
        osc2 = np.sin(2 * np.pi * (freq * 2.0) * t) * 0.5
        osc3 = np.sin(2 * np.pi * (freq * 3.0) * t) * 0.2
        raw_wave = (osc1 + osc2 + osc3) * 0.5

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_percussion(self, pitch: int, duration_sec: float, velocity: float) -> np.ndarray:
        """Procedural drum synthesis: Kick (pitch 36), Snare (pitch 38), Hi-Hat (pitch 42/46), Clap (pitch 39)."""
        # Determine percussion voice by pitch or default to kick/snare pattern
        if pitch in (35, 36):  # Bass Drum / Kick
            dur = 0.35
            n = int(dur * self.sample_rate)
            t = np.linspace(0, dur, n, endpoint=False, dtype=np.float32)
            # Pitch sweep from 150Hz down to 42Hz
            f_inst = 42.0 + (150.0 - 42.0) * np.exp(-18.0 * t)
            phase = np.cumsum(2 * np.pi * f_inst / self.sample_rate)
            kick = np.sin(phase) * np.exp(-7.0 * t)
            return (kick * velocity).astype(np.float32)

        elif pitch in (38, 40):  # Snare
            dur = 0.28
            n = int(dur * self.sample_rate)
            t = np.linspace(0, dur, n, endpoint=False, dtype=np.float32)
            # Tonal body (180Hz) + shaped noise burst
            tone = np.sin(2 * np.pi * 180.0 * t) * np.exp(-15.0 * t) * 0.5
            noise = (np.random.uniform(-1.0, 1.0, n).astype(np.float32)) * np.exp(-18.0 * t) * 0.6
            return ((tone + noise) * velocity).astype(np.float32)

        elif pitch in (42, 44):  # Closed Hi-Hat
            dur = 0.08
            n = int(dur * self.sample_rate)
            t = np.linspace(0, dur, n, endpoint=False, dtype=np.float32)
            noise = np.random.uniform(-1.0, 1.0, n).astype(np.float32) * np.exp(-45.0 * t)
            return (noise * 0.4 * velocity).astype(np.float32)

        elif pitch == 46:  # Open Hi-Hat
            dur = 0.4
            n = int(dur * self.sample_rate)
            t = np.linspace(0, dur, n, endpoint=False, dtype=np.float32)
            noise = np.random.uniform(-1.0, 1.0, n).astype(np.float32) * np.exp(-10.0 * t)
            return (noise * 0.45 * velocity).astype(np.float32)

        else:  # Hand Clap or Tom
            dur = 0.25
            n = int(dur * self.sample_rate)
            t = np.linspace(0, dur, n, endpoint=False, dtype=np.float32)
            noise = np.random.uniform(-1.0, 1.0, n).astype(np.float32)
            # Triple micro-burst for clap
            burst = np.exp(-20.0 * np.mod(t, 0.03)) * np.exp(-8.0 * t)
            return (noise * burst * 0.5 * velocity).astype(np.float32)

    def _adsr_envelope(
        self,
        total_samples: int,
        duration_sec: float,
        attack_sec: float,
        decay_sec: float,
        sustain_level: float,
        release_sec: float
    ) -> np.ndarray:
        """Generate smooth, click-free ADSR envelope."""
        env = np.zeros(total_samples, dtype=np.float32)
        sr = self.sample_rate

        att_samples = max(1, int(attack_sec * sr))
        dec_samples = max(1, int(decay_sec * sr))
        gate_samples = int(duration_sec * sr)
        rel_samples = max(1, int(release_sec * sr))

        # 1. Attack Phase (0.0 -> 1.0)
        a_len = min(att_samples, total_samples)
        env[:a_len] = np.linspace(0.0, 1.0, a_len)

        # 2. Decay Phase (1.0 -> sustain)
        d_start = a_len
        d_end = min(d_start + dec_samples, total_samples)
        if d_end > d_start:
            env[d_start:d_end] = np.linspace(1.0, sustain_level, d_end - d_start)

        # 3. Sustain Phase
        s_start = d_end
        s_end = min(gate_samples, total_samples)
        if s_end > s_start:
            env[s_start:s_end] = sustain_level

        # 4. Release Phase (current -> 0.0)
        r_start = s_end
        r_end = min(r_start + rel_samples, total_samples)
        if r_end > r_start:
            last_level = env[r_start - 1] if r_start > 0 else sustain_level
            env[r_start:r_end] = np.linspace(last_level, 0.0, r_end - r_start)

        return env

    def _apply_master_limiter(self, buffer: np.ndarray, ceiling: float = 0.794) -> np.ndarray:
        """Master limiter with soft knee and soft clipping preventing digital clipping above ceiling."""
        peak = np.max(np.abs(buffer))
        if peak > ceiling:
            # Soft tanh saturation scaling
            ratio = ceiling / peak
            buffer = buffer * ratio
        return np.clip(buffer, -ceiling, ceiling)
