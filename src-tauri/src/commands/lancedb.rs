use crate::models::vector_index::{VectorIndex, CreateVectorIndex, SimilaritySearchResult, VectorIndexStats};
use crate::services::lancedb_service::LanceDBService;
use crate::services::database::Database;
// use crate::services::ollama::OllamaService;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_lancedb_entry(
    entry: CreateVectorIndex,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<VectorIndex, String> {
    let service = lancedb.lock().await;
    service
        .create_vector_entry(entry)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_similarity_search(
    query_vector: Vec<f32>,
    limit: i64,
    threshold: f32,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<Vec<SimilaritySearchResult>, String> {
    let service = lancedb.lock().await;
    service
        .similarity_search(query_vector, limit, threshold)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_generate_embedding(
    text: String,
    model: Option<String>,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<Vec<f32>, String> {
    let service = lancedb.lock().await;
    service
        .generate_embedding(&text, model.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_index_content(
    content_id: i64,
    content_type: String,
    content: String,
    model: Option<String>,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<Vec<VectorIndex>, String> {
    let service = lancedb.lock().await;
    service
        .index_content(content_id, &content_type, &content, model.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_search_similar_content(
    query: String,
    limit: i64,
    threshold: f32,
    model: Option<String>,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<Vec<SimilaritySearchResult>, String> {
    let service = lancedb.lock().await;
    service
        .search_similar_content(&query, limit, threshold, model.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_get_stats(
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<VectorIndexStats, String> {
    let service = lancedb.lock().await;
    service
        .get_vector_stats()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_delete_content_vectors(
    content_id: i64,
    content_type: String,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<(), String> {
    let service = lancedb.lock().await;
    service
        .delete_content_vectors(content_id, &content_type)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_delete_entry(
    id: i64,
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<(), String> {
    let service = lancedb.lock().await;
    service
        .delete_vector_entry(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_migrate_from_sqlite(
    _db: State<'_, Arc<Mutex<Database>>>,
    _lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<i64, String> {
    // For now, return 0 as we're using in-memory storage
    // TODO: Implement actual migration when LanceDB is properly integrated
    Ok(0)
}

#[tauri::command]
pub async fn lancedb_get_all_entries(
    _db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<Vec<VectorIndex>, String> {
    let service = lancedb.lock().await;
    service
        .get_all_entries()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn lancedb_clear_database(
    db: State<'_, Arc<Mutex<Database>>>,
    lancedb: State<'_, Arc<Mutex<LanceDBService>>>,
) -> Result<(), String> {
    let service = lancedb.lock().await;
    service
        .clear_database()
        .await
        .map_err(|e| e.to_string())
}
