#!/usr/bin/env python3
"""
KeyMuse AI Music Autopilot — End-to-End Cinematic Sci-Fi Composition Example.

Demonstrates the complete closed-loop autonomous composition workflow:
1. Natural language brief ingestion & parameter validation.
2. Architectural composition planning with energy progression & bar alignment.
3. Project realization with multi-track motifs, chords, bassline, and percussion.
4. Real 16-bit PCM WAV rendering via local Web Audio DSP engine.
5. Empirical signal analysis (duration, peak dBFS, RMS dBFS, clipping risk).
6. Targeted surgical revision loop addressing detected constraints.
7. Re-rendering and verification comparison.
8. Deliverables export (Master WAV, Standard MIDI File, Track Stems, Project JSON, Report Manifest).

Usage:
    python examples/cinematic_autopilot.py
"""

import os
import sys
import json
import time

# Ensure keymuse package is resolvable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from keymuse import (
    MusicAutopilot,
    MusicBrief,
    UserConstraints,
    KeyMuseProject
)


def run_cinematic_autopilot():
    print("=" * 72)
    print("🎵 KEYMUSE AI MUSIC AUTOPILOT — CINEMATIC SCI-FI SOUNDTRACK DEMO")
    print("=" * 72)

    output_directory = os.path.abspath("output/cinematic_demo")
    os.makedirs(output_directory, exist_ok=True)

    autopilot = MusicAutopilot(output_dir=output_directory)

    # 1. Define Brief
    brief_prompt = (
        "Compose a 60-second cinematic sci-fi soundtrack in D minor at 90 BPM. "
        "Start mysteriously, gradually build tension, introduce a powerful climax, "
        "and end with a clean, resolved finish. Use atmospheric pads, pulsing bass, "
        "percussion, and a memorable lead melody."
    )
    print("\n[Stage 1] Ingesting Natural Language Brief:")
    print(f"  \"{brief_prompt}\"")

    brief = autopilot.parse_brief(brief_prompt)
    print("\n[Stage 1 Validated Specification]")
    print(f"  • Genre / Subgenre : {brief.genre.capitalize()} / {brief.subgenre.capitalize()}")
    print(f"  • Tonality         : {brief.key} {brief.mode}")
    print(f"  • Tempo            : {brief.tempo} BPM ({brief.time_signature})")
    print(f"  • Target Duration  : {brief.target_duration}s")
    print(f"  • Requested Tracks : {', '.join(brief.desired_instruments)}")
    print(f"  • Structure        : {' -> '.join([s.capitalize() for s in brief.arrangement_structure])}")
    print(f"  • Engine Mode      : {brief.inferred.provider_used} (Seed: {brief.seed})")

    # 2. Composition Plan
    print("\n[Stage 2] Generating Composition Plan...")
    plan = autopilot.plan_composition(brief)
    print(f"  • Bar Count        : {int(plan.total_beats // 4)} bars ({plan.total_beats} total beats)")
    print(f"  • Planned Length   : {plan.total_duration_seconds:.2f}s")
    print("  • Section Outline  :")
    for s in plan.sections:
        print(f"    - {s.name:<12} | Beats: {s.start_beat:5.1f} - {s.start_beat + s.length_beats:5.1f} | Energy: {s.energy:4.2f} ({s.dynamic_level:<2}) | Tracks: {len(s.active_track_ids)}")

    # 3. Project Realization
    print("\n[Stage 3] Realizing Canonical Project Data...")
    project = autopilot.generate_project(plan)
    print(f"  • Project ID       : {project.id}")
    print(f"  • Version          : v{project.version}")
    print(f"  • Total Tracks     : {len(project.tracks)}")
    print(f"  • Total Notes      : {project.total_note_count()} events")
    for t in project.tracks:
        print(f"    - Track [{t.id:<18}]: {len(t.notes):3d} notes | Pan: {t.pan:+4.2f} | Vol: {t.volume:4.2f}")

    # 4. Initial Render
    initial_wav = os.path.join(output_directory, "initial_preview.wav")
    print(f"\n[Stage 4] Rendering Initial Audio Preview -> {os.path.basename(initial_wav)}...")
    t0 = time.time()
    autopilot.render_preview(project, initial_wav)
    render_time = time.time() - t0
    print(f"  ✓ Render completed in {render_time:.2f}s (File Size: {os.path.getsize(initial_wav) / 1024:.1f} KB)")

    # 5. Audio Inspection
    print("\n[Stage 5] Performing Empirical Waveform Analysis...")
    analysis_v1 = autopilot.inspect_audio(initial_wav, target_duration=brief.target_duration)
    print(f"  • Measured Length  : {analysis_v1.duration_seconds:.2f}s")
    print(f"  • Sample Rate / Ch : {analysis_v1.sample_rate} Hz / {analysis_v1.channels} channels (Stereo)")
    print(f"  • Peak Level       : {analysis_v1.peak_amplitude:.4f} ({analysis_v1.peak_db:+.2f} dBFS)")
    print(f"  • RMS Energy       : {analysis_v1.rms_level:.4f} ({analysis_v1.rms_db:+.2f} dBFS)")
    print(f"  • Clipping Risk    : {'⚠️ WARNING: RISK' if analysis_v1.clipping_risk else '✓ SAFE (Zero digital clipping)'}")
    print(f"  • Start Silence    : {analysis_v1.start_silence_seconds:.2f}s")
    print(f"  • End Silence      : {analysis_v1.end_silence_seconds:.2f}s")
    print("  • Quality Assertions:")
    for c in analysis_v1.checks:
        icon = "✓" if c.status == "passed" else ("⚠️" if c.status == "warning" else "❌")
        print(f"    {icon} {c.name:<22}: {c.message}")

    # 6. Targeted Surgical Revision
    print("\n[Stage 6] Evaluating Closed-Loop Targeted Revision...")
    revised_project, rev_plan = autopilot.apply_revision(
        project,
        analysis_v1,
        target_duration=brief.target_duration
    )
    print(f"  • Revision Reason  : {rev_plan.reason}")
    print(f"  • Version Bump     : v{project.version} -> v{revised_project.version}")
    print(f"  • Applied Edits    : {len(rev_plan.edits)} modifications:")
    for e in rev_plan.edits:
        print(f"    - Action [{e.action_type:<15}] on target [{e.target:<12}]: {e.parameters}")

    # 7. Re-render and Comparative Verification
    final_wav = os.path.join(output_directory, "final_preview.wav")
    print(f"\n[Stage 7] Re-rendering Revised Project -> {os.path.basename(final_wav)}...")
    autopilot.render_preview(revised_project, final_wav)
    analysis_v2 = autopilot.inspect_audio(final_wav, target_duration=brief.target_duration)
    print(f"  • Revised Peak     : {analysis_v2.peak_db:+.2f} dBFS (Delta: {analysis_v2.peak_db - analysis_v1.peak_db:+.2f} dB)")
    print(f"  • Revised RMS      : {analysis_v2.rms_db:+.2f} dBFS (Delta: {analysis_v2.rms_db - analysis_v1.rms_db:+.2f} dB)")
    print(f"  • Revised Duration : {analysis_v2.duration_seconds:.2f}s")

    # 8. Deliverables Export
    print("\n[Stage 8] Exporting Production Deliverables...")
    deliverables = autopilot.export_deliverables(revised_project, target_dir=output_directory)
    print(f"  ✓ Master Audio WAV : {deliverables['audio']}")
    print(f"  ✓ Standard MIDI    : {deliverables['midi']}")
    print(f"  ✓ Project Schema   : {deliverables['project']}")
    print(f"  ✓ Isolated Stems   : {deliverables['stems_dir']}/")

    # 9. Machine-Readable Report
    report_path = os.path.join(output_directory, "report.json")
    report_manifest = {
        "status": "completed",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "brief": brief.model_dump(),
        "plan": plan.model_dump(),
        "project": {
            "id": revised_project.id,
            "version": revised_project.version,
            "total_notes": revised_project.total_note_count(),
            "duration_seconds": revised_project.duration_seconds()
        },
        "initial_analysis": analysis_v1.model_dump(),
        "revision_plan": rev_plan.model_dump(),
        "final_analysis": analysis_v2.model_dump(),
        "exports": deliverables
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_manifest, f, indent=2)
    print(f"  ✓ Machine Manifest : {report_path}")

    print("\n" + "=" * 72)
    print("🎉 CINEMATIC SCI-FI SOUNDTRACK SUCCESSFULLY GENERATED & VERIFIED!")
    print("=" * 72)
    return report_path


if __name__ == "__main__":
    run_cinematic_autopilot()
