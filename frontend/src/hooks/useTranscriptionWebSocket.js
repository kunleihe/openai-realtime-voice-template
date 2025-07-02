import { useState, useRef, useCallback } from 'react';

export const useTranscriptionWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptions, setTranscriptions] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    const websocketRef = useRef(null);

    const addTranscription = useCallback((transcription) => {
        setTranscriptions(prev => [...prev, transcription]);
    }, []);

    const addDebugMessage = useCallback((message) => {
        console.log(`[Transcription] ${message}`);
        // Don't add debug messages to transcriptions array - only log to console
    }, []);



    // Handle incoming transcription messages
    const handleTranscriptionMessage = useCallback((message) => {
        console.log('[Transcription] Received message:', message);

        switch (message.type) {
            case 'transcription_session.updated':
                addDebugMessage('Transcription session updated successfully');
                console.log('[Transcription] Session config:', message);
                break;

            case 'input_audio_buffer.committed':
                addDebugMessage(`Audio buffer committed: ${message.item_id}`);
                console.log('[Transcription] Buffer committed:', message);
                break;

            case 'input_audio_buffer.speech_started':
                addDebugMessage('Speech started');
                setIsTranscribing(true);
                break;

            case 'input_audio_buffer.speech_stopped':
                addDebugMessage('Speech stopped');
                setIsTranscribing(false);
                break;

            case 'conversation.item.input_audio_transcription.completed':
                if (message.transcript) {
                    addTranscription(`[TRANSCRIPTION] ${message.transcript}`);
                    addDebugMessage(`Transcription completed: "${message.transcript}"`);
                    console.log('[Transcription] Completed:', message);
                } else {
                    addDebugMessage('Transcription completed but no transcript provided');
                    console.log('[Transcription] Empty transcript:', message);
                }
                break;

            case 'conversation.item.input_audio_transcription.delta':
                if (message.delta) {
                    addDebugMessage(`Transcription delta: "${message.delta}"`);
                    console.log('[Transcription] Delta:', message);
                }
                break;

            case 'conversation.item.input_audio_transcription.failed':
                addDebugMessage(`Transcription failed: ${message.error?.message || 'Unknown error'}`);
                console.error('[Transcription] Failed:', message);
                break;

            case 'error':
                addDebugMessage(`Error: ${message.error?.message || 'Unknown error'}`);
                console.error('[Transcription] Error:', message);
                break;

            default:
                addDebugMessage(`Received message: ${message.type}`);
                console.log('[Transcription] Unknown message type:', message);
                break;
        }
    }, [addDebugMessage, addTranscription]);

    // Configure transcription session after connection
    const configureTranscriptionSession = useCallback((ws) => {
        try {
            const sessionConfig = {
                type: "transcription_session.update",
                session: {
                    input_audio_format: "pcm16",
                    input_audio_transcription: {
                        model: "gpt-4o-transcribe",
                        prompt: "",
                        language: "en"
                    },
                    turn_detection: null, // Disable VAD - manual commits
                    input_audio_noise_reduction: {
                        type: "near_field"
                    },
                    include: [
                        "item.input_audio_transcription.logprobs"
                    ]
                }
            };

            ws.send(JSON.stringify(sessionConfig));
            addDebugMessage('Sent transcription session configuration');
            console.log('[Transcription] Session config sent:', sessionConfig);
        } catch (error) {
            addDebugMessage(`Error configuring session: ${error.message}`);
            console.error('[Transcription] Session config error:', error);
        }
    }, [addDebugMessage]);

    // Connect to transcription WebSocket via backend proxy
    const connect = useCallback(async () => {
        try {
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                addDebugMessage('Already connected to transcription');
                return;
            }

            setConnectionStatus('connecting');
            console.log('[Transcription] Connecting via backend proxy...');

            // Connect to our backend transcription proxy
            const wsUrl = `ws://localhost:8000/transcription`;
            addDebugMessage(`Connecting to: ${wsUrl}`);

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                addDebugMessage('Connected to transcription WebSocket via backend proxy');
                console.log('[Transcription] WebSocket connected successfully via proxy');
                setIsConnected(true);
                setConnectionStatus('connected');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'connection.established') {
                        console.log('[Transcription] Connection established with API key');
                        // Configure the transcription session after connection is established
                        configureTranscriptionSession(ws);
                    } else {
                        handleTranscriptionMessage(message);
                    }
                } catch (error) {
                    addDebugMessage(`Error parsing message: ${error.message}`);
                    console.error('[Transcription] Message parse error:', error, 'Raw data:', event.data);
                }
            };

            ws.onclose = (event) => {
                addDebugMessage(`Transcription WebSocket closed: ${event.code} - ${event.reason}`);
                console.log('[Transcription] WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                setConnectionStatus('disconnected');
                websocketRef.current = null;
            };

            ws.onerror = (error) => {
                addDebugMessage(`Transcription WebSocket error: ${error.message || 'Unknown error'}`);
                console.error('[Transcription] WebSocket error:', error);
                setConnectionStatus('error');
            };

            websocketRef.current = ws;

        } catch (error) {
            addDebugMessage(`Connection error: ${error.message}`);
            console.error('[Transcription] Connection error:', error);
            setConnectionStatus('error');
        }
    }, [addDebugMessage, handleTranscriptionMessage, configureTranscriptionSession]);

    // Send audio data for transcription
    const sendAudioData = useCallback((audioData) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
                // Convert PCM16 data to base64
                const base64Audio = btoa(
                    String.fromCharCode.apply(null, new Uint8Array(audioData.buffer))
                );

                const audioMessage = {
                    type: "input_audio_buffer.append",
                    audio: base64Audio
                };

                websocketRef.current.send(JSON.stringify(audioMessage));
                console.log(`[Transcription] Sent audio chunk: ${audioData.length} samples (${base64Audio.length} base64 chars)`);
                return true;
            } catch (error) {
                addDebugMessage(`Error sending audio: ${error.message}`);
                console.error('[Transcription] Send audio error:', error);
                return false;
            }
        } else {
            addDebugMessage('Cannot send audio - not connected');
            console.warn('[Transcription] Not connected, cannot send audio');
            return false;
        }
    }, [addDebugMessage]);

    // Manually commit audio buffer for transcription (since VAD is disabled)
    const commitAudioBuffer = useCallback(() => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
                const commitMessage = {
                    type: "input_audio_buffer.commit"
                };

                websocketRef.current.send(JSON.stringify(commitMessage));
                addDebugMessage('Audio buffer committed for transcription');
                console.log('[Transcription] Audio buffer commit sent - waiting for response...');
                return true;
            } catch (error) {
                addDebugMessage(`Error committing audio buffer: ${error.message}`);
                console.error('[Transcription] Commit error:', error);
                return false;
            }
        } else {
            addDebugMessage('Cannot commit audio buffer - not connected');
            console.warn('[Transcription] Not connected, cannot commit audio buffer');
            return false;
        }
    }, [addDebugMessage]);

    // Disconnect from transcription WebSocket
    const disconnect = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        setIsConnected(false);
        setConnectionStatus('disconnected');
        addDebugMessage('Disconnected from transcription');
    }, [addDebugMessage]);

    // Clear transcriptions
    const clearTranscriptions = useCallback(() => {
        setTranscriptions([]);
    }, []);

    return {
        isConnected,
        isTranscribing,
        transcriptions,
        connectionStatus,
        connect,
        disconnect,
        sendAudioData,
        clearTranscriptions,
        commitAudioBuffer
    };
}; 