"""High-Level MusicAutopilot API: Closed-Loop AI Music Composition and Orchestration."""

import os
import json
import time
from typing import Optional, Dict, Any, Tuple, Union
from datetime import datetime, timezone

from keymuse.models.brief import MusicBrief, UserConstraints
from keymuse.models.plan import CompositionPlan
from keymuse.models.project import KeyMuseProject
from keymuse.models.analysis import AudioAnalysisResult, MusicalAnalysisResult
from keymuse.models.revision import RevisionPlan, RevisionRecord
from keymuse.models.task import TaskState, TaskStatus, TaskResult

from keymuse.autopilot.interpreter import MusicBriefInterpreter
from keymuse.autopilot.planner import CompositionPlanner
from keymuse.autopilot.generator import CompositionEngine
from keymuse.autopilot.reviser import RevisionPlanner
from keymuse.autopilot.orchestrator import TaskOrchestrator
from keymuse.core.render import RenderManager
from keymuse.core.analyzer import AudioQualityInspector


class MusicAutopilot:
    """Primary high-level interface for autonomous music composition and orchestration."""

    def __init__(
        self,
        output_dir: str = "output",
        sample_rate: int = 44100,
        max_iterations: int = 3,
        silence_threshold_db: float = -55.0
    ):
        self.output_dir = os.path.abspath(output_dir)
        os.makedirs(self.output_dir, exist_ok=True)
        self.sample_rate = sample_rate
        self.max_iterations = max_iterations

        # Subsystems
        self.interpreter = MusicBriefInterpreter()
        self.planner = CompositionPlanner()
        self.generator = CompositionEngine()
        self.reviser = RevisionPlanner()
        self.orchestrator = TaskOrchestrator()
        self.render_manager = RenderManager(sample_rate=sample_rate)
        self.analyzer = AudioQualityInspector(silence_threshold_db=silence_threshold_db)

    def parse_brief(self, text_or_brief: Union[str, MusicBrief, Dict[str, Any]]) -> MusicBrief:
        """Parse natural language or dict into validated MusicBrief."""
        if isinstance(text_or_brief, MusicBrief):
            return text_or_brief
        elif isinstance(text_or_brief, dict):
            return MusicBrief(**text_or_brief)
        elif isinstance(text_or_brief, str):
            return self.interpreter.interpret(text_or_brief)
        else:
            raise ValueError(f"Unsupported brief input type: {type(text_or_brief)}")

    def plan_composition(self, brief: MusicBrief) -> CompositionPlan:
        """Convert validated MusicBrief into a structured CompositionPlan."""
        return self.planner.plan(brief)

    def generate_project(self, plan: CompositionPlan) -> KeyMuseProject:
        """Realize CompositionPlan into a KeyMuseProject."""
        return self.generator.generate_project(plan)

    def render_preview(self, project: KeyMuseProject, output_path: Optional[str] = None) -> str:
        """Render audio preview to WAV file."""
        if not output_path:
            output_path = os.path.join(self.output_dir, f"{project.id}_v{project.version}.wav")
        return self.render_manager.render_project_to_wav(project, output_path)

    def inspect_audio(self, wav_path: str, target_duration: Optional[float] = None) -> AudioAnalysisResult:
        """Measure empirical audio metrics of a rendered WAV file."""
        return self.analyzer.inspect_audio_file(wav_path, target_duration=target_duration)

    def apply_revision(
        self,
        project: KeyMuseProject,
        analysis: AudioAnalysisResult,
        target_duration: float = 60.0
    ) -> Tuple[KeyMuseProject, RevisionPlan]:
        """Apply targeted surgical modifications based on audio analysis."""
        return self.reviser.evaluate_and_revise(
            project,
            analysis,
            iteration=project.version,
            target_duration=target_duration
        )

    def export_deliverables(self, project: KeyMuseProject, target_dir: Optional[str] = None) -> Dict[str, str]:
        """Export audio WAV, MIDI, project JSON, and isolated stems."""
        out_dir = target_dir or self.output_dir
        os.makedirs(out_dir, exist_ok=True)

        audio_path = os.path.join(out_dir, "audio.wav")
        midi_path = os.path.join(out_dir, "composition.mid")
        project_path = os.path.join(out_dir, "project.json")
        stems_dir = os.path.join(out_dir, "stems")

        # 1. WAV Master
        self.render_manager.render_project_to_wav(project, audio_path)

        # 2. MIDI Master
        self.render_manager.export_project_to_midi(project, midi_path)

        # 3. Project JSON
        self.save_project(project, project_path)

        # 4. Stems
        self.render_manager.export_stems(project, stems_dir)

        return {
            "audio": audio_path,
            "midi": midi_path,
            "project": project_path,
            "stems_dir": stems_dir
        }

    def save_project(self, project: KeyMuseProject, file_path: str) -> str:
        """Save KeyMuseProject to JSON file."""
        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(project.model_dump_json(indent=2))
        return file_path

    def load_project(self, file_path: str) -> KeyMuseProject:
        """Load KeyMuseProject from JSON file."""
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return KeyMuseProject(**data)

    def compose(
        self,
        brief: Union[str, MusicBrief, Dict[str, Any]],
        idempotency_key: Optional[str] = None
    ) -> TaskResult:
        """Synchronously execute complete closed-loop composition pipeline."""
        task = self.orchestrator.create_task(idempotency_key=idempotency_key)
        return self._compose_worker(task.task_id, brief)

    def compose_async(
        self,
        brief: Union[str, MusicBrief, Dict[str, Any]],
        idempotency_key: Optional[str] = None
    ) -> TaskState:
        """Asynchronously trigger composition pipeline in background without blocking caller."""
        import threading
        task = self.orchestrator.create_task(idempotency_key=idempotency_key)
        task_id = task.task_id

        def _worker():
            self._compose_worker(task_id, brief)

        thread = threading.Thread(target=_worker, daemon=True)
        thread.start()
        return task

    def _compose_worker(self, task_id: str, brief: Union[str, MusicBrief, Dict[str, Any]]) -> TaskResult:
        start_time = time.time()
        run_dir = os.path.join(self.output_dir, task_id)
        os.makedirs(run_dir, exist_ok=True)

        try:
            if self.orchestrator.is_cancelled(task_id):
                return self._cancelled_result(task_id, start_time)

            # Stage 1: Brief Parsing
            self.orchestrator.update_progress(task_id, "parsing_brief", 10.0, "Parsing music brief")
            validated_brief = self.parse_brief(brief)

            if self.orchestrator.is_cancelled(task_id):
                return self._cancelled_result(task_id, start_time)

            # Stage 2: Composition Planning
            self.orchestrator.update_progress(task_id, "planning", 25.0, "Generating composition plan")
            plan = self.plan_composition(validated_brief)

            if self.orchestrator.is_cancelled(task_id):
                return self._cancelled_result(task_id, start_time)

            # Stage 3: Project Generation
            self.orchestrator.update_progress(task_id, "generating", 40.0, "Realizing project tracks and notes")
            project = self.generate_project(plan)

            if self.orchestrator.is_cancelled(task_id):
                return self._cancelled_result(task_id, start_time)

            # Stage 4: Initial Audio Render & Analysis
            self.orchestrator.update_progress(task_id, "initial_render", 55.0, "Rendering initial audio preview")
            initial_wav_path = os.path.join(run_dir, "initial_preview.wav")
            self.render_preview(project, initial_wav_path)

            self.orchestrator.update_progress(task_id, "analyzing", 65.0, "Analyzing audio properties")
            initial_analysis = self.inspect_audio(initial_wav_path, target_duration=validated_brief.target_duration)

            if self.orchestrator.is_cancelled(task_id):
                return self._cancelled_result(task_id, start_time)

            # Stage 5: Closed-Loop Revision
            self.orchestrator.update_progress(task_id, "revising", 75.0, "Applying targeted revisions")
            revised_project, revision_plan = self.apply_revision(
                project,
                initial_analysis,
                target_duration=validated_brief.target_duration
            )

            # Stage 6: Re-render and Verify
            self.orchestrator.update_progress(task_id, "re_rendering", 85.0, "Rendering revised audio")
            final_wav_path = os.path.join(run_dir, "final_preview.wav")
            self.render_preview(revised_project, final_wav_path)

            final_analysis = self.inspect_audio(final_wav_path, target_duration=validated_brief.target_duration)

            # Stage 7: Deliverables Export
            self.orchestrator.update_progress(task_id, "exporting", 95.0, "Exporting master deliverables")
            deliverables = self.export_deliverables(revised_project, target_dir=run_dir)

            # Stage 8: Manifest and Report Generation
            report_path = os.path.join(run_dir, "report.json")
            report_data = {
                "task_id": task_id,
                "status": "completed",
                "brief": validated_brief.model_dump(),
                "plan": plan.model_dump(),
                "project_summary": {
                    "id": revised_project.id,
                    "title": revised_project.title,
                    "version": revised_project.version,
                    "tracks": [t.name for t in revised_project.tracks],
                    "total_notes": revised_project.total_note_count(),
                    "duration_seconds": revised_project.duration_seconds()
                },
                "initial_analysis": initial_analysis.model_dump(),
                "revision_plan": revision_plan.model_dump(),
                "final_analysis": final_analysis.model_dump(),
                "exports": deliverables,
                "execution_time_seconds": round(time.time() - start_time, 2)
            }
            with open(report_path, "w", encoding="utf-8") as f:
                json.dump(report_data, f, indent=2)

            result = TaskResult(
                task_id=task_id,
                status=TaskStatus.COMPLETED,
                project_id=revised_project.id,
                project_path=deliverables["project"],
                audio_path=deliverables["audio"],
                midi_path=deliverables["midi"],
                report_path=report_path,
                duration_seconds=round(time.time() - start_time, 2)
            )

            self.orchestrator.complete_task(task_id, result)
            return result

        except Exception as e:
            self.orchestrator.fail_task(task_id, str(e))
            return TaskResult(
                task_id=task_id,
                status=TaskStatus.FAILED,
                error=str(e),
                duration_seconds=round(time.time() - start_time, 2)
            )

    def _cancelled_result(self, task_id: str, start_time: float) -> TaskResult:
        result = TaskResult(
            task_id=task_id,
            status=TaskStatus.CANCELLED,
            error="Task cancelled by user request",
            duration_seconds=round(time.time() - start_time, 2)
        )
        return result

    def get_task_status(self, task_id: str) -> Optional[TaskState]:
        """Query state and progress of an orchestrated task."""
        return self.orchestrator.get_task(task_id)

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending or running task."""
        return self.orchestrator.request_cancellation(task_id)

