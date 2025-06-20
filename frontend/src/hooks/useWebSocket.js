import { useState, useRef, useCallback } from 'react';

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const websocketRef = useRef(null);
    const responseAudioBufferRef = useRef([]);
    const isPlayingResponseRef = useRef(false);

    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
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

    const handleAudioDelta = useCallback((audioBase64) => {
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

            // Add to response buffer (accumulate all chunks)
            responseAudioBufferRef.current.push(pcm16Data);

            addMessage(`Received audio delta: ${pcm16Data.length} samples`);
        } catch (error) {
            addMessage(`Error handling audio delta: ${error.message}`);
        }
    }, [addMessage]);

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

            addMessage(`Playing complete AI response: ${combinedPCM16.length} samples (${(combinedPCM16.length / 24000).toFixed(2)}s)`);

            // Create WAV file for playback
            const wavBuffer = createWavFile(combinedPCM16, 24000);
            const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
            const wavUrl = URL.createObjectURL(wavBlob);

            // Play using HTML5 audio
            const audio = new Audio(wavUrl);
            audio.play();

            audio.onended = () => {
                addMessage('AI response playback completed');
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
            addMessage(`Received: ${data.type}`);

            switch (data.type) {
                case 'session.created':
                    addMessage('Session created successfully');
                    break;

                case 'session.updated':
                    addMessage('Session updated successfully');
                    break;

                case 'input_audio_buffer.committed':
                    addMessage('Audio buffer committed');
                    break;

                case 'response.created':
                    addMessage('Response creation started');
                    // Reset audio buffer for new response
                    responseAudioBufferRef.current = [];
                    break;

                case 'response.output_item.added':
                    addMessage('Response item added');
                    break;

                case 'response.content_part.added':
                    addMessage('Response content part added');
                    break;

                case 'response.audio.delta':
                    handleAudioDelta(data.delta);
                    break;

                case 'response.audio.done':
                    addMessage('Audio response complete - ready to play');
                    break;

                case 'response.done':
                    addMessage('Response completed');
                    // Check if we got any audio response and play it
                    if (responseAudioBufferRef.current && responseAudioBufferRef.current.length > 0) {
                        playCompleteResponse();
                    } else {
                        addMessage('No audio response received');
                    }
                    break;

                case 'conversation.item.created':
                    addMessage('Conversation item created');
                    break;

                case 'response.audio_transcript.delta':
                    if (data.delta) {
                        addMessage(`Transcript: ${data.delta}`);
                    }
                    break;

                case 'response.audio_transcript.done':
                    addMessage('Audio transcript completed');
                    break;

                case 'response.content_part.done':
                    addMessage('Response content part completed');
                    break;

                case 'response.output_item.done':
                    addMessage('Response output item completed');
                    break;

                case 'rate_limits.updated':
                    addMessage('Rate limits updated');
                    break;

                case 'error':
                    addMessage(`API Error: ${data.error.message}`);
                    break;

                default:
                    addMessage(`Unhandled message type: ${data.type}`);
            }

        } catch (e) {
            addMessage(`Error parsing message: ${e.message}`);
        }
    }, [addMessage, handleAudioDelta, playCompleteResponse]);

    const connect = useCallback(() => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        // Don't create a new connection if one is already connecting
        if (websocketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        websocketRef.current = new WebSocket('ws://localhost:8000/realtime');

        websocketRef.current.onopen = () => {
            setIsConnected(true);
            addMessage('Connected to WebSocket server.');

            // Send session configuration after a brief delay to ensure connection is fully ready
            setTimeout(() => {
                if (websocketRef.current?.readyState === WebSocket.OPEN) {
                    const sessionConfig = {
                        type: "session.update",
                        session: {
                            modalities: ["text", "audio"],
                            instructions: "You are a helpful voice assistant. Please respond with both text and audio. Always provide an audio response.",
                            voice: "alloy",
                            input_audio_format: "pcm16",
                            output_audio_format: "pcm16",
                            input_audio_transcription: {
                                model: "whisper-1"
                            },
                            turn_detection: null // Disable server VAD since we're manually controlling
                        }
                    };

                    websocketRef.current.send(JSON.stringify(sessionConfig));
                    addMessage('Sent session configuration');
                } else {
                    addMessage('WebSocket not ready for session configuration');
                }
            }, 100); // 100ms delay to ensure connection is fully established
        };

        websocketRef.current.onmessage = handleWebSocketMessage;

        websocketRef.current.onclose = () => {
            setIsConnected(false);
            addMessage('WebSocket connection closed.');
        };

        websocketRef.current.onerror = (error) => {
            addMessage(`WebSocket error: ${error.message}`);
        };
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
            addMessage(`WebSocket not ready - state: ${websocketRef.current.readyState}`);
            return false;
        }

        if (!pcm16Data || pcm16Data.length === 0) {
            addMessage('No audio data to send');
            return false;
        }

        try {
            // Convert PCM16 to base64 safely
            const uint8Array = new Uint8Array(pcm16Data.buffer);
            addMessage(`Converting ${uint8Array.length} bytes to base64...`);

            const base64Audio = uint8ArrayToBase64(uint8Array);
            addMessage(`Base64 conversion complete, length: ${base64Audio.length}`);

            // Send audio buffer append
            const audioMessage = {
                type: "input_audio_buffer.append",
                audio: base64Audio
            };

            websocketRef.current.send(JSON.stringify(audioMessage));
            addMessage(`Sent audio data: ${pcm16Data.length} samples`);

            // Commit the audio buffer and create response
            const commitMessage = {
                type: "input_audio_buffer.commit"
            };
            websocketRef.current.send(JSON.stringify(commitMessage));

            const responseMessage = {
                type: "response.create",
                response: {
                    modalities: ["text", "audio"],
                    instructions: "Please respond with audio."
                }
            };
            websocketRef.current.send(JSON.stringify(responseMessage));

            addMessage('Audio sent to API, waiting for response...');
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
    }, []);

    return {
        isConnected,
        messages,
        connect,
        sendMessage,
        sendAudioData,
        disconnect,
    };
}; 