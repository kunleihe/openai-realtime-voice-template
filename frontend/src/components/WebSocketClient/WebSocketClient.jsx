import React, { useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import './WebSocketClient.css';

const WebSocketClient = () => {
    const [messageInput, setMessageInput] = useState('');
    const { isConnected, messages, connect, sendMessage, disconnect } = useWebSocket();

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            const success = sendMessage(messageInput);
            if (success) {
                setMessageInput('');
            } else {
                alert('Please connect to WebSocket first or enter a valid message.');
            }
        } else {
            alert('Please enter a message to send.');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="websocket-client">
            <h1>WebSocket Client</h1>

            <div className="connection-section">
                <button
                    onClick={isConnected ? disconnect : connect}
                    className={`connect-button ${isConnected ? 'connected' : ''}`}
                >
                    {isConnected ? 'Disconnect from WebSocket' : 'Connect to WebSocket'}
                </button>
            </div>

            <div className="message-section">
                <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your message here..."
                    rows="4"
                    cols="50"
                    className="message-input"
                />
                <br />
                <button
                    onClick={handleSendMessage}
                    disabled={!isConnected}
                    className="send-button"
                >
                    Send Message
                </button>
            </div>

            <div className="messages-section">
                <h2>Messages:</h2>
                <pre className="messages-display">
                    {messages.map((message, index) => (
                        <div key={index}>{message}</div>
                    ))}
                </pre>
            </div>
        </div>
    );
};

export default WebSocketClient; 