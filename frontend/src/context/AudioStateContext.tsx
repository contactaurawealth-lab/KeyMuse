import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  InstrumentType,
  ScaleType,
  ChordType,
  ArpeggiatorSettings,
  EffectsSettings,
  DrumPattern,
  TrackRecording,
  LayerMapping,
  SynthSettings
} from '../types';
import { AudioEngine, AudioEngineStatus } from '../audio/AudioEngine';
import { SynthEngine } from '../audio/SynthEngine';
import { SampleEngine } from '../audio/SampleEngine';
import { DrumEngine } from '../audio/DrumEngine';
import { EffectsChain } from '../audio/EffectsChain';
import { AudioRecorder } from '../audio/AudioRecorder';
import { Metronome } from '../audio/Metronome';
import { MidiEngine } from '../audio/MidiEngine';
import { INSTRUMENTS } from '../constants/instruments';
import { DEFAULT_LAYERS } from '../constants/keyMappings';
import { buildChordNotes, quantizeNoteToScale } from '../audio/MusicTheory';
import { StorageService } from '../db/indexedDb';

export const DEFAULT_EFFECTS: EffectsSettings = {
  masterVolume: 0.85,
  reverbWet: 0.25,
  reverbDecay: 1.8,
  reverbBypass: false,
  delayTime: 0.28,
  delayFeedback: 0.35,
  delayWet: 0.2,
  delayBypass: true,
  filterCutoff: 18000,
  filterType: 'lowpass',
  filterBypass: true,
  distortionDrive: 0,
  distortionWet: 0,
  distortionBypass: true
};

export const DEFAULT_DRUM_PATTERN: DrumPattern = {
  name: 'Standard Beat',
  steps: {
    kick:         [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    snare:        [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat_closed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    hihat_open:   [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true],
    clap:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    tom:          [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    perc:         [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
  }
};

interface AudioContextValue {
  audioEngine: AudioEngine;
  synthEngine: SynthEngine;
  sampleEngine: SampleEngine;
  drumEngine: DrumEngine;
  effectsChain: EffectsChain;
  audioRecorder: AudioRecorder;
  metronome: Metronome;
  midiEngine: MidiEngine;

  audioStatus: AudioEngineStatus;
  resumeAudio: () => Promise<boolean>;

  selectedInstrument: InstrumentType;
  setSelectedInstrument: (inst: InstrumentType) => void;

  activeLayerIndex: number;
  setActiveLayerIndex: (index: number) => void;
  toggleLayer: () => void;
  layers: LayerMapping[];
  updateKeyMapping: (layerIdx: number, code: string, note: string) => void;
  resetMappings: () => void;

  octaveOffset: number;
  setOctaveOffset: (offset: number | ((prev: number) => number)) => void;
  transpose: number;
  setTranspose: (semi: number | ((prev: number) => number)) => void;

  scale: ScaleType;
  setScale: (scale: ScaleType) => void;
  rootNote: string;
  setRootNote: (root: string) => void;
  scaleLock: boolean;
  setScaleLock: (lock: boolean | ((prev: boolean) => boolean)) => void;

  chordType: ChordType;
  setChordType: (chord: ChordType) => void;

  arpeggiator: ArpeggiatorSettings;
  setArpeggiator: React.Dispatch<React.SetStateAction<ArpeggiatorSettings>>;

  bpm: number;
  setBpm: (bpm: number) => void;

  effects: EffectsSettings;
  updateEffects: (updates: Partial<EffectsSettings>) => void;

  synthSettings: SynthSettings;
  updateSynthSettings: (updates: Partial<SynthSettings>) => void;

  drumPattern: DrumPattern;
  setDrumPattern: React.Dispatch<React.SetStateAction<DrumPattern>>;
  toggleDrumStep: (sound: any, stepIndex: number) => void;
  isDrumPlaying: boolean;
  toggleDrumPlayback: () => void;
  currentDrumStep: number;

  tracks: TrackRecording[];
  isRecording: boolean;
  startRecording: () => boolean;
  stopRecording: () => Promise<void>;
  deleteTrack: (trackId: string) => void;
  toggleMuteTrack: (trackId: string) => void;
  toggleSoloTrack: (trackId: string) => void;
  setTrackVolume: (trackId: string, vol: number) => void;

  activeNotes: Set<string>;
  activeKeys: Set<string>;

  triggerNoteOn: (note: string, velocity?: number) => void;
  triggerNoteOff: (note: string) => void;
  stopAllNotes: () => void;

  sustainPedal: boolean;
  toggleSustainPedal: () => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AudioStateContext = createContext<AudioContextValue | null>(null);

export const AudioStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Single Shared Audio Instances
  const audioEngineRef = useRef<AudioEngine>(AudioEngine.getInstance());
  const initialInstrument = INSTRUMENTS[0];
  const synthEngineRef = useRef<SynthEngine>(
    new SynthEngine(audioEngineRef.current, initialInstrument.defaultSynth)
  );
  const sampleEngineRef = useRef<SampleEngine>(new SampleEngine(audioEngineRef.current));
  const drumEngineRef = useRef<DrumEngine>(new DrumEngine(audioEngineRef.current));
  const effectsChainRef = useRef<EffectsChain>(
    new EffectsChain(audioEngineRef.current, DEFAULT_EFFECTS)
  );
  const audioRecorderRef = useRef<AudioRecorder>(new AudioRecorder(audioEngineRef.current));
  const metronomeRef = useRef<Metronome>(new Metronome(audioEngineRef.current, 120));
  const midiEngineRef = useRef<MidiEngine>(new MidiEngine());

  // UI States
  const [audioStatus, setAudioStatus] = useState<AudioEngineStatus>('uninitialized');
  const [selectedInstrument, setSelectedInstrumentState] = useState<InstrumentType>('piano');
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);
  const [layers, setLayers] = useState<LayerMapping[]>(DEFAULT_LAYERS);
  const [octaveOffset, setOctaveOffset] = useState<number>(0);
  const [transpose, setTranspose] = useState<number>(0);
  const [scale, setScale] = useState<ScaleType>('chromatic');
  const [rootNote, setRootNote] = useState<string>('C');
  const [scaleLock, setScaleLock] = useState<boolean>(false);
  const [chordType, setChordType] = useState<ChordType>('single');
  const [arpeggiator, setArpeggiator] = useState<ArpeggiatorSettings>({
    enabled: false,
    direction: 'off',
    rate: '1/16',
    octaves: 1
  });
  const [bpm, setBpmState] = useState<number>(120);
  const [effects, setEffectsState] = useState<EffectsSettings>(DEFAULT_EFFECTS);
  const [synthSettings, setSynthSettingsState] = useState<SynthSettings>(initialInstrument.defaultSynth);
  const [drumPattern, setDrumPattern] = useState<DrumPattern>(DEFAULT_DRUM_PATTERN);
  const [isDrumPlaying, setIsDrumPlaying] = useState<boolean>(false);
  const [currentDrumStep, setCurrentDrumStep] = useState<number>(0);
  const [tracks, setTracks] = useState<TrackRecording[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [sustainPedal, setSustainPedal] = useState<boolean>(false);
  const heldSustainedNotes = useRef<Set<string>>(new Set());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // History Stack for Undo/Redo
  interface StudioSnapshot {
    layers: LayerMapping[];
    selectedInstrument: InstrumentType;
    octaveOffset: number;
    transpose: number;
    bpm: number;
  }

  const [history, setHistory] = useState<StudioSnapshot[]>([]);
  const [future, setFuture] = useState<StudioSnapshot[]>([]);

  const pushSnapshot = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-19),
      {
        layers,
        selectedInstrument,
        octaveOffset,
        transpose,
        bpm
      }
    ]);
    setFuture([]);
  }, [layers, selectedInstrument, octaveOffset, transpose, bpm]);

  // Initialize Audio Graph once
  const graphInitialized = useRef(false);
  const initAudioGraph = useCallback(() => {
    if (graphInitialized.current) return;
    const ctx = audioEngineRef.current.init();

    // Route: Synths/Samples/Drums -> EffectsChain -> MasterLimiter
    const { input: fxInput } = effectsChainRef.current.initGraph(
      audioEngineRef.current.masterGain || ctx.destination
    );

    synthEngineRef.current.initOutput(fxInput);
    sampleEngineRef.current.initOutput(fxInput);
    drumEngineRef.current.initOutput(fxInput);

    graphInitialized.current = true;
  }, []);

  // Sync status listener
  useEffect(() => {
    const unsubscribe = audioEngineRef.current.subscribeStatus((st) => setAudioStatus(st));
    return () => unsubscribe();
  }, []);

  // Metronome & Drum Step Sequencer synchronization
  useEffect(() => {
    metronomeRef.current.onStepCallback = (stepIdx: number, audioTime: number) => {
      setCurrentDrumStep(stepIdx);

      // Trigger active drum sounds for this step
      if (isDrumPlaying) {
        Object.entries(drumPattern.steps).forEach(([snd, steps]) => {
          if (steps[stepIdx]) {
            drumEngineRef.current.schedule(snd as any, audioTime, 0.85);
          }
        });
      }
    };
  }, [drumPattern, isDrumPlaying]);

  // Web MIDI Binding
  useEffect(() => {
    const midi = midiEngineRef.current;
    midi.onNoteOn = (note, vel) => triggerNoteOn(note, vel);
    midi.onNoteOff = (note) => triggerNoteOff(note);
  }, [selectedInstrument, octaveOffset, transpose, scale, rootNote, scaleLock, chordType]);

  const resumeAudio = async () => {
    initAudioGraph();
    const ok = await audioEngineRef.current.ensureRunning();
    return ok;
  };

  const setSelectedInstrument = (inst: InstrumentType) => {
    setSelectedInstrumentState(inst);
    sampleEngineRef.current.setInstrument(inst);
    const config = INSTRUMENTS.find((i) => i.id === inst);
    if (config) {
      setSynthSettingsState(config.defaultSynth);
      synthEngineRef.current.updateSettings(config.defaultSynth);
    }
  };

  const setBpm = (newBpm: number) => {
    setBpmState(newBpm);
    metronomeRef.current.setBpm(newBpm);
  };

  const updateEffects = (updates: Partial<EffectsSettings>) => {
    setEffectsState((prev) => {
      const next = { ...prev, ...updates };
      effectsChainRef.current.applySettings(next);
      if (updates.masterVolume !== undefined) {
        audioEngineRef.current.setMasterVolume(updates.masterVolume);
      }
      return next;
    });
  };

  const updateSynthSettings = (updates: Partial<SynthSettings>) => {
    setSynthSettingsState((prev) => {
      const next = { ...prev, ...updates };
      synthEngineRef.current.updateSettings(next);
      return next;
    });
  };

  const toggleLayer = () => {
    setActiveLayerIndex((prev) => (prev === 0 ? 1 : 0));
  };

  const updateKeyMapping = (layerIdx: number, code: string, note: string) => {
    pushSnapshot();
    setLayers((prev) => {
      const next = [...prev];
      if (next[layerIdx]?.keys[code]) {
        next[layerIdx].keys[code] = { ...next[layerIdx].keys[code], note };
      }
      return next;
    });
  };

  const resetMappings = () => {
    pushSnapshot();
    setLayers(DEFAULT_LAYERS);
  };

  const toggleDrumStep = (sound: any, stepIndex: number) => {
    setDrumPattern((prev) => {
      const currentSteps = prev.steps[sound as keyof typeof prev.steps];
      const newSteps = [...currentSteps];
      newSteps[stepIndex] = !newSteps[stepIndex];
      return {
        ...prev,
        steps: {
          ...prev.steps,
          [sound]: newSteps
        }
      };
    });
  };

  const toggleDrumPlayback = () => {
    if (isDrumPlaying) {
      setIsDrumPlaying(false);
      metronomeRef.current.stop();
    } else {
      initAudioGraph();
      audioEngineRef.current.ensureRunning();
      setIsDrumPlaying(true);
      metronomeRef.current.start();
    }
  };

  const triggerNoteOn = useCallback(
    (noteStr: string, velocity = 0.8) => {
      initAudioGraph();
      audioEngineRef.current.ensureRunning();

      let finalNote = noteStr;
      if (scaleLock) {
        finalNote = quantizeNoteToScale(noteStr, rootNote, scale);
      }

      const chordNotes = buildChordNotes(finalNote, chordType);

      setActiveNotes((prev) => {
        const next = new Set(prev);
        chordNotes.forEach((n) => next.add(n));
        return next;
      });

      chordNotes.forEach((n) => {
        // Play using SampleEngine for realistic acoustic modeling or SynthEngine for analog synths
        if (
          ['synth_lead', 'synth_bass', 'ambient_pad'].includes(selectedInstrument)
        ) {
          synthEngineRef.current.noteOn(n, velocity, octaveOffset, transpose);
        } else {
          sampleEngineRef.current.noteOn(n, velocity, octaveOffset, transpose);
        }
      });
    },
    [scaleLock, rootNote, scale, chordType, selectedInstrument, octaveOffset, transpose, initAudioGraph]
  );

  const triggerNoteOff = useCallback(
    (noteStr: string) => {
      let finalNote = noteStr;
      if (scaleLock) {
        finalNote = quantizeNoteToScale(noteStr, rootNote, scale);
      }
      const chordNotes = buildChordNotes(finalNote, chordType);

      if (sustainPedal) {
        // Hold notes in sustain buffer
        chordNotes.forEach((n) => heldSustainedNotes.current.add(n));
        return;
      }

      setActiveNotes((prev) => {
        const next = new Set(prev);
        chordNotes.forEach((n) => next.delete(n));
        return next;
      });

      chordNotes.forEach((n) => {
        synthEngineRef.current.noteOff(n);
        sampleEngineRef.current.noteOff(n);
      });
    },
    [scaleLock, rootNote, scale, chordType, sustainPedal]
  );

  const toggleSustainPedal = () => {
    setSustainPedal((prev) => {
      const next = !prev;
      if (!next) {
        // Release all held sustained notes
        heldSustainedNotes.current.forEach((n) => {
          synthEngineRef.current.noteOff(n);
          sampleEngineRef.current.noteOff(n);
        });
        heldSustainedNotes.current.clear();
        setActiveNotes(new Set());
      }
      return next;
    });
  };

  const stopAllNotes = useCallback(() => {
    synthEngineRef.current.stopAllNotes();
    sampleEngineRef.current.stopAllNotes();
    heldSustainedNotes.current.clear();
    setActiveNotes(new Set());
    setActiveKeys(new Set());
  }, []);

  // Live Recording Handlers
  const startRecording = (): boolean => {
    initAudioGraph();
    const ok = audioRecorderRef.current.startRecording();
    if (ok) setIsRecording(true);
    return ok;
  };

  const stopRecording = async () => {
    const track = await audioRecorderRef.current.stopRecording(`Track ${tracks.length + 1}`);
    setIsRecording(false);
    if (track) {
      setTracks((prev) => [...prev, track]);
    }
  };

  const deleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const toggleMuteTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t))
    );
  };

  const toggleSoloTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t))
    );
  };

  const setTrackVolume = (trackId: string, vol: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume: vol } : t))
    );
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Undo / Redo
  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((prev) => [
      { layers, selectedInstrument, octaveOffset, transpose, bpm },
      ...prev
    ]);
    setHistory((prev) => prev.slice(0, -1));

    setLayers(previous.layers);
    setSelectedInstrumentState(previous.selectedInstrument);
    setOctaveOffset(previous.octaveOffset);
    setTranspose(previous.transpose);
    setBpmState(previous.bpm);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((prev) => [
      ...prev,
      { layers, selectedInstrument, octaveOffset, transpose, bpm }
    ]);
    setFuture((prev) => prev.slice(1));

    setLayers(next.layers);
    setSelectedInstrumentState(next.selectedInstrument);
    setOctaveOffset(next.octaveOffset);
    setTranspose(next.transpose);
    setBpmState(next.bpm);
  };

  return (
    <AudioStateContext.Provider
      value={{
        audioEngine: audioEngineRef.current,
        synthEngine: synthEngineRef.current,
        sampleEngine: sampleEngineRef.current,
        drumEngine: drumEngineRef.current,
        effectsChain: effectsChainRef.current,
        audioRecorder: audioRecorderRef.current,
        metronome: metronomeRef.current,
        midiEngine: midiEngineRef.current,

        audioStatus,
        resumeAudio,

        selectedInstrument,
        setSelectedInstrument,

        activeLayerIndex,
        setActiveLayerIndex,
        toggleLayer,
        layers,
        updateKeyMapping,
        resetMappings,

        octaveOffset,
        setOctaveOffset,
        transpose,
        setTranspose,

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

        bpm,
        setBpm,

        effects,
        updateEffects,

        synthSettings,
        updateSynthSettings,

        drumPattern,
        setDrumPattern,
        toggleDrumStep,
        isDrumPlaying,
        toggleDrumPlayback,
        currentDrumStep,

        tracks,
        isRecording,
        startRecording,
        stopRecording,
        deleteTrack,
        toggleMuteTrack,
        toggleSoloTrack,
        setTrackVolume,

        activeNotes,
        activeKeys,

        triggerNoteOn,
        triggerNoteOff,
        stopAllNotes,

        sustainPedal,
        toggleSustainPedal,

        theme,
        toggleTheme,

        undo,
        redo,
        canUndo: history.length > 0,
        canRedo: future.length > 0
      }}
    >
      {children}
    </AudioStateContext.Provider>
  );
};

export const useAudioState = () => {
  const context = useContext(AudioStateContext);
  if (!context) {
    throw new Error('useAudioState must be used within an AudioStateProvider');
  }
  return context;
};
