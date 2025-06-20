#!/bin/bash

# Navigate to the backend directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Start the FastAPI server
uvicorn app.main:app --reload --reload-dir app --reload-dir ../client --host 0.0.0.0 --port 8000 