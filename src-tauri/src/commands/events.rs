use crate::models::event::{CalendarEvent, CreateEvent, UpdateEvent};
use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_event(
    event: CreateEvent,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<CalendarEvent, String> {
    let db = db.lock().await;
    db.create_event(event).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_event(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<CalendarEvent, String> {
    let db = db.lock().await;
    db.get_event(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_events_in_range(
    start: String,
    end: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<CalendarEvent>, String> {
    let db = db.lock().await;
    db.get_events_in_range(&start, &end)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_event(
    id: i64,
    update: UpdateEvent,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<CalendarEvent, String> {
    let db = db.lock().await;
    db.update_event(id, update).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_event(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    db.delete_event(id).map_err(|e| e.to_string())
}

