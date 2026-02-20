FROM python:3.11-slim

WORKDIR /app

# Install system dependencies.
# gcc and postgresql-client are needed to compile some Python packages
# and to run psql commands (e.g. pg_isready in healthchecks).
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-cached unless requirements.txt changes).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY . .

# Copy and make the entrypoint executable.
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# ENTRYPOINT runs migrations then exec's CMD (or whatever docker-compose passes as 'command').
# CMD is the default if no command is supplied — production-safe (no --reload).
# docker-compose overrides CMD with: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
