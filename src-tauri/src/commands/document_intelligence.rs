use crate::services::document_intelligence_service::{DocumentIntelligenceService, DocumentIntelligenceStats};
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::path::PathBuf;

#[tauri::command]
pub async fn process_document_intelligence(
    document_id: i64,
    content: String,
    title: String,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::models::vector_index::SimilaritySearchResult>, String> {
    let lancedb_path = PathBuf::from("data/lancedb");
    let service = DocumentIntelligenceService::new(&lancedb_path, db.inner().clone(), ollama.inner().clone()).await?;
    
    service
        .process_document(document_id, &content, &title)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn auto_tag_document(
    content: String,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<String>, String> {
    let lancedb_path = PathBuf::from("data/lancedb");
    let service = DocumentIntelligenceService::new(&lancedb_path, db.inner().clone(), ollama.inner().clone()).await?;
    
    service
        .auto_tag_document(&content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn summarize_document(
    content: String,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let lancedb_path = PathBuf::from("data/lancedb");
    let service = DocumentIntelligenceService::new(&lancedb_path, db.inner().clone(), ollama.inner().clone()).await?;
    
    service
        .summarize_document(&content)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn find_related_documents(
    document_id: i64,
    limit: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::models::vector_index::SimilaritySearchResult>, String> {
    let lancedb_path = PathBuf::from("data/lancedb");
    let service = DocumentIntelligenceService::new(&lancedb_path, db.inner().clone(), ollama.inner().clone()).await?;
    
    service
        .find_related_documents(document_id, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn process_all_documents_intelligence(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<i64, String> {
    let lancedb_path = PathBuf::from("data/lancedb");
    let service = DocumentIntelligenceService::new(&lancedb_path, db.inner().clone(), ollama.inner().clone()).await?;
    
    service
        .process_all_documents()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_document_intelligence_stats(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<DocumentIntelligenceStats, String> {
    let lancedb_path = PathBuf::from("data/lancedb");
    let service = DocumentIntelligenceService::new(&lancedb_path, db.inner().clone(), ollama.inner().clone()).await?;
    
    service
        .get_intelligence_stats()
        .await
        .map_err(|e| e.to_string())
}


