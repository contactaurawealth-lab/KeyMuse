import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Bot,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  Code,
  Sparkles,
  ExternalLink,
  Search,
  Download,
  Settings,
  Cpu,
  RefreshCw,
  Folder,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ToolItem {
  name: string;
  description: string;
  category: string;
  parameters: any;
  example: string;
}

interface MetadataResponse {
  version: string;
  repository_url: string;
  mcp_server: {
    cli_command: string;
    module_command: string;
    transport: string;
    protocol_version: string;
    tool_count: number;
  };
  supported_agents: Array<{
    id: string;
    name: string;
    status: string;
    config_file: string;
    format: string;
  }>;
}

const DEFAULT_METADATA: MetadataResponse = {
  version: '2.0.0',
  repository_url: 'https://github.com/contactaurawealth-lab/KeyMuse.git',
  mcp_server: {
    cli_command: 'keymuse-mcp',
    module_command: 'python -m keymuse.mcp.server',
    transport: 'stdio',
    protocol_version: '2024-11-05',
    tool_count: 15
  },
  supported_agents: [
    { id: 'antigravity', name: 'Google Antigravity', status: 'verified', config_file: '~/.gemini/config/mcp_config.json', format: 'json' },
    { id: 'claude', name: 'Claude Code / Desktop', status: 'verified', config_file: '~/.claude.json', format: 'cli/json' },
    { id: 'codex', name: 'OpenAI Codex', status: 'verified', config_file: 'codex_tools.json', format: 'cli/json' },
    { id: 'cursor', name: 'Cursor IDE', status: 'verified', config_file: '~/.cursor/mcp.json', format: 'json' },
    { id: 'cline', name: 'VSCode / Cline', status: 'verified', config_file: 'cline_mcp_settings.json', format: 'json' }
  ]
};

const VERIFIED_TOOLS: ToolItem[] = [
  {
    name: 'keymuse_validate_brief',
    category: 'Planning',
    description: 'Validates and extracts musical parameters (tempo, key, mode, duration, instruments) from natural language.',
    parameters: { brief_text: 'string' },
    example: 'keymuse_validate_brief(brief_text="60s cinematic sci-fi in D minor at 90 BPM")'
  },
  {
    name: 'keymuse_plan_composition',
    category: 'Planning',
    description: 'Generates structured arrangement sections, track roles, and dynamic energy curves.',
    parameters: { description: 'string', duration: 'float', tempo: 'float', key: 'string', mode: 'string' },
    example: 'keymuse_plan_composition(description="Sci-fi theme", duration=60.0, tempo=90.0, key="D", mode="minor")'
  },
  {
    name: 'keymuse_create_project',
    category: 'Composition',
    description: 'Initializes a new canonical KeyMuse project schema with title, BPM, and tonality.',
    parameters: { title: 'string', bpm: 'float', key: 'string', mode: 'string' },
    example: 'keymuse_create_project(title="Sci-Fi Climax", bpm=90.0, key="D", mode="minor")'
  },
  {
    name: 'keymuse_add_track',
    category: 'Composition',
    description: 'Adds an instrument track voice (pad, bass, lead, percussion) to a project.',
    parameters: { project_id: 'string', track_id: 'string', name: 'string', instrument: 'string', volume: 'float', pan: 'float' },
    example: 'keymuse_add_track(project_id="proj_123", track_id="tr_bass", name="Bass Pulse", instrument="bass_pulse", volume=0.85)'
  },
  {
    name: 'keymuse_add_notes',
    category: 'Composition',
    description: 'Appends musical note events (pitch, start beat, duration, velocity) to a track.',
    parameters: { project_id: 'string', track_id: 'string', notes: 'list[dict]' },
    example: 'keymuse_add_notes(project_id="proj_123", track_id="tr_bass", notes=[{"pitch": 38, "start_beat": 0.0, "duration_beats": 1.0, "velocity": 90}])'
  },
  {
    name: 'keymuse_create_chord_progression',
    category: 'Composition',
    description: 'Generates harmonically aligned chord progression voice-leadings for a track.',
    parameters: { project_id: 'string', track_id: 'string', root: 'string', mode: 'string', num_bars: 'int' },
    example: 'keymuse_create_chord_progression(project_id="proj_123", track_id="tr_pad", root="D", mode="minor", num_bars=8)'
  },
  {
    name: 'keymuse_arrange_sections',
    category: 'Composition',
    description: 'Configures structural timeline markers (Intro, Verse, Build, Climax, Outro) with energy levels.',
    parameters: { project_id: 'string', sections: 'list[dict]' },
    example: 'keymuse_arrange_sections(project_id="proj_123", sections=[{"name": "Intro", "start_bar": 1, "end_bar": 4, "energy": 0.4}])'
  },
  {
    name: 'keymuse_render_preview',
    category: 'Rendering',
    description: 'Requests authentic 16-bit PCM WAV audio mixdown via pure Python DSP synthesis engine.',
    parameters: { project_id: 'string' },
    example: 'keymuse_render_preview(project_id="proj_123")'
  },
  {
    name: 'keymuse_analyze_audio',
    category: 'Analysis',
    description: 'Measures peak dBFS, RMS loudness, clipping risk, and silence boundaries on rendered audio.',
    parameters: { project_id: 'string' },
    example: 'keymuse_analyze_audio(project_id="proj_123")'
  },
  {
    name: 'keymuse_revise_project',
    category: 'Revision',
    description: 'Executes targeted surgical revisions (gain dB adjustment, tempo delta, duration correction).',
    parameters: { project_id: 'string', instructions: 'string' },
    example: 'keymuse_revise_project(project_id="proj_123", instructions="Lower master volume by 1.5 dB")'
  },
  {
    name: 'keymuse_export_midi',
    category: 'Export',
    description: 'Exports authentic binary Standard MIDI File (SMF Type 0) to disk.',
    parameters: { project_id: 'string', output_path: 'string' },
    example: 'keymuse_export_midi(project_id="proj_123", output_path="output/track.mid")'
  },
  {
    name: 'keymuse_export_wav',
    category: 'Export',
    description: 'Exports full-fidelity 16-bit stereo PCM WAV audio file to disk.',
    parameters: { project_id: 'string', output_path: 'string' },
    example: 'keymuse_export_wav(project_id="proj_123", output_path="output/master.wav")'
  },
  {
    name: 'keymuse_export_stems',
    category: 'Export',
    description: 'Renders and exports individual isolated track stems as separate WAV files.',
    parameters: { project_id: 'string', output_dir: 'string' },
    example: 'keymuse_export_stems(project_id="proj_123", output_dir="output/stems")'
  },
  {
    name: 'keymuse_get_task_status',
    category: 'Diagnostics',
    description: 'Inspects execution progress, stage, completion percentage, and diagnostics for long-running jobs.',
    parameters: { task_id: 'string' },
    example: 'keymuse_get_task_status(task_id="task_987")'
  },
  {
    name: 'keymuse_get_project_summary',
    category: 'Diagnostics',
    description: 'Returns metadata, duration, track statistics, and section list for a KeyMuse project.',
    parameters: { project_id: 'string' },
    example: 'keymuse_get_project_summary(project_id="proj_123")'
  }
];

const TROUBLESHOOTING_ITEMS = [
  {
    question: "How do I fix 'ModuleNotFoundError: No module named keymuse'?",
    answer: "Ensure KeyMuse was installed into your agent's active Python environment. In the cloned KeyMuse directory, run: 'pip install -e .' (or activate your virtual environment first: 'source venv/bin/activate'). If using a custom virtualenv with your agent, specify the full path to python (e.g. '/path/to/venv/bin/python') in your client's MCP configuration."
  },
  {
    question: "The MCP server doesn't respond or exits immediately upon connection.",
    answer: "Test the server directly in your terminal by executing: 'keymuse-mcp' or 'python -m keymuse.mcp.server'. The server will start and wait for JSON-RPC messages over standard input. If you see an immediate Python traceback, ensure Python 3.10+ is installed and 'pip install numpy mcp' succeeded."
  },
  {
    question: "Where does KeyMuse store rendered WAV and MIDI files?",
    answer: "By default, KeyMuse exports deliverables into the 'output/' directory within your current working directory, or the custom 'output_dir' passed to MusicAutopilot or the MCP server. All paths are sanitized against path traversal vulnerabilities."
  },
  {
    question: "Do I need fluid-synth, ffmpeg, or external audio binaries installed?",
    answer: "No. KeyMuse features a pure Python DSP synthesis engine and binary Standard MIDI File (SMF Type 0) generator using only standard Python libraries and numpy. It produces authentic 16-bit PCM WAV audio without external system dependencies."
  },
  {
    question: "How do I verify the server is working before asking my agent to compose?",
    answer: "Run the included verification script: 'python examples/cinematic_autopilot.py'. It runs a complete closed-loop composition pipeline in ~9 seconds, producing 'output/cinematic_demo/master_audio.wav' and 'project_midi.mid'."
  }
];

export const AgentSetupHub: React.FC = () => {
  const [osType, setOsType] = useState<'linux' | 'macos' | 'windows'>('linux');
  const [selectedAgent, setSelectedAgent] = useState<'antigravity' | 'claude' | 'codex' | 'cursor' | 'cline'>('antigravity');
  const [metadata, setMetadata] = useState<MetadataResponse>(DEFAULT_METADATA);
  const [tools, setTools] = useState<ToolItem[]>(VERIFIED_TOOLS);
  const [toolSearch, setToolSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Checklist state persisted to localStorage
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('keymuse_agent_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleChecklist = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    try {
      localStorage.setItem('keymuse_agent_checklist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch dynamic metadata & tools from API if available
  useEffect(() => {
    fetch('/api/autopilot/metadata')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.repository_url) {
          setMetadata(data);
        }
      })
      .catch(() => {});

    fetch('/api/autopilot/tools')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.tools && data.tools.length > 0) {
          setTools(data.tools);
        }
      })
      .catch(() => {});
  }, []);

  const gitUrl = metadata.repository_url || 'https://github.com/contactaurawealth-lab/KeyMuse.git';

  // OS tailored paths and commands
  const getCloneCommands = () => {
    if (osType === 'windows') {
      return `git clone ${gitUrl}\ncd KeyMuse\npython -m venv venv\n.\\venv\\Scripts\\activate\npip install -e .`;
    }
    return `git clone ${gitUrl}\ncd KeyMuse\npython3 -m venv venv\nsource venv/bin/activate\npip install -e .`;
  };

  const getVerifyCommand = () => {
    if (osType === 'windows') {
      return `python examples\\cinematic_autopilot.py`;
    }
    return `python examples/cinematic_autopilot.py`;
  };

  // Dynamic configuration snippet based on selected agent
  const getConfigSnippet = () => {
    switch (selectedAgent) {
      case 'antigravity':
        return {
          filename: osType === 'windows' ? '%USERPROFILE%\\.gemini\\config\\mcp_config.json' : '~/.gemini/config/mcp_config.json',
          code: JSON.stringify(
            {
              mcpServers: {
                keymuse: {
                  command: osType === 'windows' ? 'python' : 'python3',
                  args: ['-m', 'keymuse.mcp.server'],
                  env: {}
                }
              }
            },
            null,
            2
          )
        };
      case 'claude':
        return {
          filename: 'CLI Command / ~/.claude.json',
          code: `# Add via Claude Code CLI:\nclaude mcp add keymuse -- python -m keymuse.mcp.server\n\n# Or Claude Desktop config file:\n${JSON.stringify(
            {
              mcpServers: {
                keymuse: {
                  command: osType === 'windows' ? 'python' : 'python3',
                  args: ['-m', 'keymuse.mcp.server']
                }
              }
            },
            null,
            2
          )}`
        };
      case 'codex':
        return {
          filename: 'codex_tools.json / CLI Arguments',
          code: `# Register with OpenAI Codex CLI:\ncodex mcp register keymuse --command "keymuse-mcp"\n\n# Or codex_tools.json configuration:\n${JSON.stringify(
            {
              mcp_servers: {
                keymuse: {
                  command: 'keymuse-mcp',
                  transport: 'stdio'
                }
              }
            },
            null,
            2
          )}`
        };
      case 'cursor':
        return {
          filename: osType === 'windows' ? '%USERPROFILE%\\.cursor\\mcp.json' : '~/.cursor/mcp.json',
          code: JSON.stringify(
            {
              mcpServers: {
                keymuse: {
                  command: osType === 'windows' ? 'python' : 'python3',
                  args: ['-m', 'keymuse.mcp.server']
                }
              }
            },
            null,
            2
          )
        };
      case 'cline':
        return {
          filename: 'cline_mcp_settings.json',
          code: JSON.stringify(
            {
              mcpServers: {
                keymuse: {
                  command: osType === 'windows' ? 'python' : 'python3',
                  args: ['-m', 'keymuse.mcp.server'],
                  disabled: false,
                  autoApprove: [
                    'keymuse_validate_brief',
                    'keymuse_plan_composition',
                    'keymuse_render_preview',
                    'keymuse_analyze_audio',
                    'keymuse_get_project_summary'
                  ]
                }
              }
            },
            null,
            2
          )
        };
    }
  };

  const currentConfig = getConfigSnippet();

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(toolSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div className="studio-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Bot size={24} color="var(--accent-purple)" />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Connect Your AI Coding Agent</h1>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  color: 'var(--accent-purple)',
                  fontWeight: 700
                }}
              >
                MCP 2.x PROTOCOL
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '820px' }}>
              Self-service setup guide for pairing AI coding agents (Google Antigravity, Claude Code, OpenAI Codex, Cursor, VSCode/Cline) with KeyMuse. Connected agents can plan arrangements, compose chord progressions, synthesize 16-bit PCM WAV audio, and execute closed-loop revisions via 15 Model Context Protocol tools.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target OS:</span>
            {(['linux', 'macos', 'windows'] as const).map((os) => (
              <button
                key={os}
                onClick={() => setOsType(os)}
                className="studio-btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: osType === os ? 700 : 500,
                  backgroundColor: osType === os ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: osType === os ? '#000' : 'var(--text-primary)'
                }}
              >
                {os.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container with Sidebar + Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <aside
          style={{
            position: 'sticky',
            top: '20px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Setup Navigation
          </span>
          {[
            { id: 'quickstart', label: '1. Quick Start' },
            { id: 'get-keymuse', label: '2. Get KeyMuse' },
            { id: 'choose-agent', label: '3. Choose Your Agent' },
            { id: 'mcp-config', label: '4. MCP Configuration' },
            { id: 'connect-test', label: '5. Connect and Test' },
            { id: 'available-tools', label: '6. Available Tools (15)' },
            { id: 'python-api', label: '7. Python SDK Guide' },
            { id: 'troubleshooting', label: '8. Troubleshooting FAQ' },
            { id: 'security', label: '9. Security Guidelines' },
            { id: 'checklist', label: '10. Verification Checklist' }
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              style={{
                display: 'block',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {item.label}
            </a>
          ))}
        </aside>

        {/* Content Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Quick Start */}
          <section id="quickstart" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-cyan)" />
                <span>1. Quick Start</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              KeyMuse connects to your AI coding agent via the <strong>Model Context Protocol (MCP)</strong>. Once connected, your agent gains direct control over KeyMuse's real music engine—allowing it to understand briefs, design arrangements, generate multi-track note events, render real 16-bit PCM audio, analyze measurable acoustic properties, and revise compositions until criteria are met.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                  Real DSP Audio
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Generates true 16-bit PCM WAV audio and SMF Type 0 MIDI binary streams. Zero fake audio.
                </span>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--accent-purple)', marginBottom: '4px' }}>
                  15 Agent Tools
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Granular MCP tools for brief validation, planning, chord synthesis, audio rendering, and stem export.
                </span>
              </div>

              <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--accent-amber)', marginBottom: '4px' }}>
                  Closed-Loop Feedback
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  AudioQualityInspector measures peak dBFS, RMS loudness, and silence tails to trigger targeted revisions.
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Get KeyMuse */}
          <section id="get-keymuse" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} color="var(--accent-cyan)" />
                <span>2. Get KeyMuse</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Package: keymuse v{metadata.version}</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              Clone the authoritative Git repository and install KeyMuse into your Python 3.10+ virtual environment:
            </p>

            <div style={{ position: 'relative', marginTop: '8px' }}>
              <pre
                style={{
                  padding: '14px',
                  backgroundColor: '#0d1117',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: '#58a6ff',
                  fontSize: '12px',
                  overflowX: 'auto',
                  margin: 0,
                  fontFamily: 'monospace'
                }}
              >
                {getCloneCommands()}
              </pre>
              <button
                onClick={() => copyToClipboard(getCloneCommands(), 'clone')}
                className="studio-btn"
                style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px' }}
              >
                {copiedKey === 'clone' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span style={{ marginLeft: '4px' }}>{copiedKey === 'clone' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
              Verify your installation locally by executing the end-to-end cinematic soundtrack demo:
            </p>

            <div style={{ position: 'relative', marginTop: '6px' }}>
              <pre
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#0d1117',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: '#7ee787',
                  fontSize: '12px',
                  overflowX: 'auto',
                  margin: 0,
                  fontFamily: 'monospace'
                }}
              >
                {getVerifyCommand()}
              </pre>
              <button
                onClick={() => copyToClipboard(getVerifyCommand(), 'verify')}
                className="studio-btn"
                style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px' }}
              >
                {copiedKey === 'verify' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span style={{ marginLeft: '4px' }}>{copiedKey === 'verify' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </section>

          {/* Section 3: Choose Your Agent */}
          <section id="choose-agent" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} color="var(--accent-purple)" />
                <span>3. Choose Your Coding Agent</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              Select your coding agent to display tailored configuration files, entry points, and instructions:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '12px' }}>
              {[
                { id: 'antigravity', name: 'Antigravity', badge: 'Official SDK' },
                { id: 'claude', name: 'Claude Code', badge: 'Verified' },
                { id: 'codex', name: 'OpenAI Codex', badge: 'Verified' },
                { id: 'cursor', name: 'Cursor IDE', badge: 'Verified' },
                { id: 'cline', name: 'VSCode / Cline', badge: 'Verified' }
              ].map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id as any)}
                  type="button"
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedAgent === agent.id ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                    backgroundColor: selectedAgent === agent.id ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-tertiary)',
                    color: selectedAgent === agent.id ? 'var(--accent-purple)' : 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px' }}>{agent.name}</strong>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>{agent.badge}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Section 4: MCP Configuration */}
          <section id="mcp-config" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--accent-cyan)" />
                <span>4. MCP Configuration for {selectedAgent.toUpperCase()}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>File: {currentConfig.filename}</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              Add the following configuration snippet to your client's settings file:
            </p>

            <div style={{ position: 'relative', marginTop: '8px' }}>
              <pre
                style={{
                  padding: '14px',
                  backgroundColor: '#0d1117',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: '#e6edf3',
                  fontSize: '12px',
                  overflowX: 'auto',
                  margin: 0,
                  fontFamily: 'monospace'
                }}
              >
                {currentConfig.code}
              </pre>
              <button
                onClick={() => copyToClipboard(currentConfig.code, 'config')}
                className="studio-btn"
                style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px' }}
              >
                {copiedKey === 'config' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span style={{ marginLeft: '4px' }}>{copiedKey === 'config' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </section>

          {/* Section 5: Connect and Test */}
          <section id="connect-test" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} color="var(--accent-cyan)" />
                <span>5. Connect and Test</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Save Configuration & Restart Agent</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Save your client's configuration file and restart or refresh your coding agent session to trigger tool discovery.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Verify Tool Registration</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Ask your agent: <em>"List all available KeyMuse MCP tools."</em> You should see all 15 <code>keymuse_*</code> tools registered.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>Prompt Your Agent to Compose</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Give your agent a natural-language composition task:
                  </span>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <pre
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#0d1117',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        color: '#f0883e',
                        fontSize: '12px',
                        overflowX: 'auto',
                        margin: 0,
                        fontFamily: 'monospace'
                      }}
                    >
                      {`Compose a 45-second cinematic cyberpunk battle soundtrack in F# minor at 128 BPM. Use atmospheric pads, pulsing bass, driving percussion, and a memorable lead motif. Render audio, check for clipping, and export deliverables.`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Compose a 45-second cinematic cyberpunk battle soundtrack in F# minor at 128 BPM. Use atmospheric pads, pulsing bass, driving percussion, and a memorable lead motif. Render audio, check for clipping, and export deliverables.`,
                          'prompt'
                        )
                      }
                      className="studio-btn"
                      style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px' }}
                    >
                      {copiedKey === 'prompt' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span style={{ marginLeft: '4px' }}>{copiedKey === 'prompt' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Available MCP Tools */}
          <section id="available-tools" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="var(--accent-purple)" />
                <span>6. Available MCP Tools ({tools.length})</span>
              </div>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Filter tools..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px 4px 28px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '11px'
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              The 15 real MCP tools implemented in <code>keymuse.mcp.server.MCPServer</code> and exposed over standard I/O:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {filteredTools.map((tool) => (
                <div
                  key={tool.name}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 700 }}>{tool.name}</code>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {tool.category}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(tool.example, tool.name)}
                      className="studio-btn"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      title="Copy example call"
                    >
                      {copiedKey === tool.name ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      <span style={{ marginLeft: '4px' }}>{copiedKey === tool.name ? 'Copied' : 'Copy Call'}</span>
                    </button>
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{tool.description}</p>
                  <pre
                    style={{
                      margin: 0,
                      padding: '6px 8px',
                      backgroundColor: '#0d1117',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#a5d6ff',
                      fontFamily: 'monospace',
                      overflowX: 'auto'
                    }}
                  >
                    {tool.example}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* Section 7: Python API Guide */}
          <section id="python-api" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={18} color="var(--accent-cyan)" />
                <span>7. Python SDK Direct API</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              You can also invoke the KeyMuse engine programmatically in your own scripts or agent workflows:
            </p>

            <div style={{ position: 'relative', marginTop: '8px' }}>
              <pre
                style={{
                  padding: '14px',
                  backgroundColor: '#0d1117',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: '#e6edf3',
                  fontSize: '12px',
                  overflowX: 'auto',
                  margin: 0,
                  fontFamily: 'monospace'
                }}
              >
{`from keymuse import MusicAutopilot

# Initialize autopilot
autopilot = MusicAutopilot(output_dir="output/cinematic_track")

# Compose complete piece from natural language
result = autopilot.compose(
    brief="Compose a 60-second sci-fi soundtrack in D minor at 90 BPM.",
    seed=42
)

print(f"Status: {result.status}")
print(f"Audio Path: {result.audio_path}")
print(f"MIDI Path: {result.midi_path}")
print(f"Report: {result.report_path}")`}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(
                    `from keymuse import MusicAutopilot\n\nautopilot = MusicAutopilot(output_dir="output/cinematic_track")\nresult = autopilot.compose(brief="Compose a 60-second sci-fi soundtrack in D minor at 90 BPM.", seed=42)\nprint(f"Audio: {result.audio_path}")`,
                    'pyapi'
                  )
                }
                className="studio-btn"
                style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', fontSize: '11px' }}
              >
                {copiedKey === 'pyapi' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span style={{ marginLeft: '4px' }}>{copiedKey === 'pyapi' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </section>

          {/* Section 8: Troubleshooting FAQ */}
          <section id="troubleshooting" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} color="var(--accent-amber)" />
                <span>8. Troubleshooting FAQ</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {TROUBLESHOOTING_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    type="button"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{item.question}</span>
                    {expandedFaq === idx ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {expandedFaq === idx && (
                    <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-secondary)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 9: Security Guidelines */}
          <section id="security" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color="#10b981" />
                <span>9. Security & Sandboxing</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>
                KeyMuse is engineered with defensive security boundaries to ensure safe local and remote execution by AI coding agents:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  <strong>Path Sandboxing:</strong> All file outputs and stem exports are sanitized via <code>resolve_safe_path()</code>, preventing directory traversal attacks (<code>../../</code>).
                </li>
                <li>
                  <strong>Resource Ceilings:</strong> Hard limits of 600 seconds duration, 32 simultaneous tracks, and 50,000 notes prevent Denial of Service (DoS) memory exhaustion.
                </li>
                <li>
                  <strong>Standard I/O Transport:</strong> Local agent communication operates over authenticated process pipes (<code>stdio</code>) with no open external ports required.
                </li>
                <li>
                  <strong>Zero Secret Collection:</strong> No API keys, credentials, or proprietary tokens are ever collected, cached, or transmitted to frontend storage.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 10: Connection Checklist */}
          <section id="checklist" className="studio-card">
            <div className="card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="var(--accent-cyan)" />
                <span>10. Final Connection Checklist</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
              Check off each milestone as you complete your setup. Your progress is saved automatically in your browser:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {[
                { id: 'step_git', label: '1. Cloned Git repository from contactaurawealth-lab/KeyMuse' },
                { id: 'step_env', label: '2. Created Python 3.10+ virtualenv and ran pip install -e .' },
                { id: 'step_demo', label: '3. Verified local installation with examples/cinematic_autopilot.py' },
                { id: 'step_cfg', label: `4. Added KeyMuse server configuration to ${selectedAgent.toUpperCase()} settings` },
                { id: 'step_restart', label: '5. Restarted or refreshed AI coding agent session' },
                { id: 'step_list', label: '6. Verified agent discovers all 15 keymuse_* tools' },
                { id: 'step_compose', label: '7. Successfully asked agent to compose and render a soundtrack' }
              ].map((chk) => {
                const isChecked = !!checklist[chk.id];
                return (
                  <label
                    key={chk.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: isChecked ? 'rgba(0, 210, 196, 0.1)' : 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: isChecked ? '1px solid rgba(0, 210, 196, 0.3)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: isChecked ? 'var(--accent-cyan)' : 'var(--text-primary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecklist(chk.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{chk.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
