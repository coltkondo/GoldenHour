"""
Tests for P0-6: Dockerfile security and operational hygiene.

Three issues were present:
  1. Container ran as root — escape grants host root access.
  2. COPY . . without .dockerignore could bake .env secrets into image layers.
  3. No HEALTHCHECK — orchestrators could not detect a crashed-but-running
     container, routing traffic to a broken instance indefinitely.

The fix:
  - Non-root USER directive added (after chown so files remain readable).
  - .dockerignore created, blocking .env, __pycache__, .git/, tests/, etc.
  - HEALTHCHECK added, probing the real /health endpoint with a start-period
    long enough for Alembic migrations to complete.

Test strategy: static analysis of the Dockerfile and .dockerignore text.
These tests are intentionally lightweight — they verify the structural
properties that prevent the three security/operational issues without
requiring a Docker daemon or a built image.
"""
import pathlib
import re
import pytest

BACKEND_DIR = pathlib.Path(__file__).parent.parent
DOCKERFILE = BACKEND_DIR / "Dockerfile"
DOCKERIGNORE = BACKEND_DIR / ".dockerignore"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _dockerfile_lines() -> list[str]:
    return DOCKERFILE.read_text().splitlines()


def _directives(name: str) -> list[str]:
    """Return all lines whose Dockerfile instruction matches `name`."""
    return [
        line.strip()
        for line in _dockerfile_lines()
        if re.match(rf"^\s*{name}\b", line, re.IGNORECASE)
    ]


def _line_index(pattern: str) -> int:
    """Return the 0-based index of the first line matching `pattern`, or -1."""
    for i, line in enumerate(_dockerfile_lines()):
        if re.search(pattern, line, re.IGNORECASE):
            return i
    return -1


# ---------------------------------------------------------------------------
# Dockerfile: non-root USER
# ---------------------------------------------------------------------------

class TestDockerfileNonRootUser:

    def test_user_directive_exists(self):
        """A USER directive must be present — the default is root."""
        assert _directives("USER"), "Dockerfile has no USER directive"

    def test_user_is_not_root(self):
        """USER root (or USER 0) is forbidden."""
        for directive in _directives("USER"):
            user = directive.split()[-1].lower()
            assert user not in {"root", "0"}, \
                f"Dockerfile sets USER to root: '{directive}'"

    def test_user_directive_before_entrypoint(self):
        """USER must appear before ENTRYPOINT so the process drops privileges."""
        user_idx = _line_index(r"^\s*USER\b")
        entrypoint_idx = _line_index(r"^\s*ENTRYPOINT\b")
        assert user_idx != -1, "No USER directive found"
        assert entrypoint_idx != -1, "No ENTRYPOINT directive found"
        assert user_idx < entrypoint_idx, (
            f"USER (line {user_idx + 1}) must come before "
            f"ENTRYPOINT (line {entrypoint_idx + 1})"
        )

    def test_user_directive_before_cmd(self):
        """USER must also appear before CMD."""
        user_idx = _line_index(r"^\s*USER\b")
        cmd_idx = _line_index(r"^\s*CMD\b")
        assert user_idx != -1, "No USER directive found"
        assert cmd_idx != -1, "No CMD directive found"
        assert user_idx < cmd_idx, (
            f"USER (line {user_idx + 1}) must come before CMD (line {cmd_idx + 1})"
        )

    def test_chown_applied_before_user_switch(self):
        """
        /app must be chowned to the app user before USER drops privileges,
        otherwise the app user cannot read the copied files.
        """
        chown_idx = _line_index(r"chown")
        user_idx = _line_index(r"^\s*USER\b")
        assert chown_idx != -1, "No chown found in Dockerfile"
        assert chown_idx < user_idx, (
            "chown must appear before the USER directive so file ownership "
            "is transferred while still running as root"
        )


# ---------------------------------------------------------------------------
# Dockerfile: HEALTHCHECK
# ---------------------------------------------------------------------------

class TestDockerfileHealthcheck:

    def test_healthcheck_directive_exists(self):
        """HEALTHCHECK is required for orchestrators to detect unhealthy containers."""
        assert _directives("HEALTHCHECK"), "Dockerfile has no HEALTHCHECK directive"

    def test_healthcheck_is_not_none(self):
        """HEALTHCHECK NONE disables probing — must not be used."""
        for directive in _directives("HEALTHCHECK"):
            assert "NONE" not in directive.upper(), \
                "HEALTHCHECK is set to NONE, which disables health probing"

    def test_healthcheck_probes_health_endpoint(self):
        """The probe must call the /health endpoint (not an arbitrary command)."""
        content = DOCKERFILE.read_text()
        assert "/health" in content, \
            "HEALTHCHECK should probe the /health endpoint"

    def test_healthcheck_has_start_period(self):
        """
        --start-period must be set so migrations can finish before probes begin.
        Without it, the container is killed before the app is ready.
        """
        content = DOCKERFILE.read_text()
        assert "--start-period" in content, \
            "HEALTHCHECK should include --start-period to allow for migration time"

    def test_healthcheck_has_timeout(self):
        """--timeout limits how long a single probe can block."""
        content = DOCKERFILE.read_text()
        assert "--timeout" in content, \
            "HEALTHCHECK should include --timeout"

    def test_healthcheck_appears_before_entrypoint(self):
        """HEALTHCHECK must be declared before ENTRYPOINT."""
        hc_idx = _line_index(r"^\s*HEALTHCHECK\b")
        ep_idx = _line_index(r"^\s*ENTRYPOINT\b")
        assert hc_idx != -1, "No HEALTHCHECK directive found"
        assert ep_idx != -1, "No ENTRYPOINT directive found"
        assert hc_idx < ep_idx, (
            f"HEALTHCHECK (line {hc_idx + 1}) should come before "
            f"ENTRYPOINT (line {ep_idx + 1})"
        )


# ---------------------------------------------------------------------------
# .dockerignore: secrets and build noise excluded
# ---------------------------------------------------------------------------

class TestDockerignore:

    def test_dockerignore_file_exists(self):
        assert DOCKERIGNORE.exists(), ".dockerignore is missing"

    def test_dockerignore_blocks_dotenv(self):
        content = DOCKERIGNORE.read_text()
        assert ".env" in content, \
            ".dockerignore must exclude .env files to prevent secrets leaking into image layers"

    def test_dockerignore_blocks_git_directory(self):
        content = DOCKERIGNORE.read_text()
        assert ".git" in content, \
            ".dockerignore should exclude .git/ (large, contains history, not needed at runtime)"

    def test_dockerignore_blocks_pycache(self):
        content = DOCKERIGNORE.read_text()
        assert "__pycache__" in content, \
            ".dockerignore should exclude __pycache__ (bytecode regenerated inside container)"

    def test_dockerignore_blocks_test_directory(self):
        content = DOCKERIGNORE.read_text()
        assert "tests/" in content or "tests" in content, \
            ".dockerignore should exclude the tests/ directory (not needed at runtime)"

    def test_dockerignore_blocks_venv(self):
        content = DOCKERIGNORE.read_text()
        assert ".venv" in content or "venv/" in content, \
            ".dockerignore should exclude local virtual environments"

    def test_dockerignore_is_not_empty(self):
        lines = [
            l for l in DOCKERIGNORE.read_text().splitlines()
            if l.strip() and not l.strip().startswith("#")
        ]
        assert len(lines) >= 5, \
            ".dockerignore appears too sparse — ensure all major exclusions are present"
