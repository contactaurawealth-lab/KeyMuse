import React from 'react';
import { useAudioState } from '../context/AudioStateContext';
import {
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Play,
  Square,
  Settings,
  Music,
  Sliders,
  AlertOctagon,
  RotateCcw,
  RotateCw
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenMappings: () => void;
  onOpenMidi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenMappings,
  onOpenMidi
}) => {
  const {
    audioStatus,
    resumeAudio,
    octaveOffset,
    setOctaveOffset,
    activeLayerIndex,
    toggleLayer,
    bpm,
    setBpm,
    metronome,
    effects,
    updateEffects,
    theme,
    toggleTheme,
    stopAllNotes,
    undo,
    redo,
    canUndo,
    canRedo
  } = useAudioState();

  const handleOctaveDown = () => setOctaveOffset((prev) => Math.max(-3, prev - 1));
  const handleOctaveUp = () => setOctaveOffset((prev) => Math.min(3, prev + 1));

  return (
    <header className="studio-header">
      <div className="studio-brand">
        <span className="brand-title">KeyMuse</span>
        <span className="brand-tagline" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Your Keyboard. Your Orchestra.
        </span>
        <span className="brand-badge">Studio v1.0</span>
      </div>

      <div className="header-controls">
        {/* Audio Engine Resume Button */}
        {audioStatus !== 'running' ? (
          <button
            onClick={() => resumeAudio()}
            className="studio-btn studio-btn-primary"
            title="Start Web Audio Engine"
          >
            <Play size={14} /> Start Audio
          </button>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 210, 196, 0.1)',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
            AUDIO READY
          </div>
        )}

        {/* Octave Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={handleOctaveDown}
            className="studio-btn"
            style={{ padding: '6px 10px' }}
            title="Octave Down (-)"
          >
            -
          </button>
          <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '46px', textAlign: 'center' }}>
            Oct {octaveOffset >= 0 ? `+${octaveOffset}` : octaveOffset}
          </span>
          <button
            onClick={handleOctaveUp}
            className="studio-btn"
            style={{ padding: '6px 10px' }}
            title="Octave Up (+)"
          >
            +
          </button>
        </div>

        {/* Layer Switcher */}
        <button
          onClick={toggleLayer}
          className={`studio-btn ${activeLayerIndex === 1 ? 'studio-btn-active' : ''}`}
          title="Toggle Shift Layer"
        >
          {activeLayerIndex === 0 ? 'Base Layer' : 'Shift Layer'}
        </button>

        {/* BPM & Metronome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            style={{
              width: '54px',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>BPM</span>
          <button
            onClick={() => metronome.toggle()}
            className="studio-btn"
            style={{ padding: '6px 8px' }}
            title="Toggle Metronome"
          >
            Click
          </button>
        </div>

        {/* Master Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => updateEffects({ masterVolume: effects.masterVolume > 0 ? 0 : 0.85 })}
            style={{ color: effects.masterVolume === 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}
            title="Toggle Mute"
          >
            {effects.masterVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={effects.masterVolume}
            onChange={(e) => updateEffects({ masterVolume: parseFloat(e.target.value) })}
            className="studio-slider"
            style={{ width: '70px' }}
            title={`Master Volume: ${Math.round(effects.masterVolume * 100)}%`}
          />
        </div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="studio-btn"
            style={{ opacity: canUndo ? 1 : 0.4, padding: '6px 8px' }}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="studio-btn"
            style={{ opacity: canRedo ? 1 : 0.4, padding: '6px 8px' }}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Panic Button */}
        <button
          onClick={stopAllNotes}
          className="studio-btn"
          style={{ color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          title="Stop All Notes (Panic)"
        >
          <AlertOctagon size={14} /> Panic
        </button>

        {/* Modals & Tools */}
        <button onClick={onOpenMappings} className="studio-btn" title="Edit Keyboard Mapping">
          <Sliders size={14} /> Keys
        </button>
        <button onClick={onOpenMidi} className="studio-btn" title="MIDI Devices">
          <Music size={14} /> MIDI
        </button>
        <button onClick={onOpenSettings} className="studio-btn" title="Project & Audio Settings">
          <Settings size={14} />
        </button>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="studio-btn" title="Toggle Studio Theme">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  );
};
