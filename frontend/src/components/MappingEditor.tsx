import React, { useState } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { X, RotateCcw, Check } from 'lucide-react';

interface MappingEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MappingEditor: React.FC<MappingEditorProps> = ({ isOpen, onClose }) => {
  const {
    layers,
    activeLayerIndex,
    setActiveLayerIndex,
    updateKeyMapping,
    resetMappings
  } = useAudioState();

  const [selectedKey, setSelectedKey] = useState<string>('KeyA');
  const [newNote, setNewNote] = useState<string>('C4');

  if (!isOpen) return null;

  const currentLayer = layers[activeLayerIndex] || layers[0];
  const currentMapping = currentLayer.keys[selectedKey];

  const handleSave = () => {
    if (selectedKey && newNote) {
      updateKeyMapping(activeLayerIndex, selectedKey, newNote.toUpperCase());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Custom Keyboard Mappings</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Layer Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveLayerIndex(0)}
            className={`studio-btn ${activeLayerIndex === 0 ? 'studio-btn-active' : ''}`}
          >
            Base Layer Mappings
          </button>
          <button
            onClick={() => setActiveLayerIndex(1)}
            className={`studio-btn ${activeLayerIndex === 1 ? 'studio-btn-active' : ''}`}
          >
            Shift Layer Mappings
          </button>
        </div>

        {/* Selected Key Details */}
        <div className="studio-card" style={{ marginBottom: '16px' }}>
          <div className="card-title">Edit Selected Key</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="control-group" style={{ margin: 0, minWidth: '120px' }}>
              <label className="control-label">Physical Key</label>
              <select
                value={selectedKey}
                onChange={(e) => {
                  setSelectedKey(e.target.value);
                  const m = currentLayer.keys[e.target.value];
                  if (m?.note) setNewNote(m.note);
                }}
                className="studio-select"
              >
                {Object.keys(currentLayer.keys).map((code) => (
                  <option key={code} value={code}>
                    {currentLayer.keys[code].label} ({code})
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group" style={{ margin: 0, minWidth: '120px' }}>
              <label className="control-label">Assigned Note</label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. C4, D#4, F5"
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
            </div>

            <button
              onClick={handleSave}
              className="studio-btn studio-btn-primary"
              style={{ alignSelf: 'flex-end', height: '36px' }}
            >
              <Check size={14} /> Apply Mapping
            </button>
          </div>
        </div>

        {/* Reset Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={resetMappings}
            className="studio-btn"
            style={{ color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            <RotateCcw size={14} /> Reset to Defaults
          </button>
          <button onClick={onClose} className="studio-btn">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
