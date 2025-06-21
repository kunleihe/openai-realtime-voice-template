# Convo Book - Real-time Communication Hub

A modern real-time communication application built with **React** frontend and **FastAPI** backend, featuring WebSocket connections and OpenAI integration for voice and text processing.

## 🏗️ Project Structure 

```
convo-book/
├── backend/                    # FastAPI server
│   ├── app/                   # Application code
│   │   ├── routes/           # API endpoints
│   │   ├── main.py          # FastAPI application
│   │   └── config.py        # Configuration
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React application
│   ├── src/                   # React components and hooks
│   │   ├── components/      # UI components
│   │   ├── hooks/          # Custom React hooks
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
- **Frontend (React)**: `http://localhost:3000` 
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

## 📱 Available Features

### ✨ React Application
- **Home**: `http://localhost:3000` - Main dashboard
- **WebSocket Client**: `http://localhost:3000/websocket` - Real-time text communication
- **Voice Client**: `http://localhost:3000/voice` - Voice recording and processing

### 🔧 API Endpoints
- **Health Check**: `http://localhost:8000/health`
- **WebSocket**: `ws://localhost:8000/realtime`
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
- An OpenAI API Key

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
   ```

## 🧪 Testing the Application

1. **Start Development**: `./start_dev.sh`
2. **Frontend**: Visit `http://localhost:3000`
3. **API Health**: `http://localhost:8000/health`
4. **WebSocket**: Connect via the React WebSocket client
5. **Voice**: Test voice recording via the React Voice client

## 🔧 Configuration

Configuration settings are managed using environment variables loaded from a `.env` file. The main configuration file is `backend/app/config.py`.

## 📚 Key Features

- **Modern React Frontend** with hooks and components
- **FastAPI Backend** with automatic documentation
- **Real-time WebSocket Communication**
- **Voice Recording and Processing**
- **OpenAI/Azure OpenAI Integration**
- **Development and Production Modes**

## 🤝 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [OpenAI API](https://openai.com/api/)
- [Azure OpenAI](https://azure.microsoft.com/services/cognitive-services/openai-service/)
