#!/bin/bash

# Production server launcher for FastAPI backend
echo "🚀 Starting FastAPI Production Server..."

# Navigate to the backend directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    echo "📦 Activating virtual environment..."
    source ../venv/bin/activate
else
    echo "⚠️  No virtual environment found at ../venv"
fi

# Start the FastAPI server for production
echo "🔧 Starting FastAPI server on port 8000..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app 