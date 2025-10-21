# 🤖 Ollama Setup Guide for AI Features

**Play MVP** includes AI-powered features that run **100% locally** using Ollama. No cloud APIs, no internet required!

---

## 📦 What is Ollama?

**Ollama** is a local LLM runtime - think of it as "Docker for AI models". It lets you run powerful language models on your own machine, completely offline.

- ✅ **100% Local** - No internet or API keys required
- ✅ **Privacy-First** - Your data never leaves your machine
- ✅ **Fast** - Runs on your CPU/GPU
- ✅ **Free & Open Source**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Ollama

**macOS** (Homebrew):
```bash
brew install ollama
```

**macOS/Windows/Linux** (Direct Download):
Visit: https://ollama.ai/download

### Step 2: Start Ollama Server

```bash
ollama serve
```

This starts a local server at `http://localhost:11434`

### Step 3: Download AI Models

**For Chat Summarization & Rewriting** (Required):
```bash
ollama pull llama3.2
```

**For Embeddings & Semantic Search** (Optional but recommended):
```bash
ollama pull nomic-embed-text
```

### Step 4: Test It!

```bash
ollama run llama3.2 "Hello, test message"
```

You should see a response! ✅

---

## 🎯 AI Features in Play

Once Ollama is running, you'll have these features:

### 1. **Chat Summarization** 💬
- Click "AI Summary" button in Chat
- Generates a concise summary of your conversation
- Model: `llama3.2`

### 2. **Document Rewriting** ✍️
- Click "AI Rewrite" in Documents
- Choose style: professional, casual, concise, etc.
- Model: `llama3.2`

### 3. **Task Generation** 📋
- Click "AI Generate" in Tasks
- Paste meeting notes or project description
- Automatically extracts action items
- Model: `llama3.2`

### 4. **Semantic Search** 🔍
- Search by meaning, not just keywords
- Example: "budget concerns" finds "financial worries"
- Model: `nomic-embed-text` (384-dim embeddings)

---

## 📊 Model Specs

| Model | Size | RAM Required | Speed | Use Case |
|-------|------|--------------|-------|----------|
| `llama3.2` | 2GB | 8GB | Fast | Chat, summarization, rewriting |
| `nomic-embed-text` | 274MB | 2GB | Very Fast | Embeddings, semantic search |

**Recommended:** 16GB RAM for smooth performance

---

## 🐛 Troubleshooting

### "AI features not working"

1. **Check if Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Should return JSON with installed models.

2. **Check if models are installed:**
   ```bash
   ollama list
   ```
   Should show `llama3.2` and optionally `nomic-embed-text`.

3. **Restart Ollama:**
   ```bash
   pkill ollama
   ollama serve
   ```

### "Connection refused"

Ollama server isn't running. Start it:
```bash
ollama serve
```

### "Model not found"

Download the required models:
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### "Too slow / high CPU usage"

- Use smaller model: `ollama pull llama3.2:1b` (1 billion parameters, faster)
- Close other apps to free up RAM
- Consider upgrading to 16GB+ RAM

---

## 🔧 Advanced Configuration

### Change Ollama Port (Optional)

If port 11434 is taken:
```bash
OLLAMA_HOST=0.0.0.0:8080 ollama serve
```

Then update `src-tauri/src/services/ollama.rs`:
```rust
OllamaService::new(Some("http://localhost:8080".to_string()))
```

### Use Different Models

Edit `src-tauri/src/services/ollama.rs` to change models:
```rust
// For summarization
self.generate("mistral", &prompt).await  // Instead of llama3.2

// For embeddings
self.generate_embedding("all-minilm", text)  // Instead of nomic-embed-text
```

---

## 📚 Recommended Models

### General Purpose
- `llama3.2` - Best balance of speed/quality
- `llama3.2:1b` - Faster, less RAM
- `mistral` - Alternative, good quality

### Embeddings
- `nomic-embed-text` - **Recommended** (384-dim, fast)
- `all-minilm` - Alternative (384-dim)
- `mxbai-embed-large` - Higher quality (1024-dim, slower)

### Try Other Models
Browse: https://ollama.ai/library

---

## 💡 Pro Tips

1. **Pre-load models:** Run `ollama run llama3.2` once to load into memory (faster subsequent calls)
2. **Background service:** Set Ollama to start on boot for convenience
3. **GPU acceleration:** Ollama automatically uses GPU if available (CUDA/Metal)
4. **Model switching:** You can swap models anytime without rebuilding the app

---

## 🔒 Privacy & Security

**Everything runs locally:**
- ✅ No data sent to cloud
- ✅ No API keys required
- ✅ Works offline
- ✅ GDPR/HIPAA friendly

**Your data stays on your machine:**
- AI embeddings: `~/Library/Application Support/play/vectors/`
- SQLite database: `~/Library/Application Support/play/data/`
- All processing: Local only

---

## 📞 Need Help?

1. **Ollama Docs:** https://github.com/ollama/ollama
2. **Model Library:** https://ollama.ai/library
3. **Discord:** https://discord.gg/ollama

---

**Quick Command Reference:**
```bash
# Start server
ollama serve

# List installed models
ollama list

# Download a model
ollama pull llama3.2

# Test a model
ollama run llama3.2 "test"

# Remove a model (free space)
ollama rm llama3.2
```

---

🎉 **Ready to use AI features!** They'll work automatically once Ollama is running.

