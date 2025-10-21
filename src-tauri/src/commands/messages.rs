use crate::models::message::{CreateMessage, Message};
use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_messages(
    channel_id: i64,
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<Message>, String> {
    let db = db.lock().await;
    let limit = limit.unwrap_or(100);
    
    db.get_messages_by_channel(channel_id, limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_message(
    message: CreateMessage,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Message, String> {
    let db = db.lock().await;
    
    db.create_message(message)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_message(
    id: i64,
    content: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Message, String> {
    let db = db.lock().await;
    
    db.update_message(id, content)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_message(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    
    db.delete_message(id)
        .map_err(|e| e.to_string())
}

