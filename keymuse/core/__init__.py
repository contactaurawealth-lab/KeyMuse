"""KeyMuse Core Audio and Synthesis Modules."""

from keymuse.core.theory import note_name_to_midi, midi_to_note_name, midi_to_frequency, get_scale_notes, get_chord_notes
from keymuse.core.midi import MidiWriter
from keymuse.core.synth import SynthEngine
from keymuse.core.render import RenderManager
from keymuse.core.analyzer import AudioQualityInspector

__all__ = [
    "note_name_to_midi",
    "midi_to_note_name",
    "midi_to_frequency",
    "get_scale_notes",
    "get_chord_notes",
    "MidiWriter",
    "SynthEngine",
    "RenderManager",
    "AudioQualityInspector",
]
