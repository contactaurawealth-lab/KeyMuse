"""Tests for Security and Resource Bounds."""

import os
import pytest
from keymuse.core.security import (
    resolve_safe_path,
    check_resource_limits,
    SecurityError,
    ResourceLimitError,
    MAX_DURATION_SECONDS
)


def test_path_traversal_prevention(tmp_path):
    sandbox = str(tmp_path / "sandbox")
    os.makedirs(sandbox, exist_ok=True)

    # Valid relative path inside sandbox
    safe = resolve_safe_path(sandbox, "output/track.wav")
    assert safe.startswith(sandbox)

    # Malicious path traversal attempts
    with pytest.raises(SecurityError):
        resolve_safe_path(sandbox, "../../../etc/passwd")

    with pytest.raises(SecurityError):
        resolve_safe_path(sandbox, "/etc/shadow")

    with pytest.raises(SecurityError):
        resolve_safe_path(sandbox, "folder/../../secret.key")


def test_resource_limits():
    # Valid limits
    check_resource_limits(duration_seconds=60.0, track_count=4, note_count=100)

    # Excessive duration
    with pytest.raises(ResourceLimitError):
        check_resource_limits(duration_seconds=MAX_DURATION_SECONDS + 10.0)

    # Excessive tracks
    with pytest.raises(ResourceLimitError):
        check_resource_limits(track_count=50)

    # Excessive notes
    with pytest.raises(ResourceLimitError):
        check_resource_limits(note_count=100_000)
