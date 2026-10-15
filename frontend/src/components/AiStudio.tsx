import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Activity,
  Layers,
  Music,
  Clock,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileJson,
  FileAudio
} from 'lucide-react';

interface TrackInfo {
  id: string;
  name: string;
  instrument: string;
  volume: number;
  pan: number;
  note_count?: number;
}

interface SectionInfo {
  name: string;
  start_beat: number;
  length_beats: number;
  energy: number;
  description: string;
}

interface AnalysisInfo {
  actual_duration: number;
  peak_dbfs: number;
  rms_dbfs: number;
  clipping_detected: boolean;
  start_silence_seconds: number;
  end_silence_seconds: number;
}

interface StemInfo {
  name: string;
  url: string;
}

interface CompositionResult {
  status: string;
  project_id: string;
  title: string;
  bpm: number;
  key: string;
  mode: string;
  duration_seconds: number;
  total_tracks: number;
  total_notes: number;
  tracks: TrackInfo[];
  sections: SectionInfo[];
  analysis: AnalysisInfo;
  audio_url: string;
  midi_url: string;
  stems: StemInfo[];
  manifest_url: string;
  project_json_url: string;
}

const PRESET_BRIEFS = [
  {
    title: 'Cinematic Sci-Fi',
    prompt: 'A 60-second cinematic sci-fi soundtrack in D minor at 90 BPM with mysterious pads, pulsing bass, crisp percussion, and an emotive lead melody.',
    bpm: 90,
    key: 'D',
    mode: 'minor',
    duration: 60
  },
  {
    title: 'Cyberpunk Pulse',
    prompt: 'A 45-second high-energy cyberpunk chase in F# minor at 128 BPM with aggressive synthesized bass pulses, driving drums, and neon arpeggios.',
    bpm: 128,
    key: 'F#',
    mode: 'minor',
    duration: 45
  },
  {
    title: 'Lofi Ambient Chill',
    prompt: 'A 30-second relaxing lofi ambient chill track in C major at 85 BPM with warm electric piano chords, soft sub bass, and subtle groove.',
    bpm: 85,
    key: 'C',
    mode: 'major',
    duration: 30
  },
  {
    title: 'Epic Orchestral Climax',
    prompt: 'A 60-second dramatic orchestral build in G minor at 105 BPM starting quietly and accelerating into a powerful grand finale.',
    bpm: 105,
    key: 'G',
    mode: 'minor',
    duration: 60
  },
  {
    title: '60s Soothing Lullaby',
    prompt: 'A 60-second peaceful, gentle, soothing acoustic ambient lullaby in C major at 70 BPM. Features warm acoustic piano with delicate felt hammer strikes, lush serene ambient pad, and gentle orchestral strings.',
    bpm: 70,
    key: 'C',
    mode: 'major',
    duration: 60
  }
];

export const FEATURED_SOOTHING_TUNE: CompositionResult = {
  status: 'completed',
  project_id: 'task_220bc2a0001c',
  title: '60s Soothing Acoustic Lullaby in C Major',
  bpm: 70,
  key: 'C',
  mode: 'major',
  duration_seconds: 63.71,
  total_tracks: 3,
  total_notes: 162,
  tracks: [
    { id: 'track_piano_1', name: 'Acoustic Grand Piano', instrument: 'piano', volume: 0.8, pan: 0.0, note_count: 72 },
    { id: 'track_pad', name: 'Atmospheric Pad', instrument: 'atmospheric_pad', volume: 0.75, pan: -0.25, note_count: 48 },
    { id: 'track_orchestral_strings_2', name: 'Orchestral Strings', instrument: 'orchestral_strings', volume: 0.75, pan: 0.25, note_count: 42 }
  ],
  sections: [
    { name: 'Intro', start_beat: 0, length_beats: 16, energy: 0.3, description: 'Delicate acoustic piano hammer strikes with lush ambient pad bed' },
    { name: 'Build', start_beat: 16, length_beats: 20, energy: 0.6, description: 'Gentle swell introducing orchestral string counter-harmonies' },
    { name: 'Climax', start_beat: 36, length_beats: 24, energy: 0.95, description: 'Rich acoustic grand piano trichords with singing resonance' },
    { name: 'Resolution', start_beat: 60, length_beats: 12, energy: 0.35, description: 'Tranquil ritardando fade into natural acoustic tail' }
  ],
  analysis: {
    actual_duration: 63.71,
    peak_dbfs: -2.0,
    rms_dbfs: -19.28,
    clipping_detected: false,
    start_silence_seconds: 0.0,
    end_silence_seconds: 1.27
  },
  audio_url: '/audio/soothing_tune_60s.wav',
  midi_url: '/audio/soothing_tune_60s.mid',
  stems: [],
  manifest_url: '/audio/soothing_tune_60s.json',
  project_json_url: '/audio/soothing_tune_60s.json'
};

export const AVAILABLE_INSTRUMENTS = [
  { id: 'piano', label: 'Acoustic Grand Piano' },
  { id: 'orchestral_strings', label: 'Orchestral Strings' },
  { id: 'electric_piano', label: 'Rhodes Keys' },
  { id: 'atmospheric_pad', label: 'Atmospheric Pad' },
  { id: 'guitar', label: 'Acoustic Guitar' },
  { id: 'flute', label: 'Concert Flute' },
  { id: 'marimba', label: 'Warm Marimba' },
  { id: 'organ', label: 'Drawbar Organ' },
  { id: 'bass_pulse', label: 'Bass Pulse' },
  { id: 'lead_melody', label: 'Lead Synth' },
  { id: 'percussion', label: 'Percussion / Drums' },
  { id: 'arpeggio_synth', label: 'Arp Synth' }
];

export const AVAILABLE_INSTRUMENT_MAP: Record<string, string> = AVAILABLE_INSTRUMENTS.reduce(
  (acc, item) => ({ ...acc, [item.id]: item.label }),
  {}
);

export interface ExtractedBrief {
  tempo: number;
  key: string;
  mode: string;
  duration: number;
  instruments: string[];
  genre: string;
  mood: string;
  summary: string;
}

export function parseBriefNlp(text: string): ExtractedBrief {
  if (!text || !text.trim()) {
    return {
      tempo: 90,
      key: 'C',
      mode: 'major',
      duration: 60,
      instruments: ['piano', 'atmospheric_pad', 'orchestral_strings'],
      genre: 'Cinematic',
      mood: 'Ambient, Melodic',
      summary: 'C Major • 90 BPM • 60s'
    };
  }

  const lower = text.toLowerCase();

  // Negative constraints check
  const bannedInstruments: string[] = [];
  if (/\b(?:without|no|exclude|omit)\s+(?:drums?|percussion|beats?|grooves?)\b/.test(lower) || /\bno drums\b/.test(lower)) {
    bannedInstruments.push('percussion');
  }
  if (/\b(?:without|no|exclude|omit)\s+(?:bass|basslines?|sub)\b/.test(lower)) {
    bannedInstruments.push('bass_pulse');
  }
  if (/\b(?:without|no|exclude|omit)\s+(?:synths?|pads?)\b/.test(lower) || /\bacoustic only\b/.test(lower)) {
    bannedInstruments.push('atmospheric_pad');
  }

  // Text with negative phrases removed for positive instrument matching
  let positiveText = lower
    .replace(/\b(?:without|no|exclude|omit)\s+(?:drums?|percussion|beats?|grooves?)\b/g, ' ')
    .replace(/\b(?:without|no|exclude|omit)\s+(?:bass|basslines?|sub)\b/g, ' ')
    .replace(/\bno drums\b/g, ' ');

  // 1. Duration Extraction
  let duration = 60;
  const secMatch = lower.match(/(\d+)\s*(?:-|–|\s)?(?:sec|secs|second|seconds|s)\b/);
  const minMatch = lower.match(/(\d+)\s*(?:-|–|\s)?(?:min|mins|minute|minutes|m)\b/);
  const loneNumberMatch = lower.match(/(?:a|an|one|make|compose)?\s*(\d{2,3})\s*(?:sec|second|s)?\s*(?:[a-z]+\s+)?(?:tune|track|song|piece|lullaby|beat|composition)/);

  if (secMatch) {
    duration = Math.max(5, Math.min(300, parseInt(secMatch[1], 10)));
  } else if (minMatch) {
    duration = Math.max(5, Math.min(300, parseInt(minMatch[1], 10) * 60));
  } else if (loneNumberMatch) {
    duration = Math.max(5, Math.min(300, parseInt(loneNumberMatch[1], 10)));
  } else if (/\btwo min(?:ute)?s?\b/.test(lower)) {
    duration = 120;
  } else if (/\bthree min(?:ute)?s?\b/.test(lower)) {
    duration = 180;
  } else if (/\b(half a minute|thirty seconds)\b/.test(lower)) {
    duration = 30;
  } else if (/\b(one minute|a minute)\b/.test(lower)) {
    duration = 60;
  } else if (lower.includes('short') || lower.includes('quick')) {
    duration = 30;
  } else if (lower.includes('epic') || lower.includes('extended') || lower.includes('long')) {
    duration = 90;
  }

  // 2. Tempo Extraction
  let tempo = 90;
  const bpmExplicit = lower.match(/(?:at|around|tempo(?:\s+of)?)\s+(\d{2,3})/) || lower.match(/(\d{2,3})\s*(?:bpm|beats per minute)/);
  if (bpmExplicit) {
    tempo = Math.max(40, Math.min(240, parseInt(bpmExplicit[1], 10)));
  } else if (lower.includes('drum and bass') || lower.includes('dnb')) {
    tempo = 172;
  } else if (lower.includes('soothing') || lower.includes('lullaby') || lower.includes('gentle') || lower.includes('sleep') || lower.includes('slow')) {
    tempo = 70;
  } else if (lower.includes('lofi') || lower.includes('chill') || lower.includes('relaxing') || lower.includes('calm')) {
    tempo = 82;
  } else if (lower.includes('ambient') || lower.includes('meditative')) {
    tempo = 65;
  } else if (lower.includes('ballad')) {
    tempo = 75;
  } else if (lower.includes('upbeat') || lower.includes('dance') || lower.includes('pop')) {
    tempo = 120;
  } else if (lower.includes('cyberpunk') || lower.includes('chase') || lower.includes('action') || lower.includes('battle')) {
    tempo = 128;
  } else if (lower.includes('techno') || lower.includes('trance') || lower.includes('fast')) {
    tempo = 135;
  } else if (lower.includes('epic') || lower.includes('orchestral') || lower.includes('cinematic')) {
    tempo = 105;
  }

  // 3. Key & Mode Extraction
  let key = 'C';
  let mode = 'major';

  const keyModeMatch = lower.match(/\b([a-g](?:#|b)?)\s+(major|minor|dorian|phrygian|mixolydian|lydian)\b/);
  const accidentalSpelled = lower.match(/\b([a-g])\s+(sharp|flat)\s+(major|minor|dorian|phrygian|mixolydian|lydian)\b/);
  const abbrevMatch = lower.match(/\b([a-g](?:#|b)?)(maj|min|m)\b/);
  const keyOnlyMatch = lower.match(/\b(?:in key of|in the key of|key of|in)\s+([a-g](?:#|b)?)\b/);

  if (keyModeMatch) {
    key = keyModeMatch[1].toUpperCase();
    if (key.length === 2 && key[1] === 'B') key = key[0] + 'b';
    mode = keyModeMatch[2];
  } else if (accidentalSpelled) {
    const root = accidentalSpelled[1].toUpperCase();
    const acc = accidentalSpelled[2] === 'sharp' ? '#' : 'b';
    key = root + acc;
    mode = accidentalSpelled[3];
  } else if (abbrevMatch) {
    key = abbrevMatch[1].toUpperCase();
    if (key.length === 2 && key[1] === 'B') key = key[0] + 'b';
    mode = abbrevMatch[2] === 'maj' ? 'major' : 'minor';
  } else {
    // Mode sentiment
    if (
      lower.includes('soothing') ||
      lower.includes('peaceful') ||
      lower.includes('happy') ||
      lower.includes('bright') ||
      lower.includes('warm') ||
      lower.includes('gentle') ||
      lower.includes('lullaby') ||
      lower.includes('uplifting')
    ) {
      mode = 'major';
    } else if (
      lower.includes('dark') ||
      lower.includes('mysterious') ||
      lower.includes('tense') ||
      lower.includes('cyberpunk') ||
      lower.includes('sad') ||
      lower.includes('melancholy') ||
      lower.includes('chase') ||
      lower.includes('battle')
    ) {
      mode = 'minor';
    }

    if (keyOnlyMatch) {
      key = keyOnlyMatch[1].toUpperCase();
      if (key.length === 2 && key[1] === 'B') key = key[0] + 'b';
    } else {
      key = mode === 'major' ? 'C' : 'D';
    }
  }

  // 4. Instrument Extraction
  const detectedInstruments: string[] = [];
  if (positiveText.includes('piano') || positiveText.includes('grand piano') || positiveText.includes('felt')) detectedInstruments.push('piano');
  if (positiveText.includes('rhodes') || positiveText.includes('electric piano') || positiveText.includes('tine')) detectedInstruments.push('electric_piano');
  if (positiveText.includes('organ')) detectedInstruments.push('organ');
  if (positiveText.includes('guitar') || positiveText.includes('acoustic guitar') || positiveText.includes('fingerpicking')) detectedInstruments.push('guitar');
  if (positiveText.includes('string') || positiveText.includes('violin') || positiveText.includes('cello') || positiveText.includes('orchestral') || positiveText.includes('quartet')) detectedInstruments.push('orchestral_strings');
  if (positiveText.includes('flute') || positiveText.includes('woodwind')) detectedInstruments.push('flute');
  if (positiveText.includes('marimba') || positiveText.includes('vibraphone') || positiveText.includes('xylophone')) detectedInstruments.push('marimba');
  if (positiveText.includes('pad') || positiveText.includes('ambient') || positiveText.includes('lush') || positiveText.includes('wash')) detectedInstruments.push('atmospheric_pad');
  if (positiveText.includes('bass') || positiveText.includes('sub') || positiveText.includes('pulse')) detectedInstruments.push('bass_pulse');
  
  // Guard against "upbeat" containing "beat"
  const positiveNoUpbeat = positiveText.replace(/\bupbeat\b/g, ' ');
  if (/\b(?:percussion|drums?|beats?|grooves?|rhythms?|snare|kick|hi-?hats?)\b/.test(positiveNoUpbeat)) {
    detectedInstruments.push('percussion');
  }

  if (positiveText.includes('lead') || positiveText.includes('melody') || positiveText.includes('solo') || positiveText.includes('hook')) detectedInstruments.push('lead_melody');
  if (positiveText.includes('arp') || positiveText.includes('arpeggio')) detectedInstruments.push('lead_melody');

  // Filter out banned
  const filteredInstruments = detectedInstruments.filter((i) => !bannedInstruments.includes(i));

  // Intelligent ensemble completion
  if (filteredInstruments.length === 0) {
    if (lower.includes('soothing') || lower.includes('lullaby') || lower.includes('peaceful') || lower.includes('relaxing')) {
      filteredInstruments.push('piano', 'atmospheric_pad', 'orchestral_strings');
    } else if (lower.includes('cyberpunk') || lower.includes('electronic') || lower.includes('chase')) {
      filteredInstruments.push('bass_pulse', 'percussion', 'lead_melody', 'atmospheric_pad');
    } else if (lower.includes('lofi')) {
      filteredInstruments.push('piano', 'bass_pulse', 'percussion', 'atmospheric_pad');
    } else if (lower.includes('orchestral') || lower.includes('cello') || lower.includes('chamber')) {
      filteredInstruments.push('orchestral_strings', 'piano', 'atmospheric_pad');
    } else if (lower.includes('pop')) {
      filteredInstruments.push('piano', 'bass_pulse', 'percussion', 'lead_melody');
    } else {
      filteredInstruments.push('atmospheric_pad', 'bass_pulse', 'percussion', 'lead_melody');
    }
  } else if (filteredInstruments.length < 3) {
    if (filteredInstruments.includes('piano')) {
      if (!filteredInstruments.includes('atmospheric_pad') && !bannedInstruments.includes('atmospheric_pad')) filteredInstruments.push('atmospheric_pad');
      if (!filteredInstruments.includes('orchestral_strings') && !bannedInstruments.includes('orchestral_strings')) filteredInstruments.push('orchestral_strings');
    } else if (filteredInstruments.includes('guitar')) {
      if (!filteredInstruments.includes('atmospheric_pad') && !bannedInstruments.includes('atmospheric_pad')) filteredInstruments.push('atmospheric_pad');
      if (!filteredInstruments.includes('bass_pulse') && !bannedInstruments.includes('bass_pulse')) filteredInstruments.push('bass_pulse');
    } else if (filteredInstruments.includes('orchestral_strings')) {
      if (!filteredInstruments.includes('piano') && !bannedInstruments.includes('piano')) filteredInstruments.push('piano');
      if (!filteredInstruments.includes('atmospheric_pad') && !bannedInstruments.includes('atmospheric_pad')) filteredInstruments.push('atmospheric_pad');
    }
  }

  const finalInstruments = filteredInstruments.filter((i) => !bannedInstruments.includes(i));

  // 5. Genre & Mood Extraction
  let genre = 'Cinematic';
  let mood = 'Balanced, Dynamic';
  if (lower.includes('soothing') || lower.includes('lullaby') || lower.includes('peaceful')) {
    genre = 'Ambient';
    mood = 'Peaceful, Gentle, Soothing';
  } else if (lower.includes('lofi') || lower.includes('chill')) {
    genre = 'Lofi Hip-Hop';
    mood = 'Mellow, Nostalgic, Relaxed';
  } else if (lower.includes('cyberpunk') || lower.includes('techno') || lower.includes('synthwave')) {
    genre = 'Electronic';
    mood = 'High-Energy, Futuristic, Driving';
  } else if (lower.includes('orchestral') || lower.includes('classical') || lower.includes('cello') || lower.includes('chamber')) {
    genre = 'Orchestral';
    mood = lower.includes('sad') ? 'Sad, Melancholic, Expressive' : 'Dramatic, Majestic, Expressive';
  } else if (lower.includes('pop')) {
    genre = 'Pop';
    mood = lower.includes('happy') ? 'Happy, Upbeat, Joyful' : 'Upbeat, Catchy, Driving';
  } else if (lower.includes('ambient')) {
    genre = 'Ambient';
    mood = 'Serene, Meditative, Atmospheric';
  }

  const summary = `${key} ${mode.charAt(0).toUpperCase() + mode.slice(1)} • ${tempo} BPM • ${duration}s • ${genre} (${mood})`;

  return {
    tempo,
    key,
    mode,
    duration,
    instruments: finalInstruments,
    genre,
    mood,
    summary
  };
}

export const AiStudio: React.FC = () => {
  // Input parameters
  const [briefText, setBriefText] = useState(PRESET_BRIEFS[0].prompt);
  const [tempo, setTempo] = useState<number>(90);
  const [keyRoot, setKeyRoot] = useState('D');
  const [mode, setMode] = useState('minor');
  const [targetDuration, setTargetDuration] = useState<number>(60);
  const [seed, setSeed] = useState<number>(42);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([
    'atmospheric_pad',
    'bass_pulse',
    'percussion',
    'lead_melody'
  ]);

  // NLP Intelligence State
  const [autoSyncNlp, setAutoSyncNlp] = useState<boolean>(true);
  const [nlpData, setNlpData] = useState<ExtractedBrief>(() => parseBriefNlp(PRESET_BRIEFS[0].prompt));
  const [isInterpreting, setIsInterpreting] = useState<boolean>(false);

  // Execution state
  const [isComposing, setIsComposing] = useState(false);
  const [compositionStage, setCompositionStage] = useState('');
  const [compositionResult, setCompositionResult] = useState<CompositionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Revision State
  const [isRevising, setIsRevising] = useState(false);
  const [gainAdjustmentDb, setGainAdjustmentDb] = useState(0.0);
  const [tempoAdjustment, setTempoAdjustment] = useState(0.0);
  const [revisionNote, setRevisionNote] = useState('');

  // Automatic NLP interpretation effect
  useEffect(() => {
    const clientExtracted = parseBriefNlp(briefText);
    setNlpData(clientExtracted);

    if (autoSyncNlp) {
      setTempo(clientExtracted.tempo);
      setKeyRoot(clientExtracted.key);
      setMode(clientExtracted.mode);
      setTargetDuration(clientExtracted.duration);
      if (clientExtracted.instruments.length > 0) {
        setSelectedInstruments(clientExtracted.instruments);
      }
    }

    const timer = setTimeout(async () => {
      try {
        setIsInterpreting(true);
        const res = await fetch('/api/autopilot/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: briefText })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.brief) {
            const b = json.brief;
            setNlpData((prev) => ({
              ...prev,
              tempo: Math.round(b.tempo) || prev.tempo,
              key: b.key || prev.key,
              mode: b.mode || prev.mode,
              duration: Math.round(b.duration_seconds) || prev.duration,
              instruments: b.instruments && b.instruments.length > 0 ? b.instruments : prev.instruments,
              genre: b.genre ? b.genre.charAt(0).toUpperCase() + b.genre.slice(1) : prev.genre,
              mood: b.mood || prev.mood,
              summary: b.summary || prev.summary
            }));

            if (autoSyncNlp) {
              if (b.tempo) setTempo(Math.round(b.tempo));
              if (b.key) setKeyRoot(b.key);
              if (b.mode) setMode(b.mode);
              if (b.duration_seconds) setTargetDuration(Math.round(b.duration_seconds));
              if (b.instruments && b.instruments.length > 0) setSelectedInstruments(b.instruments);
            }
          }
        }
      } catch (err) {
        // Fallback remains clientExtracted
      } finally {
        setIsInterpreting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [briefText, autoSyncNlp]);

  // Apply NLP to sliders manually
  const applyNlpToControls = () => {
    setTempo(nlpData.tempo);
    setKeyRoot(nlpData.key);
    setMode(nlpData.mode);
    setTargetDuration(nlpData.duration);
    if (nlpData.instruments.length > 0) {
      setSelectedInstruments(nlpData.instruments);
    }
  };

  // Apply Preset
  const handleSelectPreset = (preset: typeof PRESET_BRIEFS[0]) => {
    setBriefText(preset.prompt);
    setTempo(preset.bpm);
    setKeyRoot(preset.key);
    setMode(preset.mode);
    setTargetDuration(preset.duration);
  };

  // Toggle Instrument
  const toggleInstrument = (inst: string) => {
    if (selectedInstruments.includes(inst)) {
      if (selectedInstruments.length > 1) {
        setSelectedInstruments(selectedInstruments.filter((i) => i !== inst));
      }
    } else {
      setSelectedInstruments([...selectedInstruments, inst]);
    }
  };

  // Submit composition request
  const handleCompose = async () => {
    setIsComposing(true);
    setErrorMsg(null);
    setCompositionStage('Interpreting natural language brief with KeyMuse NLP...');

    try {
      // Stage simulation indicators while server executes pure Python DSP
      const timer1 = setTimeout(() => setCompositionStage('Planning musical structure & harmonic progression...'), 1200);
      const timer2 = setTimeout(() => setCompositionStage('Synthesizing 16-bit PCM multi-track audio & MIDI...'), 3500);
      const timer3 = setTimeout(() => setCompositionStage('Running empirical audio inspection & closed-loop revisions...'), 6500);

      const response = await fetch('/api/autopilot/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: briefText,
          use_nlp: true,
          tempo,
          key: keyRoot,
          mode,
          duration_seconds: targetDuration,
          instruments: selectedInstruments,
          seed
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data: CompositionResult = await response.json();
      setCompositionResult(data);
      setIsPlaying(false);
      setCurrentTime(0);
    } catch (err: any) {
      console.error('Composition failed:', err);
      setErrorMsg(err.message || 'Failed to compose audio via Autopilot API');
    } finally {
      setIsComposing(false);
      setCompositionStage('');
    }
  };

  // Submit targeted revision
  const handleApplyRevision = async () => {
    if (!compositionResult) return;
    setIsRevising(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/autopilot/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: compositionResult.project_id,
          gain_adjustment_db: gainAdjustmentDb !== 0 ? gainAdjustmentDb : undefined,
          tempo_adjustment: tempoAdjustment !== 0 ? tempoAdjustment : undefined,
          instruction: revisionNote.trim() ? revisionNote : undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to apply revision');
      }

      const revisedData = await response.json();
      setCompositionResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          bpm: revisedData.bpm,
          duration_seconds: revisedData.duration_seconds,
          tracks: revisedData.tracks,
          analysis: revisedData.analysis,
          audio_url: `${revisedData.audio_url}?t=${Date.now()}`,
          midi_url: `${revisedData.midi_url}?t=${Date.now()}`
        };
      });

      // Reload audio element
      if (audioRef.current) {
        audioRef.current.load();
        setIsPlaying(false);
      }
    } catch (err: any) {
      console.error('Revision failed:', err);
      setErrorMsg(err.message || 'Failed to apply project revision');
    } finally {
      setIsRevising(false);
    }
  };

  // Audio Playback Controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [compositionResult?.audio_url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div className="studio-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={20} color="var(--accent-cyan)" />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>KeyMuse AI Music Autopilot</h2>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 210, 196, 0.15)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700
                }}
              >
                REAL DSP AUDIO ENGINE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Describe musical ideas in natural language or configure tempo, key, and instruments. Compositions are realized by the authentic Python engine with pure DSP synthesis, MIDI generation, and closed-loop quality analysis.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {PRESET_BRIEFS.map((p) => (
              <button
                key={p.title}
                onClick={() => handleSelectPreset(p)}
                className="studio-btn"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                title={p.prompt}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px'
          }}
        >
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left Column: Brief & Musical Controls */}
        <div className="studio-card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Music size={16} />
              <span>Composition Specification</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Natural Language Music Brief
                </label>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 210, 196, 0.15)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} />
                  <span>NLP ACTIVE</span>
                </span>
              </div>
              <textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                placeholder="Describe your desired soundtrack, mood, tempo, instruments, and structure..."
              />

              {/* Real-time NLP Intelligence Card */}
              <div
                style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(0, 210, 196, 0.06)',
                  border: '1px solid rgba(0, 210, 196, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.04em' }}>
                      NLP EXTRACTED PARAMETERS
                    </span>
                    {isInterpreting && <RefreshCw size={11} className="animate-spin" color="var(--accent-cyan)" />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoSyncNlp}
                        onChange={(e) => setAutoSyncNlp(e.target.checked)}
                      />
                      <span>Auto-sync controls</span>
                    </label>
                    {!autoSyncNlp && (
                      <button
                        type="button"
                        onClick={applyNlpToControls}
                        className="studio-btn"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        Apply to Sliders
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-primary)' }}>
                    Tonality: <strong style={{ color: 'var(--accent-cyan)' }}>{nlpData.key} {nlpData.mode}</strong>
                  </span>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-primary)' }}>
                    Tempo: <strong style={{ color: 'var(--accent-cyan)' }}>{nlpData.tempo} BPM</strong>
                  </span>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-primary)' }}>
                    Duration: <strong style={{ color: 'var(--accent-cyan)' }}>{nlpData.duration}s</strong>
                  </span>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-primary)' }}>
                    Genre & Mood: <strong>{nlpData.genre}</strong> ({nlpData.mood})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>Detected Voices:</span>
                  {nlpData.instruments.map((inst) => (
                    <span
                      key={inst}
                      style={{
                        padding: '1px 7px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 210, 196, 0.15)',
                        color: 'var(--accent-cyan)',
                        fontSize: '10px',
                        fontWeight: 700
                      }}
                    >
                      {AVAILABLE_INSTRUMENT_MAP[inst] || inst}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Parameter Sliders & Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Key & Tonality
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select
                    value={keyRoot}
                    onChange={(e) => setKeyRoot(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  >
                    {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>

                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    style={{
                      flex: 1.4,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '12px'
                    }}
                  >
                    {['minor', 'major', 'dorian', 'phrygian', 'mixolydian', 'lydian'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tempo (BPM)</label>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{tempo} BPM</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Target Duration</label>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{targetDuration}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Deterministic Seed
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            {/* Track Instrumentation Badges */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Active Track Voices ({selectedInstruments.length})
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {AVAILABLE_INSTRUMENTS.map((inst) => {
                  const isSelected = selectedInstruments.includes(inst.id);
                  return (
                    <button
                      key={inst.id}
                      onClick={() => toggleInstrument(inst.id)}
                      type="button"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '14px',
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(0, 210, 196, 0.2)' : 'var(--bg-tertiary)',
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {inst.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleCompose}
              disabled={isComposing || !briefText.trim()}
              className="studio-btn studio-btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isComposing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{compositionStage || 'Synthesizing with Autopilot...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Compose Music Autopilot</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audio Preview, Waveform & Deliverables */}
        <div className="studio-card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileAudio size={16} />
              <span>Real Audio Preview & Waveform</span>
            </div>
            {compositionResult && (
              <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {compositionResult.title}
              </span>
            )}
          </div>

          {compositionResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
              {/* Hidden real audio element */}
              <audio ref={audioRef} src={compositionResult.audio_url} preload="auto" />

              {/* Waveform Visualization Mock Canvas */}
              <div
                style={{
                  height: '80px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {Array.from({ length: 48 }).map((_, idx) => {
                  const progressPct = duration > 0 ? (currentTime / duration) * 48 : 0;
                  const isPast = idx <= progressPct;
                  const barHeight = 20 + Math.sin(idx * 0.45) * 20 + (idx % 3) * 12;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, Math.max(15, barHeight))}%`,
                        backgroundColor: isPast ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '2px',
                        transition: 'background-color 0.1s ease'
                      }}
                    />
                  );
                })}
              </div>

              {/* Scrubber & Duration */}
              <div>
                <input
                  type="range"
                  min="0"
                  max={duration || compositionResult.duration_seconds || 1}
                  step="0.01"
                  value={currentTime}
                  onChange={handleSeek}
                  style={{ width: '100%', marginBottom: '4px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(duration || compositionResult.duration_seconds)}</span>
                </div>
              </div>

              {/* Transport Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={togglePlay} className="studio-btn studio-btn-primary" style={{ padding: '8px 16px' }}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    <span style={{ marginLeft: '6px' }}>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button onClick={handleRestart} className="studio-btn" style={{ padding: '8px 12px' }} title="Replay">
                    <RotateCcw size={14} />
                  </button>
                </div>

                {/* Volume slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setIsMuted(!isMuted)} className="studio-btn" style={{ padding: '6px 8px' }}>
                    {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ width: '70px' }}
                  />
                </div>
              </div>

              {/* Quality Inspector Summary */}
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  fontSize: '11px'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Peak dBFS</span>
                  <strong style={{ color: compositionResult.analysis.peak_dbfs > -0.5 ? '#ef4444' : 'var(--accent-cyan)' }}>
                    {compositionResult.analysis.peak_dbfs.toFixed(2)} dBFS
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>RMS Loudness</span>
                  <strong>{compositionResult.analysis.rms_dbfs.toFixed(2)} dBFS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Clipping</span>
                  <span style={{ color: compositionResult.analysis.clipping_detected ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {compositionResult.analysis.clipping_detected ? 'DETECTED' : 'SAFE (0 CLIPS)'}
                  </span>
                </div>
              </div>

              {/* Deliverable Downloads */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Exported Deliverables
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <a
                    href={compositionResult.audio_url}
                    download={`${compositionResult.project_id}_master.wav`}
                    className="studio-btn"
                    style={{ fontSize: '11px', padding: '6px 10px', textDecoration: 'none' }}
                  >
                    <Download size={12} /> Master WAV
                  </a>
                  <a
                    href={compositionResult.midi_url}
                    download={`${compositionResult.project_id}.mid`}
                    className="studio-btn"
                    style={{ fontSize: '11px', padding: '6px 10px', textDecoration: 'none' }}
                  >
                    <Download size={12} /> MIDI (SMF 0)
                  </a>
                  <a
                    href={compositionResult.manifest_url}
                    target="_blank"
                    rel="noreferrer"
                    className="studio-btn"
                    style={{ fontSize: '11px', padding: '6px 10px', textDecoration: 'none' }}
                  >
                    <FileJson size={12} /> Manifest
                  </a>
                  <a
                    href={compositionResult.project_json_url}
                    target="_blank"
                    rel="noreferrer"
                    className="studio-btn"
                    style={{ fontSize: '11px', padding: '6px 10px', textDecoration: 'none' }}
                  >
                    <FileJson size={12} /> Project JSON
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                gap: '8px',
                textAlign: 'center',
                padding: '16px'
              }}
            >
              <Music size={32} opacity={0.4} />
              <p style={{ margin: 0, fontSize: '13px' }}>No custom composition rendered yet.</p>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>
                Enter a music brief above or load our featured 60s soothing tune master.
              </p>
              <button
                onClick={() => setCompositionResult(FEATURED_SOOTHING_TUNE)}
                className="studio-btn studio-btn-primary"
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px'
                }}
              >
                <Sparkles size={14} />
                <span>Load 60s Soothing Acoustic Master</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Arrangement & Closed-Loop Revision Row (when result exists) */}
      {compositionResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Arrangement Timeline */}
          <div className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} />
                <span>Arrangement & Track Structure ({compositionResult.total_tracks} Tracks, {compositionResult.total_notes} Notes)</span>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Sections Timeline Bar */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Arrangement Sections
                </label>
                <div style={{ display: 'flex', gap: '4px', height: '36px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {compositionResult.sections.map((sec, idx) => {
                    const energyColors = [
                      'rgba(0, 210, 196, 0.4)',
                      'rgba(59, 130, 246, 0.5)',
                      'rgba(245, 158, 11, 0.6)',
                      'rgba(239, 68, 68, 0.7)'
                    ];
                    const color = energyColors[idx % energyColors.length];
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: sec.length_beats || 1,
                          backgroundColor: color,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '2px 4px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        title={`${sec.name}: Start beat ${sec.start_beat}, Length ${sec.length_beats} beats, Energy ${(sec.energy * 100).toFixed(0)}%`}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{sec.name}</span>
                        <span style={{ fontSize: '9px', opacity: 0.8 }}>{(sec.energy * 100).toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Track Stems List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Track Stems & Volumes</label>
                {compositionResult.tracks.map((tr) => (
                  <div
                    key={tr.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block' }}>{tr.name}</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Voice: {tr.instrument} • {tr.note_count || 0} notes
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Vol: {(tr.volume * 100).toFixed(0)}%
                      </span>
                      <a
                        href={`/api/autopilot/projects/${compositionResult.project_id}/stems/${tr.id}.wav`}
                        download={`${tr.id}.wav`}
                        className="studio-btn"
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        title="Download isolated track stem"
                      >
                        Stem WAV
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Closed-Loop Revision Box */}
          <div className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} />
                <span>Targeted Revision & Fine-Tuning</span>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Apply targeted modifications without regenerating the entire composition. The closed-loop revision engine re-synthesizes audio and re-runs waveform checks.
              </p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Gain Level Adjustment (dB)</label>
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{gainAdjustmentDb.toFixed(1)} dB</span>
                </div>
                <input
                  type="range"
                  min="-6.0"
                  max="3.0"
                  step="0.5"
                  value={gainAdjustmentDb}
                  onChange={(e) => setGainAdjustmentDb(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tempo Delta (BPM)</label>
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>
                    {tempoAdjustment >= 0 ? `+${tempoAdjustment}` : tempoAdjustment} BPM
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={tempoAdjustment}
                  onChange={(e) => setTempoAdjustment(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Revision Instruction (Optional)
                </label>
                <input
                  type="text"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="e.g. Reduce master volume by 2 dB to increase headroom"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '12px'
                  }}
                />
              </div>

              <button
                onClick={handleApplyRevision}
                disabled={isRevising}
                className="studio-btn studio-btn-primary"
                style={{
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isRevising ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Applying Revision & Re-Rendering...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Apply Targeted Revision</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
