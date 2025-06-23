// Session Configuration
// Customize the AI assistant's behavior by modifying the instructions below

export const sessionConfig = {
    // System instructions for the AI assistant
    instructions: "You are a helpful voice assistant. Please respond with both text and audio. Always provide an audio response.",

    // Voice settings
    voice: "alloy", // Options: alloy, echo, fable, onyx, nova, shimmer

    // Audio format settings
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",

    // Supported modalities
    modalities: ["text", "audio"],

    // Input audio transcription settings
    input_audio_transcription: {
        model: "whisper-1"
    },

    // Turn detection (set to null for manual control)
    turn_detection: null
};