#!/bin/bash

# Development script to start both backend and frontend servers

echo "🚀 Starting Convo Book Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    
    # Kill specific processes if PIDs are available
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        # Wait a bit and force kill if necessary
        sleep 2
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        # Wait a bit and force kill if necessary
        sleep 2
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    
    # Kill any remaining processes that might be using our ports
    echo "Cleaning up any remaining processes on ports 5173 and 8000..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    
    # Kill any remaining vite or uvicorn processes
    pkill -f "vite" 2>/dev/null
    pkill -f "uvicorn.*--port 8000" 2>/dev/null
    
    echo "🏁 Cleanup complete!"
    exit
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

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
echo "⚛️  Starting Frontend (React) on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Development environment is ready!"
echo "📱 Frontend (React): http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for any process to finish
wait 