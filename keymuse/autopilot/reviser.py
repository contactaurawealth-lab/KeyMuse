"""Targeted Revision Engine: Analyzes audio/project defects and applies surgical modifications."""

from typing import List, Tuple
from keymuse.models.project import KeyMuseProject, Track, Note, Section
from keymuse.models.analysis import AudioAnalysisResult, MusicalAnalysisResult
from keymuse.models.revision import RevisionPlan, EditAction, RevisionRecord


class RevisionPlanner:
    """Plans and applies targeted revisions to eliminate detected audio/musical defects."""

    def __init__(self):
        pass

    def evaluate_and_revise(
        self,
        project: KeyMuseProject,
        analysis: AudioAnalysisResult,
        iteration: int = 1,
        target_duration: float = 60.0,
        max_peak_db: float = -0.5
    ) -> Tuple[KeyMuseProject, RevisionPlan]:
        """Inspect analysis findings, formulate revision plan, and apply edits to project."""
        issues: List[str] = []
        edits: List[EditAction] = []

        # 1. Anti-Clipping Check
        if analysis.clipping_risk or analysis.peak_db > max_peak_db:
            issues.append(f"Peak amplitude ({analysis.peak_db:.2f} dBFS) exceeds safe ceiling ({max_peak_db:.2f} dBFS).")
            # Calculate required attenuation factor
            overshoot_db = max(1.0, analysis.peak_db - max_peak_db)
            gain_factor = round(10.0 ** (-overshoot_db / 20.0), 3)
            edits.append(EditAction(
                action_type="adjust_volume",
                target="all_tracks",
                parameters={"gain_factor": min(0.85, gain_factor)}
            ))

        # 2. Duration Deviation Check
        dur_diff = abs(analysis.duration_seconds - target_duration)
        if dur_diff > 4.0:
            issues.append(f"Rendered duration ({analysis.duration_seconds:.1f}s) deviates from target ({target_duration:.1f}s).")
            ratio = target_duration / max(1.0, analysis.duration_seconds)
            edits.append(EditAction(
                action_type="adjust_duration",
                target="timeline",
                parameters={"scale_factor": round(ratio, 3)}
            ))

        # 3. Trailing Silence / Abrupt Ending
        if analysis.end_silence_seconds < 0.2:
            issues.append("Trailing decay cuts off abruptly before clean resolution.")
            edits.append(EditAction(
                action_type="add_ending",
                target="outro",
                parameters={"sustain_beats": 4.0, "decay_velocity": 50}
            ))

        # If no issues were detected, make an optional aesthetic polish revision
        if not edits:
            edits.append(EditAction(
                action_type="adjust_volume",
                target="all_tracks",
                parameters={"gain_factor": 0.95, "polish": True}
            ))
            issues.append("Optional master dynamic balance polish.")

        plan = RevisionPlan(
            iteration=iteration,
            reason=f"Addressed {len(issues)} detected audio/musical constraints.",
            detected_issues=issues,
            edits=edits
        )

        revised_project = self.apply_edits(project, edits)
        return revised_project, plan

    def apply_edits(self, project: KeyMuseProject, edits: List[EditAction]) -> KeyMuseProject:
        """Apply a sequence of discrete edits to a KeyMuseProject."""
        # Create a deep copy via model_copy
        revised = project.model_copy(deep=True)
        revised.version += 1

        for edit in edits:
            act = edit.action_type
            params = edit.parameters

            if act == "adjust_volume":
                factor = params.get("gain_factor", 0.9)
                if edit.target == "all_tracks":
                    for t in revised.tracks:
                        t.volume = round(max(0.1, min(1.0, t.volume * factor)), 3)
                else:
                    for t in revised.tracks:
                        if t.id == edit.target:
                            t.volume = round(max(0.1, min(1.0, t.volume * factor)), 3)

            elif act == "adjust_duration":
                scale = params.get("scale_factor", 1.0)
                # Adjust tempo proportionally to hit duration target cleanly
                revised.bpm = round(max(40.0, min(240.0, revised.bpm / scale)), 1)

            elif act == "add_ending":
                sustain_beats = params.get("sustain_beats", 4.0)
                # Find maximum beat in project
                max_beat = max((n.start_beat + n.duration_beats for t in revised.tracks for n in t.notes), default=0.0)
                # Add final resolve chord on pad track
                pad_track = next((t for t in revised.tracks if "pad" in t.instrument.lower()), None)
                if pad_track:
                    # Final root chord
                    pad_track.notes.append(Note(
                        pitch=50,  # D3
                        start_beat=max_beat,
                        duration_beats=sustain_beats,
                        velocity=params.get("decay_velocity", 50)
                    ))
                    pad_track.notes.append(Note(
                        pitch=57,  # A3
                        start_beat=max_beat,
                        duration_beats=sustain_beats,
                        velocity=params.get("decay_velocity", 50)
                    ))

        return revised
