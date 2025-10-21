use crate::models::task::{CreateTask, Task, UpdateTask};
use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_task(
    task: CreateTask,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Task, String> {
    let db = db.lock().await;
    db.create_task(task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Task, String> {
    let db = db.lock().await;
    db.get_task(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_tasks(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<Task>, String> {
    let db = db.lock().await;
    db.get_all_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(
    id: i64,
    update: UpdateTask,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Task, String> {
    let db = db.lock().await;
    db.update_task(id, update).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_task(id).map_err(|e| e.to_string())
}

