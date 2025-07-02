import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useTranscriptionWebSocket } from '../../hooks/useTranscriptionWebSocket';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import './VoiceClient.css';

const VoiceClient = () => {
    const [status, setStatus] = useState({ type: 'info', message: 'Connecting to server...' });

    // Conversation WebSocket (original functionality)
    const { isConnected, messages, connect, sendAudioData } = useWebSocket();

    // Transcription WebSocket (additional functionality)
    const {
        isConnected: isTranscriptionConnected,
        transcriptions,
        connect: connectTranscription,
        sendAudioData: sendTranscriptionAudio,
        commitAudioBuffer,
    } = useTranscriptionWebSocket();

    const hasConnectedRef = useRef(false);
    const hasTranscriptionConnectedRef = useRef(false);

    // Organize messages for display
    const organizeMessages = () => {
        const organized = {
            connectionMessages: [],
            conversations: []
        };

        // Connection/session messages that should appear at the top
        const connectionTypes = [
            'Connected to server',
            'Session configured',
            'Session created successfully',
            'Session updated successfully'
        ];

        // Separate connection messages
        organized.connectionMessages = messages.filter(msg =>
            connectionTypes.some(type => msg.includes(type))
        );

        // Process conversation messages
        const conversationMessages = messages.filter(msg =>
            !connectionTypes.some(type => msg.includes(type)) &&
            msg !== '---' &&
            !msg.includes('Disconnected') &&
            !msg.includes('Connection error')
        );

        let currentConversation = null;
        let pendingUserTranscription = null;

        // Find matching transcriptions for conversations
        const transcriptionResults = transcriptions.filter(t =>
            t.startsWith('[TRANSCRIPTION]')
        ).map(t => t.replace('[TRANSCRIPTION] ', ''));

        let transcriptionIndex = 0;

        for (const msg of conversationMessages) {
            if (msg.includes('Audio sent (') && msg.includes('s)')) {
                // Start new conversation
                const timeMatch = msg.match(/\(([0-9.]+)s\)/);
                const duration = timeMatch ? timeMatch[1] : '0.0';

                currentConversation = {
                    userInput: `User input sent.`,
                    userTranscription: null,
                    aiResponse: null,
                    aiTranscription: null
                };

                // Get corresponding transcription if available
                if (transcriptionIndex < transcriptionResults.length) {
                    currentConversation.userTranscription = `User input transcription: ${transcriptionResults[transcriptionIndex]}`;
                    transcriptionIndex++;
                }

                organized.conversations.push(currentConversation);
            }
            else if (msg.includes('AI responding...') && currentConversation) {
                // Extract latency from the message
                const latencyMatch = msg.match(/\(([0-9.]+)s\)/);
                const latency = latencyMatch ? latencyMatch[1] : '0.0';
                currentConversation.aiResponse = `AI is responding. (latency: ${latency}s)`;
            }
            else if (msg.startsWith('AI: "') && currentConversation) {
                // Extract AI transcript
                const transcript = msg.replace('AI: "', '').replace('"', '');
                currentConversation.aiTranscription = `AI response transcription: ${transcript}`;
            }
        }

        return organized;
    };

    const organizedMessages = organizeMessages();

    // Handle complete audio recording (for conversation)
    const handleAudioRecorded = (pcm16Data) => {
        if (pcm16Data && sendAudioData) {
            const success = sendAudioData(pcm16Data);
            if (success) {
                setStatus({ type: 'info', message: 'Audio sent, waiting for response...' });

                // Commit audio buffer for transcription (manual commit since VAD is disabled)
                if (isTranscriptionConnected && commitAudioBuffer) {
                    console.log(`[VoiceClient] Scheduling transcription audio buffer commit (transcription connected: ${isTranscriptionConnected})`);
                    // Add small delay to ensure all audio chunks have been sent
                    setTimeout(() => {
                        console.log('[VoiceClient] Committing transcription audio buffer now...');
                        commitAudioBuffer();
                    }, 100);
                } else {
                    console.warn(`[VoiceClient] Cannot commit transcription buffer - connected: ${isTranscriptionConnected}, commitAudioBuffer: ${!!commitAudioBuffer}`);
                }
            } else {
                console.error('VoiceClient: Failed to send audio');
                setStatus({ type: 'error', message: 'Failed to send audio' });
            }
        } else {
            console.error('VoiceClient: Cannot send audio - missing data or sendAudioData function');
            setStatus({ type: 'error', message: 'Failed to process audio' });
        }
    };

    // Handle real-time audio chunks (for transcription)
    const handleAudioChunk = (pcm16Data) => {
        if (isTranscriptionConnected) {
            console.log(`[VoiceClient] Sending audio chunk to transcription: ${pcm16Data.length} samples`);
            sendTranscriptionAudio(pcm16Data);
        } else {
            console.warn(`[VoiceClient] Transcription not connected, skipping chunk: ${pcm16Data.length} samples`);
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
    } = useAudioRecorder(
        handleAudioRecorded,
        handleAudioChunk // Always enable real-time chunks for transcription
    );

    // Auto-connect to conversation service
    useEffect(() => {
        if (!hasConnectedRef.current) {
            hasConnectedRef.current = true;
            connect();
        }
    }, [connect]);

    // Auto-connect to transcription service
    useEffect(() => {
        if (!hasTranscriptionConnectedRef.current) {
            hasTranscriptionConnectedRef.current = true;
            console.log('[VoiceClient] Auto-connecting to transcription service...');
            connectTranscription();
        }
    }, [connectTranscription]);

    // Track transcription connection status changes
    useEffect(() => {
        console.log(`[VoiceClient] Transcription connection status changed: ${isTranscriptionConnected}`);
    }, [isTranscriptionConnected]);

    // Update status based on connection state
    useEffect(() => {
        if (isConnected) {
            setStatus({ type: 'success', message: 'Connected - Ready to talk!' });
        } else {
            setStatus({ type: 'error', message: 'Disconnected from server' });
        }
    }, [isConnected]);

    const handleRecordStart = async () => {
        if (!isRecording) {
            if (!isConnected) {
                setStatus({ type: 'error', message: 'Not connected to server' });
                return;
            }

            const success = await startRecording();
            if (!success) {
                console.error('VoiceClient: Failed to start recording');
                setStatus({ type: 'error', message: 'Failed to start recording. Please check microphone permissions.' });
            } else {
                setStatus({ type: 'info', message: 'Recording... Release to send' });
            }
        }
    };

    const handleRecordStop = () => {
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
                <h1>Realtime Playground</h1>

                <div className={getStatusClass()}>
                    {status.message}
                </div>

                <div className="audio-controls">
                    <button
                        className={`record-button ${isRecording ? 'recording' : ''}`}
                        onMouseDown={handleRecordStart}
                        onMouseUp={handleRecordStop}
                        onMouseLeave={handleRecordStop}
                        onTouchStart={handleRecordStart}
                        onTouchEnd={handleRecordStop}
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
                    <h3>User Recording Playpack:</h3>
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
                    {/* Connection/Session Messages */}
                    {organizedMessages.connectionMessages.map((message, index) => (
                        <div key={`connection-${index}`}>
                            {message}
                        </div>
                    ))}

                    {organizedMessages.connectionMessages.length > 0 && organizedMessages.conversations.length > 0 && (
                        <div>---</div>
                    )}

                    {/* Conversation Rounds */}
                    {organizedMessages.conversations.map((conversation, index) => (
                        <div key={`conversation-${index}`}>
                            {conversation.userInput && <div>{conversation.userInput}</div>}
                            {conversation.userTranscription && <div>{conversation.userTranscription}</div>}
                            {conversation.aiResponse && <div>{conversation.aiResponse}</div>}
                            {conversation.aiTranscription && <div>{conversation.aiTranscription}</div>}
                            {index < organizedMessages.conversations.length - 1 && <div>---</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VoiceClient; 