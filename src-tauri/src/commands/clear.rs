// Clear Workspace Commands
use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn clear_all_messages(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<usize, String> {
    let database = db.lock().await;
    database.clear_all_messages()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_all_documents(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<usize, String> {
    let database = db.lock().await;
    database.clear_all_documents()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_all_tasks(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<usize, String> {
    let database = db.lock().await;
    database.clear_all_tasks()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_all_events(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<usize, String> {
    let database = db.lock().await;
    database.clear_all_events()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_all_links(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<usize, String> {
    let database = db.lock().await;
    database.clear_all_links()
        .map_err(|e| e.to_string())
}

