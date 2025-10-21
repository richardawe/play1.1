# GitHub Actions Setup for Multi-Platform Builds

This repository uses GitHub Actions to automatically build the Play application for multiple platforms.

## Workflows

### 1. Build Workflow (`.github/workflows/build.yml`)

**Triggers:**
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches
- Manual trigger via GitHub UI

**Builds for:**
- **macOS**: `aarch64-apple-darwin` → DMG installer
- **Linux**: `x86_64-unknown-linux-gnu` → AppImage
- **Windows**: `x86_64-pc-windows-msvc` → MSI installer

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push tags starting with `v*` (e.g., `v1.0.0`)

**Actions:**
- Builds for all platforms
- Creates a GitHub release
- Uploads platform-specific installers

## How to Use

### Automatic Builds

1. **Push to main branch**: Automatically builds for all platforms
2. **Create pull request**: Builds for all platforms to test changes
3. **Manual trigger**: Go to Actions tab → Select workflow → Run workflow

### Creating Releases

1. **Tag a version:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub automatically:**
   - Builds for all platforms
   - Creates a release with the tag name
   - Uploads installers for download

### Downloading Builds

**From Actions:**
1. Go to Actions tab
2. Click on a successful workflow run
3. Download artifacts from the bottom of the page

**From Releases:**
1. Go to Releases page
2. Download the latest release
3. Choose your platform's installer

## Build Artifacts

### macOS
- **File**: `Play-macos-aarch64.dmg`
- **Format**: DMG disk image
- **Installation**: Double-click to mount and drag to Applications

### Linux
- **File**: `Play-linux-x86_64.AppImage`
- **Format**: AppImage (portable)
- **Installation**: Make executable and run: `chmod +x Play-linux-x86_64.AppImage && ./Play-linux-x86_64.AppImage`

### Windows
- **File**: `Play-windows-x86_64.msi`
- **Format**: MSI installer
- **Installation**: Double-click to install

## Troubleshooting

### Build Failures

1. **Check the Actions tab** for error details
2. **Common issues:**
   - Missing system dependencies
   - Rust toolchain issues
   - Node.js version conflicts

### Local Testing

To test builds locally:

```bash
# macOS
npm run tauri build

# Linux (requires cross-compilation setup)
npm run tauri build -- --target x86_64-unknown-linux-gnu

# Windows (requires cross-compilation setup)
npm run tauri build -- --target x86_64-pc-windows-msvc
```

## Configuration

### System Dependencies

The workflows automatically install required dependencies:

**Ubuntu:**
- `libwebkit2gtk-4.0-dev`
- `libssl-dev`
- `libgtk-3-dev`
- `libayatana-appindicator3-dev`
- `librsvg2-dev`

**macOS:**
- `webkit2gtk` (via Homebrew)

**Windows:**
- Uses pre-installed dependencies

### Build Targets

- **macOS**: `aarch64-apple-darwin` (Apple Silicon)
- **Linux**: `x86_64-unknown-linux-gnu` (x86_64)
- **Windows**: `x86_64-pc-windows-msvc` (x86_64)

## Security

- Uses `GITHUB_TOKEN` for releases
- No additional secrets required
- All builds run in isolated environments
