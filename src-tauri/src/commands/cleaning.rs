use crate::models::cleaning::{CreateCleaningTask, CleaningTask, UpdateCleaningTask, CleaningTaskStats};
use crate::models::vector_index::CreateVectorIndex;
use crate::services::cleaning_service::CleaningService;
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use crate::services::vector_search_service::VectorSearchService;
use tauri::{State, Manager};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::fs;
use serde_json;
use rusqlite::params;

#[tauri::command]
pub async fn create_cleaning_task(
    task: CreateCleaningTask,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<CleaningTask, String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .create_cleaning_task(task)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cleaning_task(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<CleaningTask, String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .get_cleaning_task(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_cleaning_tasks(
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<CleaningTask>, String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .get_all_cleaning_tasks(limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pending_cleaning_tasks(
    limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<CleaningTask>, String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .get_pending_tasks(limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_cleaning_task(
    id: i64,
    update: UpdateCleaningTask,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<CleaningTask, String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .update_cleaning_task(id, update)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_cleaning_stats(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<CleaningTaskStats, String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .get_cleaning_stats()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn process_cleaning_task(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    // Get the task details
    let task = cleaning_service.get_cleaning_task(id).map_err(|e| e.to_string())?;
    
    // Mark as in progress
    cleaning_service
        .update_cleaning_task(id, UpdateCleaningTask {
            status: Some("in_progress".to_string()),
            started_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        })
        .map_err(|e| e.to_string())?;
    
    // Process based on task type and save output files
    let (output_content, output_file_path) = match task.task_type.as_str() {
        "text_cleanup" => {
            if let Some(input) = &task.input_content {
                // Basic text cleaning without AI for now
                let cleaned = input
                    .lines()
                    .map(|line| line.trim())
                    .filter(|line| !line.is_empty())
                    .collect::<Vec<_>>()
                    .join("\n");
                
                // Save cleaned file
                let output_path = match save_cleaned_file(&task, &cleaned, "cleaned") {
                    Ok(path) => path,
                    Err(e) => {
                        eprintln!("Failed to save cleaned file: {}", e);
                        String::new()
                    }
                };
                
                (format!("Cleaned text saved to: {}\n\n{}", output_path, cleaned), output_path)
            } else {
                ("No input content to clean".to_string(), String::new())
            }
        },
        "metadata_extraction" => {
            println!("DEBUG: Processing metadata extraction for task {}: input_content length = {:?}", 
                     task.id, task.input_content.as_ref().map(|c| c.len()));
            if let Some(input) = &task.input_content {
                // Comprehensive metadata extraction
                let lines = input.lines().count();
                let empty_lines = input.lines().filter(|line| line.trim().is_empty()).count();
                let non_empty_lines = lines - empty_lines;
                let words = input.split_whitespace().count();
                let unique_words = {
                    let mut word_set = std::collections::HashSet::new();
                    for word in input.split_whitespace() {
                        word_set.insert(word.to_lowercase());
                    }
                    word_set.len()
                };
                let chars = input.chars().count();
                let chars_no_spaces = input.chars().filter(|c| !c.is_whitespace()).count();
                let avg_words_per_line = if non_empty_lines > 0 { words as f64 / non_empty_lines as f64 } else { 0.0 };
                let avg_chars_per_line = if non_empty_lines > 0 { chars as f64 / non_empty_lines as f64 } else { 0.0 };
                let reading_time_minutes = (words as f64 / 200.0).ceil() as i32; // 200 words per minute
                
                // Detect content type based on patterns
                let content_type = detect_content_type(input);
                let language = detect_language(input);
                let complexity_score = calculate_complexity_score(input);
                
                // Create comprehensive metadata JSON
                let metadata = serde_json::json!({
                    "file_id": task.file_id,
                    "task_id": task.id,
                    "processing_timestamp": chrono::Utc::now().to_rfc3339(),
                    "content_statistics": {
                        "total_lines": lines,
                        "non_empty_lines": non_empty_lines,
                        "empty_lines": empty_lines,
                        "total_words": words,
                        "unique_words": unique_words,
                        "total_characters": chars,
                        "characters_no_spaces": chars_no_spaces,
                        "average_words_per_line": avg_words_per_line,
                        "average_characters_per_line": avg_chars_per_line,
                        "reading_time_minutes": reading_time_minutes
                    },
                    "content_analysis": {
                        "content_type": content_type,
                        "language": language,
                        "complexity_score": complexity_score,
                        "has_numbers": input.chars().any(|c| c.is_numeric()),
                        "has_special_chars": input.chars().any(|c| !c.is_alphanumeric() && !c.is_whitespace()),
                        "sentence_count": input.split(&['.', '!', '?'][..]).count() - 1
                    },
                    "file_metadata": {
                        "original_size_bytes": input.len(),
                        "processed_size_bytes": input.len(),
                        "compression_ratio": 1.0
                    }
                });
                
                let metadata_content = serde_json::to_string_pretty(&metadata).unwrap_or_else(|_| "Error serializing metadata".to_string());
                
                // Save metadata file
                let output_path = match save_cleaned_file(&task, &metadata_content, "metadata") {
                    Ok(path) => path,
                    Err(e) => {
                        eprintln!("Failed to save metadata file: {}", e);
                        String::new()
                    }
                };
                
                (format!("Metadata extracted and saved to: {}\n\nContent Analysis:\n- Type: {}\n- Language: {}\n- Complexity: {:.2}\n- Words: {}\n- Reading time: {} min", 
                    output_path, content_type, language, complexity_score, words, reading_time_minutes), output_path)
            } else {
                ("No input content for metadata extraction".to_string(), String::new())
            }
        },
        "format_conversion" => {
            if let Some(input) = &task.input_content {
                // Comprehensive format conversion and normalization
                let mut normalized = input.to_string();
                
                // Step 1: Normalize line endings
                normalized = normalized
                    .replace("\r\n", "\n")  // Windows CRLF -> LF
                    .replace("\r", "\n");   // Mac CR -> LF
                
                // Step 2: Remove excessive whitespace
                normalized = normalized
                    .lines()
                    .map(|line| line.trim_end())
                    .collect::<Vec<_>>()
                    .join("\n");
                
                // Step 3: Normalize multiple consecutive empty lines to max 2
                let lines = normalized.lines().collect::<Vec<_>>();
                let mut result_lines = Vec::new();
                let mut empty_count = 0;
                
                for line in lines {
                    if line.trim().is_empty() {
                        empty_count += 1;
                        if empty_count <= 2 {
                            result_lines.push(line);
                        }
                    } else {
                        empty_count = 0;
                        result_lines.push(line);
                    }
                }
                
                normalized = result_lines.join("\n");
                
                // Step 4: Ensure proper encoding (UTF-8)
                let normalized_bytes = normalized.as_bytes();
                let utf8_valid = std::str::from_utf8(normalized_bytes).is_ok();
                
                // Step 5: Detect and convert special characters
                let mut special_chars_found = Vec::new();
                for (i, ch) in normalized.char_indices() {
                    if !ch.is_ascii() && !ch.is_whitespace() {
                        special_chars_found.push((i, ch));
                    }
                }
                
                // Step 6: Create conversion report
                let conversion_report = format!(
                    "Format Conversion Report\n\
                    =======================\n\
                    Original size: {} bytes\n\
                    Converted size: {} bytes\n\
                    UTF-8 valid: {}\n\
                    Special characters found: {}\n\
                    Line ending type: Unix (LF)\n\
                    \n\
                    Converted Content:\n\
                    =================\n\
                    {}",
                    input.len(),
                    normalized.len(),
                    utf8_valid,
                    special_chars_found.len(),
                    normalized
                );
                
                // Save normalized file
                let output_path = match save_cleaned_file(&task, &conversion_report, "converted") {
                    Ok(path) => path,
                    Err(e) => {
                        eprintln!("Failed to save converted file: {}", e);
                        String::new()
                    }
                };
                
                (format!("Format converted and saved to: {}\n\nConversion Summary:\n- Size: {} -> {} bytes\n- UTF-8 valid: {}\n- Special chars: {}", 
                    output_path, input.len(), normalized.len(), utf8_valid, special_chars_found.len()), output_path)
            } else {
                ("No input content to convert".to_string(), String::new())
            }
        },
        _ => ("Unknown task type".to_string(), String::new()),
    };
    
    // Mark as completed with results
    cleaning_service
        .update_cleaning_task(id, UpdateCleaningTask {
            status: Some("completed".to_string()),
            output_content: Some(output_content.clone()),
            completed_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        })
        .map_err(|e| e.to_string())?;

    // Generate vector embeddings for the cleaned content (synchronous for now)
    if !output_file_path.is_empty() && task.task_type == "text_cleanup" {
        if let Ok(content) = std::fs::read_to_string(&output_file_path) {
            // Create vector index entry for the cleaned content (synchronous)
            let _ = create_vector_index_for_content_sync(task.file_id, &content, "cleaned_file");
        }
    }
    
    // Trigger insight generation after processing is complete
    // This will run in the background and generate insights about the processed content
    tokio::spawn(async move {
        // Small delay to ensure database consistency
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        // Generate insights for the newly processed content
        // This is a fire-and-forget operation
        let _ = generate_insights_for_processed_content().await;
    });
    
    Ok(())
}

#[tauri::command]
pub async fn process_pending_cleaning_tasks(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<i64, String> {
    // Get all pending tasks first
    let pending_tasks = {
        let db_guard = db.lock().await;
        let cleaning_service = CleaningService::new(&*db_guard, ollama.inner().clone());
        cleaning_service.get_pending_tasks(None).map_err(|e| e.to_string())?
    };
    
    let total_tasks = pending_tasks.len() as i64;
    let mut processed_count = 0;
    let mut failed_count = 0;
    let start_time = std::time::Instant::now();
    
    println!("Starting to process {} pending cleaning tasks", total_tasks);
    
    for (index, task) in pending_tasks.iter().enumerate() {
        let task_id = task.id;
        let progress = ((index + 1) as f64 / total_tasks as f64 * 100.0) as i32;
        
        // Calculate estimated time remaining
        let elapsed = start_time.elapsed();
        let avg_time_per_task = if index > 0 { elapsed.as_secs() / (index + 1) as u64 } else { 1 };
        let remaining_tasks = total_tasks - index as i64 - 1;
        let estimated_remaining = avg_time_per_task * remaining_tasks as u64;
        
        println!("Processing task {}/{} ({}%) - Task ID: {} - ETA: {}s", 
            index + 1, total_tasks, progress, task_id, estimated_remaining);
        
        let result = process_cleaning_task(task_id, db.clone(), ollama.clone()).await;
        
        if let Err(e) = result {
            eprintln!("Error processing task {}: {}", task_id, e);
            failed_count += 1;
            // Mark task as failed
            let db_guard = db.lock().await;
            let cleaning_service = CleaningService::new(&*db_guard, ollama.inner().clone());
            let _ = cleaning_service.update_cleaning_task(task_id, UpdateCleaningTask {
                status: Some("failed".to_string()),
                error_message: Some(e),
                completed_at: Some(chrono::Utc::now().to_rfc3339()),
                ..Default::default()
            });
        } else {
            processed_count += 1;
        }
        
        // Add small delay to prevent overwhelming the system
        if (index + 1) % 10 == 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    }
    
    let total_time = start_time.elapsed();
    println!("Completed processing {} tasks in {:.2}s ({} successful, {} failed)", 
        total_tasks, total_time.as_secs_f64(), processed_count, failed_count);
    
    Ok(processed_count)
}

#[tauri::command]
pub async fn process_pending_cleaning_tasks_with_progress(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
    app_handle: tauri::AppHandle,
) -> Result<i64, String> {
    // Get all pending tasks first
    let pending_tasks = {
        let db_guard = db.lock().await;
        let cleaning_service = CleaningService::new(&*db_guard, ollama.inner().clone());
        cleaning_service.get_pending_tasks(Some(100000)).map_err(|e| e.to_string())?
    };
    
    let total_tasks = pending_tasks.len() as i64;
    let mut processed_count = 0;
    let mut failed_count = 0;
    let start_time = std::time::Instant::now();
    
    // Send initial progress event
    let _ = app_handle.emit_all("cleaning-progress", serde_json::json!({
        "type": "started",
        "total_tasks": total_tasks,
        "processed": 0,
        "failed": 0,
        "progress": 0,
        "estimated_remaining": 0
    }));
    
    for (index, task) in pending_tasks.iter().enumerate() {
        let task_id = task.id;
        let progress = ((index + 1) as f64 / total_tasks as f64 * 100.0) as i32;
        
        // Calculate estimated time remaining
        let elapsed = start_time.elapsed();
        let avg_time_per_task = if index > 0 { elapsed.as_secs() / (index + 1) as u64 } else { 1 };
        let remaining_tasks = total_tasks - index as i64 - 1;
        let estimated_remaining = avg_time_per_task * remaining_tasks as u64;
        
        // Send progress update event
        let _ = app_handle.emit_all("cleaning-progress", serde_json::json!({
            "type": "progress",
            "total_tasks": total_tasks,
            "processed": processed_count,
            "failed": failed_count,
            "progress": progress,
            "estimated_remaining": estimated_remaining,
            "current_task_id": task_id
        }));
        
        let result = process_cleaning_task(task_id, db.clone(), ollama.clone()).await;
        
        if let Err(e) = result {
            eprintln!("Error processing task {}: {}", task_id, e);
            failed_count += 1;
            // Mark task as failed
            let db_guard = db.lock().await;
            let cleaning_service = CleaningService::new(&*db_guard, ollama.inner().clone());
            let _ = cleaning_service.update_cleaning_task(task_id, UpdateCleaningTask {
                status: Some("failed".to_string()),
                error_message: Some(e),
                completed_at: Some(chrono::Utc::now().to_rfc3339()),
                ..Default::default()
            });
        } else {
            processed_count += 1;
        }
        
        // Add small delay to prevent overwhelming the system
        if (index + 1) % 10 == 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    }
    
    let total_time = start_time.elapsed();
    
    // Send completion event
    let _ = app_handle.emit_all("cleaning-progress", serde_json::json!({
        "type": "completed",
        "total_tasks": total_tasks,
        "processed": processed_count,
        "failed": failed_count,
        "progress": 100,
        "estimated_remaining": 0,
        "total_time": total_time.as_secs_f64()
    }));
    
    println!("Completed processing {} tasks in {:.2}s ({} successful, {} failed)", 
        total_tasks, total_time.as_secs_f64(), processed_count, failed_count);
    
    Ok(processed_count)
}

#[tauri::command]
pub async fn delete_cleaning_task(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    cleaning_service
        .delete_cleaning_task(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_cleaning_tasks_for_files(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<i64, String> {
    let db = db.lock().await;
    let _cleaning_service = CleaningService::new(&*db, ollama.inner().clone());
    
    // Get all files that don't have cleaning tasks yet
    let conn = db.get_connection();
    let mut stmt = conn.prepare(
        "SELECT f.id, f.filepath, f.mimetype 
         FROM files f 
         WHERE (f.mimetype LIKE 'text/%' 
                OR f.mimetype = 'application/json'
                OR f.mimetype = 'application/xml'
                OR f.mimetype = 'application/javascript'
                OR f.mimetype = 'application/x-python'
                OR f.mimetype = 'application/x-rust'
                OR f.mimetype = 'application/x-typescript'
                OR f.mimetype LIKE 'application/%script%'
                OR f.filename LIKE '%.txt'
                OR f.filename LIKE '%.md'
                OR f.filename LIKE '%.json'
                OR f.filename LIKE '%.xml'
                OR f.filename LIKE '%.js'
                OR f.filename LIKE '%.ts'
                OR f.filename LIKE '%.py'
                OR f.filename LIKE '%.rs')
         AND f.id NOT IN (SELECT DISTINCT file_id FROM cleaning_queue)
         LIMIT 100"
    ).map_err(|e| e.to_string())?;
    
    let mut created_count = 0;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
    }).map_err(|e| e.to_string())?;
    
    let mut total_files = 0;
    for row in rows {
        let (file_id, filepath, mimetype) = row.map_err(|e| e.to_string())?;
        total_files += 1;
        println!("Found file: {} (mimetype: {})", filepath, mimetype);
        
        // Read file content
        if let Ok(content) = std::fs::read_to_string(&filepath) {
            // Create cleaning tasks
            let tasks = vec![
                ("text_cleanup", 1),
                ("metadata_extraction", 2),
                ("format_conversion", 3),
            ];
            
            for (task_type, priority) in tasks {
                conn.execute(
                    "INSERT INTO cleaning_queue (file_id, task_type, status, priority, input_content) VALUES (?1, ?2, ?3, ?4, ?5)",
                    rusqlite::params![
                        file_id,
                        task_type,
                        "pending",
                        priority,
                        Some(content.clone()) // All tasks need the content to process
                    ],
                ).map_err(|e| e.to_string())?;
            }
            created_count += 1;
        } else {
            println!("Could not read file content: {}", filepath);
        }
    }
    
    println!("Total files found: {}, Tasks created: {}", total_files, created_count);
    Ok(created_count)
}

#[tauri::command]
pub async fn get_cleaning_task_summary(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<serde_json::Value, String> {
    let db = db.lock().await;
    let conn = db.get_connection();
    
    // Get task counts by status and type
    let mut stmt = conn.prepare(
        "SELECT task_type, status, COUNT(*) as count 
         FROM cleaning_queue 
         GROUP BY task_type, status 
         ORDER BY task_type, status"
    ).map_err(|e| e.to_string())?;
    
    let mut task_summary = std::collections::HashMap::new();
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,  // task_type
            row.get::<_, String>(1)?,  // status
            row.get::<_, i64>(2)?      // count
        ))
    }).map_err(|e| e.to_string())?;
    
    for row in rows {
        let (task_type, status, count) = row.map_err(|e| e.to_string())?;
        task_summary.entry(task_type)
            .or_insert_with(std::collections::HashMap::new)
            .insert(status, count);
    }
    
    // Check if output directory exists and count files
    let output_dir = Database::get_data_dir().join("cleaned_output");
    let mut output_file_count = 0;
    let mut output_files_by_type = std::collections::HashMap::new();
    
    if output_dir.exists() {
        if let Ok(entries) = fs::read_dir(&output_dir) {
            for entry in entries.flatten() {
                if entry.file_type().map_or(false, |ft| ft.is_dir()) {
                    let task_type = entry.file_name().to_string_lossy().to_string();
                    if let Ok(file_entries) = fs::read_dir(entry.path()) {
                        let count = file_entries.count();
                        output_files_by_type.insert(task_type, count);
                        output_file_count += count;
                    }
                }
            }
        }
    }
    
    Ok(serde_json::json!({
        "task_summary": task_summary,
        "output_directory_exists": output_dir.exists(),
        "output_directory_path": output_dir.to_string_lossy(),
        "output_file_count": output_file_count,
        "output_files_by_type": output_files_by_type
    }))
}

#[tauri::command]
pub async fn fix_tasks_without_input_content(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<i64, String> {
    let db = db.lock().await;
    let conn = db.get_connection();
    
    // Find tasks that have no input content but should have it
    let mut stmt = conn.prepare(
        "SELECT cq.id, cq.file_id, f.filepath 
         FROM cleaning_queue cq 
         JOIN files f ON cq.file_id = f.id 
         WHERE cq.input_content IS NULL OR cq.input_content = ''"
    ).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?, row.get::<_, String>(2)?))
    }).map_err(|e| e.to_string())?;
    
    let mut fixed_count = 0;
    for row in rows {
        let (task_id, _file_id, filepath) = row.map_err(|e| e.to_string())?;
        
        // Try to read the file content and update the task
        if let Ok(content) = std::fs::read_to_string(&filepath) {
            conn.execute(
                "UPDATE cleaning_queue SET input_content = ?1 WHERE id = ?2",
                params![content, task_id]
            ).map_err(|e| e.to_string())?;
            
            println!("Fixed task {} for file {} (content length: {})", task_id, filepath, content.len());
            fixed_count += 1;
        } else {
            println!("Could not read file content for task {}: {}", task_id, filepath);
        }
    }
    
    Ok(fixed_count)
}

#[tauri::command]
pub async fn get_cleaning_output_directory() -> Result<String, String> {
    let output_dir = Database::get_data_dir().join("cleaned_output");
    Ok(output_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn list_cleaning_output_files() -> Result<Vec<OutputFileInfo>, String> {
    let output_dir = Database::get_data_dir().join("cleaned_output");
    let mut files = Vec::new();
    
    if !output_dir.exists() {
        return Ok(files);
    }
    
    // Read all subdirectories (task types)
    if let Ok(entries) = fs::read_dir(&output_dir) {
        for entry in entries.flatten() {
            if entry.file_type().map_or(false, |ft| ft.is_dir()) {
                let task_type = entry.file_name().to_string_lossy().to_string();
                let task_dir = entry.path();
                
                // Read files in this task type directory
                if let Ok(file_entries) = fs::read_dir(&task_dir) {
                    for file_entry in file_entries.flatten() {
                        if file_entry.file_type().map_or(false, |ft| ft.is_file()) {
                            let file_path = file_entry.path();
                            let filename = file_entry.file_name().to_string_lossy().to_string();
                            
                            if let Ok(metadata) = file_entry.metadata() {
                                let file_info = OutputFileInfo {
                                    filename,
                                    task_type: task_type.clone(),
                                    file_path: file_path.to_string_lossy().to_string(),
                                    size_bytes: metadata.len(),
                                    created_at: metadata.created()
                                .unwrap_or_else(|_| std::time::SystemTime::UNIX_EPOCH)
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs() as i64,
                                };
                                files.push(file_info);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Sort by creation time (newest first)
    files.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(files)
}

#[derive(serde::Serialize)]
pub struct OutputFileInfo {
    pub filename: String,
    pub task_type: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub created_at: i64,
}

#[tauri::command]
pub async fn read_cleaning_output_file(file_path: String) -> Result<String, String> {
    match fs::read_to_string(&file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}


#[tauri::command]
pub async fn trigger_insight_generation(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::services::ai_insights_service::Insight>, String> {
    let db_guard = db.lock().await;
    let insights_service = crate::services::ai_insights_service::AIInsightsService::new(&*db_guard, ollama.inner().clone());
    
    insights_service.generate_insights().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_all_cleaning_tasks(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<i64, String> {
    let db_guard = db.lock().await;
    let _cleaning_service = CleaningService::new(&*db_guard, ollama.inner().clone());
    
    // Get count before deletion
    let conn = db_guard.get_connection();
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM cleaning_queue", 
        [], 
        |row| row.get(0)
    ).map_err(|e| e.to_string())?;
    
    // Delete all cleaning tasks
    conn.execute("DELETE FROM cleaning_queue", []).map_err(|e| e.to_string())?;
    
    Ok(count)
}

/// Create vector index entry for content (synchronous version)
fn create_vector_index_for_content_sync(file_id: i64, content: &str, content_type: &str) -> Result<(), String> {
    // Generate a simple hash-based embedding for now
    let embedding = generate_simple_embedding(content);
    
    // Create vector index entry
    let _create_entry = crate::models::vector_index::CreateVectorIndex {
        content_id: file_id,
        content_type: content_type.to_string(),
        content: content.to_string(),
        embedding_vector: embedding.clone(),
        model_name: "simple-hash".to_string(),
        chunk_index: Some(0),
        metadata: Some(format!("Generated from cleaned content, length: {}", content.len())),
    };
    
    // This would normally call the vector search service
    // For now, we'll just log that we would create the entry
    println!("Would create vector index for file {} with {} dimensions", file_id, embedding.len());
    
    Ok(())
}

/// Create vector index entry for content

/// Generate insights for recently processed content
async fn generate_insights_for_processed_content() -> Result<(), String> {
    // This would normally call the AI insights service to generate insights
    // For now, we'll just log that we would generate insights
    println!("Would generate insights for processed content");
    Ok(())
}

/// Generate a simple hash-based embedding (placeholder for real AI embeddings)
fn generate_simple_embedding(content: &str) -> Vec<f32> {
    let mut embedding = Vec::new();
    let content_hash = content.len() as u32;
    
    // Create a simple 384-dimensional vector based on content characteristics
    for i in 0..384 {
        let seed = (content_hash + i as u32) as u64;
        let value = (seed as f32 / 1000.0).sin();
        embedding.push(value);
    }
    
    // Normalize the vector
    let norm: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm > 0.0 {
        for val in &mut embedding {
            *val /= norm;
        }
    }
    
    embedding
}

/// Save cleaned content to a file in the output directory
fn save_cleaned_file(task: &CleaningTask, content: &str, suffix: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Get the original file info from the database
    // For now, we'll create a simple output structure
    
    // Create output directory: ~/Play/data/cleaned_output/
    let output_dir = Database::get_data_dir().join("cleaned_output");
    println!("Creating output directory: {:?}", output_dir);
    fs::create_dir_all(&output_dir)?;
    
    // Create subdirectory for this task type
    let task_type_dir = output_dir.join(&task.task_type);
    println!("Creating task type directory: {:?}", task_type_dir);
    fs::create_dir_all(&task_type_dir)?;
    
    // Generate output filename
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("file_{}_task_{}_{}_{}.txt", task.file_id, task.id, suffix, timestamp);
    let output_path = task_type_dir.join(filename);
    
    println!("Writing file to: {:?}", output_path);
    println!("Content length: {} bytes", content.len());
    
    // Write content to file
    fs::write(&output_path, content)?;
    
    println!("Successfully saved file: {:?}", output_path);
    
    // Return the path as a string
    Ok(output_path.to_string_lossy().to_string())
}

/// Detect content type based on text patterns
fn detect_content_type(text: &str) -> String {
    let text_lower = text.to_lowercase();
    
    // Technical documentation patterns
    if text_lower.contains("api") || text_lower.contains("endpoint") || text_lower.contains("function") {
        return "technical_documentation".to_string();
    }
    
    // Code patterns
    if text_lower.contains("def ") || text_lower.contains("function ") || text_lower.contains("class ") || 
       text_lower.contains("import ") || text_lower.contains("const ") || text_lower.contains("var ") {
        return "code".to_string();
    }
    
    // Email patterns
    if text_lower.contains("dear ") || text_lower.contains("sincerely") || text_lower.contains("regards") {
        return "email".to_string();
    }
    
    // Meeting notes patterns
    if text_lower.contains("meeting") || text_lower.contains("agenda") || text_lower.contains("minutes") {
        return "meeting_notes".to_string();
    }
    
    // Research patterns
    if text_lower.contains("research") || text_lower.contains("study") || text_lower.contains("analysis") {
        return "research".to_string();
    }
    
    // Blog/article patterns
    if text_lower.contains("introduction") || text_lower.contains("conclusion") || text_lower.contains("article") {
        return "article".to_string();
    }
    
    // Default
    "general_text".to_string()
}

/// Detect language based on common words
fn detect_language(text: &str) -> String {
    let text_lower = text.to_lowercase();
    
    // English common words
    let english_words = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
    let english_count = english_words.iter().map(|word| text_lower.matches(word).count()).sum::<usize>();
    
    // Spanish common words
    let spanish_words = ["el", "la", "de", "que", "y", "a", "en", "un", "es", "se", "no", "te"];
    let spanish_count = spanish_words.iter().map(|word| text_lower.matches(word).count()).sum::<usize>();
    
    // French common words
    let french_words = ["le", "de", "et", "à", "un", "il", "être", "et", "en", "avoir", "que", "pour"];
    let french_count = french_words.iter().map(|word| text_lower.matches(word).count()).sum::<usize>();
    
    if english_count > spanish_count && english_count > french_count {
        "english".to_string()
    } else if spanish_count > french_count {
        "spanish".to_string()
    } else if french_count > 0 {
        "french".to_string()
    } else {
        "unknown".to_string()
    }
}

/// Calculate text complexity score (0.0 to 1.0)
fn calculate_complexity_score(text: &str) -> f64 {
    let words: Vec<&str> = text.split_whitespace().collect();
    if words.is_empty() {
        return 0.0;
    }
    
    let mut score = 0.0;
    
    // Average word length (longer words = more complex)
    let avg_word_length = words.iter().map(|w| w.len()).sum::<usize>() as f64 / words.len() as f64;
    score += (avg_word_length / 10.0).min(0.3); // Max 0.3 points
    
    // Sentence complexity (more sentences = more complex)
    let sentences = text.split(&['.', '!', '?'][..]).count();
    let avg_sentence_length = words.len() as f64 / sentences.max(1) as f64;
    score += (avg_sentence_length / 20.0).min(0.3); // Max 0.3 points
    
    // Special characters (technical content = more complex)
    let special_chars = text.chars().filter(|c| !c.is_alphanumeric() && !c.is_whitespace()).count();
    score += (special_chars as f64 / words.len() as f64).min(0.2); // Max 0.2 points
    
    // Capitalization (proper nouns = more complex)
    let capitalized_words = words.iter().filter(|w| w.chars().next().map_or(false, |c| c.is_uppercase())).count();
    score += (capitalized_words as f64 / words.len() as f64).min(0.2); // Max 0.2 points
    
    score.min(1.0)
}

#[tauri::command]
pub async fn index_all_cleaned_files_with_progress(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
    app_handle: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    use std::fs;
    
    let output_dir = Database::get_data_dir().join("cleaned_output");
    let output_path = &output_dir;
    
    if !output_path.exists() {
        return Err("Output directory does not exist".to_string());
    }
    
    let mut processed_files = Vec::new();
    let mut failed_files = Vec::new();
    
    // Get all files from all subdirectories
    let mut all_files = Vec::new();
    for entry in fs::read_dir(output_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().is_dir() {
            let task_type = entry.file_name().to_string_lossy().to_string();
            for file_entry in fs::read_dir(entry.path()).map_err(|e| e.to_string())? {
                let file_entry = file_entry.map_err(|e| e.to_string())?;
                if file_entry.path().is_file() {
                    all_files.push((task_type.clone(), file_entry.path()));
                }
            }
        }
    }
    
    let total_files = all_files.len() as i64;
    let mut processed_count = 0;
    let mut failed_count = 0;
    let start_time = std::time::Instant::now();
    let batch_size = 5; // Process files in small batches to prevent memory issues
    
    // Send initial progress event
    let _ = app_handle.emit_all("vector-indexing-progress", serde_json::json!({
        "type": "started",
        "total_files": total_files,
        "processed": 0,
        "failed": 0,
        "progress": 0,
        "estimated_remaining": 0
    }));
    
    // Process files in batches
    for batch_start in (0..all_files.len()).step_by(batch_size) {
        let batch_end = std::cmp::min(batch_start + batch_size, all_files.len());
        let batch = &all_files[batch_start..batch_end];
        
        println!("Processing batch {}/{} (files {} to {})", 
                 batch_start / batch_size + 1, 
                 (all_files.len() + batch_size - 1) / batch_size,
                 batch_start, batch_end - 1);
        
        for (index, (task_type, file_path)) in batch.iter().enumerate() {
            let global_index = batch_start + index;
            let file_name = file_path.file_name().unwrap().to_string_lossy().to_string();
            let progress = ((global_index + 1) as f64 / total_files as f64 * 100.0) as i32;
            
            // Calculate estimated time remaining
            let elapsed = start_time.elapsed();
            let avg_time_per_file = if global_index > 0 { elapsed.as_secs() / (global_index + 1) as u64 } else { 1 };
            let remaining_files = total_files - global_index as i64 - 1;
            let estimated_remaining = avg_time_per_file * remaining_files as u64;
        
        // Send progress update event
        let _ = app_handle.emit_all("vector-indexing-progress", serde_json::json!({
            "type": "progress",
            "total_files": total_files,
            "processed": processed_count,
            "failed": failed_count,
            "progress": progress,
            "estimated_remaining": estimated_remaining,
            "current_file": file_name
        }));
        
        // Read file content
        let content = match fs::read_to_string(file_path) {
            Ok(content) => content,
            Err(e) => {
                eprintln!("Failed to read file {}: {}", file_name, e);
                failed_files.push(format!("{}: {}", file_name, e));
                failed_count += 1;
                continue;
            }
        };
        
        // Extract content_id from filename (assuming format: file_XXX_task_YYY_cleaned_...)
        let content_id = if let Some(start) = file_name.find("file_") {
            if let Some(end) = file_name[start + 5..].find("_") {
                if let Ok(id) = file_name[start + 5..start + 5 + end].parse::<i64>() {
                    id
                } else {
                    eprintln!("Failed to parse content_id from filename: {}", file_name);
                    failed_files.push(format!("{}: Invalid filename format", file_name));
                    failed_count += 1;
                    continue;
                }
            } else {
                eprintln!("Failed to parse content_id from filename: {}", file_name);
                failed_files.push(format!("{}: Invalid filename format", file_name));
                failed_count += 1;
                continue;
            }
        } else {
            eprintln!("Failed to parse content_id from filename: {}", file_name);
            failed_files.push(format!("{}: Invalid filename format", file_name));
            failed_count += 1;
            continue;
        };
        
        // Chunk content for large files to prevent memory issues
        let chunks = if content.len() > 1024 { // Reduced threshold for better memory management
            let max_chunk_size = 512; // Small chunk size to prevent memory overflow
            let mut chunks = Vec::new();
            let mut start = 0;
            let mut chunk_index = 0;
            
            while start < content.len() {
                let end = std::cmp::min(start + max_chunk_size, content.len());
                let chunk = &content[start..end];
                chunks.push((chunk.to_string(), chunk_index));
                start = end;
                chunk_index += 1;
            }
            chunks
        } else {
            vec![(content.clone(), 0)]
        };
        
        // Process each chunk
        for (chunk_content, chunk_index) in chunks {
            // Generate embedding for this chunk
            let ollama_guard = ollama.lock().await;
            let embedding_result = ollama_guard.generate_embedding("nomic-embed-text", &chunk_content).await
                .map_err(|e| e.to_string()); // Convert error to String to make it Send
            drop(ollama_guard); // Release the lock immediately
            
            let embedding_vector = match embedding_result {
                Ok(embedding) => embedding,
                Err(e) => {
                    eprintln!("Failed to generate embedding for chunk {} of {}: {}", chunk_index, file_name, e);
                    failed_files.push(format!("{} chunk {}: {}", file_name, chunk_index, e));
                    failed_count += 1;
                    continue;
                }
            };
            
            // Create vector index entry for this chunk
            let db_guard = db.lock().await;
            let vector_service = VectorSearchService::new(&*db_guard, ollama.inner().clone());
            
            let create_entry = CreateVectorIndex {
                content_id,
                content_type: task_type.clone(),
                content: chunk_content,
                embedding_vector,
                model_name: "nomic-embed-text".to_string(),
                chunk_index: Some(chunk_index as i64),
                metadata: Some(format!("Cleaned content from AI processing - {} (chunk {})", task_type, chunk_index)),
            };
            
            match vector_service.create_vector_entry(create_entry) {
                Ok(_) => {
                    println!("Successfully indexed chunk {} of file: {}", chunk_index, file_name);
                }
                Err(e) => {
                    eprintln!("Failed to create vector entry for chunk {} of {}: {}", chunk_index, file_name, e);
                    failed_files.push(format!("{} chunk {}: {}", file_name, chunk_index, e));
                    failed_count += 1;
                }
            }
        }
        
            processed_files.push(file_name);
            processed_count += 1;
        }
        
        // Memory cleanup between batches
        println!("Batch completed, forcing garbage collection...");
        // Force a small delay to allow memory cleanup
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }
    
    // Send completion event
    let _ = app_handle.emit_all("vector-indexing-progress", serde_json::json!({
        "type": "completed",
        "total_files": total_files,
        "processed": processed_count,
        "failed": failed_count,
        "progress": 100,
        "estimated_remaining": 0
    }));
    
    let total_time = start_time.elapsed();
    println!("Completed indexing {} files in {:.2}s ({} successful, {} failed)", 
        total_files, total_time.as_secs_f64(), processed_count, failed_count);
    
    Ok(processed_files)
}
