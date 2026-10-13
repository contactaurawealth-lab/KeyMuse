"""Pure Python Standard MIDI File (SMF Type 0/1) Generator and Parser."""

import struct
from typing import List, Tuple
from keymuse.models.project import KeyMuseProject, Track, Note


def encode_vlq(value: int) -> bytes:
    """Encode an integer as variable-length quantity (VLQ) for MIDI delta times."""
    val = max(0, int(value))
    buffer = val & 0x7F
    bytes_arr = []
    val >>= 7
    while val > 0:
        buffer <<= 8
        buffer |= ((val & 0x7F) | 0x80)
        val >>= 7
    while True:
        bytes_arr.append(buffer & 0xFF)
        if buffer & 0x80:
            buffer >>= 8
        else:
            break
    return bytes(bytes_arr)


class MidiWriter:
    """Standard MIDI File Type 0/1 binary generator."""

    def __init__(self, ticks_per_beat: int = 480):
        self.ticks_per_beat = ticks_per_beat

    def project_to_midi_bytes(self, project: KeyMuseProject) -> bytes:
        """Convert a KeyMuseProject into standard SMF Type 0 binary bytes."""
        ticks_per_beat = self.ticks_per_beat
        bpm = max(30.0, min(300.0, project.bpm))
        microseconds_per_beat = int(60_000_000 / bpm)

        # Collect all note on and note off events across all tracks
        # Event format: (tick, event_priority, status, channel, pitch, velocity)
        events: List[Tuple[int, int, int, int, int, int]] = []

        for track_idx, track in enumerate(project.tracks):
            channel = min(15, track_idx)
            if "percussion" in track.instrument.lower() or "drum" in track.instrument.lower():
                channel = 9  # Standard MIDI Drum Channel 10 (0-indexed = 9)

            for note in track.notes:
                start_tick = int(round(note.start_beat * ticks_per_beat))
                duration_ticks = max(1, int(round(note.duration_beats * ticks_per_beat)))
                end_tick = start_tick + duration_ticks

                pitch = max(0, min(127, note.pitch))
                velocity = max(1, min(127, note.velocity))

                # Priority 0 for Note Off, Priority 1 for Note On so Off precedes On at exact same tick
                events.append((start_tick, 1, 0x90, channel, pitch, velocity))
                events.append((end_tick, 0, 0x80, channel, pitch, 0))

        # Sort chronologically by tick, then priority
        events.sort(key=lambda x: (x[0], x[1]))

        # Build MTrk chunk data
        track_data = bytearray()

        # 1. Tempo Meta Event at delta-time 0: 00 FF 51 03 tt tt tt
        track_data.extend(encode_vlq(0))
        track_data.extend([0xFF, 0x51, 0x03])
        track_data.extend(struct.pack(">I", microseconds_per_beat)[1:])  # 3 bytes

        current_tick = 0
        for tick, _, status_type, channel, pitch, velocity in events:
            delta_ticks = max(0, tick - current_tick)
            current_tick = tick

            track_data.extend(encode_vlq(delta_ticks))
            status_byte = status_type | (channel & 0x0F)
            track_data.extend([status_byte, pitch, velocity])

        # End of Track meta-event: 00 FF 2F 00
        track_data.extend(encode_vlq(0))
        track_data.extend([0xFF, 0x2F, 0x00])

        # Header Chunk (MThd): format 0, 1 track, division ticks_per_beat
        header_chunk = bytearray()
        header_chunk.extend(b"MThd")
        header_chunk.extend(struct.pack(">IHHH", 6, 0, 1, ticks_per_beat))

        # Track Chunk (MTrk)
        track_chunk = bytearray()
        track_chunk.extend(b"MTrk")
        track_chunk.extend(struct.pack(">I", len(track_data)))
        track_chunk.extend(track_data)

        return bytes(header_chunk + track_chunk)

    def write_project_to_file(self, project: KeyMuseProject, file_path: str) -> str:
        """Write project as SMF binary file to file_path."""
        data = self.project_to_midi_bytes(project)
        with open(file_path, "wb") as f:
            f.write(data)
        return file_path
