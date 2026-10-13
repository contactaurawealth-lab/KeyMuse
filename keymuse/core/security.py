"""Security and Resource Limit Verification Utilities."""

import os
from typing import Optional


class SecurityError(Exception):
    """Raised when an operation violates security or path constraints."""
    pass


class ResourceLimitError(Exception):
    """Raised when an operation exceeds configured resource limits."""
    pass


# Hard resource bounds
MAX_DURATION_SECONDS = 600.0       # 10 minutes maximum per piece
MAX_TRACK_COUNT = 32               # 32 tracks maximum per project
MAX_NOTES_PER_TRACK = 50_000       # 50k notes maximum per track
MAX_PROJECT_JSON_BYTES = 15_000_000  # 15 MB maximum project JSON payload


def resolve_safe_path(base_dir: str, candidate_path: str) -> str:
    """
    Ensure candidate_path resolves strictly within base_dir,
    preventing path traversal attacks (e.g., ../../etc/passwd).
    """
    base_abs = os.path.abspath(base_dir)
    # If candidate_path is already absolute, ensure it starts with base_abs
    if os.path.isabs(candidate_path):
        resolved = os.path.abspath(candidate_path)
    else:
        resolved = os.path.abspath(os.path.join(base_abs, candidate_path))

    if not (resolved == base_abs or resolved.startswith(base_abs + os.sep)):
        raise SecurityError(
            f"Path traversal detected! Target path '{candidate_path}' resolves outside sandbox '{base_dir}'."
        )

    return resolved


def check_resource_limits(
    duration_seconds: Optional[float] = None,
    track_count: Optional[int] = None,
    note_count: Optional[int] = None
):
    """Assert that requested composition dimensions adhere to safe operational limits."""
    if duration_seconds is not None:
        if duration_seconds <= 0.0 or duration_seconds > MAX_DURATION_SECONDS:
            raise ResourceLimitError(
                f"Requested duration ({duration_seconds}s) exceeds safe boundaries (0.1s to {MAX_DURATION_SECONDS}s)."
            )

    if track_count is not None:
        if track_count < 1 or track_count > MAX_TRACK_COUNT:
            raise ResourceLimitError(
                f"Requested track count ({track_count}) exceeds safe maximum of {MAX_TRACK_COUNT}."
            )

    if note_count is not None:
        if note_count > MAX_NOTES_PER_TRACK:
            raise ResourceLimitError(
                f"Note count ({note_count}) exceeds track ceiling ({MAX_NOTES_PER_TRACK})."
            )
