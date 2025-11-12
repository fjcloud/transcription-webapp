# Makefile for Audio Transcription Application

# Variables
IMAGE_NAME := transcription-app
CONTAINER_NAME := transcription-app
PORT := 8080

# Default environment variables (override these when running)
AUDIO_INFERENCE_URL ?= http://localhost:8000
AUDIO_MODEL_NAME ?= whisper-1
LLM_INFERENCE_URL ?= http://localhost:8001
LLM_MODEL_NAME ?= gpt-3.5-turbo

.PHONY: help build run stop clean logs restart

help: ## Display this help message
	@echo "Audio Transcription Application - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Environment Variables (set before running 'make run'):"
	@echo "  AUDIO_INFERENCE_URL  - Whisper API endpoint (default: http://localhost:8000)"
	@echo "  AUDIO_MODEL_NAME     - Whisper model name (default: whisper-1)"
	@echo "  LLM_INFERENCE_URL    - LLM API endpoint (default: http://localhost:8001)"
	@echo "  LLM_MODEL_NAME       - LLM model name (default: gpt-3.5-turbo)"
	@echo "  PORT                 - Server port (default: 8080)"
	@echo ""
	@echo "Example:"
	@echo "  make build"
	@echo "  AUDIO_INFERENCE_URL=http://whisper:8000 LLM_INFERENCE_URL=http://llm:8001 make run"

build: ## Build the Docker container image
	@echo "Building Docker image: $(IMAGE_NAME)..."
	docker build -t $(IMAGE_NAME) .
	@echo "Build complete!"

run: ## Run the application container
	@echo "Starting container: $(CONTAINER_NAME)..."
	@echo "Configuration:"
	@echo "  Audio Inference URL: $(AUDIO_INFERENCE_URL)"
	@echo "  Audio Model: $(AUDIO_MODEL_NAME)"
	@echo "  LLM Inference URL: $(LLM_INFERENCE_URL)"
	@echo "  LLM Model: $(LLM_MODEL_NAME)"
	@echo "  Port: $(PORT)"
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):8080 \
		-e AUDIO_INFERENCE_URL=$(AUDIO_INFERENCE_URL) \
		-e AUDIO_MODEL_NAME=$(AUDIO_MODEL_NAME) \
		-e LLM_INFERENCE_URL=$(LLM_INFERENCE_URL) \
		-e LLM_MODEL_NAME=$(LLM_MODEL_NAME) \
		-e PORT=8080 \
		$(IMAGE_NAME)
	@echo ""
	@echo "Container started successfully!"
	@echo "Access the application at: http://localhost:$(PORT)"
	@echo ""
	@echo "View logs with: make logs"
	@echo "Stop container with: make stop"

stop: ## Stop and remove the container
	@echo "Stopping container: $(CONTAINER_NAME)..."
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)
	@echo "Container stopped and removed."

clean: ## Stop container and remove image
	@echo "Cleaning up..."
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)
	-docker rmi $(IMAGE_NAME)
	@echo "Cleanup complete."

logs: ## Show application logs (follow mode)
	@echo "Showing logs for: $(CONTAINER_NAME)"
	@echo "Press Ctrl+C to exit log view"
	@echo "----------------------------------------"
	docker logs -f $(CONTAINER_NAME)

restart: stop run ## Restart the container

