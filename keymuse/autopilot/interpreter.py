"""Music Brief Interpreter: Robust Natural Language Processing for Music Composition Briefs."""

import re
from typing import Optional, Dict, Any, List
from keymuse.models.brief import MusicBrief, UserConstraints, InferredChoices


class MusicBriefInterpreter:
    """Interprets and extracts structured composition parameters from natural language prompts."""

    def __init__(self, default_seed: int = 42):
        self.default_seed = default_seed

    def interpret(self, text: str, constraints: Optional[UserConstraints] = None, seed: Optional[int] = None) -> MusicBrief:
        """Parse natural language brief text into a validated MusicBrief."""
        inferred = InferredChoices()
        text_lower = text.lower().strip()
        actual_constraints = constraints.model_copy(deep=True) if constraints else UserConstraints()

        # ---------------------------------------------------------
        # 1. Negative Constraints & Explicit Restrictions
        # ---------------------------------------------------------
        explicit_restrictions: List[str] = []
        banned_set = set(actual_constraints.banned_instruments)

        neg_patterns = [
            (r"\b(?:without|no|exclude|excluding|banned|omit)\s+(?:drums|percussion|beats?|grooves?)\b", "percussion", "no drums or percussion"),
            (r"\b(?:without|no|exclude|excluding|banned|omit)\s+(?:bass|basslines?|sub bass)\b", "bass_pulse", "no bass"),
            (r"\b(?:without|no|exclude|excluding|banned|omit)\s+(?:synths?|synthesizers?|pads?)\b", "atmospheric_pad", "no synthesizers or pads"),
            (r"\b(?:without|no|exclude|excluding|banned|omit)\s+(?:strings?|violins?|cellos?)\b", "orchestral_strings", "no strings"),
            (r"\b(?:without|no|exclude|excluding|banned|omit)\s+(?:pianos?|keys?)\b", "piano", "no piano"),
            (r"\b(?:without|no|exclude|excluding|banned|omit)\s+(?:guitars?)\b", "guitar", "no guitar"),
            (r"\bacoustic only\b", "atmospheric_pad", "acoustic only (no synths)"),
            (r"\bno drums\b", "percussion", "no drums")
        ]

        text_for_positive_matching = text_lower
        for pattern, instrument_name, restriction_desc in neg_patterns:
            if re.search(pattern, text_lower):
                banned_set.add(instrument_name)
                explicit_restrictions.append(restriction_desc)
                # Mask out negative phrasing so it doesn't trigger positive keyword detection
                text_for_positive_matching = re.sub(pattern, " ", text_for_positive_matching)

        actual_constraints.banned_instruments = list(banned_set)

        # ---------------------------------------------------------
        # 2. Target Duration
        # ---------------------------------------------------------
        duration = 60.0
        dur_found = False

        # Numeric with unit: "60s", "45 sec", "30-second", "90 seconds"
        dur_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-| )?\s*(?:sec|second|seconds|s\b)", text_lower)
        # Word numbers or minute phrases
        min_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:-| )?\s*(?:min|minute|minutes|m\b)", text_lower)
        # Lone number near song/piece/tune/lullaby: e.g. "a 60 soothing tune", "30s track", "a 45 piece"
        lone_dur_match = re.search(
            r"\b(?:a|an|make|compose|create)?\s*(\d+)\s*(?:-| )?(?:sec|second|s)?\s*(?:[a-z]+\s+)?(?:tune|piece|track|song|lullaby|beat|loop|composition|soundtrack)\b",
            text_lower
        )

        word_min_map = {"half": 30.0, "one": 60.0, "two": 120.0, "three": 180.0, "four": 240.0, "five": 300.0}
        word_min_match = re.search(r"\b(half|one|two|three|four|five)\s*(?:-| )?min(?:ute)?s?\b", text_lower)
        word_sec_map = {"ten": 10.0, "fifteen": 15.0, "twenty": 20.0, "thirty": 30.0, "forty-five": 45.0, "sixty": 60.0, "ninety": 90.0}
        word_sec_match = re.search(r"\b(ten|fifteen|twenty|thirty|forty-five|sixty|ninety)\s*(?:-| )?sec(?:ond)?s?\b", text_lower)

        if dur_match:
            duration = float(dur_match.group(1))
            dur_found = True
        elif lone_dur_match and 5 <= float(lone_dur_match.group(1)) <= 300:
            duration = float(lone_dur_match.group(1))
            dur_found = True
        elif min_match:
            duration = float(min_match.group(1)) * 60.0
            dur_found = True
        elif word_min_match:
            duration = word_min_map[word_min_match.group(1)]
            dur_found = True
        elif word_sec_match:
            duration = word_sec_map[word_sec_match.group(1)]
            dur_found = True
        elif "half a minute" in text_lower or "thirty seconds" in text_lower:
            duration = 30.0
            dur_found = True
        elif "a minute" in text_lower:
            duration = 60.0
            dur_found = True
        elif "short" in text_lower or "quick" in text_lower:
            duration = 30.0
            dur_found = True
        elif "long" in text_lower or "extended" in text_lower:
            duration = 90.0
            dur_found = True

        if not dur_found:
            inferred.inferred_duration = True

        duration = max(5.0, min(300.0, duration))

        # ---------------------------------------------------------
        # 3. Tempo (BPM)
        # ---------------------------------------------------------
        tempo = 90.0
        bpm_match = re.search(r"(\d+)\s*(?:bpm|beats per minute)", text_lower)
        at_match = re.search(r"\bat\s+(\d{2,3})\s*(?:bpm|\b)", text_lower)
        tempo_kw_match = re.search(r"tempo\s*(?:of\s*)?(\d+)", text_lower)

        if bpm_match:
            tempo = float(bpm_match.group(1))
            inferred.inferred_tempo = False
        elif tempo_kw_match:
            tempo = float(tempo_kw_match.group(1))
            inferred.inferred_tempo = False
        elif at_match and 40 <= int(at_match.group(1)) <= 220:
            tempo = float(at_match.group(1))
            inferred.inferred_tempo = False
        elif any(w in text_lower for w in ["drum and bass", "dnb"]):
            tempo = 172.0
            inferred.inferred_tempo = True
        elif any(w in text_lower for w in ["soothing", "lullaby", "relaxing", "peaceful", "calm", "gentle", "chill", "sleep", "meditation", "slow", "adagio", "largo"]):
            tempo = 70.0
            inferred.inferred_tempo = True
        elif any(w in text_lower for w in ["lofi", "lo-fi", "chillhop", "ballad", "andante"]):
            tempo = 82.0
            inferred.inferred_tempo = True
        elif any(w in text_lower for w in ["upbeat", "lively", "bouncy", "dance", "pop", "allegro"]):
            tempo = 120.0
            inferred.inferred_tempo = True
        elif any(w in text_lower for w in ["fast", "energetic", "high energy", "driving", "rush", "presto", "techno", "cyberpunk"]):
            tempo = 135.0
            inferred.inferred_tempo = True
        else:
            inferred.inferred_tempo = True

        tempo = max(40.0, min(240.0, tempo))

        # ---------------------------------------------------------
        # 4. Key and Mode
        # ---------------------------------------------------------
        key = "D"
        mode = "minor"

        # Normalize words like "b flat" -> "bb", "c sharp" -> "c#", "eb"
        norm_text = re.sub(r"\b([a-g])\s+flat\b", r"\1b", text_lower)
        norm_text = re.sub(r"\b([a-g])\s+sharp\b", r"\1#", norm_text)

        key_mode_match = re.search(
            r"\b([a-g][#b]?)\s+(minor|major|dorian|phrygian|mixolydian|lydian|blues|pentatonic)\b",
            norm_text
        )
        abbr_match = re.search(r"\b([a-g][#b]?)(maj|min|m)\b", norm_text)

        if key_mode_match:
            key = key_mode_match.group(1).capitalize()
            mode = key_mode_match.group(2).lower()
            inferred.inferred_key = False
            inferred.inferred_mode = False
        elif abbr_match:
            key = abbr_match.group(1).capitalize()
            mode = "major" if abbr_match.group(2) == "maj" else "minor"
            inferred.inferred_key = False
            inferred.inferred_mode = False
        else:
            # Check solitary key root
            single_key = re.search(r"\b(?:in key of|in the key of|key of|key:\s*|in)\s+([a-g][#b]?)\b", norm_text)
            if single_key:
                key = single_key.group(1).capitalize()
                inferred.inferred_key = False
            else:
                inferred.inferred_key = True

            # Determine mode from explicit mode words or emotional mood cues
            major_cues = ["happy", "cheerful", "uplifting", "joyful", "bright", "hopeful", "triumphant", "peaceful", "soothing", "lullaby", "gentle", "serene", "sweet", "sunny"]
            minor_cues = ["sad", "dark", "gloomy", "sorrowful", "melancholic", "melancholy", "dramatic", "scary", "spooky", "horror", "tense", "aggressive", "cyberpunk", "sci-fi"]
            blues_cues = ["blues", "bluesy", "soulful", "funky"]
            modal_cues = ["dorian", "floating", "space", "ethereal", "mystic"]

            if any(c in text_lower for c in blues_cues):
                mode = "blues"
                inferred.inferred_mode = True
            elif any(c in text_lower for c in major_cues) and not any(c in text_lower for c in minor_cues):
                mode = "major"
                inferred.inferred_mode = True
            elif any(c in text_lower for c in minor_cues):
                mode = "minor"
                inferred.inferred_mode = True
            elif any(c in text_lower for c in modal_cues):
                mode = "dorian"
                inferred.inferred_mode = True
            elif "major" in text_lower and "minor" not in text_lower:
                mode = "major"
                inferred.inferred_mode = False
            elif "minor" in text_lower:
                mode = "minor"
                inferred.inferred_mode = False
            else:
                inferred.inferred_mode = True

            # If key wasn't explicitly given, pick harmonic default
            if inferred.inferred_key:
                key = "C" if mode == "major" else "D"

        # ---------------------------------------------------------
        # 5. Genre & Subgenre (Ordered by Specificity)
        # ---------------------------------------------------------
        genre = "cinematic"
        subgenre = "sci-fi"

        if any(w in text_lower for w in ["cinematic", "sci-fi", "scifi", "soundtrack", "film score", "movie score", "action score"]):
            genre = "cinematic"
            subgenre = "sci-fi" if ("sci-fi" in text_lower or "scifi" in text_lower) else "soundtrack"
        elif any(w in text_lower for w in ["cyberpunk", "synthwave", "techno", "electronic", "edm", "electro", "house", "trance", "dance", "drum and bass", "dnb"]):
            genre = "electronic"
            if "cyberpunk" in text_lower:
                subgenre = "cyberpunk"
            elif "synthwave" in text_lower:
                subgenre = "synthwave"
            elif "drum and bass" in text_lower or "dnb" in text_lower:
                subgenre = "drum and bass"
            elif "techno" in text_lower:
                subgenre = "techno"
            else:
                subgenre = "dance"
        elif any(w in text_lower for w in ["lofi", "lo-fi", "chillhop"]):
            genre = "lofi"
            subgenre = "chillhop"
        elif any(w in text_lower for w in ["orchestral", "classical", "symphonic", "chamber", "cello", "string quartet", "sonata"]):
            genre = "orchestral"
            subgenre = "chamber" if any(w in text_lower for w in ["cello", "chamber", "quartet", "sonata"]) else "symphonic"
        elif any(w in text_lower for w in ["jazz", "blues", "swing"]):
            genre = "jazz"
            subgenre = "blues" if "blues" in text_lower else "swing"
        elif any(w in text_lower for w in ["acoustic", "folk", "fingerpicking"]):
            genre = "folk"
            subgenre = "acoustic"
        elif any(w in text_lower for w in ["pop", "indie pop"]):
            genre = "pop"
            subgenre = "pop"
        elif any(w in text_lower for w in ["soothing", "lullaby", "sleep", "meditation"]):
            genre = "ambient"
            subgenre = "lullaby"
        elif any(w in text_lower for w in ["ambient", "atmospheric", "chillout", "drone", "space"]):
            genre = "ambient"
            subgenre = "atmospheric"

        # ---------------------------------------------------------
        # 6. Instrumentation & Intelligent Ensemble Formation
        # ---------------------------------------------------------
        matched_instruments: List[str] = []

        # Check positive text
        pos_text = text_for_positive_matching
        if any(w in pos_text for w in ["grand piano", "acoustic piano", "upright piano", "piano", "keys", "keyboard"]):
            matched_instruments.append("piano")
        if any(w in pos_text for w in ["electric piano", "rhodes", "wurlitzer", "tine"]):
            matched_instruments.append("electric_piano")
        if any(w in pos_text for w in ["acoustic guitar", "nylon guitar", "fingerpicking", "plucked guitar", "guitar"]):
            matched_instruments.append("guitar")
        if any(w in pos_text for w in ["strings", "string", "violin", "violins", "cello", "cellos", "orchestra", "quartet", "fiddle"]):
            matched_instruments.append("orchestral_strings")
        if any(w in pos_text for w in ["flute", "woodwind", "pipe", "recorder"]):
            matched_instruments.append("flute")
        if any(w in pos_text for w in ["marimba", "xylophone", "vibraphone", "mallet", "bells", "chime"]):
            matched_instruments.append("marimba")
        if any(w in pos_text for w in ["organ", "tonewheel", "b3", "hammond"]):
            matched_instruments.append("organ")
        if any(w in pos_text for w in ["pad", "pads", "synth pad", "ambient pad", "wash", "atmosphere"]):
            matched_instruments.append("atmospheric_pad")
        if any(w in pos_text for w in ["bass", "bassline", "sub bass", "synth bass", "808"]):
            matched_instruments.append("bass_pulse")
        
        # Check percussion, guarding against "upbeat"
        pos_without_upbeat = re.sub(r"\bupbeat\b", " ", pos_text)
        if re.search(r"\b(?:percussion|drums?|beats?|grooves?|rhythms?|snare|kick|hi-?hats?|cymbals?)\b", pos_without_upbeat):
            matched_instruments.append("percussion")

        if any(w in pos_text for w in ["lead", "melody", "solo", "synth lead", "hook"]):
            matched_instruments.append("lead_melody")

        # Exclude any instruments banned by negative constraints
        matched_instruments = [i for i in matched_instruments if i not in actual_constraints.banned_instruments]

        instruments: List[str] = []
        if matched_instruments:
            instruments = list(dict.fromkeys(matched_instruments))  # Preserve order, deduplicate
            inferred.inferred_instruments = False

            # Complete ensemble into a musically rich 3-4 voice arrangement
            if len(instruments) < 3:
                # Add complementary harmonic or rhythmic texture without violating user brief
                if "piano" in instruments:
                    if "atmospheric_pad" not in instruments and "atmospheric_pad" not in actual_constraints.banned_instruments:
                        instruments.append("atmospheric_pad")
                    if "orchestral_strings" not in instruments and "orchestral_strings" not in actual_constraints.banned_instruments and (genre in ("ambient", "orchestral", "cinematic") or mode == "major"):
                        instruments.append("orchestral_strings")
                    elif "bass_pulse" not in instruments and "bass_pulse" not in actual_constraints.banned_instruments and genre not in ("ambient"):
                        instruments.append("bass_pulse")
                elif "guitar" in instruments:
                    if "atmospheric_pad" not in instruments and "atmospheric_pad" not in actual_constraints.banned_instruments:
                        instruments.append("atmospheric_pad")
                    if "bass_pulse" not in instruments and "bass_pulse" not in actual_constraints.banned_instruments:
                        instruments.append("bass_pulse")
                elif "orchestral_strings" in instruments:
                    if "piano" not in instruments and "piano" not in actual_constraints.banned_instruments:
                        instruments.append("piano")
                    if "atmospheric_pad" not in instruments and "atmospheric_pad" not in actual_constraints.banned_instruments:
                        instruments.append("atmospheric_pad")
                elif "flute" in instruments or "lead_melody" in instruments:
                    if "piano" not in instruments and "piano" not in actual_constraints.banned_instruments:
                        instruments.append("piano")
                    if "atmospheric_pad" not in instruments and "atmospheric_pad" not in actual_constraints.banned_instruments:
                        instruments.append("atmospheric_pad")
                elif "bass_pulse" in instruments:
                    if "atmospheric_pad" not in instruments and "atmospheric_pad" not in actual_constraints.banned_instruments:
                        instruments.append("atmospheric_pad")
                    if "lead_melody" not in instruments and "lead_melody" not in actual_constraints.banned_instruments:
                        instruments.append("lead_melody")
        else:
            inferred.inferred_instruments = True
            # Intelligent ensemble defaults by genre
            if genre == "ambient" or "soothing" in text_lower:
                instruments = ["piano", "atmospheric_pad", "orchestral_strings"]
            elif genre == "electronic":
                instruments = ["bass_pulse", "percussion", "lead_melody", "atmospheric_pad"]
            elif genre == "folk":
                instruments = ["guitar", "atmospheric_pad", "bass_pulse"]
            elif genre == "lofi":
                instruments = ["piano", "bass_pulse", "percussion", "atmospheric_pad"]
            elif genre == "orchestral":
                instruments = ["orchestral_strings", "piano", "atmospheric_pad", "lead_melody"]
            elif genre == "pop":
                instruments = ["piano", "bass_pulse", "percussion", "lead_melody"]
            else:
                instruments = ["atmospheric_pad", "bass_pulse", "percussion", "lead_melody"]

            # Filter banned
            instruments = [i for i in instruments if i not in actual_constraints.banned_instruments]
            if not instruments:
                instruments = ["piano", "atmospheric_pad"]

        # ---------------------------------------------------------
        # 7. Mood
        # ---------------------------------------------------------
        mood_words = []
        candidates = [
            "soothing", "peaceful", "relaxing", "calm", "gentle", "serene", "tranquil", "meditative",
            "happy", "cheerful", "uplifting", "joyful", "bright", "playful",
            "mysterious", "dark", "tense", "dramatic", "epic", "powerful", "aggressive", "intense",
            "sad", "melancholic", "sorrowful", "emotional", "dreamy", "nostalgic"
        ]
        for c in candidates:
            if c in text_lower:
                mood_words.append(c)

        if mood_words:
            mood = ", ".join(mood_words[:3])
        else:
            if genre == "ambient":
                mood = "peaceful, tranquil, soothing"
            elif genre == "electronic":
                mood = "energetic, futuristic, driving"
            elif mode == "major":
                mood = "uplifting, bright, joyful"
            elif genre == "lofi":
                mood = "nostalgic, relaxed, mellow"
            else:
                mood = "mysterious, tense, powerful"

        # ---------------------------------------------------------
        # 8. Energy Level (0.0 to 1.0)
        # ---------------------------------------------------------
        energy = 0.70
        if any(w in text_lower for w in ["explosive", "high energy", "intense", "driving", "heavy", "fast", "furious"]):
            energy = 0.90
        elif any(w in text_lower for w in ["calm", "gentle", "subtle", "soft", "soothing", "peaceful", "lullaby", "meditation", "slow"]):
            energy = 0.35
        elif any(w in text_lower for w in ["upbeat", "bouncy", "happy", "lively", "dance"]):
            energy = 0.78
        elif any(w in text_lower for w in ["ambient", "chill", "relaxing", "lofi"]):
            energy = 0.50

        # ---------------------------------------------------------
        # 9. Arrangement Structure
        # ---------------------------------------------------------
        structure = []
        if any(w in text_lower for w in ["intro", "introduction", "start mysteriously", "opening"]):
            structure.append("intro")
        if any(w in text_lower for w in ["build", "building", "tension", "verse"]):
            structure.append("build")
        if any(w in text_lower for w in ["climax", "powerful", "drop", "chorus", "peak"]):
            structure.append("climax")
        if any(w in text_lower for w in ["finish", "resolved", "ending", "outro", "resolution"]):
            structure.append("resolution")

        if len(structure) < 2:
            structure = ["intro", "build", "climax", "resolution"]
            inferred.inferred_structure = True

        actual_seed = seed if seed is not None else self.default_seed

        return MusicBrief(
            description=text.strip(),
            genre=genre,
            subgenre=subgenre,
            mood=mood,
            energy=energy,
            target_duration=duration,
            tempo=tempo,
            key=key,
            mode=mode,
            desired_instruments=instruments,
            track_count=max(len(instruments), 3),
            arrangement_structure=structure,
            opening="atmospheric introduction",
            ending="clean, resolved finish",
            explicit_restrictions=explicit_restrictions,
            constraints=actual_constraints,
            inferred=inferred,
            seed=actual_seed
        )
