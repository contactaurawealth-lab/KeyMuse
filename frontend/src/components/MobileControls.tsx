import React from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { Layers, Disc, VolumeX, ArrowDown, ArrowUp } from 'lucide-react';

export const MobileControls: React.FC = () => {
  const {
    activeLayerIndex,
    toggleLayer,
    octaveOffset,
    setOctaveOffset,
    sustainPedal,
    toggleSustainPedal,
    stopAllNotes
  } = useAudioState();

  return (
    <div className="mobile-action-bar">
      {/* Shift Layer Button */}
      <button
        onClick={toggleLayer}
        className={`studio-btn ${activeLayerIndex === 1 ? 'studio-btn-active' : ''}`}
        style={{ flex: 1, padding: '10px 8px', justifyContent: 'center' }}
      >
        <Layers size={16} />
        {activeLayerIndex === 0 ? 'Shift Layer' : 'Active: SHIFT'}
      </button>

      {/* Octave Controls */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setOctaveOffset((p) => Math.max(-3, p - 1))}
          className="studio-btn"
          style={{ padding: '10px 12px' }}
          title="Octave Down"
        >
          <ArrowDown size={16} />
        </button>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 700,
            padding: '0 4px',
            color: 'var(--accent-cyan)'
          }}
        >
          {octaveOffset >= 0 ? `+${octaveOffset}` : octaveOffset}
        </span>
        <button
          onClick={() => setOctaveOffset((p) => Math.min(3, p + 1))}
          className="studio-btn"
          style={{ padding: '10px 12px' }}
          title="Octave Up"
        >
          <ArrowUp size={16} />
        </button>
      </div>

      {/* Sustain Pedal Toggle */}
      <button
        onClick={toggleSustainPedal}
        className={`studio-btn ${sustainPedal ? 'studio-btn-active' : ''}`}
        style={{ padding: '10px 14px' }}
        title="Toggle Sustain Pedal"
      >
        <Disc size={16} />
        {sustainPedal ? 'Sustain ON' : 'Sustain'}
      </button>

      {/* Panic Button */}
      <button
        onClick={stopAllNotes}
        className="studio-btn"
        style={{ padding: '10px 12px', color: 'var(--accent-red)' }}
        title="Stop All Audio (Panic)"
      >
        <VolumeX size={16} />
      </button>
    </div>
  );
};
