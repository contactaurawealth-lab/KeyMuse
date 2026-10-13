import React, { useState } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { StorageService } from '../db/indexedDb';
import { X, Download, Upload, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { theme, toggleTheme, bpm, setBpm, effects, updateEffects } = useAudioState();
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleExportProject = async () => {
    const project = {
      id: `proj_${Date.now()}`,
      name: 'KeyMuse Studio Session',
      version: 1,
      bpm,
      selectedInstrument: 'piano' as any,
      octave: 0,
      transpose: 0,
      scale: 'chromatic' as any,
      rootNote: 'C',
      scaleLock: false,
      chordType: 'single' as any,
      arpSettings: { enabled: false, direction: 'off' as any, rate: '1/16' as any, octaves: 1 },
      effects,
      drumPattern: { name: 'Current', steps: {} as any },
      tracks: [],
      updatedAt: Date.now()
    };

    const json = StorageService.exportProjectJSON(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keymuse_session_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const project = StorageService.validateAndParseProjectJSON(text);
        if (project.bpm) setBpm(project.bpm);
        if (project.effects) updateEffects(project.effects);
        setImportStatus('Project imported successfully!');
        setTimeout(() => setImportStatus(''), 3000);
      } catch (err: any) {
        setImportStatus(`Import Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Studio Settings</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="control-group">
          <label className="control-label">Appearance</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              className={`studio-btn ${theme === 'dark' ? 'studio-btn-active' : ''}`}
            >
              Charcoal Studio (Dark)
            </button>
            <button
              onClick={toggleTheme}
              className={`studio-btn ${theme === 'light' ? 'studio-btn-active' : ''}`}
            >
              High-Contrast (Light)
            </button>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Audio Safety & Limiter</label>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Integrated 3ms fast-lookahead DynamicsCompressor prevents digital distortion & ear clipping.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>Status: Active (-2.0 dB Threshold)</span>
          </div>
        </div>

        <div className="control-group" style={{ marginTop: '16px' }}>
          <label className="control-label">Project Backup & Restore</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleExportProject} className="studio-btn studio-btn-primary">
              <Download size={14} /> Export Session JSON
            </button>
            <label className="studio-btn" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Import Session JSON
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
          {importStatus && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                color: importStatus.includes('Error') ? 'var(--accent-red)' : 'var(--accent-green)'
              }}
            >
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
