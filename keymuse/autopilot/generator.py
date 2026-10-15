"""Composition and Arrangement Engine: Realizes CompositionPlan into rich, authentic musical works."""

import random
from typing import List, Dict, Any, Tuple
from keymuse.models.plan import CompositionPlan, SectionPlan, TrackPlan
from keymuse.models.project import KeyMuseProject, Track, Note, Section
from keymuse.core.theory import (
    note_name_to_midi,
    get_scale_notes,
    get_chord_notes
)


class CompositionEngine:
    """Arranges musical motifs, chords, basslines, arpeggios, and percussion into a full KeyMuseProject."""

    def __init__(self):
        pass

    def generate_project(self, plan: CompositionPlan) -> KeyMuseProject:
        """Realize a structured plan into realistic, instrument-specific note events across all planned tracks."""
        rng = random.Random(plan.seed or 42)
        root_midi = note_name_to_midi(plan.key, octave=3)
        mode_lower = (plan.mode or "minor").lower()

        # Scale notes across 4 octaves for rich melodic and harmonic ranges
        scale_notes = get_scale_notes(plan.key, mode=plan.mode, base_octave=2, octaves=4)
        melody_scale = [n for n in scale_notes if 60 <= n <= 88] or scale_notes

        # -------------------------------------------------------------
        # Harmonic Progressions by Mode
        # -------------------------------------------------------------
        if mode_lower in ("major", "pentatonic"):
            # I - V - vi - IV (e.g. C - G - Am - F)
            chord_roots = [root_midi, root_midi + 7, root_midi + 9, root_midi + 5]
            chord_types = ["maj", "maj", "min", "maj"]
        elif mode_lower == "dorian":
            # i - IV - VII - i (e.g. Dm - G - C - Dm)
            chord_roots = [root_midi, root_midi + 5, root_midi + 10, root_midi]
            chord_types = ["min", "maj", "maj", "min"]
        elif mode_lower == "mixolydian":
            # I - bVII - IV - I (e.g. D - C - G - D)
            chord_roots = [root_midi, root_midi + 10, root_midi + 5, root_midi]
            chord_types = ["maj", "maj", "maj", "maj"]
        elif mode_lower == "phrygian":
            # i - bII - VII - i
            chord_roots = [root_midi, root_midi + 1, root_midi + 10, root_midi]
            chord_types = ["min", "maj", "min", "min"]
        elif mode_lower == "lydian":
            # I - II - V - I
            chord_roots = [root_midi, root_midi + 2, root_midi + 7, root_midi]
            chord_types = ["maj", "maj", "maj", "maj"]
        elif mode_lower == "blues":
            # I7 - IV7 - I7 - V7
            chord_roots = [root_midi, root_midi + 5, root_midi, root_midi + 7]
            chord_types = ["dom7", "dom7", "dom7", "dom7"]
        else:
            # Minor: i - VI - III - VII (e.g. Dm - Bb - F - C)
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
            inst = track_plan.instrument.lower()

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
                    triad = get_chord_notes(c_root + 12, chord_type=c_type)

                    # -------------------------------------------------------------
                    # 1. PIANO (Acoustic Grand / Upright)
                    # -------------------------------------------------------------
                    if "piano" in inst:
                        if sec.energy < 0.65 or "soothing" in plan.title.lower() or "lullaby" in plan.title.lower():
                            # Delicate, flowing broken-chord arpeggios
                            base_vel = int(60 + sec.energy * 25)
                            # Beat 0: Deep root bass note
                            notes.append(Note(
                                pitch=c_root - 12,
                                start_beat=bar_beat + 0.0,
                                duration_beats=1.8,
                                velocity=base_vel + 5
                            ))
                            # Beat 1: Fifth harmonic anchor
                            notes.append(Note(
                                pitch=c_root,
                                start_beat=bar_beat + 1.0,
                                duration_beats=1.2,
                                velocity=base_vel - 4
                            ))
                            # Beat 2: Third / chord tone
                            notes.append(Note(
                                pitch=triad[1],
                                start_beat=bar_beat + 2.0,
                                duration_beats=1.0,
                                velocity=base_vel
                            ))
                            # Beat 3: High resolution chord tone
                            notes.append(Note(
                                pitch=triad[2],
                                start_beat=bar_beat + 3.0,
                                duration_beats=0.9,
                                velocity=base_vel - 6
                            ))
                            if sec.energy > 0.45:
                                # Beat 3.5: Delicate upper passing tone
                                notes.append(Note(
                                    pitch=triad[0] + 12,
                                    start_beat=bar_beat + 3.5,
                                    duration_beats=0.45,
                                    velocity=base_vel - 10
                                ))
                        else:
                            # Upbeat rhythmic comping chords with left-hand octave root
                            base_vel = int(72 + sec.energy * 30)
                            # Left hand bass on beat 0 and 2
                            notes.append(Note(pitch=c_root - 12, start_beat=bar_beat + 0.0, duration_beats=1.2, velocity=base_vel))
                            notes.append(Note(pitch=c_root - 12, start_beat=bar_beat + 2.0, duration_beats=1.0, velocity=base_vel - 5))
                            # Right hand syncopated chord stabs
                            stabs = [0.0, 1.5, 3.0]
                            for st in stabs:
                                for p in triad:
                                    notes.append(Note(
                                        pitch=p,
                                        start_beat=bar_beat + st,
                                        duration_beats=0.75 if st == 3.0 else 0.5,
                                        velocity=base_vel - 2
                                    ))

                    # -------------------------------------------------------------
                    # 2. ACOUSTIC GUITAR
                    # -------------------------------------------------------------
                    elif "guitar" in inst:
                        # Travis / fingerstyle arpeggiation pattern
                        base_vel = int(68 + sec.energy * 24)
                        # Alternating thumb bass on beat 0 and 2
                        notes.append(Note(pitch=c_root - 12, start_beat=bar_beat + 0.0, duration_beats=1.5, velocity=base_vel + 6))
                        notes.append(Note(pitch=c_root - 5, start_beat=bar_beat + 2.0, duration_beats=1.5, velocity=base_vel + 2))
                        # Plucked upper strings on eighth notes
                        plucks = [(0.5, triad[0]), (1.0, triad[1]), (1.5, triad[2]), (2.5, triad[1]), (3.0, triad[2]), (3.5, triad[0] + 12)]
                        for offset_b, pitch in plucks:
                            notes.append(Note(
                                pitch=pitch,
                                start_beat=bar_beat + offset_b,
                                duration_beats=0.45,
                                velocity=base_vel - rng.randint(4, 10)
                            ))

                    # -------------------------------------------------------------
                    # 3. ORCHESTRAL STRINGS (Violin, Cello, Ensemble)
                    # -------------------------------------------------------------
                    elif "string" in inst or "violin" in inst or "cello" in inst:
                        # Lush multi-voice polyphony with voice leading and swell dynamics
                        vel = int(58 + sec.energy * 38)
                        if sec.energy > 0.7:
                            # Rich climax with octave doubling
                            voicing = [c_root, triad[0], triad[1], triad[2], c_root + 24]
                        else:
                            voicing = [c_root, triad[1], triad[2]]

                        for pitch in voicing:
                            notes.append(Note(
                                pitch=pitch,
                                start_beat=bar_beat,
                                duration_beats=4.0,
                                velocity=vel
                            ))

                    # -------------------------------------------------------------
                    # 4. ELECTRIC PIANO / RHODES
                    # -------------------------------------------------------------
                    elif "electric_piano" in inst or "rhodes" in inst:
                        # Warm, lush 7th voicings with syncopated comping
                        base_vel = int(65 + sec.energy * 25)
                        seventh_chord = triad + [triad[0] + 10]
                        # Downbeat chord
                        for p in seventh_chord:
                            notes.append(Note(pitch=p, start_beat=bar_beat + 0.0, duration_beats=2.2, velocity=base_vel))
                        # Offbeat color touch
                        for p in seventh_chord[:2]:
                            notes.append(Note(pitch=p + 12, start_beat=bar_beat + 2.5, duration_beats=1.2, velocity=base_vel - 8))

                    # -------------------------------------------------------------
                    # 5. ORGAN
                    # -------------------------------------------------------------
                    elif "organ" in inst:
                        # Full drawbar sustain
                        base_vel = int(70 + sec.energy * 25)
                        for p in [c_root - 12] + triad:
                            notes.append(Note(pitch=p, start_beat=bar_beat, duration_beats=4.0, velocity=base_vel))

                    # -------------------------------------------------------------
                    # 6. MARIMBA / MALLET
                    # -------------------------------------------------------------
                    elif "marimba" in inst or "xylophone" in inst or "bell" in inst:
                        base_vel = int(70 + sec.energy * 25)
                        # Ostinato eighth-note arpeggiated rolls
                        arpeggio = [triad[0], triad[1], triad[2], triad[1], triad[0] + 12, triad[2], triad[1], triad[0]]
                        for step_idx, pitch in enumerate(arpeggio):
                            notes.append(Note(
                                pitch=pitch + 12,
                                start_beat=bar_beat + (step_idx * 0.5),
                                duration_beats=0.35,
                                velocity=base_vel - (step_idx % 2) * 8
                            ))

                    # -------------------------------------------------------------
                    # 7. ATMOSPHERIC PAD / SYNTH PAD
                    # -------------------------------------------------------------
                    elif "pad" in inst or role == "harmony":
                        # Sustained warm chord bed
                        velocity = int(52 + sec.energy * 30)
                        for pitch in triad:
                            notes.append(Note(
                                pitch=pitch,
                                start_beat=bar_beat,
                                duration_beats=4.0,
                                velocity=velocity
                            ))

                    # -------------------------------------------------------------
                    # 8. BASS (Bass Pulse / Sub Bass)
                    # -------------------------------------------------------------
                    elif role == "bass" or "bass" in inst:
                        bass_root = c_root - 12
                        if sec.energy < 0.5:
                            # Soothing, warm half-note bass
                            vel = int(65 + sec.energy * 25)
                            notes.append(Note(pitch=bass_root, start_beat=bar_beat + 0.0, duration_beats=2.0, velocity=vel))
                            notes.append(Note(pitch=bass_root + 7, start_beat=bar_beat + 2.0, duration_beats=1.8, velocity=vel - 6))
                        elif sec.energy >= 0.75:
                            # High-energy driving 16th/8th octave pulse
                            vel = int(80 + sec.energy * 35)
                            pulse_step = 0.5
                            num_pulses = int(4.0 / pulse_step)
                            for p in range(num_pulses):
                                # Octave jump on alternating pulses
                                p_pitch = bass_root + (12 if p % 2 == 1 else 0)
                                notes.append(Note(
                                    pitch=p_pitch,
                                    start_beat=bar_beat + (p * pulse_step),
                                    duration_beats=pulse_step * 0.85,
                                    velocity=vel if p % 2 == 0 else vel - 8
                                ))
                        else:
                            # Groovy syncopated bass
                            vel = int(72 + sec.energy * 30)
                            groove = [(0.0, 1.2, bass_root), (1.5, 0.7, bass_root + 7), (2.5, 0.4, bass_root), (3.0, 0.8, bass_root + 12)]
                            for s_beat, d_beat, p in groove:
                                notes.append(Note(pitch=p, start_beat=bar_beat + s_beat, duration_beats=d_beat, velocity=vel))

                    # -------------------------------------------------------------
                    # 9. LEAD MELODY & FLUTE
                    # -------------------------------------------------------------
                    elif role == "melody" or "lead" in inst or "flute" in inst:
                        # Structured Phrase-Based Melodic Generator
                        # Antecedent (Bars 0-1) -> Consequent (Bars 2-3) phrasing
                        bar_in_phrase = bar_idx % 4
                        mel_root = root_midi + (24 if "flute" in inst else 24)
                        vel = int(68 + sec.energy * 40)

                        # Select candidate chord tones and scale neighbors
                        c_tones = [c_root + 12, triad[1], triad[2], c_root + 24]
                        
                        # Musical ornamentation and variation seeded by rng
                        ornament1 = rng.choice([0, 2, -2, 4, -1])
                        ornament2 = rng.choice([0, 3, -2, 5, -3])

                        if bar_in_phrase == 0:
                            # Opening motif: starts on strong chord tone, ascends
                            notes.append(Note(pitch=c_tones[0], start_beat=bar_beat + 0.0, duration_beats=1.0, velocity=vel + 5))
                            notes.append(Note(pitch=c_tones[1] + ornament1, start_beat=bar_beat + 1.0, duration_beats=0.75, velocity=vel))
                            notes.append(Note(pitch=c_tones[2], start_beat=bar_beat + 2.0, duration_beats=1.5, velocity=vel + 2))
                        elif bar_in_phrase == 1:
                            # Half-cadence (question): active tone with pause
                            notes.append(Note(pitch=c_tones[2] + ornament2, start_beat=bar_beat + 0.0, duration_beats=0.75, velocity=vel))
                            notes.append(Note(pitch=c_tones[1], start_beat=bar_beat + 1.0, duration_beats=1.0, velocity=vel - 4))
                            notes.append(Note(pitch=c_tones[0] + 7, start_beat=bar_beat + 2.5, duration_beats=1.2, velocity=vel))
                        elif bar_in_phrase == 2:
                            # Climax / variation leap
                            high_tone = c_tones[2] + (12 if sec.energy > 0.7 else 2) + ornament1
                            notes.append(Note(pitch=high_tone, start_beat=bar_beat + 0.0, duration_beats=1.25, velocity=vel + 8))
                            notes.append(Note(pitch=c_tones[2], start_beat=bar_beat + 1.5, duration_beats=0.5, velocity=vel))
                            notes.append(Note(pitch=c_tones[1] + ornament2, start_beat=bar_beat + 2.25, duration_beats=0.75, velocity=vel))
                            notes.append(Note(pitch=c_tones[0], start_beat=bar_beat + 3.0, duration_beats=0.9, velocity=vel))
                        else:
                            # Resolution: descending back to tonic root
                            notes.append(Note(pitch=c_tones[1] + ornament1, start_beat=bar_beat + 0.0, duration_beats=1.0, velocity=vel))
                            notes.append(Note(pitch=c_tones[0], start_beat=bar_beat + 1.5, duration_beats=2.2, velocity=vel - 4))

                    # -------------------------------------------------------------
                    # 10. PERCUSSION
                    # -------------------------------------------------------------
                    elif role == "percussion" or "drum" in inst or "percussion" in inst:
                        vel = int(75 + sec.energy * 42)

                        # Ambient / Soothing guard: Do NOT blast drums in soothing pieces
                        is_soothing = sec.energy < 0.40 or any(w in plan.title.lower() for w in ["soothing", "lullaby", "ambient", "peaceful"])

                        if not is_soothing:
                            # Kick drum (pitch 36)
                            if sec.energy > 0.4:
                                notes.append(Note(pitch=36, start_beat=bar_beat + 0.0, duration_beats=0.25, velocity=vel))
                                notes.append(Note(pitch=36, start_beat=bar_beat + 2.0, duration_beats=0.25, velocity=vel))
                                if sec.energy > 0.75:
                                    # Four-on-the-floor during energetic peaks
                                    notes.append(Note(pitch=36, start_beat=bar_beat + 1.0, duration_beats=0.25, velocity=vel))
                                    notes.append(Note(pitch=36, start_beat=bar_beat + 3.0, duration_beats=0.25, velocity=vel))

                            # Snare drum (pitch 38) on beats 1 and 3
                            if sec.energy > 0.45:
                                notes.append(Note(pitch=38, start_beat=bar_beat + 1.0, duration_beats=0.25, velocity=vel))
                                notes.append(Note(pitch=38, start_beat=bar_beat + 3.0, duration_beats=0.25, velocity=vel))

                            # Closed Hi-Hat (pitch 42) on eighth notes
                            if sec.energy > 0.35:
                                for h in range(8):
                                    notes.append(Note(
                                        pitch=42,
                                        start_beat=bar_beat + (h * 0.5),
                                        duration_beats=0.1,
                                        velocity=vel - 12
                                    ))
                        else:
                            # Ultra-delicate shaker texture only during build/climax if energy allows
                            if sec.energy > 0.38:
                                notes.append(Note(pitch=42, start_beat=bar_beat + 1.0, duration_beats=0.08, velocity=38))
                                notes.append(Note(pitch=42, start_beat=bar_beat + 3.0, duration_beats=0.08, velocity=38))

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
