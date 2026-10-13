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
        elif "string" in instrument or "violin" in instrument:
            return self._render_strings(freq, duration_sec, velocity)
        elif "guitar" in instrument:
            return self._render_guitar(freq, duration_sec, velocity)
        else:
            return self._render_piano(freq, duration_sec, velocity)

    def _render_piano(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Acoustic Concert Grand Piano Model:
        1. Velocity-sensitive felt hammer strike transient impulse
        2. 8 inharmonic string partials with frequency-dependent exponential damping
        3. 3-string unison chorus with subtle detuning (beating effect)
        4. Wooden soundboard acoustic body resonance
        5. Pitch-dependent natural decay
        """
        sr = self.sample_rate
        # Natural decay dependent on pitch (bass notes sustain up to 5.5s, treble decays in ~1.2s)
        pitch_factor = float(np.clip(1.0 - 0.22 * np.log2(max(27.5, freq) / 261.63), 0.35, 1.8))
        decay_time = max(1.2, min(5.5, duration_sec * 1.5 * pitch_factor))
        release_sec = 0.35
        total_time = max(duration_sec + release_sec, decay_time)
        n_samples = int(total_time * sr)
        t = np.linspace(0, total_time, n_samples, endpoint=False, dtype=np.float32)

        # 1. Hammer strike transient impulse (14ms mechanical felt-on-steel impact)
        hammer_samples = int(0.014 * sr)
        hammer = np.zeros(n_samples, dtype=np.float32)
        if hammer_samples > 0:
            h_t = np.linspace(0, 0.014, hammer_samples, endpoint=False, dtype=np.float32)
            knock_freq = min(1800.0, max(600.0, freq * 2.2))
            h_tone = np.sin(2 * np.pi * knock_freq * h_t)
            h_noise = np.random.uniform(-1.0, 1.0, hammer_samples).astype(np.float32)
            h_env = np.exp(-h_t / 0.0032)
            hammer[:hammer_samples] = (0.65 * h_tone + 0.35 * h_noise) * h_env * 0.40

        # 2. 8 Inharmonic String Partials
        # Inharmonicity parameter B for piano strings
        B = 0.00028
        partials = [
            (1, 1.00, 1.0),      # Fundamental
            (2, 0.65, 1.5),      # 2nd Harmonic
            (3, 0.42, 2.2),      # 3rd Harmonic
            (4, 0.25, 3.2),      # 4th Harmonic
            (5, 0.14, 4.5),      # 5th Harmonic
            (6, 0.08, 6.0),      # 6th Harmonic
            (7, 0.04, 7.8),      # 7th Harmonic
            (8, 0.02, 9.8),      # 8th Harmonic
        ]

        # 3-string unison detuning (beating effect): center, +1.4c, -1.4c
        detune_factors = [1.0, 1.00081, 0.99919]
        string_weights = [0.48, 0.26, 0.26]

        string_sound = np.zeros(n_samples, dtype=np.float32)
        decay_base = 1.0 / (pitch_factor * 1.1)

        for s_detune, s_weight in zip(detune_factors, string_weights):
            s_freq = freq * s_detune
            for k, amp, decay_rate in partials:
                p_freq = k * s_freq * np.sqrt(1.0 + B * (k ** 2))
                if p_freq >= sr / 2.0:
                    continue
                damping = np.exp(-t * (decay_rate * decay_base))
                partial_wave = np.sin(2 * np.pi * p_freq * t) * amp * damping
                string_sound += partial_wave * s_weight

        # 3. Soundboard acoustic body resonance (low-mid spruce wood fullness)
        sb_freq = 210.0
        sb_resonance = np.sin(2 * np.pi * sb_freq * t) * np.exp(-t * 9.0) * 0.12

        # Composite piano sound
        composite = hammer + string_sound * 0.85 + sb_resonance

        # 4. Key release felt damper decay
        gate_samples = int(duration_sec * sr)
        if gate_samples < n_samples:
            rel_len = n_samples - gate_samples
            rel_t = np.linspace(0, 1.0, rel_len, endpoint=False, dtype=np.float32)
            damper_env = np.exp(-rel_t * 7.5)
            composite[gate_samples:] *= damper_env

        # Velocity scaling: non-linear dynamics
        vel_scale = (velocity ** 1.25) * 0.72
        return (composite * vel_scale).astype(np.float32)

    def _render_generic_keyboard(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Fallback to physical piano model for all keyboard instruments."""
        return self._render_piano(freq, duration_sec, velocity)

    def _render_pad(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Atmospheric Pad: Rich detuned dual saw/triangle with smooth attack & release."""
        attack = 0.35
        decay = 0.30
        sustain = 0.80
        release = 0.75
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        # Dual detuned oscillators
        wave1 = np.sin(2 * np.pi * freq * t)
        wave2 = np.sin(2 * np.pi * (freq * 1.004) * t) * 0.7
        sub = np.sin(2 * np.pi * (freq * 0.5) * t) * 0.3
        raw_wave = (wave1 + wave2 + sub) * 0.42

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_bass(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Bass Pulse: Punchy analog bass with rapid attack and solid sub fundamental."""
        attack = 0.02
        decay = 0.15
        sustain = 0.70
        release = 0.18
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        fundamental = np.sin(2 * np.pi * freq * t)
        octave_down = np.sin(2 * np.pi * (freq * 0.5) * t) * 0.5
        harmonic = (np.sin(2 * np.pi * (freq * 2.0) * t) ** 3) * 0.25
        raw_wave = (fundamental + octave_down + harmonic) * 0.60

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_lead(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Lead Melody: Expressive lead with slight vibrato and resonant harmonic body."""
        attack = 0.04
        decay = 0.18
        sustain = 0.75
        release = 0.32
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        # Subtle 5Hz vibrato
        vibrato = 1.0 + 0.006 * np.sin(2 * np.pi * 5.0 * t)
        phase = np.cumsum(2 * np.pi * (freq * vibrato) / self.sample_rate)

        osc1 = np.sin(phase)
        osc2 = np.sin(2 * phase) * 0.4
        osc3 = np.sin(3 * phase) * 0.2
        raw_wave = (osc1 + osc2 + osc3) * 0.50

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_strings(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Lush Orchestral Strings: Multi-voice ensemble detuning with smooth bowed swell."""
        attack = 0.12
        decay = 0.25
        sustain = 0.85
        release = 0.55
        total_time = duration_sec + release
        t = np.linspace(0, total_time, int(total_time * self.sample_rate), endpoint=False, dtype=np.float32)

        # 4-voice ensemble detuning
        s1 = np.sin(2 * np.pi * freq * t)
        s2 = np.sin(2 * np.pi * (freq * 1.002) * t) * 0.7
        s3 = np.sin(2 * np.pi * (freq * 0.998) * t) * 0.7
        h1 = np.sin(2 * np.pi * (freq * 2.0) * t) * 0.35
        raw_wave = (s1 + s2 + s3 + h1) * 0.35

        env = self._adsr_envelope(len(t), duration_sec, attack, decay, sustain, release)
        return (raw_wave * env * velocity).astype(np.float32)

    def _render_guitar(self, freq: float, duration_sec: float, velocity: float) -> np.ndarray:
        """Acoustic Plucked Guitar: Bright transient with natural string dampening."""
        total_time = max(duration_sec + 0.3, 2.2)
        n = int(total_time * self.sample_rate)
        t = np.linspace(0, total_time, n, endpoint=False, dtype=np.float32)

        # Fast pluck noise transient
        p_len = min(n, int(0.01 * self.sample_rate))
        pluck = np.zeros(n, dtype=np.float32)
        if p_len > 0:
            pluck[:p_len] = np.random.uniform(-1.0, 1.0, p_len).astype(np.float32) * np.exp(-np.linspace(0, 10, p_len)) * 0.35

        f1 = np.sin(2 * np.pi * freq * t) * np.exp(-t * 2.2)
        f2 = np.sin(2 * np.pi * (freq * 2.0) * t) * np.exp(-t * 4.5) * 0.4
        f3 = np.sin(2 * np.pi * (freq * 3.0) * t) * np.exp(-t * 7.5) * 0.2
        string_wave = (f1 + f2 + f3) * 0.65

        composite = pluck + string_wave
        gate_samples = int(duration_sec * self.sample_rate)
        if gate_samples < n:
            rel_t = np.linspace(0, 1.0, n - gate_samples, endpoint=False, dtype=np.float32)
            composite[gate_samples:] *= np.exp(-rel_t * 6.0)

        return (composite * velocity * 0.75).astype(np.float32)

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
