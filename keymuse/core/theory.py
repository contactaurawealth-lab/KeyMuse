"""Music Theory Utilities: Scales, chords, pitch conversions, and intervals."""

from typing import List, Dict, Tuple

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
NAME_TO_PITCH_CLASS: Dict[str, int] = {
    "C": 0, "B#": 0,
    "C#": 1, "DB": 1,
    "D": 2,
    "D#": 3, "EB": 3,
    "E": 4, "FB": 4,
    "F": 5, "E#": 5,
    "F#": 6, "GB": 6,
    "G": 7,
    "G#": 8, "AB": 8,
    "A": 9,
    "A#": 10, "BB": 10,
    "B": 11, "CB": 11,
}

SCALE_INTERVALS: Dict[str, List[int]] = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10],
    "lydian": [0, 2, 4, 6, 7, 9, 11],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
    "aeolian": [0, 2, 3, 5, 7, 8, 10],
    "harmonic_minor": [0, 2, 3, 5, 7, 8, 11],
    "pentatonic": [0, 2, 4, 7, 9],
    "pentatonic_minor": [0, 3, 5, 7, 10],
    "blues": [0, 3, 5, 6, 7, 10],
}

CHORD_INTERVALS: Dict[str, List[int]] = {
    "maj": [0, 4, 7],
    "min": [0, 3, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
    "maj7": [0, 4, 7, 11],
    "min7": [0, 3, 7, 10],
    "dom7": [0, 4, 7, 10],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7],
}


def note_name_to_midi(name: str, octave: int = 4) -> int:
    """Convert note name like 'D' or 'C#' and octave to MIDI pitch number."""
    clean = name.strip().upper()
    pitch_class = NAME_TO_PITCH_CLASS.get(clean, 0)
    midi = (octave + 1) * 12 + pitch_class
    return max(0, min(127, midi))


def midi_to_note_name(midi: int) -> Tuple[str, int]:
    """Convert MIDI number (e.g. 62) to note name and octave ('D', 4)."""
    pitch_class = midi % 12
    octave = (midi // 12) - 1
    return NOTE_NAMES[pitch_class], octave


def midi_to_frequency(midi: int) -> float:
    """Calculate frequency in Hz from MIDI pitch number (A4 = 440 Hz = MIDI 69)."""
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def get_scale_notes(root_name: str, mode: str = "minor", base_octave: int = 4, octaves: int = 1) -> List[int]:
    """Return MIDI note numbers for a given scale across specified octaves."""
    clean_root = root_name.strip().upper()
    root_pitch_class = NAME_TO_PITCH_CLASS.get(clean_root, 2)  # Default D
    intervals = SCALE_INTERVALS.get(mode.lower(), SCALE_INTERVALS["minor"])

    notes: List[int] = []
    for oct_idx in range(octaves):
        octave_num = base_octave + oct_idx
        for interval in intervals:
            midi = (octave_num + 1) * 12 + root_pitch_class + interval
            if 0 <= midi <= 127:
                notes.append(midi)
    return notes


def get_chord_notes(root_midi: int, chord_type: str = "min") -> List[int]:
    """Return chord constituent MIDI note numbers."""
    intervals = CHORD_INTERVALS.get(chord_type.lower(), CHORD_INTERVALS["min"])
    return [root_midi + interval for interval in intervals if 0 <= root_midi + interval <= 127]
