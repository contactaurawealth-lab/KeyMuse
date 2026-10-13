import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Music,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  FileCode,
  Repeat
} from 'lucide-react';

interface SoothingAudioPlayerProps {
  onOpenAiStudio?: () => void;
  compact?: boolean;
}

export const SoothingAudioPlayer: React.FC<SoothingAudioPlayerProps> = ({
  onOpenAiStudio,
  compact = false
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(63.71);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeSection, setActiveSection] = useState<string>('Intro');

  // Sync audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // Map time to composition sections (Tempo 70 BPM -> 1 beat = 0.857s)
      // Intro: 0-13.7s, Build: 13.7-30.8s, Climax: 30.8-51.4s, Resolution: 51.4-63.7s
      if (cur < 13.7) {
        setActiveSection('Intro');
      } else if (cur < 30.8) {
        setActiveSection('Build');
      } else if (cur < 51.4) {
        setActiveSection('Climax');
      } else {
        setActiveSection('Resolution');
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isLooping]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn('Playback error or user gesture required:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().catch(() => {});
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 56 waveform visualizer bars with sinusoidal envelope
  const totalBars = 56;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * totalBars);

  return (
    <div
      className="soothing-player-card"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid rgba(0, 210, 196, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '16px' : '24px',
        boxShadow: isPlaying
          ? '0 8px 32px rgba(0, 210, 196, 0.15)'
          : '0 4px 16px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Real audio element */}
      <audio
        ref={audioRef}
        src="/audio/soothing_tune_60s.wav"
        preload="metadata"
        loop={isLooping}
      />

      {/* Header Badge & Title */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 210, 196, 0.12)',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}
          >
            <Music size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: compact ? '16px' : '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}
              >
                60s Soothing Acoustic Lullaby
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 210, 196, 0.15)',
                  color: 'var(--accent-cyan)',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                Physical Model
              </span>
            </div>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            >
              Concert Grand Piano (Hammer Impulses) • Atmospheric Pad • Orchestral Strings • C Major @ 70 BPM
            </p>
          </div>
        </div>

        {/* Status / Section Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--accent-cyan)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isPlaying ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                boxShadow: isPlaying ? '0 0 8px var(--accent-cyan)' : 'none',
                display: 'inline-block'
              }}
            />
            Section: {activeSection}
          </span>

          {onOpenAiStudio && (
            <button
              onClick={onOpenAiStudio}
              className="studio-btn studio-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Open this project in AI Studio to inspect tracks or revise"
            >
              <Sparkles size={13} color="var(--accent-cyan)" />
              Remix in Studio
            </button>
          )}
        </div>
      </div>

      {/* Interactive Waveform Display */}
      <div
        style={{
          height: compact ? '64px' : '92px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '10px'
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          const newTime = ratio * duration;
          setCurrentTime(newTime);
          if (audioRef.current) {
            audioRef.current.currentTime = newTime;
          }
        }}
        title="Click anywhere on waveform to seek"
      >
        {Array.from({ length: totalBars }).map((_, idx) => {
          const isPassed = idx <= activeBarIndex;
          // Smooth acoustic curve with gentle crescendos
          const baseHeight = 22 + Math.sin(idx * 0.22) * 26 + (Math.cos(idx * 0.45) * 14);
          const dynamicBoost = isPlaying && idx === activeBarIndex ? 15 : 0;
          const barHeight = Math.min(100, Math.max(14, baseHeight + dynamicBoost));

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${barHeight}%`,
                backgroundColor: isPassed ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.16)',
                borderRadius: '2px',
                transition: 'height 0.1s ease, background-color 0.12s ease',
                boxShadow: isPlaying && idx === activeBarIndex ? '0 0 8px var(--accent-cyan)' : 'none'
              }}
            />
          );
        })}
      </div>

      {/* Scrubber Timeline Slider */}
      <div style={{ marginBottom: '14px' }}>
        <input
          type="range"
          min="0"
          max={duration || 63.71}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Seek time"
          style={{
            width: '100%',
            height: '5px',
            borderRadius: '3px',
            accentColor: 'var(--accent-cyan)',
            cursor: 'pointer'
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            marginTop: '3px'
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {activeSection} ({Math.round(progressRatio * 100)}%)
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* Playback Transport Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={togglePlay}
            className="studio-btn studio-btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isPlaying ? '0 0 12px rgba(0, 210, 196, 0.4)' : 'none'
            }}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            <span>{isPlaying ? 'Pause' : 'Play Soothing Tune'}</span>
          </button>

          <button
            onClick={handleRestart}
            className="studio-btn studio-btn-secondary"
            style={{ padding: '9px 12px' }}
            title="Replay from start"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={toggleLoop}
            className={`studio-btn ${isLooping ? 'studio-btn-primary' : 'studio-btn-secondary'}`}
            style={{ padding: '9px 12px' }}
            title={isLooping ? 'Looping enabled' : 'Looping disabled'}
          >
            <Repeat size={15} />
          </button>

          <button
            onClick={cycleSpeed}
            className="studio-btn studio-btn-secondary"
            style={{ padding: '7px 10px', fontSize: '11px', fontWeight: 700 }}
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume & Mute Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMute}
            className="studio-btn studio-btn-secondary"
            style={{ padding: '7px', border: 'none', background: 'transparent' }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={17} color="var(--text-secondary)" />
            ) : (
              <Volume2 size={17} color="var(--accent-cyan)" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Volume slider"
            style={{
              width: '85px',
              height: '4px',
              accentColor: 'var(--accent-cyan)',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Export / Download Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="/audio/soothing_tune_60s.wav"
            download="KeyMuse_Soothing_Tune_60s.wav"
            className="studio-btn studio-btn-secondary"
            style={{
              padding: '8px 12px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none'
            }}
            title="Download full quality 16-bit PCM WAV (10.7 MB)"
          >
            <Download size={13} />
            <span>WAV (10.7MB)</span>
          </a>

          <a
            href="/audio/soothing_tune_60s.mid"
            download="KeyMuse_Soothing_Tune_60s.mid"
            className="studio-btn studio-btn-secondary"
            style={{
              padding: '8px 12px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none'
            }}
            title="Download Standard MIDI File (162 notes)"
          >
            <FileCode size={13} />
            <span>MIDI</span>
          </a>

          <a
            href="/audio/soothing_tune_60s.json"
            target="_blank"
            rel="noopener noreferrer"
            className="studio-btn studio-btn-secondary"
            style={{
              padding: '8px 10px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              textDecoration: 'none'
            }}
            title="Inspect quality manifest JSON"
          >
            <Activity size={13} />
            <span>Audit</span>
          </a>
        </div>
      </div>

      {/* Collapsible / Detailed Physical Acoustic Metrics (Shown on non-compact) */}
      {!compact && (
        <div
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            fontSize: '11px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={13} color="var(--accent-cyan)" />
              <span>Acoustic Piano Model</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              16ms Felt Hammer + Unison Beating
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Activity size={13} color="var(--accent-cyan)" />
              <span>True Peak dBFS</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              -2.00 dBFS (0 Clips Guaranteed)
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={13} color="var(--accent-cyan)" />
              <span>RMS Energy & Notes</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              -19.28 dBFS • 162 Notes
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} color="var(--accent-cyan)" />
              <span>Tail & Decay</span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              1.27s Natural Acoustic Tail
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
