# OpenAI Realtime API + React + FastAPI Starter

A full-stack voice communication application template built with **React** frontend and **FastAPI** backend, featuring direct WebSocket connections to OpenAI's Realtime API for voice and text processing. Perfect as a starting point for building real-time voice applications.

## 🏗️ Project Structure 

```
convo-book/
├── backend/                    # FastAPI server
│   ├── app/                   # Application code
│   │   ├── routes/           # API endpoints
│   │   │   ├── health_check.py  # Health check endpoint
│   │   │   └── realtime.py      # WebSocket relay to OpenAI
│   │   ├── main.py          # FastAPI application
│   │   └── config.py        # Configuration
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React application
│   ├── src/                   # React components and hooks
│   │   ├── components/       # UI components
│   │   │   └── VoiceClient/  # Voice recording and communication
│   │   ├── config/           # Configuration files
│   │   │   └── sessionConfig.js  # Voice session settings
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAudioRecorder.js  # Audio recording functionality
│   │   │   └── useWebSocket.js      # WebSocket communication
│   │   └── App.jsx         # Main application
│   └── package.json           # Node.js dependencies
└── start_dev.sh              # Development script
```

## 🚀 Quick Start

### Development Mode (Recommended)
```bash
./start_dev.sh
```

This starts:
- **Frontend (React)**: `http://localhost:5173` 
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

### Production Mode
```bash
cd frontend && npm run build
cd ../backend && ./start_server.sh
```

This serves everything from `http://localhost:8000`:
- **React App**: `http://localhost:8000/app`
- **API**: `http://localhost:8000`

## 📱 Application Features

### ✨ Voice Communication Interface
- **Main App**: `http://localhost:5173` - Real-time voice communication with OpenAI
- **Hold-to-Talk Interface**: Press and hold to record, release to send
- **Audio Playback**: Automatic playback of AI responses and manual playback of recordings
- **Connection Status**: Real-time connection monitoring and status updates
- **Debug Messages**: Live WebSocket message monitoring for troubleshooting

### 🔧 API Endpoints
- **Health Check**: `http://localhost:8000/health`
- **WebSocket Relay**: `ws://localhost:8000/realtime` - Proxies to OpenAI Realtime API
- **API Docs**: `http://localhost:8000/docs`

## 🛠️ Development

### Backend Development
```bash
cd backend
source ../venv/bin/activate  # If using virtual environment
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Building for Production
```bash
cd frontend
npm run build
```

## 📦 Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- An OpenAI API Key with Realtime API access

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd convo-book
   ```

2. Set up Python environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   cd backend && pip install -r requirements.txt
   ```

3. Set up React environment:
   ```bash
   cd frontend && npm install
   ```

4. Create a `.env` file in the `/backend/app/`:
   ```env
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_REALTIME_URL="wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
   USE_AZURE_OPENAI=False
   ENVIRONMENT=development  # Can be: development, staging, or production
   ```

## 🧪 Testing the Application

1. **Start Development**: `./start_dev.sh`
2. **Open Application**: Visit `http://localhost:5173`
3. **Test Connection**: Check the status indicator for "Connected - Ready to talk!"
4. **Test Voice**: Hold the microphone button and speak, then release to send
5. **Check API Health**: `http://localhost:8000/health`

## ⚙️ Voice Configuration

The application includes a configurable voice session system located in `frontend/src/config/sessionConfig.js`:

```javascript
export const sessionConfig = {
    instructions: "You are a helpful voice assistant...",
    voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    modalities: ["text", "audio"],
    input_audio_transcription: {
        model: "whisper-1"
    },
    turn_detection: null // Manual control via UI
};
```

## 🔧 Configuration

Configuration settings are managed using environment variables loaded from a `.env` file. The main configuration file is `backend/app/config.py`.

### Environment-Aware CORS Configuration

The application features environment-aware CORS (Cross-Origin Resource Sharing) configuration that automatically adjusts allowed origins based on your deployment environment:

- **Development** (`ENVIRONMENT=development`): Allows local development servers
  - `http://localhost:5173` (Vite dev server)
  - `http://localhost:8000` (FastAPI server)

- **Staging** (`ENVIRONMENT=staging`): Configured for staging deployments
  - `https://staging.yourdomain.com`
  - `http://localhost:5173` (for local testing against staging)

- **Production** (`ENVIRONMENT=production`): Restricted to production domains
  - `https://yourdomain.com`
  - `https://www.yourdomain.com`

To configure CORS for your environment, set the `ENVIRONMENT` variable in your `.env` file and update the production/staging origins in `backend/app/config.py` to match your actual domains.

## 📚 Key Features

- **Real-time Voice Communication** with OpenAI's Realtime API
- **Modern React Frontend** with custom hooks for audio and WebSocket handling
- **FastAPI Backend** with WebSocket relay to OpenAI
- **Configurable Voice Sessions** with multiple voice options
- **Hold-to-Talk Interface** with visual feedback
- **Automatic Audio Playback** of AI responses
- **Environment-Aware CORS Configuration**
- **Development and Production Modes**
- **Connection Status Monitoring**

## 🏗️ Architecture

The application uses a relay architecture where:

1. **Frontend** captures audio and sends it via WebSocket to the backend
2. **Backend** relays all communication to OpenAI's Realtime API
3. **OpenAI API** processes voice input and returns audio responses
4. **Backend** relays responses back to the frontend
5. **Frontend** automatically plays audio responses and shows status updates

## 🤝 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [WebSockets](https://websockets.readthedocs.io/)
- [openai-realtime-fastapi](https://github.com/Geo-Joy/openai-realtime-fastapi.git)