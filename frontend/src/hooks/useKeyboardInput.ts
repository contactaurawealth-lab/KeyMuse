import { useEffect, useRef } from 'react';
import { useAudioState } from '../context/AudioStateContext';

export function useKeyboardInput() {
  const {
    layers,
    activeLayerIndex,
    triggerNoteOn,
    triggerNoteOff,
    stopAllNotes,
    setOctaveOffset,
    toggleLayer,
    toggleSustainPedal,
    activeKeys
  } = useAudioState();

  // Track currently pressed keys by KeyboardEvent.code
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const activeLayerRef = useRef(activeLayerIndex);
  activeLayerRef.current = activeLayerIndex;

  const layersRef = useRef(layers);
  layersRef.current = layers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore typing inside editable fields
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 2. Ignore modifier shortcuts (Ctrl, Alt, Meta) to allow browser functions
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // 3. Ignore browser autorepeat
      if (e.repeat) {
        return;
      }

      const code = e.code;
      if (pressedKeysRef.current.has(code)) {
        return;
      }

      // Determine active layer (Shift held or mobile Shift layer active)
      const isShift = e.shiftKey || activeLayerRef.current === 1;
      const currentLayer = isShift ? layersRef.current[1] : layersRef.current[0];
      const mapping = currentLayer?.keys[code];

      if (!mapping) {
        return;
      }

      // Prevent default browser scroll on Space, etc.
      if (['Space', 'Slash'].includes(code)) {
        e.preventDefault();
      }

      pressedKeysRef.current.add(code);

      // Handle actions
      if (mapping.action) {
        switch (mapping.action) {
          case 'octave_down':
            setOctaveOffset((p) => Math.max(-3, p - 1));
            break;
          case 'octave_up':
            setOctaveOffset((p) => Math.min(3, p + 1));
            break;
          case 'layer_toggle':
            toggleLayer();
            break;
          case 'sustain_toggle':
            toggleSustainPedal();
            break;
          case 'panic':
            stopAllNotes();
            break;
        }
        return;
      }

      // Handle musical note
      if (mapping.note) {
        triggerNoteOn(mapping.note, 0.85);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (!pressedKeysRef.current.has(code)) {
        return;
      }

      pressedKeysRef.current.delete(code);

      // Determine which layer note was playing
      const isShift = e.shiftKey || activeLayerRef.current === 1;
      const currentLayer = isShift ? layersRef.current[1] : layersRef.current[0];
      const mapping = currentLayer?.keys[code] || layersRef.current[0]?.keys[code];

      if (mapping && mapping.note) {
        triggerNoteOff(mapping.note);
      }
    };

    // 4. Focus loss & tab hide cleanup: prevent stuck notes
    const handleFocusLoss = () => {
      pressedKeysRef.current.clear();
      stopAllNotes();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleFocusLoss);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleFocusLoss);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleFocusLoss();
    };
  }, [
    triggerNoteOn,
    triggerNoteOff,
    stopAllNotes,
    setOctaveOffset,
    toggleLayer,
    toggleSustainPedal
  ]);

  return {
    pressedKeys: pressedKeysRef.current
  };
}
