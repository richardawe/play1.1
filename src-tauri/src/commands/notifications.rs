use crate::services::notifications::NotificationService;

#[tauri::command]
pub async fn send_notification(
    title: String,
    body: String,
) -> Result<(), String> {
    let service = NotificationService::new();
    service.send_notification(&title, &body)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn schedule_reminder(
    title: String,
    body: String,
    time: String,
) -> Result<(), String> {
    let service = NotificationService::new();
    let datetime = chrono::DateTime::parse_from_rfc3339(&time)
        .map_err(|e| e.to_string())?
        .with_timezone(&chrono::Utc);
    
    service.schedule_reminder(&title, &body, datetime)
        .map_err(|e| e.to_string())
}

