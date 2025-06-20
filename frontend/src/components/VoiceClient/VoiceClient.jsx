import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import './VoiceClient.css';

const VoiceClient = () => {
    const [status, setStatus] = useState({ type: 'info', message: 'Connecting to server...' });
    const { isConnected, messages, connect, sendAudioData } = useWebSocket();
    const hasConnectedRef = useRef(false);

    // Handle audio recording with callback to send to API
    const handleAudioRecorded = (pcm16Data) => {
        console.log('VoiceClient: handleAudioRecorded called with', pcm16Data ? pcm16Data.length : 'null', 'samples');
        if (pcm16Data && sendAudioData) {
            console.log('VoiceClient: Sending audio data to WebSocket');
            const success = sendAudioData(pcm16Data);
            if (success) {
                setStatus({ type: 'info', message: 'Audio sent, waiting for response...' });
            } else {
                setStatus({ type: 'error', message: 'Failed to send audio' });
            }
        } else {
            console.error('VoiceClient: Cannot send audio - missing data or sendAudioData function');
            setStatus({ type: 'error', message: 'Failed to process audio' });
        }
    };

    const {
        isRecording,
        recordingTime,
        lastRecordingUrl,
        audioFormat,
        startRecording,
        stopRecording,
        playLastRecording,
    } = useAudioRecorder(handleAudioRecorded);

    useEffect(() => {
        // Auto-connect when component mounts, but only once
        if (!hasConnectedRef.current) {
            hasConnectedRef.current = true;
            connect();
        }
    }, [connect]);

    useEffect(() => {
        // Update status based on connection state
        if (isConnected) {
            setStatus({ type: 'success', message: 'Connected - Ready to talk!' });
        } else {
            setStatus({ type: 'error', message: 'Disconnected from server' });
        }
    }, [isConnected]);

    const handleRecordStart = async () => {
        console.log('VoiceClient: Starting recording...');
        if (!isRecording) {
            const success = await startRecording();
            if (!success) {
                console.error('VoiceClient: Failed to start recording');
                setStatus({ type: 'error', message: 'Failed to start recording. Please check microphone permissions.' });
            } else {
                console.log('VoiceClient: Recording started successfully');
                setStatus({ type: 'info', message: 'Recording... Release to send' });
            }
        }
    };

    const handleRecordStop = () => {
        console.log('VoiceClient: Stopping recording...');
        if (isRecording) {
            stopRecording();
            setStatus({ type: 'info', message: 'Processing audio...' });
        }
    };

    const getStatusClass = () => {
        switch (status.type) {
            case 'success': return 'status success';
            case 'error': return 'status error';
            default: return 'status info';
        }
    };

    return (
        <div className="voice-client">
            <div className="container">
                <h1>🎤 Voice Client - Realtime API</h1>

                <div className={getStatusClass()}>
                    {status.message}
                </div>

                <div className="audio-controls">
                    <button
                        className={`record-button ${isRecording ? 'recording' : ''}`}
                        onMouseDown={handleRecordStart}
                        onMouseUp={handleRecordStop}
                        onMouseLeave={handleRecordStop}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            handleRecordStart();
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            handleRecordStop();
                        }}
                        disabled={!isConnected}
                    >
                        🎤 {isRecording ? 'Recording...' : 'Hold to Talk'}
                    </button>
                </div>

                <div className={`recording-info ${isRecording ? 'active' : ''}`}>
                    <p><strong>Recording:</strong> <span>{recordingTime}</span></p>
                    <p><strong>Audio Format:</strong> <span>{audioFormat}</span></p>
                </div>

                <div className="audio-controls">
                    <h3>Local Recording (for testing):</h3>
                    {lastRecordingUrl ? (
                        <>
                            <audio className="audio-player" controls src={lastRecordingUrl} />
                            <button onClick={playLastRecording} className="playback-button">
                                ▶️ Play Local Recording
                            </button>
                            <p><em>Note: OpenAI responses will play automatically when received</em></p>
                        </>
                    ) : (
                        <p>No recording available</p>
                    )}
                </div>

                <h3>Debug Messages:</h3>
                <div className="messages">
                    {messages.map((message, index) => (
                        <div key={index}>{message}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VoiceClient; 