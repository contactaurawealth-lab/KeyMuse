import React from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { DrumSound, DrumPattern } from '../types';
import { Play, Square, RotateCcw, Volume2, Disc, Music } from 'lucide-react';

const DRUM_TRACKS: { sound: DrumSound; name: string; color: string }[] = [
  { sound: 'kick',         name: 'Kick Drum',     color: '#00d2c4' },
  { sound: 'snare',        name: 'Snare Drum',    color: '#f59e0b' },
  { sound: 'hihat_closed', name: 'Closed Hat',    color: '#10b981' },
  { sound: 'hihat_open',   name: 'Open Hat',      color: '#06b6d4' },
  { sound: 'clap',         name: 'Hand Clap',     color: '#ec4899' },
  { sound: 'tom',          name: 'Floor Tom',     color: '#8b5cf6' },
  { sound: 'perc',         name: 'Percussion',    color: '#eab308' }
];

const PRESET_PATTERNS: Record<string, DrumPattern> = {
  standard: {
    name: 'Rock / Pop 4/4',
    steps: {
      kick:         [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare:        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat_closed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      hihat_open:   [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
      clap:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    }
  },
  fourOnTheFloor: {
    name: 'House / EDM',
    steps: {
      kick:         [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare:        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat_closed: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      hihat_open:   [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap:         [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    }
  },
  boomBap: {
    name: 'Hip-Hop Boom Bap',
    steps: {
      kick:         [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      snare:        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihat_closed: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      hihat_open:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
      clap:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    }
  },
  trap: {
    name: 'Trap Half-Time',
    steps: {
      kick:         [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      snare:        [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      hihat_closed: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      hihat_open:   [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
      clap:         [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      perc:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    }
  },
  empty: {
    name: 'Empty Pattern',
    steps: {
      kick:         new Array(16).fill(false),
      snare:        new Array(16).fill(false),
      hihat_closed: new Array(16).fill(false),
      hihat_open:   new Array(16).fill(false),
      clap:         new Array(16).fill(false),
      tom:          new Array(16).fill(false),
      perc:         new Array(16).fill(false)
    }
  }
};

export const DrumMachine: React.FC = () => {
  const {
    drumPattern,
    setDrumPattern,
    toggleDrumStep,
    isDrumPlaying,
    toggleDrumPlayback,
    currentDrumStep,
    drumEngine,
    bpm,
    setBpm
  } = useAudioState();

  const handleAudition = (sound: DrumSound) => {
    drumEngine.trigger(sound, 0.9);
  };

  const handleLoadPreset = (key: string) => {
    const preset = PRESET_PATTERNS[key];
    if (preset) {
      setDrumPattern(preset);
    }
  };

  const handleClear = () => {
    handleLoadPreset('empty');
  };

  return (
    <div className="studio-card" style={{ padding: '16px' }}>
      {/* Sequencer Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleDrumPlayback}
            className={`studio-btn ${isDrumPlaying ? 'studio-btn-amber' : 'studio-btn-primary'}`}
            style={{ padding: '8px 16px', fontWeight: 700 }}
          >
            {isDrumPlaying ? <Square size={16} /> : <Play size={16} />}
            {isDrumPlaying ? 'Stop Pattern' : 'Play Pattern'}
          </button>

          <button onClick={handleClear} className="studio-btn" title="Clear all steps">
            <RotateCcw size={14} /> Clear
          </button>
        </div>

        {/* Pattern Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Preset:</span>
          <select
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="studio-select"
            defaultValue="standard"
          >
            <option value="standard">Rock / Pop 4/4</option>
            <option value="fourOnTheFloor">House / EDM</option>
            <option value="boomBap">Hip-Hop Boom Bap</option>
            <option value="trap">Trap Half-Time</option>
            <option value="empty">Clear (Empty)</option>
          </select>
        </div>

        {/* Tempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>BPM:</span>
          <input
            type="number"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            style={{
              width: '56px',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--accent-cyan)',
              textAlign: 'center',
              fontWeight: 700
            }}
          />
        </div>
      </div>

      {/* Step Indicator Header (1-16) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '110px',
        marginBottom: '6px',
        gap: '4px'
      }}>
        {Array.from({ length: 16 }).map((_, stepIdx) => {
          const isCurrent = isDrumPlaying && currentDrumStep === stepIdx;
          const isQuarter = stepIdx % 4 === 0;
          return (
            <div
              key={stepIdx}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10px',
                fontWeight: isQuarter ? 800 : 500,
                color: isCurrent ? 'var(--accent-cyan)' : isQuarter ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: isCurrent ? 'rgba(0, 210, 196, 0.2)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 0'
              }}
            >
              {stepIdx + 1}
            </div>
          );
        })}
      </div>

      {/* 16-Step Track Matrix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {DRUM_TRACKS.map((trk) => {
          const steps = drumPattern.steps[trk.sound] || [];
          return (
            <div key={trk.sound} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Audition & Track Label Button */}
              <button
                onClick={() => handleAudition(trk.sound)}
                className="studio-btn"
                style={{
                  width: '104px',
                  justifyContent: 'flex-start',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={`Click to audition ${trk.name}`}
              >
                <Disc size={12} style={{ color: trk.color, flexShrink: 0 }} />
                <span>{trk.name}</span>
              </button>

              {/* 16 Step Buttons */}
              <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                {Array.from({ length: 16 }).map((_, stepIdx) => {
                  const isActive = steps[stepIdx] || false;
                  const isCurrent = isDrumPlaying && currentDrumStep === stepIdx;
                  const isQuarterStart = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleDrumStep(trk.sound, stepIdx)}
                      style={{
                        flex: 1,
                        height: '34px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive
                          ? trk.color
                          : isQuarterStart
                          ? 'var(--bg-surface)'
                          : 'var(--bg-tertiary)',
                        border: isCurrent
                          ? '2px solid #ffffff'
                          : isActive
                          ? `1px solid ${trk.color}`
                          : '1px solid var(--border-subtle)',
                        boxShadow: isActive ? `0 0 8px ${trk.color}66` : 'none',
                        cursor: 'pointer',
                        transform: isCurrent ? 'scale(1.04)' : 'none',
                        transition: 'transform 0.05s ease, background-color 0.1s'
                      }}
                      title={`${trk.name} - Step ${stepIdx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
