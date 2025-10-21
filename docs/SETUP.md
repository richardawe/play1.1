# 🚀 Play MVP - Setup Guide

This guide will help you set up the Play MVP development environment.

## Prerequisites

### Required

1. **Rust** (latest stable)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (v18 or higher)
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   ```

3. **System Dependencies**
   
   **macOS:**
   ```bash
   xcode-select --install
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.0-dev \
       build-essential \
       curl \
       wget \
       libssl-dev \
       libgtk-3-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev
   ```

   **Windows:**
   - Install [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Play
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# The Rust dependencies will be installed automatically when running Tauri
```

### 3. Development Mode

```bash
# Start the development server
npm run tauri:dev
```

This will:
- Start the Vite development server (frontend)
- Compile the Rust backend
- Launch the Tauri window

### 4. Build for Production

```bash
# Build for your current platform
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`

## Project Structure

```
Play/
├── src/                      # React frontend
│   ├── components/          # React components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utility functions
│   └── main.tsx            # Frontend entry point
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── main.rs         # Rust entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── tests/                  # Test files
├── docs/                   # Documentation
└── package.json            # Node.js dependencies
```

## Database

The SQLite database is automatically created on first run at:
- **macOS**: `~/Library/Application Support/play/data/play.db`
- **Windows**: `%APPDATA%/play/data/play.db`
- **Linux**: `~/.config/play/data/play.db`

## Testing

```bash
# Run unit tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Development Workflow

1. **Frontend development**: Edit files in `src/`
   - Hot reload is enabled
   - Changes reflect immediately

2. **Backend development**: Edit files in `src-tauri/src/`
   - Automatic recompilation on save
   - App will restart automatically

3. **Testing**: Write tests as you develop
   - Unit tests: `*.test.ts` or `*.test.tsx`
   - E2E tests: `tests/e2e/*.spec.ts`

## Common Issues

### Issue: Database locked
**Solution**: Close all instances of the app before running again

### Issue: Rust compilation errors
**Solution**: Clean and rebuild
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri:dev
```

### Issue: Frontend not loading
**Solution**: Ensure Vite server is running on port 1420
```bash
npm run dev
```

## Next Steps

After setup, refer to:
- [Product Requirements](./prd.md) - What we're building
- [Architecture](./ARCHITECTURE.md) - How it's built
- [Todo List](./todo.md) - Development roadmap
- [Project Guide](./PROJECT-GUIDE.md) - Complete reference

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Rust Documentation](https://www.rust-lang.org/learn)

---

**Status**: Phase 1 - Foundation in progress ✅

For questions or issues, refer to [PROJECT-GUIDE.md](./PROJECT-GUIDE.md)

