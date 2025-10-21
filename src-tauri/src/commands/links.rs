use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Link {
    pub id: i64,
    pub from_type: String,
    pub from_id: i64,
    pub to_type: String,
    pub to_id: i64,
    pub created_at: String,
}

#[tauri::command]
pub async fn create_link(
    from_type: String,
    from_id: i64,
    to_type: String,
    to_id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Link, String> {
    let database = db.lock().await;
    database.create_link(&from_type, from_id, &to_type, to_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_links_for_item(
    item_type: String,
    item_id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<Link>, String> {
    let database = db.lock().await;
    database.get_links_for_item(&item_type, item_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_link(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let database = db.lock().await;
    database.delete_link(id)
        .map_err(|e| e.to_string())
}

