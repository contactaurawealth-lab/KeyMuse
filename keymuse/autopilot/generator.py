"""Composition and Arrangement Engine: Realizes CompositionPlan into a canonical KeyMuseProject."""

import random
from typing import List, Dict, Any
from keymuse.models.plan import CompositionPlan, SectionPlan, TrackPlan
from keymuse.models.project import KeyMuseProject, Track, Note, Section
from keymuse.core.theory import (
    note_name_to_midi,
    get_scale_notes,
    get_chord_notes
)


class CompositionEngine:
    """Arranges musical motifs, chords, basslines, and percussion into a full KeyMuseProject."""

    def __init__(self):
        pass

    def generate_project(self, plan: CompositionPlan) -> KeyMuseProject:
        """Realize a structured plan into note events across all planned tracks."""
        rng = random.Random(plan.seed or 42)
        root_midi = note_name_to_midi(plan.key, octave=3)
        scale_notes = get_scale_notes(plan.key, mode=plan.mode, base_octave=3, octaves=3)

        # Harmonic Progression in D minor (or selected mode): i - VI - III - VII
        # For D minor: Dm (root+0), Bb (root+8), F (root+3), C (root+10)
        chord_roots = [root_midi, root_midi + 8, root_midi + 3, root_midi + 10]
        chord_types = ["min", "maj", "maj", "maj"]

        project_sections = [
            Section(
                name=s.name,
                start_beat=s.start_beat,
                length_beats=s.length_beats,
                energy=s.energy,
                description=f"{s.name} section ({s.dynamic_level})"
            )
            for s in plan.sections
        ]

        tracks: List[Track] = []

        for track_plan in plan.tracks:
            notes: List[Note] = []
            role = track_plan.role.lower()

            for sec in plan.sections:
                if track_plan.track_id not in sec.active_track_ids:
                    continue  # Inactive during this section

                sec_start = sec.start_beat
                sec_length = sec.length_beats
                bars = int(sec_length // 4.0)

                for bar_idx in range(bars):
                    bar_beat = sec_start + (bar_idx * 4.0)
                    chord_idx = bar_idx % len(chord_roots)
                    c_root = chord_roots[chord_idx]
                    c_type = chord_types[chord_idx]

                    if role in ("harmony", "pad"):
                        # Atmospheric Pad: Sustained chord triad over 4 beats
                        triad = get_chord_notes(c_root + 12, chord_type=c_type)
                        velocity = int(60 + sec.energy * 35)
                        for pitch in triad:
                            notes.append(Note(
                                pitch=pitch,
                                start_beat=bar_beat,
                                duration_beats=4.0,
                                velocity=velocity
                            ))

                    elif role == "bass":
                        # Bass Pulse: Rhythmic eighth notes (every 0.5 or 1.0 beat)
                        pulse_step = 0.5 if sec.energy > 0.5 else 1.0
                        num_pulses = int(4.0 / pulse_step)
                        bass_pitch = c_root - 12  # Low register
                        velocity = int(75 + sec.energy * 35)
                        for p in range(num_pulses):
                            notes.append(Note(
                                pitch=bass_pitch,
                                start_beat=bar_beat + (p * pulse_step),
                                duration_beats=pulse_step * 0.8,
                                velocity=velocity
                            ))

                    elif role == "melody":
                        # Lead Melody: Expressive motifs on scale degrees
                        # Motif changes every bar; higher density during climax
                        motif_steps = [0.0, 1.0, 2.0, 3.0] if sec.energy < 0.8 else [0.0, 0.75, 1.5, 2.5, 3.25]
                        melody_octave_root = root_midi + 24  # High register
                        velocity = int(70 + sec.energy * 40)

                        for step in motif_steps:
                            # Choose chord tone or scalar neighbor
                            offset = rng.choice([0, 3, 5, 7, 10, 12])
                            notes.append(Note(
                                pitch=melody_octave_root + offset,
                                start_beat=bar_beat + step,
                                duration_beats=0.75,
                                velocity=velocity
                            ))

                    elif role == "percussion":
                        # Percussion:
                        # Kick (pitch 36): beat 0, 2 (or four on floor during climax)
                        # Snare (pitch 38): beat 1, 3
                        # Closed Hat (pitch 42): eighth notes
                        vel = int(80 + sec.energy * 40)

                        if sec.energy > 0.4:
                            # Kick
                            notes.append(Note(pitch=36, start_beat=bar_beat + 0.0, duration_beats=0.25, velocity=vel))
                            notes.append(Note(pitch=36, start_beat=bar_beat + 2.0, duration_beats=0.25, velocity=vel))
                            if sec.energy > 0.8:
                                notes.append(Note(pitch=36, start_beat=bar_beat + 1.0, duration_beats=0.25, velocity=vel))
                                notes.append(Note(pitch=36, start_beat=bar_beat + 3.0, duration_beats=0.25, velocity=vel))

                        if sec.energy > 0.5:
                            # Snare on beats 1 and 3
                            notes.append(Note(pitch=38, start_beat=bar_beat + 1.0, duration_beats=0.25, velocity=vel))
                            notes.append(Note(pitch=38, start_beat=bar_beat + 3.0, duration_beats=0.25, velocity=vel))

                        if sec.energy > 0.3:
                            # Hi-hat on eighth notes
                            for h in range(8):
                                notes.append(Note(pitch=42, start_beat=bar_beat + (h * 0.5), duration_beats=0.1, velocity=vel - 10))

            tracks.append(Track(
                id=track_plan.track_id,
                name=track_plan.name,
                instrument=track_plan.instrument,
                volume=track_plan.volume,
                pan=track_plan.pan,
                notes=notes
            ))

        return KeyMuseProject(
            id=f"proj_{abs(hash(plan.title)) % 1000000}",
            title=plan.title,
            bpm=plan.tempo,
            key=plan.key,
            mode=plan.mode,
            time_signature=plan.time_signature,
            version=1,
            sections=project_sections,
            tracks=tracks,
            metadata={"brief_id": plan.brief_id, "seed": plan.seed}
        )
