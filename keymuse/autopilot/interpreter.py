"""Music Brief Interpreter: Converts natural-language instructions into validated MusicBrief."""

import re
from typing import Optional, Dict, Any, List
from keymuse.models.brief import MusicBrief, UserConstraints, InferredChoices


class MusicBriefInterpreter:
    """Interprets and extracts structured composition parameters from natural language."""

    def __init__(self, default_seed: int = 42):
        self.default_seed = default_seed

    def interpret(self, text: str, constraints: Optional[UserConstraints] = None, seed: Optional[int] = None) -> MusicBrief:
        """Parse natural language brief text into a validated MusicBrief."""
        inferred = InferredChoices()
        text_lower = text.lower()

        # 1. Target Duration
        duration = 60.0
        dur_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-| )?\s*(?:sec|second|seconds|s\b)", text_lower)
        if dur_match:
            duration = float(dur_match.group(1))
        elif "minute" in text_lower:
            min_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-| )?\s*(?:min|minute|minutes|m\b)", text_lower)
            if min_match:
                duration = float(min_match.group(1)) * 60.0
        else:
            inferred.inferred_tempo = False

        # 2. Tempo (BPM)
        tempo = 90.0
        bpm_match = re.search(r"(\d+)\s*(?:bpm|beats per minute)", text_lower)
        if bpm_match:
            tempo = float(bpm_match.group(1))
        elif re.search(r"tempo\s*(\d+)", text_lower):
            t_match = re.search(r"tempo\s*(\d+)", text_lower)
            if t_match:
                tempo = float(t_match.group(1))
        else:
            inferred.inferred_tempo = True

        # 3. Key and Mode
        key = "D"
        mode = "minor"
        key_match = re.search(r"\b([a-g][#b]?)\s+(minor|major|dorian|phrygian|mixolydian|lydian|blues)\b", text_lower)
        if key_match:
            key = key_match.group(1).capitalize()
            mode = key_match.group(2).lower()
        else:
            # Check solitary key or mode
            if "major" in text_lower and "minor" not in text_lower:
                mode = "major"
                inferred.inferred_mode = True
            elif "minor" in text_lower:
                mode = "minor"
                inferred.inferred_mode = True
            
            single_key = re.search(r"\b(?:in|key of)\s+([a-g][#b]?)\b", text_lower)
            if single_key:
                key = single_key.group(1).capitalize()
            else:
                inferred.inferred_key = True

        # 4. Genre & Subgenre
        genre = "cinematic"
        subgenre = "sci-fi"
        if "sci-fi" in text_lower or "scifi" in text_lower:
            genre = "cinematic"
            subgenre = "sci-fi"
        elif "electronic" in text_lower or "synthwave" in text_lower or "techno" in text_lower:
            genre = "electronic"
            subgenre = "synthwave" if "synthwave" in text_lower else "techno"
        elif "ambient" in text_lower or "chill" in text_lower:
            genre = "ambient"
            subgenre = "atmospheric"
        elif "orchestral" in text_lower or "classical" in text_lower:
            genre = "orchestral"
            subgenre = "symphonic"

        # 5. Instrumentation
        instruments = []
        if "pad" in text_lower:
            instruments.append("atmospheric_pad")
        if "bass" in text_lower:
            instruments.append("bass_pulse")
        if "percussion" in text_lower or "drum" in text_lower or "drums" in text_lower:
            instruments.append("percussion")
        if "lead" in text_lower or "melody" in text_lower:
            instruments.append("lead_melody")
        if "piano" in text_lower:
            instruments.append("piano")
        if "strings" in text_lower or "string" in text_lower:
            instruments.append("orchestral_strings")

        if not instruments:
            instruments = ["atmospheric_pad", "bass_pulse", "percussion", "lead_melody"]
            inferred.inferred_instruments = True

        # 6. Structure
        structure = []
        if "start mysteriously" in text_lower or "mysterious" in text_lower or "intro" in text_lower:
            structure.append("intro")
        if "build" in text_lower or "tension" in text_lower:
            structure.append("build")
        if "climax" in text_lower or "powerful" in text_lower or "drop" in text_lower:
            structure.append("climax")
        if "finish" in text_lower or "resolved" in text_lower or "ending" in text_lower or "outro" in text_lower:
            structure.append("resolution")

        if len(structure) < 2:
            structure = ["intro", "build", "climax", "resolution"]
            inferred.inferred_structure = True

        # 7. Energy
        energy = 0.7
        if "high energy" in text_lower or "explosive" in text_lower:
            energy = 0.9
        elif "calm" in text_lower or "gentle" in text_lower or "subtle" in text_lower:
            energy = 0.4

        actual_seed = seed if seed is not None else self.default_seed

        return MusicBrief(
            description=text.strip(),
            genre=genre,
            subgenre=subgenre,
            mood="mysterious, tense, powerful",
            energy=energy,
            target_duration=duration,
            tempo=tempo,
            key=key,
            mode=mode,
            desired_instruments=instruments,
            track_count=max(len(instruments), 4),
            arrangement_structure=structure,
            opening="atmospheric introduction",
            ending="clean, resolved finish",
            constraints=constraints or UserConstraints(),
            inferred=inferred,
            seed=actual_seed
        )
