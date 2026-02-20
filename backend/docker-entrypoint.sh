#!/bin/bash
set -e

# Wait for Postgres to be ready and run Alembic migrations with retries.
echo "Running database migrations..."
MAX_ATTEMPTS=10

for i in $(seq 1 $MAX_ATTEMPTS); do
    if alembic upgrade head 2>&1; then
        echo "Migrations completed successfully."
        break
    fi

    if [ "$i" -eq "$MAX_ATTEMPTS" ]; then
        echo "[WARNING] Failed to run migrations after $MAX_ATTEMPTS attempts."
        echo "[WARNING] Starting anyway — database schema may be incomplete."
        break
    fi

    echo "Attempt $i/$MAX_ATTEMPTS: migration failed, retrying in 3 seconds..."
    sleep 3
done

# Start the application.
# exec "$@" passes whatever command was given to this entrypoint — either the
# Dockerfile CMD default or the docker-compose 'command:' override (e.g. --reload).
echo "Starting application: $*"
exec "$@"
