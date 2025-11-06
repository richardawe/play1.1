// use tauri::command;
use std::path::PathBuf;

#[tauri::command]
pub async fn select_database_path() -> Result<String, String> {
    // For now, return the default database path
    // File dialog integration can be added later
    Ok("data/lancedb".to_string())
}

#[tauri::command]
pub async fn get_database_info(path: String) -> Result<serde_json::Value, String> {
    let path = PathBuf::from(path);
    
    if !path.exists() {
        return Err("Database path does not exist".to_string());
    }
    
    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Failed to get metadata: {}", e))?;
    
    let info = serde_json::json!({
        "path": path.to_string_lossy(),
        "exists": true,
        "is_file": metadata.is_file(),
        "is_dir": metadata.is_dir(),
        "size": metadata.len(),
        "modified": metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
    });
    
    Ok(info)
}

#[tauri::command]
pub async fn list_database_files() -> Result<Vec<String>, String> {
    let data_dir = PathBuf::from("data");
    
    if !data_dir.exists() {
        return Ok(vec![]);
    }
    
    let mut files = Vec::new();
    
    if let Ok(entries) = std::fs::read_dir(&data_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() && path.file_name().unwrap_or_default().to_string_lossy().contains("lancedb") {
                files.push(path.to_string_lossy().to_string());
            } else if path.extension().map_or(false, |ext| {
                matches!(ext.to_str(), Some("db") | Some("sqlite") | Some("sqlite3"))
            }) {
                files.push(path.to_string_lossy().to_string());
            }
        }
    }
    
    Ok(files)
}
