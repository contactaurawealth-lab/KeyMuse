import React, { useState, useRef, useCallback } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { Grid, Eye, EyeOff, ArrowLeft, ArrowRight, Disc } from 'lucide-react';
import { DrumSound } from '../types';

interface KeyDef {
  note: string;
  isBlack: boolean;
  whiteIndex: number; // Index among white keys for positioning
}

// Generate keys for a given base octave (e.g., baseOctave = 3 generates C3 to B4 or C3 to B5)
function generatePianoKeys(startOctave: number, octaveCount: number): KeyDef[] {
  const notesPattern = [
    { name: 'C', isBlack: false },
    { name: 'C#', isBlack: true },
    { name: 'D', isBlack: false },
    { name: 'D#', isBlack: true },
    { name: 'E', isBlack: false },
    { name: 'F', isBlack: false },
    { name: 'F#', isBlack: true },
    { name: 'G', isBlack: false },
    { name: 'G#', isBlack: true },
    { name: 'A', isBlack: false },
    { name: 'A#', isBlack: true },
    { name: 'B', isBlack: false }
  ];

  const keys: KeyDef[] = [];
  let whiteCount = 0;

  for (let o = 0; o < octaveCount; o++) {
    const oct = startOctave + o;
    for (const item of notesPattern) {
      if (!item.isBlack) {
        keys.push({
          note: `${item.name}${oct}`,
          isBlack: false,
          whiteIndex: whiteCount
        });
        whiteCount++;
      } else {
        keys.push({
          note: `${item.name}${oct}`,
          isBlack: true,
          whiteIndex: whiteCount - 1
        });
      }
    }
  }

  // End on high C
  keys.push({
    note: `C${startOctave + octaveCount}`,
    isBlack: false,
    whiteIndex: whiteCount
  });

  return keys;
}

const DRUM_PAD_NAMES: { sound: DrumSound; label: string; key: string }[] = [
  { sound: 'kick', label: 'Kick Drum', key: '1' },
  { sound: 'snare', label: 'Snare Drum', key: '2' },
  { sound: 'hihat_closed', label: 'Closed Hat', key: '3' },
  { sound: 'hihat_open', label: 'Open Hat', key: '4' },
  { sound: 'clap', label: 'Hand Clap', key: '5' },
  { sound: 'tom', label: 'Floor Tom', key: '6' },
  { sound: 'perc', label: 'Percussion', key: '7' },
  { sound: 'kick', label: 'Punch Kick', key: '8' }
];

export const VirtualPiano: React.FC = () => {
  const {
    triggerNoteOn,
    triggerNoteOff,
    activeNotes,
    drumEngine,
    octaveOffset,
    setOctaveOffset
  } = useAudioState();

  const [displayOctave, setDisplayOctave] = useState<number>(3);
  const [octaveSpan, setOctaveSpan] = useState<number>(2); // 2 octaves displayed
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isPadMode, setIsPadMode] = useState<boolean>(false);

  // Multi-touch tracking: pointerId -> note
  const activePointersRef = useRef<Map<number, string>>(new Map());

  const keys = generatePianoKeys(displayOctave + octaveOffset, octaveSpan);
  const totalWhiteKeys = keys.filter((k) => !k.isBlack).length;

  const handlePointerDown = useCallback((e: React.PointerEvent, note: string) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, note);
    triggerNoteOn(note, 0.85);
  }, [triggerNoteOn]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const note = activePointersRef.current.get(e.pointerId);
    if (note) {
      triggerNoteOff(note);
      activePointersRef.current.delete(e.pointerId);
    }
  }, [triggerNoteOff]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    handlePointerUp(e);
  }, [handlePointerUp]);

  return (
    <div className="studio-card" style={{ padding: '16px' }}>
      {/* Piano Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isPadMode ? 'MPC DRUM PADS' : 'VIRTUAL MULTI-TOUCH PIANO'}
          </span>
          <button
            onClick={() => setIsPadMode(!isPadMode)}
            className={`studio-btn ${isPadMode ? 'studio-btn-active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            <Grid size={14} /> {isPadMode ? 'Switch to Keys' : 'Switch to Pads'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Octave Shift */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setDisplayOctave((o) => Math.max(1, o - 1))}
              className="studio-btn"
              style={{ padding: '4px 8px' }}
              title="Display Lower Octave"
            >
              <ArrowLeft size={14} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>
              C{displayOctave + octaveOffset}
            </span>
            <button
              onClick={() => setDisplayOctave((o) => Math.min(6, o + 1))}
              className="studio-btn"
              style={{ padding: '4px 8px' }}
              title="Display Higher Octave"
            >
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Toggle Labels */}
          {!isPadMode && (
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="studio-btn"
              style={{ padding: '4px 8px' }}
              title="Toggle Note Labels"
            >
              {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Virtual Piano Keyboard */}
      {!isPadMode ? (
        <div
          style={{
            position: 'relative',
            height: '170px',
            width: '100%',
            overflowX: 'auto',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '2px',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* White Keys */}
          <div style={{ display: 'flex', height: '100%', width: '100%' }}>
            {keys
              .filter((k) => !k.isBlack)
              .map((k) => {
                const isActive = activeNotes.has(k.note);
                return (
                  <div
                    key={k.note}
                    onPointerDown={(e) => handlePointerDown(e, k.note)}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    style={{
                      flex: 1,
                      height: '100%',
                      backgroundColor: isActive ? 'var(--key-white-active)' : 'var(--key-white)',
                      border: '1px solid #1a1c23',
                      borderBottomLeftRadius: '4px',
                      borderBottomRightRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      paddingBottom: '8px',
                      zIndex: 1,
                      boxShadow: isActive ? 'inset 0 -6px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.15)',
                      transition: 'background-color 0.05s'
                    }}
                  >
                    {showLabels && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isActive ? '#121316' : '#475569',
                          pointerEvents: 'none'
                        }}
                      >
                        {k.note}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Black Keys (Overlay) */}
          {keys
            .filter((k) => k.isBlack)
            .map((k) => {
              const isActive = activeNotes.has(k.note);
              // Calculate horizontal offset based on whiteIndex
              const whiteKeyWidthPercent = 100 / totalWhiteKeys;
              const leftPercent = (k.whiteIndex + 1) * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.35;

              return (
                <div
                  key={k.note}
                  onPointerDown={(e) => handlePointerDown(e, k.note)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: `${leftPercent}%`,
                    width: `${whiteKeyWidthPercent * 0.7}%`,
                    height: '60%',
                    backgroundColor: isActive ? 'var(--key-black-active)' : 'var(--key-black)',
                    border: isActive ? '1px solid var(--accent-cyan)' : '1px solid #000',
                    borderBottomLeftRadius: '3px',
                    borderBottomRightRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: '6px',
                    zIndex: 2,
                    boxShadow: isActive
                      ? '0 0 10px rgba(0, 210, 196, 0.8)'
                      : '0 3px 6px rgba(0,0,0,0.6)',
                    transition: 'background-color 0.05s'
                  }}
                >
                  {showLabels && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: isActive ? 'var(--accent-cyan)' : '#94a3b8',
                        pointerEvents: 'none'
                      }}
                    >
                      {k.note}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* Mode 2: MPC Drum Touch Pads */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}>
          {DRUM_PAD_NAMES.map((pad, idx) => (
            <div
              key={idx}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                drumEngine.trigger(pad.sound, 0.9);
              }}
              style={{
                height: '80px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                touchAction: 'none',
                transition: 'all 0.08s ease'
              }}
              onPointerEnter={(e) => {
                if (e.buttons > 0) drumEngine.trigger(pad.sound, 0.9);
              }}
            >
              <Disc size={20} style={{ color: 'var(--accent-amber)', marginBottom: '4px' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{pad.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Pad {pad.key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
