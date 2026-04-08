FROM python:3.11-slim

WORKDIR /app

# Install system dependencies.
# gcc and postgresql-client are needed to compile some Python packages
# and to run psql commands during migrations.
# curl is used by the HEALTHCHECK probe below.
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user. Ownership is transferred after code is copied.
RUN adduser --disabled-password --gecos "" appuser

# Install Python dependencies first (layer-cached unless requirements.txt changes).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY . .

# Copy and make the entrypoint executable, then hand all of /app to appuser.
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown -R appuser:appuser /app

# Drop root privileges before the process starts.
# Container escape now yields appuser rather than root on the host.
USER appuser

# Probe the /health endpoint so Railway / Docker knows when the app is
# actually ready to serve traffic (not just that the process is alive).
# --start-period gives migrations time to finish before probes begin.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl --fail --silent http://localhost:8000/health || exit 1

# ENTRYPOINT runs migrations then exec's CMD (or whatever docker-compose passes as 'command').
# CMD is the default if no command is supplied — production-safe (no --reload).
# docker-compose overrides CMD with: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
