use crate::services::indexer::BackgroundIndexer;
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn index_all_content(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<usize, String> {
    let indexer = BackgroundIndexer::new(
        db.inner().clone(),
        ollama.inner().clone(),
    );
    
    indexer.index_all_content()
        .await
        .map_err(|e| e.to_string())
}

