"""Tests for Real Audio Rendering and MIDI Export."""

import os
import wave
import struct
import numpy as np
import pytest
from keymuse import MusicAutopilot, KeyMuseProject, Track, Note, Section
from keymuse.core.render import RenderManager
from keymuse.core.synth import SynthEngine


def test_render_manager_wav_and_midi(tmp_path):
    render_manager = RenderManager(sample_rate=44100)

    # Construct a test project
    project = KeyMuseProject(
        id="test_render_proj",
        title="Rendering Test",
        bpm=120.0,
        key="C",
        mode="major",
        sections=[Section(name="Main", start_beat=0.0, length_beats=8.0, energy=0.7)],
        tracks=[
            Track(
                id="track_pad",
                name="Pad",
                instrument="atmospheric_pad",
                volume=0.8,
                pan=-0.2,
                notes=[
                    Note(pitch=60, start_beat=0.0, duration_beats=4.0, velocity=80),
                    Note(pitch=64, start_beat=0.0, duration_beats=4.0, velocity=80),
                    Note(pitch=67, start_beat=0.0, duration_beats=4.0, velocity=80),
                ]
            ),
            Track(
                id="track_bass",
                name="Bass",
                instrument="bass_pulse",
                volume=0.9,
                pan=0.0,
                notes=[
                    Note(pitch=36, start_beat=0.0, duration_beats=1.0, velocity=100),
                    Note(pitch=36, start_beat=2.0, duration_beats=1.0, velocity=100),
                ]
            )
        ]
    )

    wav_path = os.path.join(str(tmp_path), "test.wav")
    midi_path = os.path.join(str(tmp_path), "test.mid")

    # Render WAV
    out_wav = render_manager.render_project_to_wav(project, wav_path)
    assert os.path.exists(out_wav)
    assert os.path.getsize(out_wav) > 1000

    with wave.open(out_wav, "rb") as wf:
        assert wf.getnchannels() == 2
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == 44100
        n_frames = wf.getnframes()
        assert n_frames > 0
        raw = wf.readframes(n_frames)
        audio = np.frombuffer(raw, dtype=np.int16)
        # Check non-silent
        assert np.max(np.abs(audio)) > 500

    # Render MIDI
    out_midi = render_manager.export_project_to_midi(project, midi_path)
    assert os.path.exists(out_midi)
    assert os.path.getsize(out_midi) > 30

    with open(out_midi, "rb") as mf:
        hdr_chunk = mf.read(4)
        assert hdr_chunk == b"MThd"
        hdr_len, fmt, ntracks, div = struct.unpack(">IHHH", mf.read(10))
        assert hdr_len == 6
        assert fmt == 0
        assert ntracks == 1
        assert div == 480
        trk_chunk = mf.read(4)
        assert trk_chunk == b"MTrk"


def test_stem_export(tmp_path):
    render_manager = RenderManager(sample_rate=44100)
    project = KeyMuseProject(
        id="test_stems_proj",
        title="Stem Export Test",
        bpm=120.0,
        tracks=[
            Track(
                id="t_pad",
                name="Pad",
                instrument="atmospheric_pad",
                notes=[Note(pitch=60, start_beat=0.0, duration_beats=2.0, velocity=80)]
            ),
            Track(
                id="t_lead",
                name="Lead",
                instrument="lead_melody",
                notes=[Note(pitch=72, start_beat=0.0, duration_beats=2.0, velocity=90)]
            )
        ]
    )

    stems_dir = os.path.join(str(tmp_path), "stems")
    stems = render_manager.export_stems(project, stems_dir)

    assert "t_pad" in stems
    assert "t_lead" in stems
    assert os.path.exists(stems["t_pad"])
    assert os.path.exists(stems["t_lead"])


def test_master_limiter_anti_clipping():
    synth = SynthEngine(sample_rate=44100)
    # 20 notes simultaneously at full velocity
    notes = [Note(pitch=60 + i, start_beat=0.0, duration_beats=2.0, velocity=127) for i in range(20)]
    project = KeyMuseProject(
        id="test_limiter",
        bpm=120.0,
        tracks=[Track(id="t_mass", name="Overload", instrument="lead_melody", volume=1.0, notes=notes)]
    )

    audio_buf = synth.render_project(project)
    peak = np.max(np.abs(audio_buf))
    # Limiter ceiling is 0.794 (-2.0 dBFS)
    assert peak <= 0.795
