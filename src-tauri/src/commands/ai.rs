// AI Commands - Ollama integration
use crate::services::ollama::OllamaService;
use crate::services::vector_search_service::VectorSearchService;
use crate::services::database::Database;
use crate::models::vector_index::CreateVectorIndex;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn summarize(
    text: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let ollama = ollama.lock().await;
    ollama.summarize(&text).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn rewrite(
    text: String,
    style: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let ollama = ollama.lock().await;
    ollama.rewrite(&text, &style).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_tasks(
    text: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<String>, String> {
    let ollama = ollama.lock().await;
    ollama.generate_tasks(&text).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn chat_with_ai(
    user_message: String,
    conversation_history: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let ollama = ollama.lock().await;
    
    // Build context from conversation history
    let context = if conversation_history.is_empty() {
        format!("User: {}", user_message)
    } else {
        format!("Previous conversation:\n{}\n\nUser: {}", conversation_history, user_message)
    };
    
    // Generate AI response
    ollama.chat(&context).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_embedding(
    text: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<f32>, String> {
    let ollama = ollama.lock().await;
    ollama.generate_embedding("nomic-embed-text", &text).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn index_content(
    content_id: i64,
    content_type: String,
    text: String,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    // Generate embedding
    let ollama_guard = ollama.lock().await;
    let embedding = ollama_guard.generate_embedding("nomic-embed-text", &text).await.map_err(|e| e.to_string())?;
    drop(ollama_guard);
    
    // Store in vector database using VectorSearchService
    let db_guard = db.lock().await;
    let vector_service = VectorSearchService::new(&*db_guard, ollama.inner().clone());
    
    let create_entry = CreateVectorIndex {
        content_id,
        content_type,
        content: text,
        embedding_vector: embedding,
        model_name: "nomic-embed-text".to_string(),
        chunk_index: Some(0),
        metadata: Some("AI indexed content".to_string()),
    };
    
    vector_service.create_vector_entry(create_entry)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn semantic_search(
    query: String,
    limit: usize,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<(i64, String, f32)>, String> {
    // Generate query embedding
    let ollama_guard = ollama.lock().await;
    let query_embedding = ollama_guard.generate_embedding("nomic-embed-text", &query).await.map_err(|e| e.to_string())?;
    drop(ollama_guard);
    
    // Search using VectorSearchService
    let db_guard = db.lock().await;
    let vector_service = VectorSearchService::new(&*db_guard, ollama.inner().clone());
    
    let results = vector_service.similarity_search(query_embedding, limit as i64, 0.0)
        .map_err(|e| e.to_string())?;
    
    // Convert to the expected format
    let converted_results: Vec<(i64, String, f32)> = results
        .into_iter()
        .map(|result| (result.content_id, result.content, result.similarity_score))
        .collect();
    
    Ok(converted_results)
}

#[tauri::command]
pub async fn chat_with_context(
    query: String,
    context_docs: Vec<String>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let ollama = ollama.lock().await;
    
    let context = context_docs.join("\n\n");
    let prompt = format!(
        "Context from documents:\n{}\n\nUser question: {}\n\nPlease answer based on the context provided.",
        context, query
    );
    
    ollama.chat(&prompt).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_ollama_models(
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<String>, String> {
    let ollama = ollama.lock().await;
    ollama.list_models().await.map_err(|e| e.to_string())
}
