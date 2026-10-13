export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface MidiNoteEvent {
  note: string;
  midi: number;
  velocity: number;
  timeMs: number;
  durationMs: number;
}

export class MidiEngine {
  public isSupported: boolean = false;
  public access: any = null;
  public devices: MidiDevice[] = [];
  public selectedDeviceId: string = '';
  public onNoteOn: ((note: string, velocity: number) => void) | null = null;
  public onNoteOff: ((note: string) => void) | null = null;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  /**
   * Requests MIDI access from the browser after user interaction
   */
  public async requestAccess(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      this.access = await (navigator as any).requestMIDIAccess({ sysex: false });
      this.updateDevices();

      this.access.onstatechange = () => {
        this.updateDevices();
      };

      return true;
    } catch (err) {
      console.warn('Web MIDI access was denied or failed:', err);
      return false;
    }
  }

  private updateDevices() {
    if (!this.access) return;
    this.devices = [];
    const inputs = this.access.inputs.values();

    for (const input of inputs) {
      this.devices.push({
        id: input.id,
        name: input.name || 'MIDI Input Device',
        manufacturer: input.manufacturer || 'Generic',
        state: input.state || 'connected'
      });

      // Bind message listener
      input.onmidimessage = (event: any) => this.handleMidiMessage(event);
    }

    if (this.devices.length > 0 && !this.selectedDeviceId) {
      this.selectedDeviceId = this.devices[0].id;
    }
  }

  private handleMidiMessage(event: any) {
    const data = event.data;
    if (!data || data.length < 2) return;

    const status = data[0] >> 4;
    const noteNumber = data[1];
    const velocity = data.length > 2 ? data[2] : 64;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = noteNames[noteNumber % 12];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteStr = `${noteName}${octave}`;

    if (status === 0x9 && velocity > 0) {
      // Note On
      if (this.onNoteOn) {
        this.onNoteOn(noteStr, velocity / 127);
      }
    } else if (status === 0x8 || (status === 0x9 && velocity === 0)) {
      // Note Off
      if (this.onNoteOff) {
        this.onNoteOff(noteStr);
      }
    }
  }

  /**
  /**
   * Generates valid binary Standard MIDI File (SMF Type 0, 480 ticks/beat) bytes as Uint8Array
   */
  public static createStandardMidiBytes(events: MidiNoteEvent[], bpm: number = 120): Uint8Array {
    const ticksPerQuarter = 480;
    const msPerTick = (60000 / bpm) / ticksPerQuarter;

    // Convert notes into MIDI ON and OFF messages with delta times
    interface RawMidiMsg {
      tick: number;
      bytes: number[];
    }

    const rawMsgs: RawMidiMsg[] = [];

    // Add Tempo Meta Event: 0x00 FF 51 03 (microseconds per quarter)
    const usPerQuarter = Math.round(60000000 / bpm);
    rawMsgs.push({
      tick: 0,
      bytes: [
        0xff, 0x51, 0x03,
        (usPerQuarter >> 16) & 0xff,
        (usPerQuarter >> 8) & 0xff,
        usPerQuarter & 0xff
      ]
    });

    for (const ev of events) {
      const startTick = Math.max(0, Math.round(ev.timeMs / msPerTick));
      const endTick = startTick + Math.max(1, Math.round(ev.durationMs / msPerTick));
      const vel = Math.max(1, Math.min(127, Math.round(ev.velocity * 127)));

      // Note On
      rawMsgs.push({
        tick: startTick,
        bytes: [0x90, ev.midi, vel]
      });

      // Note Off
      rawMsgs.push({
        tick: endTick,
        bytes: [0x80, ev.midi, 0]
      });
    }

    // Sort by tick
    rawMsgs.sort((a, b) => a.tick - b.tick);

    // Encode delta times with variable-length quantity (VLQ)
    const trackBytes: number[] = [];
    let lastTick = 0;

    for (const msg of rawMsgs) {
      const delta = msg.tick - lastTick;
      lastTick = msg.tick;

      // Encode delta as VLQ
      this.writeVlq(trackBytes, delta);
      // Append message bytes
      trackBytes.push(...msg.bytes);
    }

    // End of Track Meta Event: delta=0, 0xFF 0x2F 0x00
    this.writeVlq(trackBytes, 0);
    trackBytes.push(0xff, 0x2f, 0x00);

    // Build MThd and MTrk chunks
    const fileBytes: number[] = [
      // MThd Chunk
      0x4d, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Chunk length (6)
      0x00, 0x00,             // Format 0 (single track)
      0x00, 0x01,             // 1 Track
      (ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff, // Ticks per beat

      // MTrk Chunk
      0x4d, 0x54, 0x72, 0x6b, // "MTrk"
      (trackBytes.length >> 24) & 0xff,
      (trackBytes.length >> 16) & 0xff,
      (trackBytes.length >> 8) & 0xff,
      trackBytes.length & 0xff,
      ...trackBytes
    ];

    return new Uint8Array(fileBytes);
  }

  /**
   * Generates a valid binary Standard MIDI File (SMF Type 0, 480 ticks/beat) Blob
   */
  public static createStandardMidiFile(events: MidiNoteEvent[], bpm: number = 120): Blob {
    const bytes = this.createStandardMidiBytes(events, bpm);
    return new Blob([bytes as any], { type: 'audio/midi' });
  }

  private static writeVlq(target: number[], value: number) {
    let buffer = value & 0x7f;
    const bytes: number[] = [];
    value >>= 7;

    while (value > 0) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
      value >>= 7;
    }

    while (true) {
      bytes.push(buffer & 0xff);
      if (buffer & 0x80) {
        buffer >>= 8;
      } else {
        break;
      }
    }

    target.push(...bytes.reverse());
  }
}
