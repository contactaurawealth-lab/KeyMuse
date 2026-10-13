import React, { useState } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { INSTRUMENTS } from '../constants/instruments';
import { InstrumentType } from '../types';
import { Volume2, Play, CheckCircle2, Sliders, Sparkles } from 'lucide-react';

export const InstrumentSelector: React.FC = () => {
  const {
    selectedInstrument,
    setSelectedInstrument,
    synthSettings,
    updateSynthSettings,
    triggerNoteOn,
    triggerNoteOff,
    sampleEngine
  } = useAudioState();

  const [activeCategory, setActiveCategory] = useState<'all' | 'keys' | 'synths' | 'acoustic' | 'percussion'>('all');

  const filteredInstruments = INSTRUMENTS.filter(
    (inst) => activeCategory === 'all' || inst.category === activeCategory
  );

  const previewInstrument = (instId: InstrumentType) => {
    setSelectedInstrument(instId);
    // Audition preview: plays a short C Major triad
    const notes = ['C4', 'E4', 'G4'];
    notes.forEach((note, idx) => {
      setTimeout(() => {
        triggerNoteOn(note, 0.7);
        setTimeout(() => triggerNoteOff(note), 600);
      }, idx * 120);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['all', 'keys', 'synths', 'acoustic', 'percussion'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`studio-btn ${activeCategory === cat ? 'studio-btn-active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {cat === 'all' ? `All Instruments (${INSTRUMENTS.length})` : cat}
          </button>
        ))}
      </div>

      {/* Instrument Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px'
        }}
      >
        {filteredInstruments.map((inst) => {
          const isSelected = selectedInstrument === inst.id;
          const status = sampleEngine.loadingState[inst.id] || 'ready';

          return (
            <div
              key={inst.id}
              onClick={() => setSelectedInstrument(inst.id)}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isSelected ? 'var(--bg-surface)' : 'var(--bg-tertiary)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? '0 0 12px rgba(0, 210, 196, 0.25)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                      {inst.name}
                    </span>
                    {isSelected && <CheckCircle2 size={14} style={{ color: 'var(--accent-cyan)' }} />}
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {inst.category}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                  {inst.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                  {status === 'ready' ? '• Model: Physical DSP' : '• Status: ' + status}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    previewInstrument(inst.id);
                  }}
                  className="studio-btn"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                  title="Audition Sound"
                >
                  <Play size={12} /> Audition
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Envelope & Timbre Shaper for Active Instrument */}
      <div className="studio-card" style={{ marginTop: '8px' }}>
        <div className="card-title">
          <span>Active Instrument Sound Shaper</span>
          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>
            Editing: {INSTRUMENTS.find((i) => i.id === selectedInstrument)?.name}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {/* Attack */}
          <div className="control-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="control-label">Attack</label>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                {Math.round(synthSettings.envelope.attack * 1000)} ms
              </span>
            </div>
            <input
              type="range"
              min={0.002}
              max={1.5}
              step={0.005}
              value={synthSettings.envelope.attack}
              onChange={(e) =>
                updateSynthSettings({
                  envelope: { ...synthSettings.envelope, attack: parseFloat(e.target.value) }
                })
              }
              className="studio-slider"
            />
          </div>

          {/* Decay */}
          <div className="control-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="control-label">Decay</label>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                {synthSettings.envelope.decay.toFixed(2)} s
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={3.0}
              step={0.05}
              value={synthSettings.envelope.decay}
              onChange={(e) =>
                updateSynthSettings({
                  envelope: { ...synthSettings.envelope, decay: parseFloat(e.target.value) }
                })
              }
              className="studio-slider"
            />
          </div>

          {/* Sustain */}
          <div className="control-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="control-label">Sustain</label>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                {Math.round(synthSettings.envelope.sustain * 100)} %
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.01}
              value={synthSettings.envelope.sustain}
              onChange={(e) =>
                updateSynthSettings({
                  envelope: { ...synthSettings.envelope, sustain: parseFloat(e.target.value) }
                })
              }
              className="studio-slider"
            />
          </div>

          {/* Release */}
          <div className="control-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="control-label">Release</label>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                {synthSettings.envelope.release.toFixed(2)} s
              </span>
            </div>
            <input
              type="range"
              min={0.02}
              max={3.0}
              step={0.05}
              value={synthSettings.envelope.release}
              onChange={(e) =>
                updateSynthSettings({
                  envelope: { ...synthSettings.envelope, release: parseFloat(e.target.value) }
                })
              }
              className="studio-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
