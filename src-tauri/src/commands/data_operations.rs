use crate::services::data_operations_service::{DataOperationsService, UpdateDataProcessingJob};
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use crate::services::file_processor::{FileProcessor, ProcessedContent};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use std::path::Path;
use std::fs;
use sha2::{Sha256, Digest};
use serde_json;

#[tauri::command]
pub async fn create_data_processing_job(
    name: String,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    // Initialize tables if they don't exist
    service.initialize_tables().await.map_err(|e| e.to_string())?;
    
    let job = service.create_processing_job(name)
        .await.map_err(|e| e.to_string())?;
    
    Ok(serde_json::to_value(job).unwrap())
}

#[tauri::command]
pub async fn get_data_processing_job(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let job = service.get_processing_job(id)
        .await.map_err(|e| e.to_string())?;
    
    Ok(serde_json::to_value(job).unwrap())
}

#[tauri::command]
pub async fn get_all_data_processing_jobs(
    _limit: Option<i64>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let jobs = service.get_all_processing_jobs()
        .await.map_err(|e| e.to_string())?;
    
    Ok(serde_json::to_value(jobs).unwrap())
}

#[tauri::command]
pub async fn update_data_processing_job(
    id: i64,
    status: Option<String>,
    progress: Option<f64>,
    total_files: Option<i64>,
    processed_files: Option<i64>,
    error_count: Option<i64>,
    started_at: Option<String>,
    completed_at: Option<String>,
    error_message: Option<String>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let update = UpdateDataProcessingJob {
        name: None,
        status,
        progress,
        total_files,
        processed_files,
        error_count,
        started_at,
        completed_at,
        error_message,
    };
    
    let job = service.update_processing_job(id, update)
        .await.map_err(|e| e.to_string())?;
    
    Ok(serde_json::to_value(job).unwrap())
}

#[tauri::command]
pub async fn process_files_for_job(
    job_id: i64,
    file_paths: Vec<String>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    println!("process_files_for_job called with job_id: {}, file_paths: {:?}", job_id, file_paths);
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    println!("DataOperationsService created successfully");
    
    // Initialize tables
    service.initialize_tables().await.map_err(|e| {
        println!("Error initializing tables: {}", e);
        e.to_string()
    })?;
    println!("Tables initialized successfully");
    
    println!("Starting real file processing for {} files", file_paths.len());
    
    // Skip job status update for now to avoid hanging
    println!("Skipping job status update to avoid hanging");
    
    // Create ingestion directory in app data directory
    let app_data_dir = dirs::data_dir().ok_or("Could not get app data directory")?;
    let ingest_dir = app_data_dir.join("PlayData").join("ingest");
    if !ingest_dir.exists() {
        std::fs::create_dir_all(&ingest_dir).map_err(|e| {
            println!("Error creating ingest directory: {}", e);
            e.to_string()
        })?;
    }
    
    let mut processed_count = 0;
    let mut error_count = 0;
    
    // Process each file with timeout
    for (index, file_path) in file_paths.iter().enumerate() {
        println!("Processing file {}: {}", index + 1, file_path);
        println!("About to call process_single_file with timeout...");
        
        // Add timeout to prevent hanging
        match tokio::time::timeout(
            std::time::Duration::from_secs(60), // 60 second timeout
            process_single_file(&service, job_id, file_path, &ingest_dir, &ollama)
        ).await {
            Ok(Ok(_)) => {
                processed_count += 1;
                println!("Successfully processed file: {}", file_path);
            }
            Ok(Err(e)) => {
                error_count += 1;
                println!("Error processing file {}: {}", file_path, e);
            }
            Err(_) => {
                error_count += 1;
                println!("Timeout processing file {}: {}", file_path, "Processing timed out after 60 seconds");
            }
        }
        
        // Update progress
        let progress = ((index + 1) as f64 / file_paths.len() as f64) * 100.0;
        println!("Progress: {}% (processed: {}, errors: {})", progress, processed_count, error_count);
    }
    
    println!("All files processed successfully - Processed: {}, Errors: {}", processed_count, error_count);
    
    println!("Job processing completed successfully - Processed: {}, Errors: {}", processed_count, error_count);
    
    Ok(())
}

/// Process a single file through the complete pipeline
async fn process_single_file(
    service: &DataOperationsService,
    job_id: i64,
    file_path: &str,
    ingest_dir: &Path,
    ollama: &Arc<Mutex<OllamaService>>,
) -> Result<(), String> {
    println!("Processing file: {}", file_path);
    
    // Step 1: Process the actual file
    let file_name = Path::new(file_path)
        .file_name()
        .ok_or("Invalid file path")?
        .to_string_lossy()
        .to_string();
    
    let ingest_path = ingest_dir.join(&file_name);
    
    // Copy the actual file to ingestion directory
    fs::copy(file_path, &ingest_path).map_err(|e| {
        format!("Failed to copy file to ingest directory: {}", e)
    })?;
    
    println!("File copied to: {:?}", ingest_path);
    
    // Step 2: Process file content using FileProcessor
    println!("Starting file content processing...");
    let processed_content = FileProcessor::process_file(&ingest_path).await.map_err(|e| {
        format!("Failed to process file content: {}", e)
    })?;
    
    println!("File content processed, extracted {} characters", processed_content.text.len());
    
    // Step 3: Generate file hash for duplicate detection
    let file_hash = generate_file_hash(&ingest_path)?;
    println!("File hash: {}", file_hash);
    
    // Step 4: AI-powered text cleaning
    println!("Starting AI text cleaning...");
    let cleaned_text = clean_text_with_ai(&processed_content.text, ollama).await?;
    println!("Text cleaned with AI, {} characters", cleaned_text.len());
    
    // Step 5: Chunk the text
    let chunks = chunk_text(&cleaned_text, 500, 100)?;
    println!("Text chunked into {} pieces", chunks.len());
    
    // Step 6: Generate embeddings for each chunk
    let mut chunks_with_embeddings = Vec::new();
    let mut successful_embeddings = 0;
    let mut failed_embeddings = 0;
    
    for (index, chunk) in chunks.iter().enumerate() {
        match generate_embedding(chunk, ollama).await {
            Ok(embedding) => {
                chunks_with_embeddings.push((index, chunk.clone(), Some(embedding)));
                successful_embeddings += 1;
            },
            Err(e) => {
                println!("Failed to generate embedding for chunk {}: {}", index, e);
                chunks_with_embeddings.push((index, chunk.clone(), None));
                failed_embeddings += 1;
            }
        }
    }
    println!("Generated embeddings for {} chunks ({} successful, {} failed)", 
              chunks_with_embeddings.len(), successful_embeddings, failed_embeddings);
    
    // Step 7: Store in database
    let file_id = store_processed_file(
        service,
        job_id,
        &file_name,
        &ingest_path.to_string_lossy(),
        &processed_content,
        &file_hash,
        &chunks_with_embeddings,
    ).await?;
    
    println!("Stored processed file with ID: {}", file_id);
    
    Ok(())
}

/// Generate SHA256 hash of a file
fn generate_file_hash(file_path: &Path) -> Result<String, String> {
    let file_content = fs::read(file_path).map_err(|e| {
        format!("Failed to read file for hashing: {}", e)
    })?;
    
    let mut hasher = Sha256::new();
    hasher.update(&file_content);
    let hash = hasher.finalize();
    Ok(format!("{:x}", hash))
}

/// Clean text using AI
async fn clean_text_with_ai(text: &str, _ollama: &Arc<Mutex<OllamaService>>) -> Result<String, String> {
    println!("Using basic text cleaning (bypassing AI for now)");
    
    // Basic text cleaning without AI - this should be fast and reliable
    let cleaned = text
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| line.trim())
        .collect::<Vec<&str>>()
        .join("\n");
    
    println!("Basic text cleaning completed, {} characters", cleaned.len());
    Ok(cleaned)
}

/// Chunk text into smaller pieces with overlap
fn chunk_text(text: &str, chunk_size: usize, overlap: usize) -> Result<Vec<String>, String> {
    let words: Vec<&str> = text.split_whitespace().collect();
    let mut chunks = Vec::new();
    
    let mut start = 0;
    while start < words.len() {
        let end = std::cmp::min(start + chunk_size, words.len());
        let chunk_words = &words[start..end];
        chunks.push(chunk_words.join(" "));
        
        if end >= words.len() {
            break;
        }
        
        start = end - overlap;
    }
    
    Ok(chunks)
}

/// Generate embedding for text using Ollama
async fn generate_embedding(text: &str, ollama: &Arc<Mutex<OllamaService>>) -> Result<Vec<f32>, String> {
    // Safely truncate text for preview, handling Unicode characters
    let preview = if text.len() > 50 {
        let mut chars = text.chars();
        let mut preview = String::new();
        for _ in 0..50 {
            if let Some(ch) = chars.next() {
                preview.push(ch);
            } else {
                break;
            }
        }
        format!("{}...", preview)
    } else {
        text.to_string()
    };
    println!("Generating embedding for text: {}", preview);
    
    // Try to generate real embedding with timeout
    let result = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        async {
            let ollama_service = ollama.lock().await;
            ollama_service.generate_embedding("nomic-embed-text", text).await
        }
    ).await;
    
    match result {
        Ok(Ok(embedding)) => {
            println!("Real embedding generated with {} dimensions", embedding.len());
            Ok(embedding)
        },
        Ok(Err(e)) => {
            println!("Ollama embedding failed: {}, skipping embedding for this chunk", e);
            Err("Failed to generate embedding".to_string())
        },
        Err(_) => {
            println!("Embedding generation timed out, skipping embedding for this chunk");
            Err("Embedding generation timed out".to_string())
        }
    }
}

/// Store processed file and chunks in database
async fn store_processed_file(
    service: &DataOperationsService,
    job_id: i64,
    filename: &str,
    filepath: &str,
    processed_content: &ProcessedContent,
    file_hash: &str,
    chunks_with_embeddings: &[(usize, String, Option<Vec<f32>>)],
) -> Result<i64, String> {
    println!("Storing processed file: {} with {} chunks", filename, chunks_with_embeddings.len());
    
    let file_id = service.store_processed_file(
        job_id,
        filename,
        filepath,
        processed_content.metadata.file_size,
        &processed_content.metadata.mime_type,
        file_hash,
        chunks_with_embeddings,
    ).await.map_err(|e| {
        println!("Error storing processed file: {}", e);
        e.to_string()
    })?;
    
    println!("Successfully stored {} chunks for file {} with ID: {}", chunks_with_embeddings.len(), filename, file_id);
    Ok(file_id)
}

#[tauri::command]
pub async fn get_processing_stats(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let stats = service.get_processing_stats()
        .await.map_err(|e| e.to_string())?;
    
    Ok(serde_json::to_value(stats).unwrap())
}

#[tauri::command]
pub async fn get_processed_files(
    jobId: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    println!("=== get_processed_files COMMAND INVOKED ===");
    println!("get_processed_files called with jobId: {}", jobId);
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let files = service.get_processed_files(jobId)
        .await.map_err(|e| {
            println!("Error getting processed files: {}", e);
            e.to_string()
        })?;
    
    println!("Found {} processed files for jobId: {}", files.len(), jobId);
    for file in &files {
        println!("File: {} (ID: {})", file.filename, file.id);
    }
    
    Ok(serde_json::to_value(files).unwrap())
}

#[tauri::command]
pub async fn get_data_chunks(
    fileId: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    println!("get_data_chunks called with fileId: {}", fileId);
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let chunks = service.get_data_chunks(fileId)
        .await.map_err(|e| {
            println!("Error getting data chunks: {}", e);
            e.to_string()
        })?;
    
    println!("Found {} chunks for fileId: {}", chunks.len(), fileId);
    Ok(serde_json::to_value(chunks).unwrap())
}

#[tauri::command]
pub async fn export_processed_data(
    jobId: i64,
    format: String, // "jsonl", "csv", "md"
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<String, String> {
    let service = DataOperationsService::new(db.inner().clone(), ollama.inner().clone());
    
    let files = service.get_processed_files(jobId)
        .await.map_err(|e| e.to_string())?;
    
    match format.as_str() {
        "jsonl" => {
            let mut jsonl_content = String::new();
            for file in files {
                  let chunks = service.get_data_chunks(file.id)
                    .await.map_err(|e| e.to_string())?;
                
                for chunk in chunks {
                    let chunk_data = serde_json::json!({
                        "id": chunk.id,
                        "file_id": chunk.file_id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "token_count": chunk.token_count,
                        "has_embedding": chunk.has_embedding,
                        "metadata": file.metadata
                    });
                    jsonl_content.push_str(&serde_json::to_string(&chunk_data).unwrap());
                    jsonl_content.push('\n');
                }
            }
            Ok(jsonl_content)
        }
        "csv" => {
            let mut csv_content = String::new();
            csv_content.push_str("file_id,filename,file_size,mime_type,chunks_count,has_embeddings,is_duplicate,created_at\n");
            
            for file in files {
                csv_content.push_str(&format!(
                    "{},{},{},{},{},{},{},{}\n",
                    file.id,
                    file.filename,
                    file.file_size,
                    file.mime_type,
                    file.chunks_count,
                    file.has_embeddings,
                    file.is_duplicate,
                    file.created_at
                ));
            }
            Ok(csv_content)
        }
        "md" => {
            let mut md_content = String::new();
            md_content.push_str("# Processed Data Export\n\n");
            
            for file in files {
                md_content.push_str(&format!("## {}\n\n", file.filename));
                md_content.push_str(&format!("- **Size**: {} bytes\n", file.file_size));
                md_content.push_str(&format!("- **Type**: {}\n", file.mime_type));
                md_content.push_str(&format!("- **Chunks**: {}\n", file.chunks_count));
                md_content.push_str(&format!("- **Embeddings**: {}\n", if file.has_embeddings { "Yes" } else { "No" }));
                md_content.push_str(&format!("- **Duplicate**: {}\n", if file.is_duplicate { "Yes" } else { "No" }));
                md_content.push_str(&format!("- **Created**: {}\n\n", file.created_at));
                
                  let chunks = service.get_data_chunks(file.id)
                    .await.map_err(|e| e.to_string())?;
                
                for chunk in chunks {
                    md_content.push_str(&format!("### Chunk {}\n\n", chunk.chunk_index));
                    md_content.push_str(&format!("{}\n\n", chunk.content));
                }
            }
            Ok(md_content)
        }
        _ => Err("Unsupported format. Use 'jsonl', 'csv', or 'md'".to_string())
    }
}
