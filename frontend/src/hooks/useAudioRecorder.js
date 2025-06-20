import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = (onAudioRecorded) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState('00:00');
    const [lastRecordingUrl, setLastRecordingUrl] = useState(null);
    const [audioFormat, setAudioFormat] = useState('-');

    const mediaRecorderRef = useRef(null);
    const audioStreamRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const recordingStartTimeRef = useRef(null);
    const audioContextRef = useRef(null);
    const accumulatedAudioDataRef = useRef([]);

    const updateRecordingTime = useCallback(() => {
        if (recordingStartTimeRef.current) {
            const elapsed = Date.now() - recordingStartTimeRef.current;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            setRecordingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
    }, []);

    // Convert float32 audio to PCM16
    const floatToPCM16 = useCallback((float32Array) => {
        const pcm16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
            const sample = Math.max(-1, Math.min(1, float32Array[i]));
            pcm16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        return pcm16Array;
    }, []);

    // Convert WebM audio to PCM16 format
    const convertWebMToPCM16 = useCallback(async (audioBlob) => {
        try {
            console.log('Starting audio conversion - blob size:', audioBlob.size, 'bytes');

            if (audioBlob.size === 0) {
                console.error('Audio blob is empty');
                return null;
            }

            const arrayBuffer = await audioBlob.arrayBuffer();
            console.log('Array buffer size:', arrayBuffer.byteLength);

            // Create new AudioContext for processing
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000
            });

            console.log('Decoding audio data...');
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio decoded - duration:', audioBuffer.duration, 'seconds, channels:', audioBuffer.numberOfChannels);

            // Get channel data and convert to PCM16
            const channelData = audioBuffer.getChannelData(0);
            console.log('Channel data length:', channelData.length, 'samples');

            const pcm16Data = floatToPCM16(channelData);
            console.log('Converted to PCM16:', pcm16Data.length, 'samples');

            audioContext.close();
            return pcm16Data;
        } catch (error) {
            console.error('Error converting audio to PCM16:', error);
            return null;
        }
    }, [floatToPCM16]);

    const startRecording = useCallback(async () => {
        try {
            console.log('Starting recording...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 24000, // Optimal for OpenAI Realtime API
                    channelCount: 1 // Mono audio
                }
            });

            audioStreamRef.current = stream;
            recordedChunksRef.current = [];
            accumulatedAudioDataRef.current = [];

            // Initialize AudioContext for PCM16 conversion
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000
            });

            // Determine supported audio format
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }

            console.log('Using MIME type:', mimeType);
            setAudioFormat(`PCM16 24kHz (converted from ${mimeType})`);

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    console.log('Audio chunk received:', event.data.size, 'bytes');
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                console.log('Recording stopped, processing', recordedChunksRef.current.length, 'chunks');

                if (recordedChunksRef.current.length === 0) {
                    console.error('No audio chunks recorded');
                    return;
                }

                const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                console.log('Created blob:', blob.size, 'bytes');

                const url = URL.createObjectURL(blob);
                setLastRecordingUrl(url);

                // Convert to PCM16 and send to API
                console.log('Converting audio to PCM16...');
                const pcm16Data = await convertWebMToPCM16(blob);

                if (pcm16Data && pcm16Data.length > 0) {
                    console.log('Audio conversion successful, calling onAudioRecorded with', pcm16Data.length, 'samples');
                    if (onAudioRecorded) {
                        onAudioRecorded(pcm16Data);
                    } else {
                        console.error('onAudioRecorded callback is not provided');
                    }
                } else {
                    console.error('Audio conversion failed - no PCM16 data produced');
                }

                // Clean up stream
                if (audioStreamRef.current) {
                    audioStreamRef.current.getTracks().forEach(track => track.stop());
                }

                // Clean up AudioContext
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
            };

            mediaRecorderRef.current.start(100); // Collect data every 100ms
            setIsRecording(true);
            recordingStartTimeRef.current = Date.now();

            // Start timer
            recordingTimerRef.current = setInterval(updateRecordingTime, 100);

            console.log('Recording started successfully');
            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            return false;
        }
    }, [updateRecordingTime, convertWebMToPCM16, onAudioRecorded]);

    const stopRecording = useCallback(() => {
        console.log('Stopping recording...');

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            console.log('MediaRecorder stopped');
        } else {
            console.log('MediaRecorder not in recording state:', mediaRecorderRef.current?.state);
        }

        setIsRecording(false);
        recordingStartTimeRef.current = null;

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        setRecordingTime('00:00');
    }, []);

    const playLastRecording = useCallback(() => {
        if (lastRecordingUrl) {
            const audio = new Audio(lastRecordingUrl);
            audio.play().catch(console.error);
        }
    }, [lastRecordingUrl]);

    return {
        isRecording,
        recordingTime,
        lastRecordingUrl,
        audioFormat,
        startRecording,
        stopRecording,
        playLastRecording,
    };
}; 