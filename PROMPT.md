# Audio Transcription Application

## Overview
Create a simple audio transcription application with a Go backend server and a pure JavaScript frontend using Red Hat PatternFly design system. The application allows users to record or upload WAV audio files, transcribe them using an OpenAI-compatible Whisper API, and generate summaries using an OpenAI-compatible LLM API.

## Architecture

### Backend - Go Server
- **Purpose**: 
  - Serve static files (HTML, CSS, JavaScript)
  - Act as a gateway/proxy to the transcription API
  - Act as a gateway/proxy to the LLM API for summarization

- **Requirements**:
  - Use only Go standard library (no external dependencies)
  - Keep code simple and concise (~300 lines)
  - Handle WAV file uploads from the frontend
  - Forward transcription requests to the Whisper API endpoint: `v1/audio/transcriptions`
  - Forward summarization requests to the LLM API endpoint: `v1/chat/completions`
  - Return transcription and summarization results to the frontend
  - Parse JSON for summarization requests
  - Support multipart form data for file uploads

- **Environment Variables**:
  - `AUDIO_INFERENCE_URL`: The HTTP URL of the Whisper inference server (e.g., `http://localhost:8000`)
  - `AUDIO_MODEL_NAME`: The model name to use for transcription (default: `whisper-1`)
  - `LLM_INFERENCE_URL`: The HTTP URL of the LLM server (e.g., `http://localhost:8001`)
  - `LLM_MODEL_NAME`: The LLM model name to use for summarization (default: `gpt-3.5-turbo`)
  - `PORT`: Optional port for the server (default: `8080`)

### Frontend - Pure JavaScript with PatternFly

- **Purpose**: Provide a professional, Red Hat-branded web interface for audio transcription and summarization

- **UI Framework**: 
  - PatternFly 5 (Red Hat's official design system)
  - Load via CDN (no npm/build required):
    - `https://unpkg.com/@patternfly/patternfly@5/patternfly.css`
    - `https://unpkg.com/@patternfly/patternfly@5/patternfly-addons.css`
  - Use Red Hat brand colors:
    - Primary Red: `#ee0000`
    - Red hover: `#c00`
    - Blue links: `#06c`

- **JavaScript Libraries**:
  - marked.js for Markdown parsing (summaries only)
  - Load via CDN: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`
  - Lightweight (~10KB), well-tested, supports GitHub Flavored Markdown
  - Used only for rendering LLM summaries with Markdown formatting

- **Typography** (Official Red Hat Brand Standards):
  - Font Family: Red Hat Display and Red Hat Text
  - Load via CDN or Google Fonts:
    - `https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700&family=Red+Hat+Text:wght@400;500;700&display=swap`
  - Usage:
    - **Red Hat Display**: Headers, titles, call-to-action buttons, banners
    - **Red Hat Text**: Body text, paragraphs, descriptions, subtitles
  - Characteristics:
    - Geometric, rational, and clean with a human dimension
    - Formed from perfect circles and straight, regular lines
    - Open Source under SIL International license
  - Line spacing (leading):
    - Body text: 1.2 to 1.5 times line height
    - Large text (>150pt): 1.1 times line height
  - Alignment:
    - Primary: Left-aligned (default for readability)
    - Center: Only for titles, captions, or special emphasis (max 30 words)
    - Right: Only for special cases (narrow sidebars)
    - Never justify text
  - Letter spacing (tracking):
    - Use default letter spacing (already optimized)
    - Do not modify
  - Reference: [Red Hat Typography Standards](https://www.redhat.com/fr/about/brand/standards/typography)

- **PatternFly Components to Use**:
  - `pf-v5-c-page`: Page layout structure
  - `pf-v5-c-masthead`: Top header with Red Hat branding
  - `pf-v5-c-card`: Cards for each section
  - `pf-v5-c-button`: Buttons (primary, secondary, block styles)
  - `pf-v5-c-form`: Form controls and labels
  - `pf-v5-c-form-control`: Input fields and selects
  - `pf-v5-c-spinner`: Loading indicators
  - `pf-v5-c-alert`: Error messages
  - `pf-v5-c-code-block`: Display transcription and summary results
  - `pf-v5-l-grid`: Responsive grid layout

- **Features**:
  1. **Audio Recording**:
     - Request microphone permissions from the user
     - Record audio directly from the computer's microphone using MediaRecorder API
     - Convert to WAV format using AudioContext and custom WAV encoder
     - Display recording timer and playback controls
     - Save recording as WAV format locally

  2. **File Upload**:
     - Allow users to upload existing WAV files
     - Validate file extension (.wav)
     - Display selected filename

  3. **Audio Language Selection (Optional Hint)**:
     - Dropdown menu to optionally specify the audio's spoken language
     - Label: "Audio Language (optional hint)"
     - Helper text: "Optionally specify the audio's spoken language to improve transcription accuracy. The audio will be transcribed in its original language (no translation)."
     - Option to auto-detect (default) - Whisper detects language automatically
     - Support for 15+ major languages (English, French, Spanish, German, Italian, Portuguese, Dutch, Polish, Russian, Chinese, Japanese, Korean, Arabic, Hindi, Turkish)
     - **Important**: This parameter is a HINT to improve accuracy, NOT for translation
     - Whisper transcribes audio in its original language
     - For translation, Whisper only supports translation TO English (via `/v1/audio/translations` endpoint, not implemented in this app)

  4. **Transcription**:
     - Send WAV files to the Go server with optional language parameter
     - Display loading spinner during transcription
     - Display transcription results in a code block with proper formatting
     - Support line breaks and preserve whitespace

  5. **Summarization**:
     - Button to generate a summary of the transcribed text
     - Send transcription text as JSON to the Go server for LLM processing
     - Display loading spinner during summary generation
     - Display summary results with Markdown rendering
     - Support multiple response formats (OpenAI, Harmony)
     - Parse and render Markdown formatting:
       - Headers (`##`, `###`) → `<h2>`, `<h3>`
       - Bold (`**text**`) → `<strong>`
       - Italic (`*text*`) → `<em>`
       - Lists (`-`, `*`, `1.`) → `<ul>`, `<ol>`, `<li>`
       - Code (`` `code` ``) → `<code>`
     - Copy summary to clipboard (plain text without HTML)

- **Requirements**:
  - Use only vanilla JavaScript (no frameworks like React, Vue, etc.)
  - Use PatternFly 5 CSS framework via CDN for Red Hat branding
  - Use marked.js library via CDN for Markdown parsing (summaries only)
  - Create a professional, enterprise-grade design
  - Follow Red Hat design patterns and guidelines
  - Implement responsive design (mobile, tablet, desktop)
  - Keep the code simple and maintainable
  - Escape HTML in user content to prevent XSS attacks
  - Use marked.js to parse Markdown in summaries (Harmony format support)

## Build and Deployment

### Dockerfile
- Use Red Hat UBI9 images:
  - Build stage: `registry.access.redhat.com/ubi9/go-toolset:1.23`
  - Runtime stage: `registry.access.redhat.com/ubi9/ubi-minimal:latest`
- Build the Go server entirely within the container
- No local Go development required
- Multi-stage build for optimization
- Handle UBI9 permissions correctly (non-root user 1001)
- Final image should contain:
  - Compiled Go binary
  - Static files (HTML, CSS, JavaScript)

### Makefile
- Provide simple commands to:
  - `make build`: Build the container image
  - `make run`: Run the application with environment variables
  - `make stop`: Stop and remove the container
  - `make clean`: Stop container and remove image
  - `make logs`: Show application logs
  - `make help`: Display available commands

## API Integration

### Whisper API Endpoint
- **Endpoint**: `/v1/audio/transcriptions`
- **Method**: POST
- **Format**: OpenAI-compatible API
- **Content-Type**: multipart/form-data
- **Input**: WAV audio file
- **Required fields**: 
  - `file`: WAV audio file
  - `model`: Model name (from MODEL_NAME env var)
- **Optional fields**:
  - `language`: ISO 639-1 language code (e.g., 'en', 'fr') for output language
- **Output**: JSON with transcription text
  ```json
  {
    "text": "Transcribed text here..."
  }
  ```

### LLM API Endpoint
- **Endpoint**: `/v1/chat/completions`
- **Method**: POST
- **Format**: OpenAI-compatible API
- **Content-Type**: application/json
- **Input**: JSON with messages
- **Required fields**:
  - `model`: Model name (from LLM_MODEL env var)
  - `messages`: Array of message objects with role and content
- **Output formats supported**:
  - OpenAI format: `choices[0].message.content`
  - Harmony format: `response`
  - Fallback: `text`
- **Example request**:
  ```json
  {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant that summarizes transcribed audio. Provide a clear, concise summary of the main points."
      },
      {
        "role": "user",
        "content": "Please summarize the following transcription:\n\nTranscribed text here..."
      }
    ],
    "temperature": 0.7
  }
  ```

### Go Server Routes
1. **`GET /`**: Serve the main HTML page
2. **`GET /static/*`**: Serve static assets (CSS, JS)
   - Set appropriate Content-Type headers
   - Prevent directory traversal attacks
3. **`POST /transcribe`**: Proxy endpoint that:
   - Receives WAV file from frontend via multipart form
   - Receives optional `language` parameter from frontend
   - Forwards to `{AUDIO_INFERENCE_URL}/v1/audio/transcriptions`
   - Includes `model` field from AUDIO_MODEL_NAME environment variable
   - Includes `language` field if provided by user
   - Returns transcription result as JSON
   - Max file size: 500MB
4. **`POST /summarize`**: Proxy endpoint that:
   - Receives JSON with `text` field from frontend
   - Creates OpenAI-compatible chat completion request
   - Forwards to `{LLM_INFERENCE_URL}/v1/chat/completions`
   - Includes `model` from LLM_MODEL_NAME environment variable
   - Includes system and user prompts for summarization
   - Returns summary result as JSON

## Technical Specifications

### Audio Format
- Format: WAV (Waveform Audio File Format)
- Encoding: PCM (recommended)
- Sample rate: Standard audio sample rates (16kHz, 44.1kHz, or 48kHz)
- Browser recording: Convert from MediaRecorder output to WAV format
- Use AudioContext for audio processing
- Implement custom WAV encoder (RIFF header + PCM data)

### Text Formatting

**Transcription Display**:
- Display in `<pre>` tags within code blocks
- Use `white-space: pre-wrap` to preserve line breaks and spaces
- Use `word-wrap: break-word` to prevent overflow
- Escape HTML content to prevent XSS
- Plain text display (no Markdown parsing)

**Summary Display (Markdown Support)**:
- Parse Markdown from LLM responses (especially Harmony format)
- Support for:
  - Headers: `##`, `###` → `<h2>`, `<h3>`
  - Bold: `**text**` → `<strong>`
  - Italic: `*text*` → `<em>`
  - Lists: `-` or `*` → `<ul><li>`
  - Code: `` `code` `` → `<code>`
- Escape HTML before parsing to prevent XSS
- Convert parsed Markdown to HTML for rich display
- Support multiple LLM response formats (OpenAI, Harmony)

### Error Handling
- Handle network errors gracefully
- Display user-friendly error messages using PatternFly alerts
- Validate file types (WAV only)
- Handle microphone permission denials
- Show error message with dismiss button
- Hide error when user starts new action

### Security Considerations
- Validate file size limits (500MB max)
- Sanitize user inputs and escape HTML
- Prevent directory traversal in static file serving
- Environment variable validation on startup
- Use appropriate CORS headers if needed

### Responsive Design
- Mobile-first approach
- Grid layout: 12 columns on desktop, stack on mobile
- Cards expand to full width on mobile
- Buttons adapt to screen size
- Text size adjustments for readability
- Touch-friendly button sizes

### Typography Implementation
Following [Red Hat Brand Standards](https://www.redhat.com/fr/about/brand/standards/typography):

**Font Loading**:
```html
<link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700&family=Red+Hat+Text:wght@400;500;700&display=swap" rel="stylesheet">
```

**CSS Implementation**:
```css
body {
  font-family: 'Red Hat Text', 'Overpass', overpass, helvetica, arial, sans-serif;
  font-size: 16px;
  line-height: 1.5; /* 1.2-1.5 for body text */
  text-align: left; /* Always left-aligned by default */
}

h1, h2, h3, h4, h5, h6, .pf-v5-c-title {
  font-family: 'Red Hat Display', 'Overpass', overpass, helvetica, arial, sans-serif;
  font-weight: 500;
  line-height: 1.3;
}

.pf-v5-c-button {
  font-family: 'Red Hat Display', 'Overpass', overpass, helvetica, arial, sans-serif;
  font-weight: 500;
}

/* Large text (>150pt equivalent ~112px) */
.large-text {
  line-height: 1.1;
}

/* Never justify text */
p, div {
  text-align: left;
  text-justify: none;
}

/* Use default letter-spacing (do not modify) */
* {
  letter-spacing: normal;
}
```

**Typography Rules**:
- Use Red Hat Display for: titles, headers, buttons, call-to-actions
- Use Red Hat Text for: body text, descriptions, labels, help text
- Line height: 1.2-1.5 for body text, 1.1 for very large text
- Alignment: Left-aligned (default), center only for titles/captions
- Never justify text
- Never modify letter-spacing
- Fonts are geometric, formed from circles and straight lines
- Open Source under SIL International license

## Development Guidelines

1. **Simplicity First**: Keep the codebase minimal and easy to understand
2. **Minimal Dependencies**: 
   - Go: Use only standard library (no external dependencies)
   - Frontend: PatternFly and marked.js via CDN only (no frameworks, no build process)
3. **Container-Only Build**: All Go compilation happens inside the container
4. **Enterprise UI**: Create a professional Red Hat-branded interface with PatternFly
5. **Clear Error Messages**: Provide helpful feedback to users
6. **Security**: Validate inputs, escape outputs, limit file sizes
7. **Accessibility**: Use ARIA labels, proper semantic HTML, keyboard navigation

## Expected File Structure
```
transcript-app/
├── Dockerfile              # Multi-stage build with UBI9
├── Makefile               # Build and run commands
├── server.go              # Go backend (~300 lines, stdlib only)
├── static/
│   ├── index.html         # PatternFly UI structure
│   ├── style.css          # Custom styles for PatternFly
│   └── app.js             # Frontend logic (vanilla JS)
├── README.md              # User documentation
└── prompt.md              # This file - development specification
```

## Usage Flow

### Transcription Flow
1. User opens the web application
2. User either:
   - **Record**: Clicks "Start Recording" → records audio → clicks "Stop Recording" → gets WAV file
   - **Upload**: Clicks "Choose WAV File" → selects a WAV file from their computer
3. User selects the output language from dropdown (or leaves as "Auto-detect" for original language)
   - The audio's spoken language is automatically detected by Whisper
   - The selection controls the output/translation language
4. User clicks "Transcribe Audio" button
5. Frontend:
   - Creates FormData with file and optional language parameter
   - Sends POST request to `/transcribe`
   - Displays loading spinner
6. Go server:
   - Receives multipart form data
   - Validates WAV file (max 500MB)
   - Creates new multipart request with file, model, and optional language
   - Forwards to `{AUDIO_INFERENCE_URL}/v1/audio/transcriptions`
   - Returns response to frontend
7. Frontend:
   - Receives transcription result
   - Displays text in code block with proper formatting
   - Shows action buttons (Summarize, Copy, New Transcription)

### Summarization Flow
1. After transcription is displayed, user clicks "Summarize" button
2. Frontend:
   - Gets transcription text
   - Sends POST request to `/summarize` with JSON body: `{"text": "..."}`
   - Displays loading spinner
3. Go server:
   - Receives JSON request
   - Extracts text field
   - Creates OpenAI-compatible chat completion request:
     - System prompt: Summarization instructions
     - User prompt: The transcription text
     - Temperature: 0.7
   - Forwards to `{LLM_INFERENCE_URL}/v1/chat/completions`
   - Returns response to frontend
4. Frontend:
   - Receives summary result
   - Extracts text from response (supports OpenAI, Harmony, and text formats)
   - Escapes HTML and converts newlines to `<br>`
   - Displays summary in code block with proper formatting
   - Shows copy button
5. User can copy transcription or summary to clipboard

## Key Implementation Details

### WAV Conversion (JavaScript)
- Use MediaRecorder to capture audio
- Convert to AudioBuffer using AudioContext
- Implement audioBufferToWav function:
  - Create RIFF header (44 bytes)
  - Write WAV metadata (format, channels, sample rate, bit depth)
  - Convert Float32 samples to Int16 PCM data
  - Combine header and audio data

### HTML Escaping and Markdown Parsing (JavaScript)

**Load marked.js library**:
```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

**Implementation**:
```javascript
// Escape HTML to prevent XSS (for plain text display)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse Markdown using marked.js (for summaries)
function parseMarkdown(text) {
    // Configure marked options
    marked.setOptions({
        breaks: true,        // Convert \n to <br>
        gfm: true,          // GitHub Flavored Markdown
        headerIds: false,   // Don't add IDs to headers
        mangle: false,      // Don't escape email addresses
        sanitize: false     // marked v5+ doesn't sanitize by default (escapes HTML)
    });
    
    // Parse markdown to HTML
    return marked.parse(text);
}
```

**Benefits of using marked.js**:
- Industry-standard, well-tested Markdown parser
- Handles edge cases and complex Markdown correctly
- GitHub Flavored Markdown support (tables, task lists, etc.)
- Automatic HTML escaping for security
- Lightweight (~10KB minified)
- No build process required (CDN)

### PatternFly Integration
- Load CSS from CDN in `<head>`
- Use semantic HTML with PatternFly classes
- Follow PatternFly component structure exactly
- Apply custom styles in separate CSS file
- Customize colors to match Red Hat branding
- Ensure responsive grid layout works on all devices

### Go Server Best Practices
- Keep functions small and focused
- Use descriptive variable names
- Log important events (startup, API calls)
- Return appropriate HTTP status codes
- Set correct Content-Type headers
- Handle errors gracefully
- Close response bodies and files properly