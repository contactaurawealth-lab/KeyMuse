"""Composition Planner: Converts MusicBrief into a structured CompositionPlan."""

import math
from typing import List, Dict, Any, Optional
from keymuse.models.brief import MusicBrief
from keymuse.models.plan import CompositionPlan, SectionPlan, TrackPlan


class CompositionPlanner:
    """Plans musical structure, track roles, and section progression."""

    def __init__(self):
        pass

    def plan(self, brief: MusicBrief) -> CompositionPlan:
        """Generate a structured, bar-aligned CompositionPlan from a MusicBrief."""
        beats_per_minute = brief.tempo
        seconds_per_beat = 60.0 / beats_per_minute
        beats_per_bar = 4.0  # Assuming 4/4 default

        # Bar-aligned total beats calculation
        raw_beats = brief.target_duration / seconds_per_beat
        total_bars = max(4, round(raw_beats / beats_per_bar))
        total_beats = total_bars * beats_per_bar
        actual_duration_seconds = total_beats * seconds_per_beat

        # 1. Plan Tracks
        tracks = self._plan_tracks(brief.desired_instruments)
        all_track_ids = [t.track_id for t in tracks]

        # 2. Plan Sections
        sections = self._plan_sections(
            structure=brief.arrangement_structure,
            total_bars=total_bars,
            beats_per_bar=beats_per_bar,
            tracks=tracks
        )

        return CompositionPlan(
            brief_id="brief-" + str(abs(hash(brief.description)) % 100000),
            title=f"{brief.genre.capitalize()} {brief.subgenre.capitalize()} in {brief.key} {brief.mode}",
            tempo=brief.tempo,
            key=brief.key,
            mode=brief.mode,
            time_signature=brief.time_signature,
            total_duration_seconds=actual_duration_seconds,
            total_beats=total_beats,
            sections=sections,
            tracks=tracks,
            seed=brief.seed
        )

    def _plan_tracks(self, desired_instruments: List[str]) -> List[TrackPlan]:
        tracks: List[TrackPlan] = []
        pan_positions = [-0.3, 0.0, 0.25, -0.1, 0.35, -0.25]

        for i, inst in enumerate(desired_instruments):
            pan = pan_positions[i % len(pan_positions)]
            inst_lower = inst.lower()

            if "pad" in inst_lower:
                tracks.append(TrackPlan(
                    track_id="track_pad",
                    name="Atmospheric Pad",
                    instrument="atmospheric_pad",
                    role="harmony",
                    pitch_register="mid",
                    polyphony_limit=4,
                    volume=0.75,
                    pan=-0.25
                ))
            elif "bass" in inst_lower:
                tracks.append(TrackPlan(
                    track_id="track_bass",
                    name="Bass Pulse",
                    instrument="bass_pulse",
                    role="bass",
                    pitch_register="low",
                    polyphony_limit=1,
                    volume=0.85,
                    pan=0.0
                ))
            elif "percussion" in inst_lower or "drum" in inst_lower:
                tracks.append(TrackPlan(
                    track_id="track_percussion",
                    name="Percussion",
                    instrument="percussion",
                    role="percussion",
                    pitch_register="full",
                    polyphony_limit=8,
                    volume=0.80,
                    pan=0.0
                ))
            elif "lead" in inst_lower or "melody" in inst_lower:
                tracks.append(TrackPlan(
                    track_id="track_lead",
                    name="Lead Melody",
                    instrument="lead_melody",
                    role="melody",
                    pitch_register="high",
                    polyphony_limit=2,
                    volume=0.85,
                    pan=0.15
                ))
            elif "piano" in inst_lower:
                tracks.append(TrackPlan(
                    track_id=f"track_piano_{i}",
                    name="Acoustic Piano",
                    instrument="piano",
                    role="harmony",
                    pitch_register="mid",
                    polyphony_limit=6,
                    volume=0.8,
                    pan=pan
                ))
            else:
                tracks.append(TrackPlan(
                    track_id=f"track_{inst_lower}_{i}",
                    name=inst.replace("_", " ").title(),
                    instrument=inst_lower,
                    role="harmony",
                    pitch_register="mid",
                    polyphony_limit=4,
                    volume=0.75,
                    pan=pan
                ))

        if not tracks:
            tracks.append(TrackPlan(
                track_id="track_pad",
                name="Atmospheric Pad",
                instrument="atmospheric_pad",
                role="harmony",
                pitch_register="mid",
                polyphony_limit=4,
                volume=0.75,
                pan=0.0
            ))
        return tracks

    def _plan_sections(
        self,
        structure: List[str],
        total_bars: int,
        beats_per_bar: float,
        tracks: List[TrackPlan]
    ) -> List[SectionPlan]:
        num_sections = max(1, len(structure))
        # Default distribution proportions for 4 common sections: Intro (20%), Build (30%), Climax (35%), Resolution (15%)
        proportions = {
            "intro": 0.20,
            "build": 0.30,
            "climax": 0.35,
            "resolution": 0.15,
            "outro": 0.15,
            "verse": 0.25,
            "chorus": 0.35,
            "drop": 0.35
        }

        raw_weights = [proportions.get(s.lower(), 1.0 / num_sections) for s in structure]
        sum_weights = sum(raw_weights)
        norm_weights = [w / sum_weights for w in raw_weights]

        bar_counts: List[int] = []
        allocated_bars = 0
        for i, weight in enumerate(norm_weights):
            if i == len(norm_weights) - 1:
                bars = max(1, total_bars - allocated_bars)
            else:
                bars = max(1, round(total_bars * weight))
                allocated_bars += bars
            bar_counts.append(bars)

        # Ensure sum matches total_bars
        diff = total_bars - sum(bar_counts)
        if diff != 0:
            bar_counts[-2 if len(bar_counts) > 1 else 0] += diff

        sections: List[SectionPlan] = []
        current_beat = 0.0

        track_ids = {t.role: t.track_id for t in tracks}
        all_ids = [t.track_id for t in tracks]

        for idx, s_name in enumerate(structure):
            bars = bar_counts[idx]
            length_beats = bars * beats_per_bar
            name_lower = s_name.lower()

            if "intro" in name_lower:
                energy = 0.3
                dyn = "p"
                # Intro: pad + optional light melodic hint
                active = [t.track_id for t in tracks if t.role in ("harmony", "pad")]
                transition = "fade_in"
            elif "build" in name_lower:
                energy = 0.6
                dyn = "mf"
                # Build: pad + bass + light percussion
                active = [t.track_id for t in tracks if t.role in ("harmony", "bass", "percussion")]
                transition = "swell"
            elif "climax" in name_lower or "drop" in name_lower or "chorus" in name_lower:
                energy = 0.95
                dyn = "ff"
                # Climax: all tracks active
                active = all_ids
                transition = "drop" if "climax" in name_lower else "sudden"
            elif "resolution" in name_lower or "outro" in name_lower:
                energy = 0.35
                dyn = "mp"
                # Resolution: pad + lead fading out
                active = [t.track_id for t in tracks if t.role in ("harmony", "melody")]
                transition = "ritardando"
            else:
                energy = 0.5
                dyn = "mf"
                active = all_ids
                transition = "normal"

            if not active:
                active = all_ids[:2]

            sections.append(SectionPlan(
                name=s_name.capitalize(),
                start_beat=current_beat,
                length_beats=length_beats,
                energy=energy,
                dynamic_level=dyn,
                active_track_ids=active,
                transition_type=transition
            ))
            current_beat += length_beats

        return sections
