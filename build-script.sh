#!/bin/bash

# Custom build script to prevent WebKit installation issues
set -e

echo "Starting custom build process..."

# Set environment variables to prevent WebKit installation
export TAURI_PRIVATE_KEY=""
export TAURI_KEY_PASSWORD=""
export WEBKIT_DISABLE_INSTALL="true"
export CARGO_INCREMENTAL=0
export CARGO_NET_RETRY=2

# Get target from command line argument
TARGET=$1

if [ -z "$TARGET" ]; then
    echo "Error: No target specified"
    exit 1
fi

echo "Building for target: $TARGET"

# Build the frontend first
echo "Building frontend..."
npm run build

# Build the Tauri application
echo "Building Tauri application..."
npx tauri build --target "$TARGET" --verbose

echo "Build completed successfully!"
