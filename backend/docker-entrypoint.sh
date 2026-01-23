#!/bin/bash

# Wait for Postgres to be ready and retry migrations
echo "Waiting for Postgres to be ready..."
MAX_ATTEMPTS=5

for i in $(seq 1 $MAX_ATTEMPTS); do
    if alembic upgrade head 2>&1; then
        echo "Migrations completed successfully"
        break
    fi
    
    if [ $i -eq $MAX_ATTEMPTS ]; then
        echo "[WARNING] Failed to run migrations after $MAX_ATTEMPTS attempts"
        echo "[WARNING] Starting application anyway - database schema may not be initialized"
        break
    fi
    
    echo "Attempt $i/$MAX_ATTEMPTS: Migration failed, retrying in 3 seconds..."
    sleep 3
done

# Start the application
echo "Starting application..."
PORT=${PORT:-8000}
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
