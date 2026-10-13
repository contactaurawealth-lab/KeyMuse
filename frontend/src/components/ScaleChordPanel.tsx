import React from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { ROOT_NOTES, SCALES } from '../constants/scales';
import { CHORDS } from '../constants/chords';
import { ScaleType, ChordType, ArpDirection } from '../types';
import { getScaleNoteNames } from '../audio/MusicTheory';
import { Lock, Unlock, Music, Layers, Zap, ArrowLeft, ArrowRight } from 'lucide-react';

export const ScaleChordPanel: React.FC = () => {
  const {
    scale,
    setScale,
    rootNote,
    setRootNote,
    scaleLock,
    setScaleLock,
    chordType,
    setChordType,
    arpeggiator,
    setArpeggiator,
    transpose,
    setTranspose
  } = useAudioState();

  const scaleNotes = getScaleNoteNames(rootNote, scale);

  return (
    <div className="studio-card" style={{ padding: '14px' }}>
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Music size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Musical Intelligence Engine</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setScaleLock((prev) => !prev)}
            className={`studio-btn ${scaleLock ? 'studio-btn-active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '11px' }}
            title="Lock keyboard input to current scale"
          >
            {scaleLock ? <Lock size={12} /> : <Unlock size={12} />}
            {scaleLock ? 'Scale Lock ON' : 'Scale Lock'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* 1. Scale & Root Note */}
        <div className="control-group" style={{ margin: 0 }}>
          <label className="control-label">Scale & Root Note</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select
              value={rootNote}
              onChange={(e) => setRootNote(e.target.value)}
              className="studio-select"
              style={{ width: '65px', fontWeight: 700, color: 'var(--accent-cyan)' }}
            >
              {ROOT_NOTES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as ScaleType)}
              className="studio-select"
              style={{ flex: 1 }}
            >
              {Object.values(SCALES).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active scale notes visualization */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginTop: '6px',
              flexWrap: 'wrap',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            {scaleNotes.map((n, idx) => (
              <span
                key={idx}
                style={{
                  padding: '2px 5px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: n === rootNote ? 'rgba(0, 210, 196, 0.2)' : 'var(--bg-tertiary)',
                  color: n === rootNote ? 'var(--accent-cyan)' : 'var(--text-primary)',
                  fontWeight: n === rootNote ? 700 : 500
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Chord Performance Mode */}
        <div className="control-group" style={{ margin: 0 }}>
          <label className="control-label">Chord Harmonies</label>
          <select
            value={chordType}
            onChange={(e) => setChordType(e.target.value as ChordType)}
            className="studio-select"
          >
            {Object.values(CHORDS).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.symbol ? `(${c.symbol})` : ''}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {chordType === 'single'
              ? 'Play single polyphonic notes'
              : `Triggers full ${CHORDS[chordType]?.name} on every key`}
          </span>
        </div>

        {/* 3. Arpeggiator Settings */}
        <div className="control-group" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label">Arpeggiator</label>
            <button
              onClick={() =>
                setArpeggiator((prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                  direction: !prev.enabled ? 'up' : 'off'
                }))
              }
              className={`studio-btn ${arpeggiator.enabled ? 'studio-btn-active' : ''}`}
              style={{ padding: '2px 6px', fontSize: '10px' }}
            >
              <Zap size={10} /> {arpeggiator.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <select
              value={arpeggiator.direction}
              disabled={!arpeggiator.enabled}
              onChange={(e) =>
                setArpeggiator((prev) => ({ ...prev, direction: e.target.value as ArpDirection }))
              }
              className="studio-select"
              style={{ flex: 1, opacity: arpeggiator.enabled ? 1 : 0.5 }}
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="updown">Up / Down</option>
              <option value="random">Random</option>
            </select>

            <select
              value={arpeggiator.rate}
              disabled={!arpeggiator.enabled}
              onChange={(e) =>
                setArpeggiator((prev) => ({ ...prev, rate: e.target.value as any }))
              }
              className="studio-select"
              style={{ width: '70px', opacity: arpeggiator.enabled ? 1 : 0.5 }}
            >
              <option value="1/4">1/4</option>
              <option value="1/8">1/8</option>
              <option value="1/16">1/16</option>
              <option value="1/32">1/32</option>
            </select>
          </div>
        </div>

        {/* 4. Transpose (+/- 12 Semitones) */}
        <div className="control-group" style={{ margin: 0 }}>
          <label className="control-label">Pitch Transpose</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setTranspose((t) => Math.max(-12, t - 1))}
              className="studio-btn"
              style={{ padding: '6px 10px' }}
            >
              <ArrowLeft size={14} />
            </button>
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: transpose === 0 ? 'var(--text-primary)' : 'var(--accent-cyan)'
              }}
            >
              {transpose > 0 ? `+${transpose} semitones` : transpose < 0 ? `${transpose} semitones` : 'Standard (0)'}
            </span>
            <button
              onClick={() => setTranspose((t) => Math.min(12, t + 1))}
              className="studio-btn"
              style={{ padding: '6px 10px' }}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
