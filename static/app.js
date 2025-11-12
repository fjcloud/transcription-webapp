// Global state
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let timerInterval = null;
let currentAudioBlob = null;
let currentTranscription = null;

// DOM Elements
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const recordingTimer = document.getElementById('recordingTimer');
const timerDisplay = document.getElementById('timerDisplay');
const audioPlayback = document.getElementById('audioPlayback');
const fileInput = document.getElementById('fileInput');
const languageSelect = document.getElementById('languageSelect');
const transcribeBtn = document.getElementById('transcribeBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const loadingMessage = document.getElementById('loadingMessage');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const transcriptionCard = document.getElementById('transcriptionCard');
const transcriptionText = document.getElementById('transcriptionText');
const summarizeBtn = document.getElementById('summarizeBtn');
const copyTranscriptionBtn = document.getElementById('copyTranscriptionBtn');
const newTranscriptionBtn = document.getElementById('newTranscriptionBtn');
const summaryCard = document.getElementById('summaryCard');
const summaryText = document.getElementById('summaryText');
const copySummaryBtn = document.getElementById('copySummaryBtn');

// Event Listeners
startRecordBtn.addEventListener('click', startRecording);
stopRecordBtn.addEventListener('click', stopRecording);
transcribeBtn.addEventListener('click', transcribeAudio);
summarizeBtn.addEventListener('click', summarizeTranscription);
copyTranscriptionBtn.addEventListener('click', copyTranscription);
copySummaryBtn.addEventListener('click', copySummary);
newTranscriptionBtn.addEventListener('click', resetForm);
closeErrorBtn.addEventListener('click', hideError);
fileInput.addEventListener('change', handleFileSelect);

// Utility Functions

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseMarkdown(text) {
    // Configure marked options
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false
    });
    
    // Parse markdown to HTML
    return marked.parse(text);
}

function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'flex';
}

function hideError() {
    errorAlert.style.display = 'none';
}

function showLoading(message) {
    loadingMessage.textContent = message;
    loadingSpinner.style.display = 'block';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Audio Recording Functions

async function startRecording() {
    try {
        hideError();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use MediaRecorder to capture audio
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Convert to WAV
            try {
                currentAudioBlob = await convertToWav(audioBlob);
                const audioUrl = URL.createObjectURL(currentAudioBlob);
                audioPlayback.src = audioUrl;
                audioPlayback.style.display = 'block';
                
                // Clear file input since we have a recording
                fileInput.value = '';
            } catch (err) {
                showError('Error converting audio to WAV format: ' + err.message);
            }
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        
        // Update UI
        startRecordBtn.style.display = 'none';
        stopRecordBtn.style.display = 'block';
        recordingTimer.style.display = 'block';
        timerDisplay.textContent = '00:00';
        
    } catch (err) {
        if (err.name === 'NotAllowedError') {
            showError('Microphone permission denied. Please allow microphone access to record audio.');
        } else {
            showError('Error accessing microphone: ' + err.message);
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(timerInterval);
        
        // Update UI
        startRecordBtn.style.display = 'block';
        stopRecordBtn.style.display = 'none';
        recordingTimer.style.display = 'none';
    }
}

async function convertToWav(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const wavBlob = audioBufferToWav(audioBuffer);
    return wavBlob;
}

function audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    // Interleave channels
    const length = audioBuffer.length * numChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true); // byte rate
    view.setUint16(32, numChannels * bitDepth / 8, true); // block align
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// File Upload Functions

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.name.toLowerCase().endsWith('.wav')) {
            showError('Please select a WAV file');
            fileInput.value = '';
            return;
        }
        currentAudioBlob = file;
        audioPlayback.style.display = 'none';
        hideError();
    }
}

// Transcription Functions

async function transcribeAudio() {
    if (!currentAudioBlob) {
        showError('Please record or upload an audio file first');
        return;
    }
    
    try {
        hideError();
        showLoading('Transcribing audio...');
        
        // Hide previous results
        transcriptionCard.style.display = 'none';
        summaryCard.style.display = 'none';
        
        const formData = new FormData();
        formData.append('file', currentAudioBlob, 'audio.wav');
        
        // Add language parameter if not auto-detect
        const language = languageSelect.value;
        if (language && language !== 'auto') {
            formData.append('language', language);
        }
        
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Transcription failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.text) {
            throw new Error('No transcription text in response');
        }
        
        currentTranscription = result.text;
        
        // Display transcription with escaped HTML
        transcriptionText.textContent = currentTranscription;
        transcriptionCard.style.display = 'block';
        
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

// Summarization Functions

async function summarizeTranscription() {
    if (!currentTranscription) {
        showError('No transcription to summarize');
        return;
    }
    
    try {
        hideError();
        showLoading('Generating summary...');
        
        summaryCard.style.display = 'none';
        
        const response = await fetch('/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: currentTranscription })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Summarization failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        // Extract summary text from different response formats
        let summaryContent = '';
        if (result.choices && result.choices[0] && result.choices[0].message) {
            // OpenAI format
            summaryContent = result.choices[0].message.content;
        } else if (result.response) {
            // Harmony format
            summaryContent = result.response;
        } else if (result.text) {
            // Fallback format
            summaryContent = result.text;
        } else {
            throw new Error('Unable to extract summary from response');
        }
        
        // Parse Markdown and display
        const htmlContent = parseMarkdown(summaryContent);
        summaryText.innerHTML = htmlContent;
        summaryCard.style.display = 'block';
        
        // Store raw text for copying
        summaryText.dataset.rawText = summaryContent;
        
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

// Copy Functions

async function copyTranscription() {
    if (!currentTranscription) {
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentTranscription);
        
        // Visual feedback
        const originalText = copyTranscriptionBtn.textContent;
        copyTranscriptionBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyTranscriptionBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        showError('Failed to copy to clipboard: ' + err.message);
    }
}

async function copySummary() {
    const rawText = summaryText.dataset.rawText;
    if (!rawText) {
        return;
    }
    
    try {
        await navigator.clipboard.writeText(rawText);
        
        // Visual feedback
        const originalText = copySummaryBtn.textContent;
        copySummaryBtn.textContent = 'Copied!';
        setTimeout(() => {
            copySummaryBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        showError('Failed to copy to clipboard: ' + err.message);
    }
}

// Reset Functions

function resetForm() {
    // Clear audio
    currentAudioBlob = null;
    currentTranscription = null;
    audioChunks = [];
    
    // Reset file input
    fileInput.value = '';
    
    // Reset language select
    languageSelect.value = 'auto';
    
    // Hide audio playback
    audioPlayback.style.display = 'none';
    audioPlayback.src = '';
    
    // Hide results
    transcriptionCard.style.display = 'none';
    summaryCard.style.display = 'none';
    
    // Hide error
    hideError();
    
    // Reset recording UI if needed
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        stopRecording();
    }
}

// Initialize
console.log('Audio Transcription App initialized');

