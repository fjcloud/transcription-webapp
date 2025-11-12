# Audio Transcription Application

A professional web application for audio transcription and summarization, built with a Go backend and Red Hat PatternFly frontend design system.

## Features

- 🎤 **Audio Recording**: Record audio directly from your microphone
- 📁 **File Upload**: Upload existing WAV audio files
- 🌍 **Language Support**: Optional language hints for improved transcription accuracy (15+ languages)
- 📝 **Transcription**: Convert audio to text using OpenAI-compatible Whisper API
- 📊 **Summarization**: Generate concise summaries using OpenAI-compatible LLM API
- 🎨 **Professional UI**: Enterprise-grade design with Red Hat PatternFly
- 📋 **Copy to Clipboard**: Easy copying of transcriptions and summaries
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Architecture

### Backend (Go Server)
- Pure Go standard library (no external dependencies)
- Serves static files (HTML, CSS, JavaScript)
- Proxies requests to Whisper API for transcription
- Proxies requests to LLM API for summarization
- Handles file uploads up to 500MB
- Simple and maintainable (~300 lines of code)

### Frontend (Vanilla JavaScript + PatternFly)
- Red Hat PatternFly 5 design system
- Vanilla JavaScript (no frameworks)
- Audio recording with MediaRecorder API
- WAV format conversion
- Markdown rendering for summaries (marked.js)
- Red Hat typography (Red Hat Display & Red Hat Text fonts)

## Prerequisites

- **Docker**: For building and running the containerized application
- **Whisper API Server**: OpenAI-compatible transcription service
- **LLM API Server**: OpenAI-compatible chat completion service

## Quick Start

### 1. Clone or Extract the Project

```bash
cd transcription-webapp
```

### 2. Set Environment Variables

Set the required environment variables for your API endpoints:

```bash
export AUDIO_INFERENCE_URL=http://localhost:8000
export LLM_INFERENCE_URL=http://localhost:8001
```

Optional environment variables:

```bash
export AUDIO_MODEL_NAME=whisper-1        # Default: whisper-1
export LLM_MODEL_NAME=gpt-3.5-turbo      # Default: gpt-3.5-turbo
export PORT=8080                         # Default: 8080
```

### 3. Build the Application

```bash
make build
```

This will:
- Build a Docker image using Red Hat UBI9
- Compile the Go server inside the container
- Package static files (HTML, CSS, JavaScript)

### 4. Run the Application

```bash
make run
```

The application will start and be available at: **http://localhost:8080**

### 5. Access the Application

Open your web browser and navigate to:

```
http://localhost:8080
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make help` | Display available commands and usage |
| `make build` | Build the Docker container image |
| `make run` | Run the application container |
| `make stop` | Stop and remove the container |
| `make clean` | Stop container and remove image |
| `make logs` | Show application logs (follow mode) |
| `make restart` | Restart the container |

## Usage Guide

### Recording Audio

1. Click **"Start Recording"** to begin recording from your microphone
2. Speak clearly into your microphone
3. Click **"Stop Recording"** when finished
4. The recording will be automatically converted to WAV format
5. An audio player will appear for playback review

### Uploading Audio Files

1. Click **"Choose WAV File"** under the Upload section
2. Select a WAV audio file from your computer
3. The filename will be displayed once selected

### Language Selection (Optional)

1. Use the **"Audio Language"** dropdown to optionally specify the spoken language
2. Default is **"Auto-detect"** (Whisper automatically detects the language)
3. Supported languages:
   - English, French, Spanish, German, Italian
   - Portuguese, Dutch, Polish, Russian
   - Chinese, Japanese, Korean, Arabic, Hindi, Turkish
4. **Note**: This is a hint for accuracy, NOT for translation
5. The audio is transcribed in its original language

### Transcribing Audio

1. After recording or uploading a WAV file, click **"Transcribe Audio"**
2. A loading spinner will appear during transcription
3. The transcription result will be displayed in a text block
4. Options:
   - **Summarize**: Generate a summary of the transcription
   - **Copy**: Copy transcription to clipboard
   - **New Transcription**: Reset and start over

### Generating Summaries

1. After transcription is complete, click **"Summarize"**
2. A loading spinner will appear during summary generation
3. The summary will be displayed with Markdown formatting
4. Click **"Copy Summary"** to copy the plain text to clipboard

## API Integration

### Whisper API (Transcription)

**Endpoint**: `POST /v1/audio/transcriptions`

**Format**: OpenAI-compatible API

**Request**:
- Content-Type: `multipart/form-data`
- Fields:
  - `file`: WAV audio file
  - `model`: Model name (from `AUDIO_MODEL_NAME`)
  - `language`: Optional ISO 639-1 language code

**Response**:
```json
{
  "text": "Transcribed text here..."
}
```

### LLM API (Summarization)

**Endpoint**: `POST /v1/chat/completions`

**Format**: OpenAI-compatible API

**Request**:
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that summarizes transcribed audio..."
    },
    {
      "role": "user",
      "content": "Please summarize the following transcription:\n\n..."
    }
  ],
  "temperature": 0.7
}
```

**Response Formats Supported**:
- OpenAI format: `choices[0].message.content`
- Harmony format: `response`
- Fallback: `text`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUDIO_INFERENCE_URL` | **Yes** | - | Whisper API endpoint (e.g., `http://localhost:8000`) |
| `LLM_INFERENCE_URL` | **Yes** | - | LLM API endpoint (e.g., `http://localhost:8001`) |
| `AUDIO_MODEL_NAME` | No | `whisper-1` | Whisper model name |
| `LLM_MODEL_NAME` | No | `gpt-3.5-turbo` | LLM model name |
| `PORT` | No | `8080` | Server port |

## Project Structure

```
transcription-webapp/
├── Dockerfile              # Multi-stage build with UBI9
├── Makefile               # Build and run commands
├── server.go              # Go backend (~300 lines)
├── static/
│   ├── index.html         # PatternFly UI
│   ├── style.css          # Custom Red Hat styles
│   └── app.js             # Frontend logic
├── README.md              # This file
└── prompt.md              # Development specification
```

## Technical Details

### Audio Format
- **Format**: WAV (Waveform Audio File Format)
- **Encoding**: PCM (Pulse Code Modulation)
- **Sample Rates**: 16kHz, 44.1kHz, or 48kHz
- **Browser Recording**: Automatic conversion from MediaRecorder output

### Security Features
- File size limit: 500MB
- HTML escaping to prevent XSS attacks
- Directory traversal prevention
- Input validation for file types
- Non-root container execution (user 1001)

### Browser Compatibility
- Modern browsers with MediaRecorder API support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires HTTPS for microphone access (except localhost)

## Troubleshooting

### Microphone Not Working

**Issue**: "Microphone permission denied" error

**Solution**:
- Check browser permissions (click the lock icon in address bar)
- Grant microphone access when prompted
- For HTTPS: Ensure valid SSL certificate
- For HTTP: Only works on localhost

### Transcription Fails

**Issue**: "Transcription service error"

**Solution**:
- Verify `AUDIO_INFERENCE_URL` is correct and accessible
- Check that Whisper API server is running
- Ensure WAV file format is valid
- Check application logs: `make logs`

### Summarization Fails

**Issue**: "Summarization service error"

**Solution**:
- Verify `LLM_INFERENCE_URL` is correct and accessible
- Check that LLM API server is running
- Ensure transcription text is not empty
- Check application logs: `make logs`

### Container Won't Start

**Issue**: Container exits immediately

**Solution**:
- Check required environment variables are set
- View logs: `make logs`
- Verify API endpoints are reachable from container
- Use Docker network if APIs are in containers

## Docker Network Example

If your Whisper and LLM services are also running in Docker containers, create a Docker network:

```bash
# Create network
docker network create transcription-net

# Run your API services on the network
docker run -d --name whisper-api --network transcription-net whisper-image
docker run -d --name llm-api --network transcription-net llm-image

# Update Makefile or use environment variables
export AUDIO_INFERENCE_URL=http://whisper-api:8000
export LLM_INFERENCE_URL=http://llm-api:8001

# Run the transcription app on the same network
docker run -d \
  --name transcription-app \
  --network transcription-net \
  -p 8080:8080 \
  -e AUDIO_INFERENCE_URL=http://whisper-api:8000 \
  -e LLM_INFERENCE_URL=http://llm-api:8001 \
  transcription-app
```

## Development

### Building Locally (Without Docker)

If you prefer to develop without Docker:

```bash
# Build the Go server
go build -o transcription-server server.go

# Set environment variables
export AUDIO_INFERENCE_URL=http://localhost:8000
export LLM_INFERENCE_URL=http://localhost:8001

# Run the server
./transcription-server
```

Access the application at: http://localhost:8080

### Hot Reload for Development

For frontend changes (HTML, CSS, JavaScript):
1. Edit files in the `static/` directory
2. Refresh your browser (no rebuild needed)

For backend changes (server.go):
1. Rebuild: `make build`
2. Restart: `make restart`

## License

This project is provided as-is for demonstration and educational purposes.

## Credits

- **Go**: Backend server (https://golang.org/)
- **PatternFly**: Red Hat design system (https://www.patternfly.org/)
- **marked.js**: Markdown parser (https://marked.js.org/)
- **Red Hat Fonts**: Red Hat Display & Red Hat Text (https://www.redhat.com/en/about/brand/standards/typography)
- **Font Awesome**: Icons (https://fontawesome.com/)

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review application logs: `make logs`
3. Verify environment variables and API endpoints
4. Ensure all prerequisites are met

---

**Built with ❤️ using Red Hat PatternFly and Go**

