import { AudioEngine } from './AudioEngine';
import { TrackRecording } from '../types';

export class AudioRecorder {
  private audioEngine: AudioEngine;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording: boolean = false;
  private startTime: number = 0;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  /**
   * Starts live audio recording from the master audio stream
   */
  public startRecording(): boolean {
    if (this.isRecording) return false;
    const ctx = this.audioEngine.init();

    if (!this.audioEngine.recordStreamDestination) {
      console.error('Record stream destination not initialized');
      return false;
    }

    try {
      const stream = this.audioEngine.recordStreamDestination.stream;
      const mimeType = this.getSupportedMimeType();

      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms slice
      this.isRecording = true;
      this.startTime = ctx.currentTime;
      return true;
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      return false;
    }
  }

  /**
   * Stops live recording and returns completed TrackRecording
   */
  public async stopRecording(trackName: string = 'Track'): Promise<TrackRecording | null> {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const durationSeconds = this.audioEngine.ctx ? this.audioEngine.ctx.currentTime - this.startTime : 0;
        const audioUrl = URL.createObjectURL(blob);

        const track: TrackRecording = {
          id: `trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: trackName,
          blob,
          audioUrl,
          durationSeconds: Math.max(0.1, durationSeconds),
          volume: 0.85,
          muted: false,
          solo: false,
          pan: 0,
          createdAt: Date.now()
        };

        this.isRecording = false;
        this.mediaRecorder = null;
        resolve(track);
      };

      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Encodes an AudioBuffer into a 16-bit PCM Stereo WAV ArrayBuffer
   */
  public static encodeWavBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const numSamples = audioBuffer.length;
    const dataByteLength = numSamples * blockAlign;
    const headerByteLength = 44;
    const totalByteLength = headerByteLength + dataByteLength;

    const buffer = new ArrayBuffer(totalByteLength);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataByteLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataByteLength, true);

    // Interleave channels & write samples
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(audioBuffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        // Clamp sample to [-1, 1]
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return buffer;
  }

  /**
   * Encodes an AudioBuffer into a Standard 16-bit PCM Stereo WAV file Blob
   */
  public static encodeWav(audioBuffer: AudioBuffer): Blob {
    const buffer = this.encodeWavBuffer(audioBuffer);
    return new Blob([buffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private getSupportedMimeType(): string | undefined {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return undefined;
  }
}
