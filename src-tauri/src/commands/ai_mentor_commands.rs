use crate::services::ai_mentor::{AIMentorService, MentorResponse, PromptSuggestion};
use crate::services::ollama::OllamaService;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

pub type AIMentorServiceState = Arc<Mutex<AIMentorService>>;

#[tauri::command]
pub async fn explain_ai_output(
    context: String,
    output: String,
    _service: State<'_, AIMentorServiceState>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<MentorResponse, String> {
    let ollama = ollama.lock().await;
    
    // Create educational prompt
    let prompt = format!(
        "You are an AI mentor helping users understand AI systems.\n\n\
        Context: {}\n\
        AI Output: {}\n\n\
        Explain in simple terms:\n\
        1. Why the AI generated this output\n\
        2. What patterns it recognized\n\
        3. How the user can get better results\n\n\
        Keep it educational and encouraging.",
        context, output
    );
    
    let explanation = ollama.generate("llama3.2", &prompt)
        .await
        .unwrap_or_else(|_| "Unable to generate explanation. The AI service may be unavailable.".to_string());
    
    Ok(MentorResponse {
        explanation,
        suggestion: Some("Try providing more specific context for better results.".to_string()),
        learning_resources: vec![
            "Understanding AI Prompts".to_string(),
            "Context in AI Systems".to_string(),
        ],
        difficulty_level: crate::services::ai_mentor::DifficultyLevel::Beginner,
    })
}

#[tauri::command]
pub async fn suggest_prompt_improvement(
    prompt: String,
    _service: State<'_, AIMentorServiceState>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<PromptSuggestion, String> {
    let ollama = ollama.lock().await;
    
    // Ask AI to improve the prompt
    let ai_prompt = format!(
        "You are an AI prompt engineering expert. Analyze this prompt and suggest improvements.\n\n\
        Original prompt: \"{}\"\n\n\
        Provide:\n\
        1. An improved version of the prompt\n\
        2. A brief explanation of what makes a good prompt\n\
        3. 3 specific improvements you made\n\n\
        Format as:\n\
        IMPROVED: <improved prompt>\n\
        EXPLANATION: <explanation>\n\
        IMPROVEMENTS:\n\
        - <improvement 1>\n\
        - <improvement 2>\n\
        - <improvement 3>",
        prompt
    );
    
    let ai_response = ollama.generate("llama3.2", &ai_prompt)
        .await
        .unwrap_or_else(|_| format!("IMPROVED: {} (Please be specific and provide context)\nEXPLANATION: Add more details to your prompt.\nIMPROVEMENTS:\n- Add context\n- Be specific\n- Include examples", prompt));
    
    // Parse AI response
    let improved = ai_response
        .lines()
        .find(|l| l.starts_with("IMPROVED:"))
        .and_then(|l| l.strip_prefix("IMPROVED:"))
        .unwrap_or(&prompt)
        .trim()
        .to_string();
    
    let explanation = ai_response
        .lines()
        .find(|l| l.starts_with("EXPLANATION:"))
        .and_then(|l| l.strip_prefix("EXPLANATION:"))
        .unwrap_or("A good prompt includes context, specificity, and clear expectations.")
        .trim()
        .to_string();
    
    let improvements: Vec<String> = ai_response
        .lines()
        .skip_while(|l| !l.starts_with("IMPROVEMENTS:"))
        .skip(1)
        .filter(|l| l.trim().starts_with("-"))
        .map(|l| l.trim().trim_start_matches("-").trim().to_string())
        .take(3)
        .collect();
    
    let improvements = if improvements.is_empty() {
        vec![
            "Add more specific details".to_string(),
            "Clarify the desired output format".to_string(),
            "Include relevant context".to_string(),
        ]
    } else {
        improvements
    };
    
    Ok(PromptSuggestion {
        original: prompt,
        improved,
        explanation,
        improvements,
    })
}

#[tauri::command]
pub async fn get_learning_path(
    service: State<'_, AIMentorServiceState>,
) -> Result<Vec<String>, String> {
    let service = service.lock().await;
    Ok(service.generate_learning_path())
}

#[tauri::command]
pub async fn generate_ai_quiz(
    topic: String,
    service: State<'_, AIMentorServiceState>,
) -> Result<Vec<String>, String> {
    let service = service.lock().await;
    Ok(service.generate_quiz(&topic))
}

#[tauri::command]
pub async fn track_ai_feature_usage(
    feature: String,
    service: State<'_, AIMentorServiceState>,
) -> Result<(), String> {
    let mut service = service.lock().await;
    service.track_feature_usage(feature);
    Ok(())
}

#[tauri::command]
pub async fn chat_with_mentor(
    user_message: String,
    mode: String,
    conversation_history: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let ollama = ollama.lock().await;
    
    // Create context based on mode
    let system_prompt = match mode.as_str() {
        "explain" => {
            "You are an AI mentor helping users understand AI concepts. \
            Explain things clearly and simply. Use analogies and examples. \
            Be encouraging and patient."
        }
        "improve" => {
            "You are an AI prompt engineering expert. Help users write better prompts. \
            Provide specific, actionable advice. Show before/after examples. \
            Be constructive and helpful."
        }
        "learn" => {
            "You are an AI literacy educator. Teach users about AI in an engaging way. \
            Use interactive examples. Check understanding. \
            Make learning fun and practical."
        }
        _ => "You are a helpful AI mentor."
    };
    
    // Build full context
    let full_prompt = if conversation_history.is_empty() {
        format!("{}\n\nUser: {}", system_prompt, user_message)
    } else {
        format!("{}\n\nPrevious conversation:\n{}\n\nUser: {}", 
            system_prompt, conversation_history, user_message)
    };
    
    // Generate AI response
    ollama.generate("llama3.2", &full_prompt)
        .await
        .map_err(|e| e.to_string())
}

