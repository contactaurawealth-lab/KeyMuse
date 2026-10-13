import React from 'react';
import { useAudioState } from '../context/AudioStateContext';

const KEYBOARD_ROWS = [
  // Row 1: Digits
  [
    'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
    'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
    'Minus', 'Equal'
  ],
  // Row 2: QWERTY
  [
    'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY',
    'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'
  ],
  // Row 3: ASDF
  [
    'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH',
    'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'
  ],
  // Row 4: ZXCV
  [
    'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN',
    'KeyM', 'Comma', 'Period', 'Slash'
  ],
  // Row 5: Space and Navigation
  [
    'Space', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'
  ]
];

export const KeyboardVisualizer: React.FC = () => {
  const {
    layers,
    activeLayerIndex,
    triggerNoteOn,
    triggerNoteOff,
    activeNotes
  } = useAudioState();

  const currentLayer = layers[activeLayerIndex] || layers[0];

  const handlePointerDown = (code: string) => {
    const mapping = currentLayer.keys[code];
    if (mapping && mapping.note) {
      triggerNoteOn(mapping.note, 0.85);
    }
  };

  const handlePointerUp = (code: string) => {
    const mapping = currentLayer.keys[code];
    if (mapping && mapping.note) {
      triggerNoteOff(mapping.note);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            gap: '6px',
            justifyContent: rowIdx === 4 ? 'center' : 'flex-start',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {row.map((code) => {
            const mapping = currentLayer.keys[code];
            const isNoteActive = mapping?.note ? activeNotes.has(mapping.note) : false;
            const isSpace = code === 'Space';

            return (
              <div
                key={code}
                onPointerDown={() => handlePointerDown(code)}
                onPointerUp={() => handlePointerUp(code)}
                onPointerLeave={() => handlePointerUp(code)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: isSpace ? '160px' : '42px',
                  height: '48px',
                  padding: '4px',
                  backgroundColor: isNoteActive ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: isNoteActive ? '#121316' : 'var(--text-primary)',
                  border: isNoteActive ? '1px solid var(--accent-cyan-hover)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  touchAction: 'none',
                  boxShadow: isNoteActive ? '0 0 12px rgba(0, 210, 196, 0.6)' : 'var(--shadow-sm)',
                  transform: isNoteActive ? 'translateY(1px)' : 'none',
                  transition: 'all 0.08s ease'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  {mapping?.label || code.replace('Key', '')}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isNoteActive ? '#121316' : 'var(--accent-amber)',
                    marginTop: '2px'
                  }}
                >
                  {mapping?.note || mapping?.action?.replace('_', ' ') || ''}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
