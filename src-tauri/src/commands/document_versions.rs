use crate::models::document::Document;
use crate::services::database::Database;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentVersion {
    pub id: i64,
    pub version: i64,
    pub content: String,
    pub created_at: String,
}

#[tauri::command]
pub async fn get_document_versions(
    document_id: i64,
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<DocumentVersion>, String> {
    let db = db.lock().await;
    let limit = limit.unwrap_or(50);
    
    let versions = db.get_document_versions(document_id, limit)
        .map_err(|e| e.to_string())?;
    
    let result = versions
        .into_iter()
        .map(|(id, version, content, created_at)| DocumentVersion {
            id,
            version,
            content,
            created_at,
        })
        .collect();
    
    Ok(result)
}

#[tauri::command]
pub async fn restore_document_version(
    document_id: i64,
    version_id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Document, String> {
    let db = db.lock().await;
    db.restore_document_version(document_id, version_id)
        .map_err(|e| e.to_string())
}

