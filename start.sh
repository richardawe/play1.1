#!/bin/bash

# Play v1.1 Startup Script
echo "🚀 Starting Play v1.1 - Offline-First AI Workspace"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first."
    echo "   Visit: https://rustup.rs/"
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install Ollama first."
    echo "   Visit: https://ollama.ai/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Ollama is running
if ! pgrep -f "ollama serve" > /dev/null; then
    echo "🤖 Starting Ollama..."
    # Start Ollama in background
    OLLAMA_HOST=0.0.0.0:8080 ollama serve &
    OLLAMA_PID=$!
    echo "Ollama started with PID: $OLLAMA_PID"
    
    # Wait a moment for Ollama to start
    sleep 3
fi

# Check if required models are installed
echo "🔍 Checking AI models..."
if ! ollama list | grep -q "llama3.2"; then
    echo "📥 Downloading llama3.2 model (this may take a while)..."
    ollama pull llama3.2
fi

if ! ollama list | grep -q "nomic-embed-text"; then
    echo "📥 Downloading nomic-embed-text model..."
    ollama pull nomic-embed-text
fi

echo "✅ AI models ready"

# Start the application
echo "🎯 Starting Play v1.1..."
npm run tauri:dev
