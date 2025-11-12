package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Configuration from environment variables
type Config struct {
	AudioInferenceURL string
	AudioModelName    string
	LLMInferenceURL   string
	LLMModelName      string
	Port              string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	config := &Config{
		AudioInferenceURL: os.Getenv("AUDIO_INFERENCE_URL"),
		AudioModelName:    getEnvOrDefault("AUDIO_MODEL_NAME", "whisper-1"),
		LLMInferenceURL:   os.Getenv("LLM_INFERENCE_URL"),
		LLMModelName:      getEnvOrDefault("LLM_MODEL_NAME", "gpt-3.5-turbo"),
		Port:              getEnvOrDefault("PORT", "8080"),
	}

	// Validate required environment variables
	if config.AudioInferenceURL == "" {
		log.Fatal("AUDIO_INFERENCE_URL environment variable is required")
	}
	if config.LLMInferenceURL == "" {
		log.Fatal("LLM_INFERENCE_URL environment variable is required")
	}

	return config
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

var config *Config

func main() {
	config = LoadConfig()

	log.Printf("Starting Audio Transcription Server")
	log.Printf("Audio Inference URL: %s", config.AudioInferenceURL)
	log.Printf("Audio Model: %s", config.AudioModelName)
	log.Printf("LLM Inference URL: %s", config.LLMInferenceURL)
	log.Printf("LLM Model: %s", config.LLMModelName)
	log.Printf("Port: %s", config.Port)

	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/static/", handleStatic)
	http.HandleFunc("/transcribe", handleTranscribe)
	http.HandleFunc("/summarize", handleSummarize)

	addr := ":" + config.Port
	log.Printf("Server listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}

// handleIndex serves the main HTML page
func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, "static/index.html")
}

// handleStatic serves static files with proper Content-Type headers
func handleStatic(w http.ResponseWriter, r *http.Request) {
	// Remove /static/ prefix and prevent directory traversal
	path := strings.TrimPrefix(r.URL.Path, "/static/")
	if strings.Contains(path, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Build full file path
	filePath := filepath.Join("static", path)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	// Set Content-Type based on file extension
	ext := filepath.Ext(filePath)
	contentType := mime.TypeByExtension(ext)
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}

	http.ServeFile(w, r, filePath)
}

// handleTranscribe proxies transcription requests to the Whisper API
func handleTranscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("Received transcription request")

	// Parse multipart form (max 500MB)
	if err := r.ParseMultipartForm(500 << 20); err != nil {
		log.Printf("Error parsing form: %v", err)
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		log.Printf("Error getting file: %v", err)
		http.Error(w, "Error getting file from form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(header.Filename), ".wav") {
		http.Error(w, "Only WAV files are supported", http.StatusBadRequest)
		return
	}

	log.Printf("Processing file: %s (size: %d bytes)", header.Filename, header.Size)

	// Get optional language parameter
	language := r.FormValue("language")

	// Create multipart form for the API request
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Add file field
	filePart, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		log.Printf("Error creating form file: %v", err)
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	if _, err := io.Copy(filePart, file); err != nil {
		log.Printf("Error copying file: %v", err)
		http.Error(w, "Error processing file", http.StatusInternalServerError)
		return
	}

	// Add model field
	if err := writer.WriteField("model", config.AudioModelName); err != nil {
		log.Printf("Error adding model field: %v", err)
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	// Add language field if provided
	if language != "" && language != "auto" {
		if err := writer.WriteField("language", language); err != nil {
			log.Printf("Error adding language field: %v", err)
			http.Error(w, "Error creating request", http.StatusInternalServerError)
			return
		}
		log.Printf("Language hint: %s", language)
	}

	if err := writer.Close(); err != nil {
		log.Printf("Error closing writer: %v", err)
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	// Forward request to Whisper API
	apiURL := config.AudioInferenceURL + "/v1/audio/transcriptions"
	log.Printf("Forwarding to: %s", apiURL)

	req, err := http.NewRequest("POST", apiURL, &requestBody)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error calling API: %v", err)
		http.Error(w, "Error calling transcription service", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Error reading response", http.StatusInternalServerError)
		return
	}

	// Check response status
	if resp.StatusCode != http.StatusOK {
		log.Printf("API error (status %d): %s", resp.StatusCode, string(body))
		http.Error(w, fmt.Sprintf("Transcription service error: %s", string(body)), resp.StatusCode)
		return
	}

	log.Println("Transcription successful")

	// Forward response to client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

// SummarizeRequest represents the request body for summarization
type SummarizeRequest struct {
	Text string `json:"text"`
}

// ChatCompletionRequest represents OpenAI-compatible chat completion request
type ChatCompletionRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature"`
}

// Message represents a chat message
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// handleSummarize proxies summarization requests to the LLM API
func handleSummarize(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Println("Received summarization request")

	// Parse JSON request
	var req SummarizeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error parsing JSON: %v", err)
		http.Error(w, "Error parsing request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if req.Text == "" {
		http.Error(w, "Text field is required", http.StatusBadRequest)
		return
	}

	log.Printf("Summarizing text (length: %d characters)", len(req.Text))

	// Create chat completion request
	chatReq := ChatCompletionRequest{
		Model: config.LLMModelName,
		Messages: []Message{
			{
				Role:    "system",
				Content: "You are a helpful assistant that summarizes transcribed audio. Provide a clear, concise summary of the main points.",
			},
			{
				Role:    "user",
				Content: fmt.Sprintf("Please summarize the following transcription:\n\n%s", req.Text),
			},
		},
		Temperature: 0.7,
	}

	// Marshal request to JSON
	jsonData, err := json.Marshal(chatReq)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	// Forward request to LLM API
	apiURL := config.LLMInferenceURL + "/v1/chat/completions"
	log.Printf("Forwarding to: %s", apiURL)

	apiReq, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	apiReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 2 * time.Minute}
	resp, err := client.Do(apiReq)
	if err != nil {
		log.Printf("Error calling API: %v", err)
		http.Error(w, "Error calling summarization service", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Error reading response", http.StatusInternalServerError)
		return
	}

	// Check response status
	if resp.StatusCode != http.StatusOK {
		log.Printf("API error (status %d): %s", resp.StatusCode, string(body))
		http.Error(w, fmt.Sprintf("Summarization service error: %s", string(body)), resp.StatusCode)
		return
	}

	log.Println("Summarization successful")

	// Forward response to client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

