use crate::models::ingestion::{CreateIngestionJob, IngestionJob, UpdateIngestionJob, IngestionJobStats};
use crate::services::ingestion_service::IngestionService;
use crate::services::database::Database;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_ingestion_job(
    job: CreateIngestionJob,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<IngestionJob, String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    ingestion_service
        .create_ingestion_job(job)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ingestion_job(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<IngestionJob, String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    ingestion_service
        .get_ingestion_job(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_ingestion_jobs(
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<Vec<IngestionJob>, String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    ingestion_service
        .get_all_ingestion_jobs(limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_ingestion_job(
    id: i64,
    update: UpdateIngestionJob,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<IngestionJob, String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    ingestion_service
        .update_ingestion_job(id, update)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ingestion_stats(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<IngestionJobStats, String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    ingestion_service
        .get_ingestion_stats()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_ingestion_job(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    // Get the job to get the source path
    let job = ingestion_service
        .get_ingestion_job(id)
        .map_err(|e| e.to_string())?;
    
    // Process the source synchronously
    let source_path = job.source_path.clone();
    if let Err(e) = ingestion_service.process_source(id, &source_path) {
        eprintln!("Error processing source: {}", e);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn cancel_ingestion_job(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<IngestionJob, String> {
    let db = db.lock().await;
    let ingestion_service = IngestionService::new(&*db);
    
    ingestion_service
        .update_ingestion_job(id, UpdateIngestionJob {
            status: Some("cancelled".to_string()),
            completed_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_ingestion_job(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let conn = db.get_connection();
    
    conn.execute("DELETE FROM ingestion_jobs WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
