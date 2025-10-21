use crate::models::vector_index::{CreateVectorIndex, SimilaritySearchResult, VectorIndexStats};
use crate::services::vector_search_service::VectorSearchService;
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_vector_entry(
    entry: CreateVectorIndex,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<crate::models::vector_index::VectorIndex, String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .create_vector_entry(entry)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_vector_entry(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<crate::models::vector_index::VectorIndex, String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .get_vector_entry(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_entries_for_content(
    content_id: i64,
    content_type: String,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::models::vector_index::VectorIndex>, String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .get_entries_for_content(content_id, &content_type)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn similarity_search(
    query_vector: Vec<f32>,
    limit: i64,
    threshold: f32,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<SimilaritySearchResult>, String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .similarity_search(query_vector, limit, threshold)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_vector_embedding(
    text: String,
    _model: Option<String>,
    _db: State<'_, Arc<Mutex<Database>>>,
    _ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<f32>, String> {
    
    // Generate a sophisticated hash-based embedding
    let mut embedding = Vec::new();
    
    // Create multiple hash functions for better distribution
    let text_bytes = text.as_bytes();
    let mut hash1: u32 = 0;
    let mut hash2: u32 = 0;
    let mut hash3: u32 = 0;
    
    for (i, &byte) in text_bytes.iter().enumerate() {
        hash1 = hash1.wrapping_add(byte as u32).wrapping_mul(31);
        hash2 = hash2.wrapping_add((byte as u32) << (i % 8));
        hash3 = hash3.wrapping_sub(byte as u32).wrapping_mul(17);
    }
    
    // Generate 384-dimensional embedding
    for i in 0..384 {
        let seed = match i % 3 {
            0 => hash1.wrapping_add(i as u32),
            1 => hash2.wrapping_add(i as u32),
            _ => hash3.wrapping_add(i as u32),
        };
        
        // Create more varied values
        let value1 = (seed as f32 / 1000.0).sin();
        let value2 = ((seed * 7) as f32 / 1000.0).cos();
        let value = (value1 + value2) / 2.0;
        
        embedding.push(value);
    }
    
    // Normalize the vector
    let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for val in &mut embedding {
            *val /= norm;
        }
    }
    
    Ok(embedding)
}

#[tauri::command]
pub async fn index_vector_content(
    content_id: i64,
    content_type: String,
    content: String,
    _model: Option<String>,
    db: State<'_, Arc<Mutex<Database>>>,
    _ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::models::vector_index::VectorIndex>, String> {
    
    // Generate embedding for the content
    let embedding = generate_vector_embedding(content.clone(), None, db.clone(), _ollama.clone()).await?;
    
    // Create vector index entry
    let create_entry = crate::models::vector_index::CreateVectorIndex {
        content_id,
        content_type,
        content: content.clone(),
        embedding_vector: embedding,
        model_name: "simple-hash".to_string(),
        chunk_index: Some(0),
        metadata: Some(format!("Content length: {}", content.len())),
    };
    
    // Save to database
    let db_guard = db.lock().await;
    let vector_service = VectorSearchService::new(&*db_guard, _ollama.inner().clone());
    
    let entry = vector_service.create_vector_entry(create_entry).map_err(|e| e.to_string())?;
    
    Ok(vec![entry])
}

#[tauri::command]
pub async fn search_similar_content(
    query: String,
    limit: i64,
    threshold: f32,
    _model: Option<String>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<SimilaritySearchResult>, String> {
    
    println!("Backend: Starting search for query: '{}'", query);
    println!("Backend: Search params - limit: {}, threshold: {}", limit, threshold);
    
    // Generate proper embedding using Ollama
    let ollama_guard = ollama.lock().await;
    println!("Backend: Generating embedding for query...");
    let query_embedding = ollama_guard.generate_embedding("nomic-embed-text", &query)
        .await
        .map_err(|e| e.to_string())?;
    drop(ollama_guard);
    
    println!("Backend: Generated query embedding with {} dimensions", query_embedding.len());
    
    // Perform similarity search
    let db_guard = db.lock().await;
    let vector_service = VectorSearchService::new(&*db_guard, ollama.inner().clone());
    
    println!("Backend: Performing similarity search...");
    let results = vector_service.similarity_search(query_embedding, limit, threshold).map_err(|e| e.to_string())?;
    
    println!("Backend: Found {} search results", results.len());
    
    Ok(results)
}

#[tauri::command]
pub async fn get_vector_stats(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<VectorIndexStats, String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .get_vector_stats()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_content_vectors(
    content_id: i64,
    content_type: String,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .delete_content_vectors(content_id, &content_type)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_vector_entry(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .delete_vector_entry(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_ollama_connection(
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<bool, String> {
    let ollama = ollama.lock().await;
    ollama.check_connection().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_vector_entries(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::models::vector_index::VectorIndex>, String> {
    let db = db.lock().await;
    let vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    vector_service
        .get_all_entries()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_vector_database(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<i64, String> {
    let db = db.lock().await;
    let _vector_service = VectorSearchService::new(&*db, ollama.inner().clone());
    
    // Get count before deletion
    let conn = db.get_connection();
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM vector_index", 
        [], 
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    // Clear all vector entries
    conn.execute("DELETE FROM vector_index", []).map_err(|e| e.to_string())?;
    
    Ok(count)
}
