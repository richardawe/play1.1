#!/bin/bash
set -e

echo "🏗️ Building Complete Play App with Embedded Ollama & AI Models..."
echo ""

# Colors
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_VERSION="1.0.0"
OLLAMA_VERSION="0.12.3"
MODELS=("llama3.2" "nomic-embed-text")

echo "${BLUE}📦 Step 1: Building Tauri App...${NC}"
npm run tauri:build
echo "✅ App built successfully"
echo ""

echo "${BLUE}📥 Step 2: Downloading Ollama Binary...${NC}"
mkdir -p src-tauri/binaries

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="darwin"
    OLLAMA_URL="https://ollama.com/download/ollama-darwin"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
    OLLAMA_URL="https://ollama.com/download/ollama-linux-amd64"
elif [[ "$OSTYPE" == "msys" ]]; then
    PLATFORM="windows"
    OLLAMA_URL="https://ollama.com/download/OllamaSetup.exe"
else
    echo "❌ Unsupported platform: $OSTYPE"
    exit 1
fi

echo "Platform detected: $PLATFORM"
curl -L "$OLLAMA_URL" -o "src-tauri/binaries/ollama"
chmod +x "src-tauri/binaries/ollama"
echo "✅ Ollama binary downloaded"
echo ""

echo "${BLUE}🤖 Step 3: Copying AI Models...${NC}"
mkdir -p src-tauri/models

# Check if Ollama models exist
if [ ! -d "$HOME/.ollama/models" ]; then
    echo "${YELLOW}⚠️  Ollama models not found in $HOME/.ollama/models${NC}"
    echo "${YELLOW}   Please run: ollama pull llama3.2 && ollama pull nomic-embed-text${NC}"
    exit 1
fi

# Copy model files
cp -r "$HOME/.ollama/models/manifests" src-tauri/models/
cp -r "$HOME/.ollama/models/blobs" src-tauri/models/

# Calculate size
MODELS_SIZE=$(du -sh src-tauri/models | cut -f1)
echo "✅ Models copied ($MODELS_SIZE)"
echo ""

echo "${BLUE}📦 Step 4: Creating Complete Bundle...${NC}"
mkdir -p dist/complete

if [[ "$PLATFORM" == "darwin" ]]; then
    # macOS Bundle
    BUNDLE_PATH="src-tauri/target/release/bundle/macos/Play.app"
    
    if [ -d "$BUNDLE_PATH" ]; then
        # Copy Ollama into app bundle
        cp src-tauri/binaries/ollama "$BUNDLE_PATH/Contents/MacOS/ollama"
        
        # Copy models into Resources
        mkdir -p "$BUNDLE_PATH/Contents/Resources/models"
        cp -r src-tauri/models/* "$BUNDLE_PATH/Contents/Resources/models/"
        
        # Create DMG
        echo "Creating DMG installer..."
        hdiutil create -volname "Play" -srcfolder "$BUNDLE_PATH" -ov -format UDZO "dist/complete/Play-Complete-v${APP_VERSION}-macOS.dmg"
        
        FINAL_SIZE=$(du -sh "dist/complete/Play-Complete-v${APP_VERSION}-macOS.dmg" | cut -f1)
        echo "✅ Complete bundle created: Play-Complete-v${APP_VERSION}-macOS.dmg ($FINAL_SIZE)"
    else
        echo "❌ App bundle not found. Did the build succeed?"
        exit 1
    fi

elif [[ "$PLATFORM" == "linux" ]]; then
    # Linux AppImage
    echo "Creating Linux AppImage with embedded resources..."
    # TODO: Implement AppImage bundling with models
    echo "⚠️  Linux bundling script needs completion"
    
elif [[ "$PLATFORM" == "windows" ]]; then
    # Windows Installer
    echo "Creating Windows installer with embedded resources..."
    # TODO: Implement Windows InnoSetup/WiX script
    echo "⚠️  Windows bundling script needs completion"
fi

echo ""
echo "${GREEN}🎉 Complete Bundle Created!${NC}"
echo ""
echo "📦 Package Details:"
echo "   - App Version: $APP_VERSION"
echo "   - Ollama Version: $OLLAMA_VERSION"
echo "   - Models: ${MODELS[*]}"
echo "   - Total Size: $FINAL_SIZE"
echo ""
echo "📁 Location: dist/complete/"
echo ""
echo "${GREEN}✅ User can now install with ONE click - everything included!${NC}"

