import { useState, useRef, useCallback } from 'react';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const websocketRef = useRef(null);
    const responseAudioBufferRef = useRef([]);
    const isPlayingResponseRef = useRef(false);

    // Web Audio API refs for streaming
    const audioContextRef = useRef(null);
    const nextPlayTimeRef = useRef(0);
    const isStreamingAudioRef = useRef(false);

    // Accumulate transcript for complete response
    const currentTranscriptRef = useRef('');

    // Track timing for debugging
    const userInputTimeRef = useRef(null);
    const firstAudioChunkRef = useRef(false);

    const addMessage = useCallback((message, addDivider = false) => {
        setMessages(prev => {
            const newMessages = [...prev];
            if (addDivider) {
                newMessages.push('---');
            }
            newMessages.push(message);
            return newMessages;
        });
    }, []);

    // Initialize Web Audio API context
    const initializeAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000
            });
            nextPlayTimeRef.current = 0;
        }
        return audioContextRef.current;
    }, []);

    // Resume audio context if suspended (required by browser policies)
    const resumeAudioContext = useCallback(async () => {
        const audioContext = audioContextRef.current;
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
    }, []);

    // Audio utility functions
    const createWavFile = useCallback((pcm16Data, sampleRate) => {
        const length = pcm16Data.length;
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // PCM data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            view.setInt16(offset, pcm16Data[i], true);
            offset += 2;
        }

        return buffer;
    }, []);

    // Stream audio chunk immediately using Web Audio API
    const streamAudioChunk = useCallback(async (pcm16Data) => {
        try {
            const audioContext = initializeAudioContext();
            await resumeAudioContext();

            if (pcm16Data.length === 0) {
                return;
            }

            // Create WAV buffer for the chunk
            const wavBuffer = createWavFile(pcm16Data, 24000);

            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(wavBuffer);

            // Create buffer source
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            // Schedule playback for seamless continuation
            const currentTime = audioContext.currentTime;
            let startTime = Math.max(currentTime, nextPlayTimeRef.current);

            // If this is the first chunk, start immediately
            if (nextPlayTimeRef.current === 0) {
                startTime = currentTime;
                nextPlayTimeRef.current = currentTime;
            }

            source.start(startTime);
            nextPlayTimeRef.current = startTime + audioBuffer.duration;

        } catch (error) {
            addMessage(`Audio streaming error: ${error.message}`);
            console.error('Streaming error:', error);
        }
    }, [initializeAudioContext, resumeAudioContext, createWavFile, addMessage]);

    // Reset streaming state
    const resetStreamingState = useCallback(() => {
        nextPlayTimeRef.current = 0;
        isStreamingAudioRef.current = false;
    }, []);

    const handleAudioDelta = useCallback(async (audioBase64) => {
        try {
            if (!responseAudioBufferRef.current) {
                responseAudioBufferRef.current = [];
            }

            // Decode base64 audio data (PCM16)
            const audioData = atob(audioBase64);
            const audioBytes = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                audioBytes[i] = audioData.charCodeAt(i);
            }

            // Convert PCM16 bytes to Int16Array
            const pcm16Data = new Int16Array(audioBytes.buffer);

            // Add to response buffer (keep for fallback/debugging)
            responseAudioBufferRef.current.push(pcm16Data);

            // Stream the audio chunk immediately
            await streamAudioChunk(pcm16Data);

        } catch (error) {
            addMessage(`Audio processing error: ${error.message}`);
        }
    }, [streamAudioChunk]);

    // Keep the original playCompleteResponse as fallback
    const playCompleteResponse = useCallback(() => {
        if (!responseAudioBufferRef.current || responseAudioBufferRef.current.length === 0) {
            addMessage('No audio response to play');
            return;
        }

        if (isPlayingResponseRef.current) {
            return; // Already playing
        }

        try {
            isPlayingResponseRef.current = true;
            addMessage('Playing AI response...');

            // Combine all response audio chunks
            let totalLength = 0;
            for (const chunk of responseAudioBufferRef.current) {
                totalLength += chunk.length;
            }

            const combinedPCM16 = new Int16Array(totalLength);
            let offset = 0;
            for (const chunk of responseAudioBufferRef.current) {
                combinedPCM16.set(chunk, offset);
                offset += chunk.length;
            }

            // Create WAV file for playback
            const wavBuffer = createWavFile(combinedPCM16, 24000);
            const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
            const wavUrl = URL.createObjectURL(wavBlob);

            // Play using HTML5 audio
            const audio = new Audio(wavUrl);
            audio.play();

            audio.onended = () => {
                addMessage('AI response completed');
                URL.revokeObjectURL(wavUrl);
                isPlayingResponseRef.current = false;

                // Complete cleanup for next conversation
                responseAudioBufferRef.current = [];
            };

            audio.onerror = (error) => {
                addMessage(`Audio playback error: ${error.message || 'Unknown error'}`);
                URL.revokeObjectURL(wavUrl);
                isPlayingResponseRef.current = false;

                // Complete cleanup for next conversation
                responseAudioBufferRef.current = [];
            };

        } catch (error) {
            addMessage(`Error playing response: ${error.message}`);
            isPlayingResponseRef.current = false;

            // Complete cleanup for next conversation
            responseAudioBufferRef.current = [];
        }
    }, [addMessage, createWavFile]);

    const handleWebSocketMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'session.created':
                    addMessage('Session created successfully');
                    break;

                case 'session.updated':
                    addMessage('Session updated successfully');
                    break;

                case 'response.created':
                    addMessage(`AI is responding...`, true);
                    // Reset audio buffer and streaming state for new response
                    responseAudioBufferRef.current = [];
                    resetStreamingState();
                    isStreamingAudioRef.current = true;
                    currentTranscriptRef.current = '';
                    firstAudioChunkRef.current = false;
                    break;

                case 'response.audio.delta':
                    // Calculate latency on first audio chunk (when audio actually starts playing)
                    if (!firstAudioChunkRef.current && userInputTimeRef.current) {
                        const latency = ((Date.now() - userInputTimeRef.current) / 1000).toFixed(1);
                        // Update the last message to include latency
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastIndex = newMessages.length - 1;
                            if (lastIndex >= 0 && newMessages[lastIndex].includes('AI is responding...')) {
                                newMessages[lastIndex] = `AI is responding. (latency: ${latency}s)`;
                            }
                            return newMessages;
                        });
                        firstAudioChunkRef.current = true;
                    }
                    handleAudioDelta(data.delta);
                    break;

                case 'response.audio.done':
                    isStreamingAudioRef.current = false;
                    break;

                case 'response.done':
                    isStreamingAudioRef.current = false;
                    // Audio has already been streamed, so just clean up
                    setTimeout(() => {
                        responseAudioBufferRef.current = [];
                        resetStreamingState();
                    }, 1000);
                    break;

                case 'response.audio_transcript.delta':
                    if (data.delta) {
                        currentTranscriptRef.current += data.delta;
                    }
                    break;

                case 'response.audio_transcript.done':
                    if (currentTranscriptRef.current) {
                        addMessage(`AI: "${currentTranscriptRef.current}"`);
                    }
                    break;

                case 'error':
                    addMessage(`API Error: ${data.error.message}`);
                    break;

                case 'rate_limits.updated':
                    if (data.rate_limits && data.rate_limits.remaining_requests < 10) {
                        addMessage(`⚠️ Low rate limit: ${data.rate_limits.remaining_requests} requests remaining`);
                    }
                    break;

                default:
                    // Silently handle other message types
                    break;
            }

        } catch (e) {
            addMessage(`Error parsing message: ${e.message}`);
        }
    }, [addMessage, handleAudioDelta, resetStreamingState]);

    const connect = useCallback(async () => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        // Don't create a new connection if one is already connecting
        if (websocketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        try {
            // Fetch session configuration from backend
            const response = await fetch('http://localhost:8000/session/config');
            if (!response.ok) {
                throw new Error(`Failed to fetch session config: ${response.status}`);
            }
            const sessionConfig = await response.json();

            websocketRef.current = new WebSocket('ws://localhost:8000/realtime');

            websocketRef.current.onopen = () => {
                setIsConnected(true);
                addMessage('Connected to server');

                // Send session configuration after a brief delay to ensure connection is fully ready
                setTimeout(() => {
                    if (websocketRef.current?.readyState === WebSocket.OPEN) {
                        const sessionUpdateMessage = {
                            type: "session.update",
                            session: {
                                modalities: sessionConfig.modalities,
                                instructions: sessionConfig.instructions,
                                voice: sessionConfig.voice,
                                input_audio_format: sessionConfig.input_audio_format,
                                output_audio_format: sessionConfig.output_audio_format,
                                input_audio_transcription: sessionConfig.input_audio_transcription,
                                turn_detection: sessionConfig.turn_detection
                            }
                        };

                        websocketRef.current.send(JSON.stringify(sessionUpdateMessage));
                        addMessage('Session configured');
                    }
                }, 100);
            };

            websocketRef.current.onmessage = handleWebSocketMessage;

            websocketRef.current.onclose = (event) => {
                setIsConnected(false);
                addMessage(`Disconnected (${event.wasClean ? 'normal' : 'unexpected'})`);
            };

            websocketRef.current.onerror = (error) => {
                addMessage(`Connection error: ${error.message || 'Failed to connect'}`);
            };

        } catch (error) {
            addMessage(`Failed to connect: ${error.message}`);
        }
    }, [addMessage, handleWebSocketMessage]);

    const sendMessage = useCallback((message) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN && message.trim()) {
            websocketRef.current.send(message);
            addMessage(`Sent: ${message}`);
            return true;
        }
        return false;
    }, [addMessage]);

    // Helper function to convert Uint8Array to base64 without stack overflow
    const uint8ArrayToBase64 = useCallback((uint8Array) => {
        let binaryString = '';
        const chunkSize = 8192; // Process in chunks to avoid stack overflow

        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binaryString += String.fromCharCode.apply(null, chunk);
        }

        return btoa(binaryString);
    }, []);

    const sendAudioData = useCallback((pcm16Data) => {
        if (!websocketRef.current) {
            addMessage('WebSocket not initialized');
            return false;
        }

        if (websocketRef.current.readyState !== WebSocket.OPEN) {
            addMessage('WebSocket not ready');
            return false;
        }

        if (!pcm16Data || pcm16Data.length === 0) {
            addMessage('No audio data to send');
            return false;
        }

        try {
            // Convert PCM16 to base64 safely
            const uint8Array = new Uint8Array(pcm16Data.buffer);
            const base64Audio = uint8ArrayToBase64(uint8Array);

            // Create conversation item with audio content
            const conversationItemMessage = {
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: "user",
                    content: [
                        {
                            type: "input_audio",
                            audio: base64Audio
                        }
                    ]
                }
            };

            websocketRef.current.send(JSON.stringify(conversationItemMessage));
            userInputTimeRef.current = Date.now();
            addMessage(`Audio sent (${(pcm16Data.length / 24000).toFixed(1)}s)`, true);

            // Create response to get AI reply
            const responseMessage = {
                type: "response.create",
                response: {
                    modalities: ["text", "audio"],
                    instructions: "Please respond with audio."
                }
            };
            websocketRef.current.send(JSON.stringify(responseMessage));

            return true;
        } catch (error) {
            addMessage(`Error sending audio: ${error.message}`);
            console.error('Full error:', error);
            return false;
        }
    }, [addMessage, uint8ArrayToBase64]);

    const disconnect = useCallback(() => {
        if (websocketRef.current) {
            websocketRef.current.close();
        }

        // Clean up Web Audio API context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }, []);

    return {
        isConnected,
        messages,
        connect,
        sendMessage,
        sendAudioData,
        disconnect,
        // Expose streaming status for debugging
        isStreamingAudio: isStreamingAudioRef.current,
    };
}; 