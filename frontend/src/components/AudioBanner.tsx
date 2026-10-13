import React from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { Volume2, Play } from 'lucide-react';

export const AudioBanner: React.FC = () => {
  const { audioStatus, resumeAudio } = useAudioState();

  if (audioStatus === 'running') {
    return null;
  }

  return (
    <div className="audio-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Volume2 size={18} style={{ color: 'var(--accent-cyan)' }} />
        <span>
          <strong>Audio Engine Suspended:</strong> Modern browsers require a user interaction to enable real-time Web Audio.
        </span>
      </div>
      <button
        onClick={() => resumeAudio()}
        className="studio-btn studio-btn-primary"
        style={{ padding: '6px 14px', fontSize: '12px' }}
      >
        <Play size={14} /> Enable Audio Now
      </button>
    </div>
  );
};
