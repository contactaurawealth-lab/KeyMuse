import React, { useState, useEffect } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { MidiDevice } from '../audio/MidiEngine';
import {
  Radio,
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Keyboard,
  Zap,
  Activity
} from 'lucide-react';

interface MidiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MidiModal: React.FC<MidiModalProps> = ({ isOpen, onClose }) => {
  const { midiEngine } = useAudioState();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [devices, setDevices] = useState<MidiDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [recentEvents, setRecentEvents] = useState<Array<{ note: string; velocity: number; time: string }>>([]);
  const [activeTab, setActiveTab] = useState<'midi' | 'shortcuts'>('midi');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsSupported('requestMIDIAccess' in navigator);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (midiEngine.devices.length > 0) {
      setDevices([...midiEngine.devices]);
      setSelectedDevice(midiEngine.selectedDeviceId);
    }

    const prevOnNoteOn = midiEngine.onNoteOn;
    midiEngine.onNoteOn = (note, vel) => {
      if (prevOnNoteOn) prevOnNoteOn(note, vel);
      const timeStr = new Date().toLocaleTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0');
      setRecentEvents((prev) => [
        { note, velocity: Math.round(vel * 127), time: timeStr },
        ...prev.slice(0, 9)
      ]);
    };

    return () => {
      midiEngine.onNoteOn = prevOnNoteOn;
    };
  }, [isOpen, midiEngine]);

  const handleRequestAccess = async () => {
    const ok = await midiEngine.requestAccess();
    if (ok) {
      setDevices([...midiEngine.devices]);
      setSelectedDevice(midiEngine.selectedDeviceId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={20} color="var(--accent-cyan)" />
            <h2 className="modal-title">Hardware MIDI & Studio Shortcuts</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Tab switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('midi')}
            className={`btn ${activeTab === 'midi' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Radio size={14} /> Web MIDI Devices
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`btn ${activeTab === 'shortcuts' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Keyboard size={14} /> Keyboard Shortcuts
          </button>
        </div>

        {activeTab === 'midi' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status card */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isSupported ? 'rgba(0, 210, 196, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isSupported ? 'rgba(0, 210, 196, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: isSupported ? 'var(--accent-cyan)' : '#ef4444' }}>
                  {isSupported ? 'Web MIDI API Supported' : 'Web MIDI Not Supported in this Browser'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {isSupported
                    ? 'Connect any USB or Bluetooth MIDI keyboard/pad controller.'
                    : 'Use Chrome, Edge, or Opera on desktop/Android for Web MIDI support.'}
                </div>
              </div>
              {isSupported && (
                <button
                  onClick={handleRequestAccess}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  <Zap size={13} color="var(--accent-cyan)" /> Scan Devices
                </button>
              )}
            </div>

            {/* Connected devices list */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Detected MIDI Inputs ({devices.length})
              </div>
              {devices.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  No external MIDI controllers detected yet. Plug in your USB keyboard and click "Scan Devices".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {devices.map((dev) => (
                    <div
                      key={dev.id}
                      onClick={() => setSelectedDevice(dev.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-tertiary)',
                        border: `1px solid ${selectedDevice === dev.id ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{dev.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {dev.manufacturer} • {dev.state}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: selectedDevice === dev.id ? 'var(--accent-cyan)' : 'var(--border-color)',
                          color: selectedDevice === dev.id ? '#000' : 'var(--text-secondary)',
                          fontWeight: 700
                        }}
                      >
                        {selectedDevice === dev.id ? 'ACTIVE' : 'SELECT'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Input Event Monitor */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Live MIDI Monitor
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  Velocity 0–127
                </span>
              </div>
              <div
                style={{
                  background: '#0a0d11',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)'
                }}
              >
                {recentEvents.length === 0 ? (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Awaiting incoming MIDI messages...
                  </span>
                ) : (
                  recentEvents.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: i === 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                      <span>[{ev.time}] NOTE_ON {ev.note}</span>
                      <span>Vel: {ev.velocity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Keyboard Shortcuts Guide */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              KeyMuse maps every physical key into musical expressions with zero setup required.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 16px',
                fontSize: '12px',
                background: 'var(--bg-tertiary)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}
            >
              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>A – L</kbd>
              <span>Middle Octave Natural Notes & Scales</span>

              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>W, E, T, Y, U</kbd>
              <span>Accidentals (Sharps / Flats)</span>

              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Shift + Key</kbd>
              <span>Shift Layer Alternate Notes & Harmonies</span>

              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>[ / ]</kbd>
              <span>Shift Octave Down / Up (-3 to +3)</span>

              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>- / =</kbd>
              <span>Transpose Semitones Down / Up (-12 to +12)</span>

              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Spacebar</kbd>
              <span>Sustain Pedal Lock (holds notes until released)</span>

              <kbd style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>1 – 0</kbd>
              <span>Top Melody Row / Percussion Triggers</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
