# Multi-stage build for Audio Transcription Application
# Using Red Hat Universal Base Image 9 (UBI9)

# Build Stage
FROM registry.access.redhat.com/ubi9/go-toolset:1.23 AS builder

# Set working directory
WORKDIR /opt/app-root/src

# Copy source files
COPY --chown=1001:0 server.go .

# Build the Go application
RUN go build -o transcription-server server.go

# Runtime Stage
FROM registry.access.redhat.com/ubi9/ubi-minimal:latest

# Install ca-certificates for HTTPS requests
RUN microdnf install -y ca-certificates && \
    microdnf clean all

# Create non-root user (UBI9 standard)
USER 1001

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder --chown=1001:0 /opt/app-root/src/transcription-server /app/transcription-server

# Copy static files
COPY --chown=1001:0 static /app/static

# Expose default port
EXPOSE 8080

# Set environment variables with defaults
ENV PORT=8080 \
    AUDIO_MODEL_NAME=whisper-1 \
    LLM_MODEL_NAME=gpt-3.5-turbo

# Run the application
CMD ["/app/transcription-server"]

