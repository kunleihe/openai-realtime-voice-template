#!/bin/bash

echo "Stopping FastAPI server on port 8000..."

# Try to kill processes using port 8000
PROCESSES=$(lsof -ti:8000)

if [ -z "$PROCESSES" ]; then
    echo "No processes found using port 8000."
else
    echo "Found processes using port 8000: $PROCESSES"
    echo "Terminating processes..."
    lsof -ti:8000 | xargs kill -9
    echo "Processes terminated."
fi

# Verify port is free
sleep 1
REMAINING=$(lsof -ti:8000)
if [ -z "$REMAINING" ]; then
    echo "✅ Port 8000 is now free!"
else
    echo "⚠️  Some processes may still be using port 8000: $REMAINING"
fi 