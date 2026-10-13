import React, { useState, useEffect, useRef } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { AudioRecorder } from '../audio/AudioRecorder';
import { MidiEngine, MidiNoteEvent } from '../audio/MidiEngine';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Layers,
  FileAudio,
  FileCode,
  Music
} from 'lucide-react';

export const LoopStation: React.FC = () => {
  const {
    tracks,
    isRecording,
    startRecording,
    stopRecording,
    deleteTrack,
    toggleMuteTrack,
    toggleSoloTrack,
    setTrackVolume,
    bpm,
    drumPattern,
    selectedInstrument,
    effects
  } = useAudioState();

  const [recordTimer, setRecordTimer] = useState<number>(0);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Recording elapsed timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      setRecordTimer(0);
      const start = Date.now();
      interval = setInterval(() => {
        setRecordTimer(Math.floor((Date.now() - start) / 100) / 10);
      }, 100);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Clean up audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach((el) => {
        el.pause();
        el.src = '';
      });
    };
  }, []);

  const handleTogglePlayTrack = (trackId: string, audioUrl: string) => {
    if (playingTrackId === trackId) {
      const el = audioElementsRef.current[trackId];
      if (el) el.pause();
      setPlayingTrackId(null);
    } else {
      // Pause any currently playing track
      if (playingTrackId && audioElementsRef.current[playingTrackId]) {
        audioElementsRef.current[playingTrackId].pause();
      }

      if (!audioElementsRef.current[trackId]) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingTrackId(null);
        audioElementsRef.current[trackId] = audio;
      }

      const el = audioElementsRef.current[trackId];
      el.currentTime = 0;
      el.play().catch((err) => console.warn('Audio playback error:', err));
      setPlayingTrackId(trackId);
    }
  };

  const handleDownloadTrack = (track: any) => {
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `${track.name.replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportWav = async () => {
    // Generate a master 16-bit PCM WAV from recorded tracks or synthesize a clean stereo bounce
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = Math.max(2, tracks.reduce((max, t) => Math.max(max, t.durationSeconds), 0));
    const sampleRate = audioCtx.sampleRate || 44100;
    const numSamples = Math.floor(duration * sampleRate);
    const audioBuffer = audioCtx.createBuffer(2, numSamples, sampleRate);

    // If tracks have blob data, read and mix them
    for (const track of tracks) {
      if (track.muted || !track.blob) continue;
      try {
        const arrayBuf = await track.blob.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(arrayBuf);
        const gain = track.volume;
        for (let ch = 0; ch < 2; ch++) {
          const outData = audioBuffer.getChannelData(ch);
          const inData = decoded.getChannelData(Math.min(ch, decoded.numberOfChannels - 1));
          for (let i = 0; i < Math.min(outData.length, inData.length); i++) {
            outData[i] += inData[i] * gain;
          }
        }
      } catch (err) {
        console.warn('Could not decode track for bounce:', err);
      }
    }

    const wavBlob = AudioRecorder.encodeWav(audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KeyMuse_Master_Mix_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMidi = () => {
    // Convert current drum pattern or session notes into Standard MIDI File Type 0
    const events: MidiNoteEvent[] = [];
    const stepDurationMs = (60000 / bpm) / 4; // 16th note

    // Map drum pattern steps
    const drumMidiMap: { [key: string]: number } = {
      kick: 36,
      snare: 38,
      hihatClosed: 42,
      hihatOpen: 46,
      clap: 39,
      tom: 45,
      perc: 56
    };

    Object.entries(drumPattern.steps).forEach(([snd, steps]) => {
      const midiPitch = drumMidiMap[snd] || 60;
      steps.forEach((active, stepIdx) => {
        if (active) {
          events.push({
            note: snd,
            midi: midiPitch,
            velocity: 0.85,
            timeMs: stepIdx * stepDurationMs,
            durationMs: stepDurationMs * 0.8
          });
        }
      });
    });

    // If no drum steps, add an audition C-major chord
    if (events.length === 0) {
      [60, 64, 67, 72].forEach((midi) => {
        events.push({
          note: 'C4',
          midi,
          velocity: 0.8,
          timeMs: 0,
          durationMs: 1000
        });
      });
    }

    const midiBlob = MidiEngine.createStandardMidiFile(events, bpm);
    const url = URL.createObjectURL(midiBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KeyMuse_Performance_${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportProjectJson = () => {
    const projectData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      bpm,
      selectedInstrument,
      effects,
      drumPattern,
      trackCount: tracks.length
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KeyMuse_Project_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Master Recorder Transport Card */}
      <div className="studio-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Multi-Track Loop Station</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 700,
                color: isRecording ? '#ef4444' : 'var(--text-secondary)'
              }}
            >
              {isRecording ? `REC: ${recordTimer.toFixed(1)}s` : `${tracks.length} Layer(s)`}
            </span>
          </div>
        </div>

        {/* Transport Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {!isRecording ? (
            <button
              onClick={() => startRecording()}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ef4444',
                color: '#fff',
                borderColor: '#ef4444'
              }}
            >
              <Mic size={16} />
              Record Take
            </button>
          ) : (
            <button
              onClick={() => stopRecording()}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ef4444',
                color: '#fff',
                animation: 'pulse 1s infinite'
              }}
            >
              <Square size={16} fill="white" />
              Stop Recording ({recordTimer.toFixed(1)}s)
            </button>
          )}

          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

          {/* Quick Export Suite Buttons */}
          <button
            onClick={handleExportWav}
            disabled={tracks.length === 0}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <FileAudio size={14} color="var(--accent-cyan)" />
            Export Mix (WAV)
          </button>

          <button
            onClick={handleExportMidi}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Music size={14} color="var(--accent-amber)" />
            Export MIDI (.mid)
          </button>

          <button
            onClick={handleExportProjectJson}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <FileCode size={14} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Recorded Tracks List */}
      <div className="studio-card">
        <div className="card-title">Recorded Stems & Loops</div>

        {tracks.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Mic size={32} color="var(--border-color)" />
            <p style={{ margin: 0 }}>
              No tracks recorded yet. Hit <strong>Record Take</strong> and play notes on your keyboard, virtual piano, or drum machine.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
            {tracks.map((track, idx) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <div
                  key={track.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto auto auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {/* Play / Pause Preview */}
                  <button
                    onClick={() => handleTogglePlayTrack(track.id, track.audioUrl || '')}
                    className="btn btn-secondary"
                    style={{
                      width: '32px',
                      height: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%'
                    }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>

                  {/* Track Details */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      {track.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Duration: {track.durationSeconds.toFixed(1)}s • Layer #{idx + 1}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '110px' }}>
                    <Volume2 size={13} color="var(--text-secondary)" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                    />
                  </div>

                  {/* Mute Toggle */}
                  <button
                    onClick={() => toggleMuteTrack(track.id)}
                    className="btn"
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: track.muted ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-primary)',
                      color: track.muted ? '#ef4444' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    MUTE
                  </button>

                  {/* Solo Toggle */}
                  <button
                    onClick={() => toggleSoloTrack(track.id)}
                    className="btn"
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: track.solo ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-primary)',
                      color: track.solo ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    SOLO
                  </button>

                  {/* Track Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleDownloadTrack(track)}
                      className="btn btn-secondary"
                      title="Download Track WebM"
                      style={{ padding: '6px' }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="btn btn-secondary"
                      title="Delete Track"
                      style={{ padding: '6px', color: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
