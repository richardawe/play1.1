use crate::services::ics::ICSService;
use crate::services::database::Database;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn export_calendar_to_ics(
    start: String,
    end: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let database = db.lock().await;
    let events = database.get_events_in_range(&start, &end)
        .map_err(|e| e.to_string())?;
    drop(database);
    
    let ics_service = ICSService::new();
    ics_service.export_to_ics(&events)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_calendar_from_ics(
    ics_content: String,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<usize, String> {
    let ics_service = ICSService::new();
    let events = ics_service.import_from_ics(&ics_content)
        .map_err(|e| e.to_string())?;
    
    let mut count = 0;
    let database = db.lock().await;
    
    for event in events {
        // Create event in database
        if let Ok(_) = database.create_event(crate::models::event::CreateEvent {
            title: event.title,
            description: event.description,
            start_time: event.start_time,
            end_time: event.end_time,
            reminder_time: event.reminder_time,
            recurrence: event.recurrence,
        }) {
            count += 1;
        }
    }
    
    Ok(count)
}

