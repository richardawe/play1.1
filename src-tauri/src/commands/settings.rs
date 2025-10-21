use crate::services::database::Database;
use crate::services::settings::{SettingsService, UserSettings};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn get_settings(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<UserSettings, String> {
    let db = db.lock().await;
    let settings_service = SettingsService::new(db.get_connection());
    
    settings_service.get_user_settings()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_settings(
    settings: UserSettings,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<UserSettings, String> {
    let db = db.lock().await;
    let settings_service = SettingsService::new(db.get_connection());
    
    settings_service.update_user_settings(settings.clone())
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}

#[tauri::command]
pub async fn get_setting(
    key: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Option<String>, String> {
    let db = db.lock().await;
    let settings_service = SettingsService::new(db.get_connection());
    
    settings_service.get_setting(&key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let settings_service = SettingsService::new(db.get_connection());
    
    settings_service.set_setting(&key, &value)
        .map_err(|e| e.to_string())
}

