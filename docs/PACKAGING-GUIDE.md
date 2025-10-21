# 📦 Packaging Guide - Building Production App

**Play MVP** - Package as a standalone desktop application for macOS, Windows, and Linux.

---

## 🎯 Prerequisites

Before building:

1. ✅ All features implemented and tested
2. ✅ No compilation errors
3. ✅ App runs successfully in development (`npm run tauri:dev`)
4. ✅ Ollama installed (for AI features)
5. ✅ Code signing certificate (optional, for distribution)

---

## 🚀 Build Commands

### Development Build (Fast, for testing)

```bash
npm run tauri:build
```

This creates an **unsigned** build for testing:
- macOS: `.app` bundle + `.dmg` installer
- Windows: `.exe` installer
- Linux: `.AppImage`, `.deb`, `.rpm`

### Production Build (Optimized)

```bash
npm run tauri:build -- --release
```

Smaller file size, better performance, no debug symbols.

---

## 📁 Build Output

After building, find your app in:

```
src-tauri/target/release/
├── play-mvp (executable)
└── bundle/
    ├── macos/
    │   ├── Play.app
    │   └── Play.dmg
    ├── windows/
    │   └── Play_1.0.0_x64_en-US.msi
    └── linux/
        ├── play-mvp_1.0.0_amd64.AppImage
        ├── play-mvp_1.0.0_amd64.deb
        └── play-mvp_1.0.0-1.x86_64.rpm
```

---

## 🍎 macOS Specific

### Code Signing (for distribution)

1. **Get Apple Developer Certificate:**
   - Enroll in Apple Developer Program ($99/year)
   - Generate "Developer ID Application" certificate

2. **Update `tauri.conf.json`:**
   ```json
   {
     "tauri": {
       "bundle": {
         "macOS": {
           "signingIdentity": "Developer ID Application: Your Name (TEAMID)"
         }
       }
     }
   }
   ```

3. **Build with signing:**
   ```bash
   npm run tauri:build
   ```

4. **Notarize (for Gatekeeper):**
   ```bash
   xcrun notarytool submit src-tauri/target/release/bundle/macos/Play.dmg \
     --apple-id you@example.com \
     --password your-app-password \
     --team-id TEAMID
   ```

### Install Icon

Icons already configured in `src-tauri/icons/`. Tauri auto-generates all required sizes.

---

## 🪟 Windows Specific

### Code Signing (for SmartScreen)

1. **Get Code Signing Certificate:**
   - Purchase from SSL.com, DigiCert, etc.
   - Or use self-signed cert for testing

2. **Sign the .exe:**
   ```powershell
   signtool sign /f certificate.pfx /p password Play_1.0.0_x64_en-US.msi
   ```

3. **Update `tauri.conf.json`:**
   ```json
   {
     "tauri": {
       "bundle": {
         "windows": {
           "certificateThumbprint": "YOUR_THUMBPRINT",
           "digestAlgorithm": "sha256"
         }
       }
     }
   }
   ```

---

## 🐧 Linux Specific

### AppImage (Recommended)

Most universal format - works on all distributions:

```bash
chmod +x play-mvp_1.0.0_amd64.AppImage
./play-mvp_1.0.0_amd64.AppImage
```

### Debian/Ubuntu (.deb)

```bash
sudo dpkg -i play-mvp_1.0.0_amd64.deb
```

### Fedora/RHEL (.rpm)

```bash
sudo rpm -i play-mvp_1.0.0-1.x86_64.rpm
```

---

## 📊 Build Optimizations

### Reduce Bundle Size

1. **Remove unused dependencies:**
   ```bash
   npm prune --production
   ```

2. **Update `Cargo.toml` release profile:**
   ```toml
   [profile.release]
   opt-level = "z"     # Optimize for size
   lto = true          # Link-time optimization
   codegen-units = 1   # Better optimization
   strip = true        # Remove debug symbols
   ```

3. **Minimize frontend assets:**
   - Already using Vite for tree-shaking
   - Tailwind CSS purges unused styles

### Build Times

Expect:
- **First build**: 5-10 minutes (compiles all dependencies)
- **Subsequent builds**: 30-60 seconds (incremental)

---

## 🧪 Test the Build

Before distributing:

1. **Install on a clean machine** (no dev tools)
2. **Test all features:**
   - Chat, Documents, Tasks, Calendar
   - AI features (requires Ollama)
   - Settings and themes
   - File attachments
   - Database persistence

3. **Check file paths:**
   - Data stored in correct app directory
   - No hardcoded development paths

4. **Test offline mode:**
   - Disconnect from internet
   - All features still work ✅

---

## 📋 Distribution Checklist

Before releasing:

### Code Quality
- [ ] All tests pass
- [ ] No console errors
- [ ] No linter warnings
- [ ] README.md updated
- [ ] CHANGELOG.md created

### Build
- [ ] Production build succeeds
- [ ] App launches without errors
- [ ] File size reasonable (<100MB)
- [ ] Icons display correctly

### Testing
- [ ] Fresh install works
- [ ] Data persists across restarts
- [ ] Settings save correctly
- [ ] All modules functional

### Documentation
- [ ] User guide (README.md)
- [ ] Ollama setup instructions
- [ ] Known issues documented
- [ ] Version number updated

### Legal
- [ ] LICENSE file included
- [ ] Third-party licenses acknowledged
- [ ] Privacy policy (if distributing)

---

## 🌐 Distribution Options

### Option 1: GitHub Releases (Free)

1. Create release on GitHub
2. Upload .dmg, .exe, .AppImage
3. Users download directly

**Pros**: Free, simple  
**Cons**: No auto-updates

### Option 2: Homebrew (macOS)

```bash
brew tap your-org/play
brew install play
```

**Pros**: Easy for Mac users  
**Cons**: Requires maintenance

### Option 3: Microsoft Store / Mac App Store

**Pros**: Discovery, credibility  
**Cons**: Review process, fees

### Option 4: Self-Hosted

Host builds on your own server/CDN.

---

## 🔄 Auto-Updates (Future Enhancement)

Tauri supports auto-updates via:

1. **Update server:** Host JSON manifest with latest version
2. **Update `tauri.conf.json`:**
   ```json
   {
     "tauri": {
       "updater": {
         "active": true,
         "endpoints": ["https://releases.your-domain.com/{{target}}/{{current_version}}"]
       }
     }
   }
   ```

3. **Check for updates on launch**

---

## 📊 Expected Build Sizes

| Platform | Size | Notes |
|----------|------|-------|
| macOS .dmg | ~20MB | Universal (Intel + ARM) |
| Windows .msi | ~15MB | x64 only |
| Linux .AppImage | ~18MB | Includes runtime |

All sizes **after compression**. Actual installed size ~50-80MB.

---

## 🎯 Quick Build & Test

```bash
# Clean build
rm -rf src-tauri/target/release/bundle
npm run tauri:build

# Test the app
open src-tauri/target/release/bundle/macos/Play.app
# or on Windows: start src-tauri/target/release/bundle/msi/Play.msi
# or on Linux: ./src-tauri/target/release/bundle/appimage/play-mvp.AppImage
```

---

## 🔒 Security Notes

- ✅ App runs in **sandbox mode** (limited system access)
- ✅ All data stored in **app-specific directories**
- ✅ SQLite database **encrypted** with SQLCipher
- ✅ No network access (except Ollama on localhost)
- ✅ File system access limited to app data folder

---

## 📝 Post-Build

After building:

1. **Test on target platforms**
2. **Create release notes** (CHANGELOG.md)
3. **Update version number** in `package.json` and `Cargo.toml`
4. **Tag release** in Git
5. **Upload to distribution platform**

---

## 🎉 You're Ready!

Your app is:
- ✅ Fully offline
- ✅ Privacy-focused
- ✅ AI-powered
- ✅ Cross-platform
- ✅ Production-ready

**Build it and ship it!** 🚀

