# OpenAI Realtime API + React + FastAPI Template

A production-ready, full-stack voice communication application template built with **React** frontend and **FastAPI** backend, featuring direct WebSocket connections to OpenAI's Realtime API for voice and text processing. Perfect as a starting point for building real-time voice applications.

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗️ Project Structure](#️-project-structure)
- [📦 Setup and Installation](#-setup-and-installation)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🏗️ Architecture](#️-architecture)
- [🤝 Acknowledgments](#-acknowledgments)

## ✨ Key Features

- **Real-time Voice Communication** with OpenAI's Realtime API
- **Hold-to-Talk Interface** with visual feedback and connection status
- **Configurable Voice Sessions** - customize AI behavior, voice, and audio formats
- **WebSocket Relay Architecture** - secure proxy to OpenAI's API
- **Environment-Aware CORS** - automatic configuration for dev/staging/production
- **Production Ready** - includes build scripts and deployment configuration

## 🏗️ Project Structure 

```
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── routes/            # API endpoints
│   │   ├── main.py           # FastAPI application
│   │   └── config.py         # Configuration
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/VoiceClient/  # Voice interface
│   │   ├── config/sessionConfig.js  # Voice settings
│   │   ├── hooks/            # Custom React hooks
│   │   └── App.jsx          # Main application
│   └── package.json          # Node.js dependencies
└── start_dev.sh              # Development script
```

## 📦 Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API Key with Realtime API access

### Installation

1. **Clone and navigate to the repository:**
   ```bash
   git clone <repository-url>
   cd your-repo-name
   ```

2. **Set up Python environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   cd backend && pip install -r requirements.txt
   ```

3. **Set up React environment:**
   ```bash
   cd frontend && npm install
   ```

4. **Create environment configuration:**
   
   Create `.env` file in `/backend/app/`:
   ```env
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_REALTIME_URL="wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
   USE_AZURE_OPENAI=False
   ENVIRONMENT=development
   ```

## 🚀 Quick Start

### Development Mode (Recommended)
```bash
./start_dev.sh
```

This starts:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

### Production Mode
```bash
cd frontend && npm run build
cd ../backend && ./start_server.sh
```

### Testing the Application
1. Visit `http://localhost:5173`
2. Check connection status: "Connected - Ready to talk!"
3. Hold microphone button to record, release to send
4. AI responses will play automatically

## ⚙️ Configuration

### Voice Settings
Customize the AI assistant in `frontend/src/config/sessionConfig.js`:

```javascript
export const sessionConfig = {
    instructions: "You are a helpful voice assistant...",
    voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    modalities: ["text", "audio"],
    turn_detection: null // Manual control via UI
};
```

### Environment Configuration
The app automatically adjusts CORS settings based on your `ENVIRONMENT` variable in `.env`:
- **Development**: Allows `localhost:5173` and `localhost:8000`
- **Staging/Production**: Configure domains in `backend/app/config.py`

## 🏗️ Architecture

**Simple relay pattern:**
1. Frontend captures audio → WebSocket to backend
2. Backend relays messages ↔ OpenAI Realtime API  
3. OpenAI processes voice → returns audio response
4. Frontend receives and plays audio automatically

## 🤝 Acknowledgments

- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [FastAPI](https://fastapi.tiangolo.com/) 
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [openai-realtime-fastapi](https://github.com/Geo-Joy/openai-realtime-fastapi.git)