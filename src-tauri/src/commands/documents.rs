use crate::models::document::{CreateDocument, Document, UpdateDocument};
use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_document(
    document: CreateDocument,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Document, String> {
    let db = db.lock().await;
    db.create_document(document).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_document(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Document, String> {
    let db = db.lock().await;
    db.get_document(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_documents(
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<Document>, String> {
    let db = db.lock().await;
    let limit = limit.unwrap_or(100);
    db.get_all_documents(limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_document(
    id: i64,
    update: UpdateDocument,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Document, String> {
    let db = db.lock().await;
    db.update_document(id, update).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_document(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_document(id).map_err(|e| e.to_string())
}

