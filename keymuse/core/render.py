"""Render Manager: Exports KeyMuseProject to authentic 16-bit PCM WAV and Standard MIDI Files."""

import os
import wave
import numpy as np
from typing import Dict, Any
from keymuse.models.project import KeyMuseProject
from keymuse.core.synth import SynthEngine
from keymuse.core.midi import MidiWriter


class RenderManager:
    """Manages audio synthesis rendering to WAV and MIDI file export."""

    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate
        self.synth = SynthEngine(sample_rate=sample_rate)
        self.midi_writer = MidiWriter()

    def render_project_to_wav(self, project: KeyMuseProject, output_path: str) -> str:
        """Render complete project mixdown to 16-bit stereo PCM WAV file."""
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        audio_buffer = self.synth.render_project(project)
        self._write_wav_file(output_path, audio_buffer, self.sample_rate)
        return output_path

    def export_project_to_midi(self, project: KeyMuseProject, output_path: str) -> str:
        """Export project note data to Standard MIDI File (SMF Type 0)."""
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        return self.midi_writer.write_project_to_file(project, output_path)

    def export_stems(self, project: KeyMuseProject, output_dir: str) -> Dict[str, str]:
        """Render individual isolated track stems to WAV files."""
        os.makedirs(output_dir, exist_ok=True)
        stem_paths: Dict[str, str] = {}

        for track in project.tracks:
            stem_filename = f"{track.id}.wav"
            stem_path = os.path.join(output_dir, stem_filename)

            # Create single-track subproject
            sub_project = KeyMuseProject(
                id=f"{project.id}_{track.id}",
                title=f"{project.title} - {track.name}",
                bpm=project.bpm,
                key=project.key,
                mode=project.mode,
                time_signature=project.time_signature,
                sections=project.sections,
                tracks=[track],
                metadata=project.metadata
            )

            audio_buffer = self.synth.render_project(sub_project)
            self._write_wav_file(stem_path, audio_buffer, self.sample_rate)
            stem_paths[track.id] = stem_path

        return stem_paths

    def _write_wav_file(self, path: str, float_buffer: np.ndarray, sample_rate: int):
        """Encode float32 stereo numpy buffer to authentic 16-bit PCM RIFF WAV."""
        # Clamp to [-1.0, 1.0]
        clamped = np.clip(float_buffer, -1.0, 1.0)
        # Convert to 16-bit signed PCM
        pcm16 = (clamped * 32767.0).astype(np.int16)

        with wave.open(path, "wb") as wf:
            wf.setnchannels(2)      # Stereo
            wf.setsampwidth(2)      # 16-bit (2 bytes)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm16.tobytes())
