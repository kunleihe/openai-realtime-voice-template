# Convo Book - Real-time Communication Hub

This project facilitates real-time communication between FastAPI WebSocket connections and OpenAI's WebSocket connections, including compatibility with Azure OpenAI. It now features both legacy HTML clients and a modern React frontend.

## 🏗️ Project Structure 

```
convo-book/
├── backend/                    # FastAPI server
│   ├── app/                   # Application code
│   └── requirements.txt       # Python dependencies
├── frontend/                   # React application
│   ├── src/                   # React components and hooks
│   └── package.json           # Node.js dependencies
├── client/                     # Legacy HTML clients (still functional)
│   ├── client_1.html         # Original WebSocket client
│   └── voice_client.html     # Original voice client
└── start_dev.sh              # Development script
```

## 🚀 Quick Start

### Option 1: Development Mode (Both Servers)
```bash
./start_dev.sh
```

This starts:
- **Backend**: `http://localhost:8000` 
- **Frontend Dev**: `http://localhost:3000`

### Option 2: Production Mode (Single Server)
```bash
cd backend && ./start_server.sh
```

This serves everything from `http://localhost:8000`:
- **React App**: `http://localhost:8000/app`
- **Legacy Clients**: `http://localhost:8000/client_1.html` | `http://localhost:8000/voice_client.html`

## 📱 Available Interfaces

### ✨ New React App (Recommended)
- **Home**: `http://localhost:8000/app` - Choose your client type
- **WebSocket Client**: `http://localhost:8000/app/websocket` - Modern React version
- **Voice Client**: `http://localhost:8000/app/voice` - Modern React version

### 📜 Legacy HTML Clients (Still Working)
- **WebSocket Client**: `http://localhost:8000/client_1.html` - Original HTML version
- **Voice Client**: `http://localhost:8000/voice_client.html` - Original HTML version

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
- An OpenAI API Key or Azure OpenAI API Key

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

1. **Health Check**: Visit `http://localhost:8000/health`
2. **Legacy WebSocket**: `http://localhost:8000/client_1.html`
3. **Legacy Voice**: `http://localhost:8000/voice_client.html`
4. **React App**: `http://localhost:8000/app`
5. **WebSocket Endpoint**: `ws://localhost:8000/realtime`

## 🔧 Configuration

Configuration settings are managed using environment variables loaded from a `.env` file. The main configuration file is `backend/app/config.py`.

## 📚 Key Features

- **Hybrid Architecture**: Legacy HTML + Modern React
- **Real-time WebSocket Communication**
- **Voice Recording and Processing**
- **OpenAI/Azure OpenAI Integration**
- **Cross-platform Development Tools**

## 🤝 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [OpenAI API](https://openai.com/api/)
- [Azure OpenAI](https://azure.microsoft.com/services/cognitive-services/openai-service/)
- [openai-realtime-fastapi] (https://github.com/Geo-Joy/openai-realtime-fastapi.git)
