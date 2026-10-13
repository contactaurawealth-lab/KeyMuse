import React, { useState, useEffect } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { Volume2, Play, WifiOff } from 'lucide-react';

export const AudioBanner: React.FC = () => {
  const { audioStatus, resumeAudio } = useAudioState();
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (audioStatus === 'running' && !isOffline) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {isOffline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--accent-amber)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px'
          }}
        >
          <WifiOff size={15} />
          <span>
            <strong>Offline Mode Active:</strong> KeyMuse PWA is running from local cache. Instruments, synth engine, drum sequencer, and loop recordings function 100% offline.
          </span>
        </div>
      )}

      {audioStatus !== 'running' && (
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
      )}
    </div>
  );
};
