#!/bin/bash

# Development script to start both backend and frontend servers

echo "🚀 Starting Convo Book Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Start backend server
echo "🔧 Starting Backend (FastAPI) on port 8000..."
cd backend
if [ -d "../venv" ]; then
    source ../venv/bin/activate
fi
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend development server
echo "⚛️  Starting Frontend (React) on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Development environment is ready!"
echo "📱 Frontend (React): http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for any process to finish
wait 