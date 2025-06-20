import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WebSocketClient from './components/WebSocketClient/WebSocketClient';
import VoiceClient from './components/VoiceClient/VoiceClient';
import './App.css';

const HomePage = () => (
  <div className="home-page">
    <h1>🎯 Convo Book - Real-time Communication Hub</h1>
    <p>Choose your client type:</p>

    <div className="client-options">
      <Link to="/websocket" className="client-card">
        <h3>💬 WebSocket Client</h3>
        <p>Text-based real-time communication</p>
      </Link>

      <Link to="/voice" className="client-card">
        <h3>🎤 Voice Client</h3>
        <p>Voice recording and real-time audio processing</p>
      </Link>
    </div>

    <div className="legacy-links">
      <h3>Legacy HTML Clients (Still Available)</h3>
      <p>
        <a href="/client_1.html" target="_blank" rel="noopener noreferrer">
          Original WebSocket Client
        </a>
        {' | '}
        <a href="/voice_client.html" target="_blank" rel="noopener noreferrer">
          Original Voice Client
        </a>
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Router basename="/app">
      <div className="App">
        <nav className="main-nav">
          <Link to="/" className="nav-brand">Convo Book</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/websocket" className="nav-link">WebSocket</Link>
            <Link to="/voice" className="nav-link">Voice</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/websocket" element={<WebSocketClient />} />
            <Route path="/voice" element={<VoiceClient />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
