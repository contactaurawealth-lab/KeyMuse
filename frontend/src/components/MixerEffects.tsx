import React, { useEffect, useRef, useState } from 'react';
import { useAudioState } from '../context/AudioStateContext';
import { AudioEngine } from '../audio/AudioEngine';
import {
  Sliders,
  Volume2,
  VolumeX,
  Activity,
  Sparkles,
  Waves,
  Flame,
  Zap,
  RotateCcw,
  Check,
  ShieldCheck
} from 'lucide-react';

export const MixerEffects: React.FC = () => {
  const {
    effects,
    updateEffects,
    bpm,
    synthSettings,
    updateSynthSettings,
    audioStatus
  } = useAudioState();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [activePreset, setActivePreset] = useState<string>('Custom');

  // Real-time Master Analyser Spectrum Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = AudioEngine.getInstance();
    const analyser = engine.masterAnalyser;

    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 128);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background grid line
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, width, height);

      if (analyser && engine.status === 'running') {
        analyser.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(2); // subtle resting line
      }

      const barCount = 48;
      const step = Math.floor(dataArray.length / barCount);
      const barWidth = (width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * (height - 6));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Color gradient from cyan to amber based on height
        if (percent > 0.8) {
          ctx.fillStyle = '#ef4444'; // clipping / high peak warning
        } else if (percent > 0.5) {
          ctx.fillStyle = '#f59e0b'; // amber
        } else {
          ctx.fillStyle = '#00d2c4'; // cyan
        }

        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [audioStatus]);

  // Master volume in dB display
  const masterDb =
    effects.masterVolume > 0.001
      ? (20 * Math.log10(effects.masterVolume)).toFixed(1) + ' dB'
      : '-∞ dB';

  // Tempo-synced delay calculation
  const setSyncedDelay = (subdivision: number) => {
    // 1 beat = 60 / bpm seconds.
    // 1/16 = beat / 4
    // 1/8  = beat / 2
    // 1/4  = beat
    const beatSec = 60 / bpm;
    const timeSec = Math.max(0.02, Math.min(1.0, beatSec * subdivision));
    updateEffects({ delayTime: parseFloat(timeSec.toFixed(3)), delayBypass: false });
  };

  // Preset Configurations
  const applyPreset = (name: string) => {
    setActivePreset(name);
    switch (name) {
      case 'Clean Studio':
        updateEffects({
          reverbBypass: false,
          reverbWet: 0.15,
          reverbDecay: 1.2,
          delayBypass: true,
          delayWet: 0,
          filterBypass: true,
          distortionBypass: true,
          distortionDrive: 0,
          distortionWet: 0
        });
        break;
      case 'Cathedral Reverb':
        updateEffects({
          reverbBypass: false,
          reverbWet: 0.5,
          reverbDecay: 4.2,
          delayBypass: true,
          filterBypass: true,
          distortionBypass: true
        });
        break;
      case 'Dub Echo':
        updateEffects({
          reverbBypass: false,
          reverbWet: 0.25,
          reverbDecay: 2.0,
          delayBypass: false,
          delayTime: parseFloat(((60 / bpm) * 0.75).toFixed(3)), // dotted 8th
          delayFeedback: 0.6,
          delayWet: 0.45,
          filterBypass: false,
          filterType: 'lowpass',
          filterCutoff: 5000,
          distortionBypass: true
        });
        break;
      case 'Lo-Fi Vintage':
        updateEffects({
          reverbBypass: false,
          reverbWet: 0.2,
          reverbDecay: 1.4,
          delayBypass: false,
          delayTime: 0.18,
          delayFeedback: 0.25,
          delayWet: 0.15,
          filterBypass: false,
          filterType: 'lowpass',
          filterCutoff: 3800,
          distortionBypass: false,
          distortionDrive: 12,
          distortionWet: 0.28
        });
        break;
      case 'Synthwave Drive':
        updateEffects({
          reverbBypass: false,
          reverbWet: 0.35,
          reverbDecay: 2.5,
          delayBypass: false,
          delayTime: parseFloat(((60 / bpm) * 0.5).toFixed(3)), // 1/8th
          delayFeedback: 0.4,
          delayWet: 0.3,
          filterBypass: true,
          distortionBypass: false,
          distortionDrive: 22,
          distortionWet: 0.35
        });
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner: Master Output & Spectrum Analyser */}
      <div className="studio-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Master Output & Spectrum Analyser</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 210, 196, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 210, 196, 0.3)'
              }}
            >
              <ShieldCheck size={13} />
              Master Limiter: Active (-2.0 dB Peak Protection)
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'monospace'
              }}
            >
              {masterDb}
            </span>
          </div>
        </div>

        {/* Real-Time Spectrum Canvas */}
        <div style={{ width: '100%', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0a0d11', border: '1px solid var(--border-color)' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={80}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        {/* Master Volume Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => updateEffects({ masterVolume: effects.masterVolume === 0 ? 0.85 : 0 })}
            className="btn btn-secondary"
            title="Toggle Mute"
            style={{ padding: '6px 10px' }}
          >
            {effects.masterVolume === 0 ? <VolumeX size={16} color="var(--accent-amber)" /> : <Volume2 size={16} />}
          </button>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Master Output Level</span>
              <span style={{ fontWeight: 600 }}>{Math.round(effects.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effects.masterVolume}
              onChange={(e) => updateEffects({ masterVolume: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>
          <button
            onClick={() => updateEffects({ masterVolume: 0.85 })}
            className="btn btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
          >
            Reset (0dB)
          </button>
        </div>

        {/* DSP Presets Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
            DSP Presets:
          </span>
          {['Clean Studio', 'Cathedral Reverb', 'Dub Echo', 'Lo-Fi Vintage', 'Synthwave Drive'].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className="btn"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activePreset === p ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                color: activePreset === p ? '#000' : 'var(--text-primary)',
                fontWeight: activePreset === p ? 700 : 500,
                border: '1px solid var(--border-color)'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Effects Rack Grid (4 Modules) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Module 1: Algorithmic / Procedural Reverb */}
        <div className="studio-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Reverb (Impulse)</span>
            </div>
            <button
              onClick={() => updateEffects({ reverbBypass: !effects.reverbBypass })}
              className="btn"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: effects.reverbBypass ? 'var(--bg-tertiary)' : 'rgba(0, 210, 196, 0.2)',
                color: effects.reverbBypass ? 'var(--text-secondary)' : 'var(--accent-cyan)',
                border: '1px solid ' + (effects.reverbBypass ? 'var(--border-color)' : 'rgba(0, 210, 196, 0.4)')
              }}
            >
              {effects.reverbBypass ? 'BYPASS' : 'ON'}
            </button>
          </div>

          <div style={{ opacity: effects.reverbBypass ? 0.5 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wet / Dry Mix</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.reverbWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={effects.reverbBypass}
                value={effects.reverbWet}
                onChange={(e) => updateEffects({ reverbWet: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Decay Time</span>
                <span style={{ fontWeight: 600 }}>{effects.reverbDecay.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="5.0"
                step="0.1"
                disabled={effects.reverbBypass}
                value={effects.reverbDecay}
                onChange={(e) => updateEffects({ reverbDecay: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {[
                { label: 'Room', decay: 0.8 },
                { label: 'Plate', decay: 1.8 },
                { label: 'Hall', decay: 3.2 }
              ].map((r) => (
                <button
                  key={r.label}
                  disabled={effects.reverbBypass}
                  onClick={() => updateEffects({ reverbDecay: r.decay, reverbBypass: false })}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '10px', padding: '4px' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Module 2: Stereo Echo / Delay */}
        <div className="studio-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Waves size={18} color="var(--accent-amber)" />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Stereo Delay</span>
            </div>
            <button
              onClick={() => updateEffects({ delayBypass: !effects.delayBypass })}
              className="btn"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: effects.delayBypass ? 'var(--bg-tertiary)' : 'rgba(245, 158, 11, 0.2)',
                color: effects.delayBypass ? 'var(--text-secondary)' : 'var(--accent-amber)',
                border: '1px solid ' + (effects.delayBypass ? 'var(--border-color)' : 'rgba(245, 158, 11, 0.4)')
              }}
            >
              {effects.delayBypass ? 'BYPASS' : 'ON'}
            </button>
          </div>

          <div style={{ opacity: effects.delayBypass ? 0.5 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Delay Time</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.delayTime * 1000)}ms</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="1.0"
                step="0.01"
                disabled={effects.delayBypass}
                value={effects.delayTime}
                onChange={(e) => updateEffects({ delayTime: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={effects.delayBypass}
                onClick={() => setSyncedDelay(0.25)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '10px', padding: '3px' }}
              >
                1/16
              </button>
              <button
                disabled={effects.delayBypass}
                onClick={() => setSyncedDelay(0.5)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '10px', padding: '3px' }}
              >
                1/8
              </button>
              <button
                disabled={effects.delayBypass}
                onClick={() => setSyncedDelay(0.75)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '10px', padding: '3px' }}
              >
                1/8d
              </button>
              <button
                disabled={effects.delayBypass}
                onClick={() => setSyncedDelay(1.0)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '10px', padding: '3px' }}
              >
                1/4
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Feedback</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.85"
                step="0.01"
                disabled={effects.delayBypass}
                value={effects.delayFeedback}
                onChange={(e) => updateEffects({ delayFeedback: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wet Mix</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.delayWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={effects.delayBypass}
                value={effects.delayWet}
                onChange={(e) => updateEffects({ delayWet: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
              />
            </div>
          </div>
        </div>

        {/* Module 3: Biquad Tone Filter */}
        <div className="studio-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Biquad Filter</span>
            </div>
            <button
              onClick={() => updateEffects({ filterBypass: !effects.filterBypass })}
              className="btn"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: effects.filterBypass ? 'var(--bg-tertiary)' : 'rgba(0, 210, 196, 0.2)',
                color: effects.filterBypass ? 'var(--text-secondary)' : 'var(--accent-cyan)',
                border: '1px solid ' + (effects.filterBypass ? 'var(--border-color)' : 'rgba(0, 210, 196, 0.4)')
              }}
            >
              {effects.filterBypass ? 'BYPASS' : 'ON'}
            </button>
          </div>

          <div style={{ opacity: effects.filterBypass ? 0.5 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={effects.filterBypass}
                onClick={() => updateEffects({ filterType: 'lowpass' })}
                className="btn"
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '4px',
                  backgroundColor: effects.filterType === 'lowpass' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: effects.filterType === 'lowpass' ? '#000' : 'var(--text-primary)',
                  fontWeight: 600
                }}
              >
                Low-Pass
              </button>
              <button
                disabled={effects.filterBypass}
                onClick={() => updateEffects({ filterType: 'highpass' })}
                className="btn"
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '4px',
                  backgroundColor: effects.filterType === 'highpass' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: effects.filterType === 'highpass' ? '#000' : 'var(--text-primary)',
                  fontWeight: 600
                }}
              >
                High-Pass
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cutoff Frequency</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.filterCutoff)} Hz</span>
              </div>
              <input
                type="range"
                min="50"
                max="20000"
                step="50"
                disabled={effects.filterBypass}
                value={effects.filterCutoff}
                onChange={(e) => updateEffects({ filterCutoff: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: 'Warm Sub', freq: 650 },
                { label: 'Vocal Mid', freq: 2800 },
                { label: 'Air High', freq: 12000 }
              ].map((f) => (
                <button
                  key={f.label}
                  disabled={effects.filterBypass}
                  onClick={() => updateEffects({ filterCutoff: f.freq, filterBypass: false })}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '10px', padding: '3px' }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Module 4: Overdrive / Distortion */}
        <div className="studio-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#ef4444" />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Saturation / Drive</span>
            </div>
            <button
              onClick={() => updateEffects({ distortionBypass: !effects.distortionBypass })}
              className="btn"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: effects.distortionBypass ? 'var(--bg-tertiary)' : 'rgba(239, 68, 68, 0.2)',
                color: effects.distortionBypass ? 'var(--text-secondary)' : '#ef4444',
                border: '1px solid ' + (effects.distortionBypass ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.4)')
              }}
            >
              {effects.distortionBypass ? 'BYPASS' : 'ON'}
            </button>
          </div>

          <div style={{ opacity: effects.distortionBypass ? 0.5 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Drive Intensity</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.distortionDrive)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                disabled={effects.distortionBypass}
                value={effects.distortionDrive}
                onChange={(e) => updateEffects({ distortionDrive: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wet Mix</span>
                <span style={{ fontWeight: 600 }}>{Math.round(effects.distortionWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={effects.distortionBypass}
                value={effects.distortionWet}
                onChange={(e) => updateEffects({ distortionWet: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Oversampling: 4x Anti-Alias</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>Sigmoid Soft-Clip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submix Channel Strips */}
      <div className="studio-card">
        <div className="card-title">Submix Channels</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '12px' }}>
          {/* Channel 1: Instrument Synth Engine */}
          <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Instrument Voice Level</span>
              <span>{Math.round(synthSettings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={synthSettings.volume}
              onChange={(e) => updateSynthSettings({ volume: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Channel 2: Metronome & Rhythm */}
          <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Rhythm Tempo Sync</span>
              <span>{bpm} BPM</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              LFOs and delay subdivisions locked to master clock.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
