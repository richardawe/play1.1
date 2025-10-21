use crate::services::database::Database;
use crate::services::file_manager::{FileManager, FileMetadata};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn upload_file(
    filename: String,
    content: Vec<u8>,
    mimetype: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<FileMetadata, String> {
    let db = db.lock().await;
    let file_manager = FileManager::new(db.get_connection())
        .map_err(|e| e.to_string())?;
    
    file_manager.save_file(&filename, &content, &mimetype)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_file_metadata(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<FileMetadata, String> {
    let db = db.lock().await;
    let file_manager = FileManager::new(db.get_connection())
        .map_err(|e| e.to_string())?;
    
    file_manager.get_file(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_file_content(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<u8>, String> {
    let db = db.lock().await;
    let file_manager = FileManager::new(db.get_connection())
        .map_err(|e| e.to_string())?;
    
    file_manager.read_file(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_file(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let file_manager = FileManager::new(db.get_connection())
        .map_err(|e| e.to_string())?;
    
    file_manager.delete_file(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_files(
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<FileMetadata>, String> {
    let db = db.lock().await;
    let file_manager = FileManager::new(db.get_connection())
        .map_err(|e| e.to_string())?;
    
    let limit = limit.unwrap_or(100);
    file_manager.list_files(limit)
        .map_err(|e| e.to_string())
}

