# AI Mentor - User Guide

## 🎓 **AI Mentor with Real Ollama Integration!**

The AI Mentor is now **fully integrated with Ollama** and provides real AI-powered educational assistance!

---

## 🚀 **How to Use**

### **Access the AI Mentor:**
1. Click **"AI Mentor"** in the sidebar (🎓 icon)
2. Choose a mode (Explain, Improve, or Learn)
3. Type your question
4. Press Enter or click "Ask"
5. **Get real AI responses from Ollama!** ✨

---

## 🎯 **Three Learning Modes**

### 1. **Explain Mode** 💡
Ask the AI to explain concepts in simple terms.

**Try these questions:**
- "Explain how AI works"
- "What is machine learning?"
- "How do language models generate text?"
- "Why does AI sometimes make mistakes?"

**The AI will:**
- Explain concepts clearly
- Use analogies and examples
- Be encouraging and patient
- Help you understand AI

### 2. **Improve Mode** ✨
Get AI-powered suggestions to improve your prompts.

**Try these:**
- Paste any prompt you use
- "write code" (AI will suggest improvements)
- "summarize this text" (AI will make it more specific)
- "generate tasks" (AI will add context)

**The AI will:**
- Provide an improved version
- Explain what makes a good prompt
- List specific improvements
- Show before/after examples

### 3. **Learn Mode** 📚
Interactive AI literacy education.

**Try these:**
- "Teach me about AI ethics"
- "How can I use AI effectively?"
- "What are the limitations of AI?"
- "Best practices for prompt engineering"

**The AI will:**
- Teach you about AI
- Use interactive examples
- Check your understanding
- Make learning fun

---

## 🧪 **Testing the AI Mentor**

### **Option 1: Use the UI** (Recommended)
1. Click "AI Mentor" in sidebar
2. Type: "Explain how AI works"
3. Press Enter
4. See real AI response! ✨

### **Option 2: Console Testing**
```javascript
// Test AI Mentor
window.P2PTest.testAIMentor()

// Test Prompt Improvement
window.P2PTest.testPromptImprovement()
```

### **Option 3: Direct Command**
```javascript
// Ask a question
const response = await window.__TAURI__.tauri.invoke('chat_with_mentor', {
  userMessage: 'What is artificial intelligence?',
  mode: 'explain',
  conversationHistory: ''
});
console.log('Response:', response);
```

---

## ✨ **Example Conversations**

### **Explain Mode:**
```
You: "Explain how AI works"

AI Mentor: "AI works by learning patterns from data, similar to how you learn 
from experience. When you see many examples of cats, you learn what makes 
something a cat. AI does the same thing with numbers and patterns..."
```

### **Improve Mode:**
```
You: "write code"

AI Mentor: 
IMPROVED: "Write Python code that creates a REST API with FastAPI, 
including endpoints for CRUD operations on a User model"

EXPLANATION: A good prompt specifies the programming language, 
framework, and desired functionality clearly.

IMPROVEMENTS:
- Specified programming language (Python)
- Named the framework (FastAPI)
- Described the exact functionality needed
```

### **Learn Mode:**
```
You: "Teach me about prompt engineering"

AI Mentor: "Prompt engineering is the art of asking AI the right questions!
Think of it like giving directions to a helpful but literal friend...
Let's start with the basics..."
```

---

## 💡 **Tips for Best Results**

### **For Explain Mode:**
- ✅ Ask specific questions
- ✅ Request simple explanations
- ✅ Ask follow-up questions
- ✅ Request examples

### **For Improve Mode:**
- ✅ Paste your actual prompts
- ✅ Be open to suggestions
- ✅ Try the improved versions
- ✅ Learn from the feedback

### **For Learn Mode:**
- ✅ Start with basics
- ✅ Build on previous knowledge
- ✅ Ask for practice exercises
- ✅ Request resources

---

## 🔧 **Advanced Features**

### **Conversation History:**
The AI Mentor remembers your conversation within the session, so you can:
- Ask follow-up questions
- Reference previous answers
- Have natural conversations
- Build on what you've learned

### **Mode Switching:**
You can switch modes anytime:
- Switch from Explain to Improve
- Try different modes for the same topic
- Compare different perspectives

### **Learning Tracking:**
Your AI usage is tracked (locally only) to:
- Show your progress
- Suggest next topics
- Adapt to your level
- Provide personalized paths

---

## 🐛 **Troubleshooting**

### **AI Mentor not responding?**
**Check:**
1. Is Ollama running? (`ps aux | grep ollama`)
2. Is llama3.2 model installed? (Check in AI Chat)
3. Any errors in console?

**Solutions:**
- Restart Ollama: Settings → re-check setup
- Check terminal for Ollama errors
- Try the test command: `window.P2PTest.testAIMentor()`

### **Slow responses?**
- This is normal - AI generation takes time
- Wait for the "thinking..." animation
- Larger models are slower but better

### **Generic responses?**
- Be more specific in your questions
- Provide context
- Use follow-up questions
- Try different modes

---

## 🎯 **What Makes This Special**

### **Real AI:**
- ✅ Powered by Ollama (your local AI)
- ✅ Uses llama3.2 model
- ✅ Private - runs on your machine
- ✅ No cloud API calls

### **Educational:**
- ✅ Designed for learning
- ✅ Encouraging and patient
- ✅ Adaptive to your level
- ✅ Interactive and engaging

### **Integrated:**
- ✅ Part of Play's ecosystem
- ✅ Shares your AI models
- ✅ Works offline
- ✅ Privacy-first

---

## 🎉 **Try It Now!**

1. Open Play
2. Click "AI Mentor" in sidebar
3. Type: **"Explain how AI understands language"**
4. Press Enter
5. **See real AI-generated educational content!** 🎓

**The AI Mentor is ready to help you become AI-literate!** ✨

---

## 📊 **What You Can Learn**

Topics the AI Mentor can help with:
- ✅ How AI works
- ✅ Machine learning basics
- ✅ Prompt engineering
- ✅ AI ethics
- ✅ Language models
- ✅ Neural networks
- ✅ AI limitations
- ✅ Best practices
- ✅ And much more!

---

**Happy Learning! The AI Mentor is here to help you understand AI! 🎓✨**


