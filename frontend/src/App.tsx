import React, { useState } from 'react';
import { Header } from './components/Header';
import { AudioBanner } from './components/AudioBanner';
import { MobileControls } from './components/MobileControls';
import { KeyboardVisualizer } from './components/KeyboardVisualizer';
import { VirtualPiano } from './components/VirtualPiano';
import { InstrumentSelector } from './components/InstrumentSelector';
import { ScaleChordPanel } from './components/ScaleChordPanel';
import { DrumMachine } from './components/DrumMachine';
import { MixerEffects } from './components/MixerEffects';
import { LoopStation } from './components/LoopStation';
import { MappingEditor } from './components/MappingEditor';
import { SettingsModal } from './components/StateModals';
import { MidiModal } from './components/MidiModal';
import { AiStudio } from './components/AiStudio';
import { AgentSetupHub } from './components/AgentSetupHub';
import { SoothingAudioPlayer } from './components/SoothingAudioPlayer';
import { INSTRUMENTS } from './constants/instruments';
import { useAudioState } from './context/AudioStateContext';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { Sparkles, Music } from 'lucide-react';
import './styles/theme.css';
import './styles/studio.css';

export default function App() {
  const {
    selectedInstrument,
    setSelectedInstrument,
    activeLayerIndex
  } = useAudioState();

  // Attach universal physical keyboard listener
  useKeyboardInput();

  const [currentView, setCurrentView] = useState<'studio' | 'agent-hub'>('studio');
  const [activeTab, setActiveTab] = useState<'soothing-tune' | 'keys' | 'ai-studio' | 'instruments' | 'drums' | 'mixer' | 'recorder'>('soothing-tune');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMappingsOpen, setIsMappingsOpen] = useState(false);
  const [isMidiOpen, setIsMidiOpen] = useState(false);

  return (
    <div className="studio-container">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMappings={() => setIsMappingsOpen(true)}
        onOpenMidi={() => setIsMidiOpen(true)}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
      />

      <AudioBanner />

      <div className="studio-main">
        {currentView === 'agent-hub' ? (
          <main className="studio-content" style={{ maxWidth: '100%' }}>
            <AgentSetupHub />
          </main>
        ) : (
          <>
            {/* Studio Navigation Tabs */}
            <nav className="studio-tabs">
              <button
                onClick={() => setActiveTab('soothing-tune')}
                className={`tab-btn ${activeTab === 'soothing-tune' ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'soothing-tune' ? 'var(--accent-cyan)' : undefined,
                  fontWeight: 700
                }}
              >
                <Music size={14} color="var(--accent-cyan)" />
                60s Soothing Tune
              </button>
              <button
                onClick={() => setActiveTab('keys')}
                className={`tab-btn ${activeTab === 'keys' ? 'active' : ''}`}
              >
                Piano & Keyboard
              </button>
              <button
                onClick={() => setActiveTab('ai-studio')}
                className={`tab-btn ${activeTab === 'ai-studio' ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: activeTab === 'ai-studio' ? 'var(--accent-cyan)' : undefined,
                  fontWeight: 700
                }}
              >
                <Sparkles size={14} color="var(--accent-cyan)" />
                AI Music Autopilot
              </button>
              <button
                onClick={() => setActiveTab('instruments')}
                className={`tab-btn ${activeTab === 'instruments' ? 'active' : ''}`}
              >
                Instruments ({INSTRUMENTS.length})
              </button>
              <button
                onClick={() => setActiveTab('drums')}
                className={`tab-btn ${activeTab === 'drums' ? 'active' : ''}`}
              >
                Drum Machine
              </button>
              <button
                onClick={() => setActiveTab('mixer')}
                className={`tab-btn ${activeTab === 'mixer' ? 'active' : ''}`}
              >
                Mixer & Effects
              </button>
              <button
                onClick={() => setActiveTab('recorder')}
                className={`tab-btn ${activeTab === 'recorder' ? 'active' : ''}`}
              >
                Loop Station
              </button>
            </nav>

            {/* Dynamic Studio Workspace Content */}
            <main className="studio-content">
              {activeTab === 'soothing-tune' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <SoothingAudioPlayer onOpenAiStudio={() => setActiveTab('ai-studio')} />
                </div>
              )}

              {activeTab === 'keys' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Featured Audio Player Banner */}
                  <SoothingAudioPlayer compact onOpenAiStudio={() => setActiveTab('ai-studio')} />

                  <div className="studio-card">
                    <div className="card-title">
                      <span>Physical Keyboard Studio Mapping</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Active: {INSTRUMENTS.find((i) => i.id === selectedInstrument)?.name}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: activeLayerIndex === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 210, 196, 0.2)',
                            color: activeLayerIndex === 1 ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {activeLayerIndex === 0 ? 'BASE LAYER' : 'SHIFT LAYER'}
                        </span>
                      </div>
                    </div>

                    {/* Interactive QWERTY Keyboard Map */}
                    <KeyboardVisualizer />
                  </div>

                  {/* Musical Intelligence: Scale Lock, Chord Harmonies, Arpeggiator & Transpose */}
                  <ScaleChordPanel />

                  {/* Interactive Virtual Touch Piano & MPC Drum Pads */}
                  <VirtualPiano />
                </div>
              )}

              {activeTab === 'ai-studio' && (
                <AiStudio />
              )}

              {activeTab === 'instruments' && (
                <InstrumentSelector />
              )}

              {activeTab === 'drums' && (
                <DrumMachine />
              )}

              {activeTab === 'mixer' && (
                <MixerEffects />
              )}

              {activeTab === 'recorder' && (
                <LoopStation />
              )}
            </main>
          </>
        )}

        <MobileControls />
      </div>

      <MappingEditor isOpen={isMappingsOpen} onClose={() => setIsMappingsOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <MidiModal isOpen={isMidiOpen} onClose={() => setIsMidiOpen(false)} />
    </div>
  );
}

