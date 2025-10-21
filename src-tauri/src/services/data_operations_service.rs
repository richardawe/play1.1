use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use rusqlite::{params, Result};
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::Utc;
use serde_json::json;
use bincode;

// Data structures for the data operations service
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DataProcessingJob {
    pub id: i64,
    pub name: String,
    pub status: String,
    pub progress: f64,
    pub total_files: i64,
    pub processed_files: i64,
    pub error_count: i64,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CreateDataProcessingJob {
    pub name: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UpdateDataProcessingJob {
    pub name: Option<String>,
    pub status: Option<String>,
    pub progress: Option<f64>,
    pub total_files: Option<i64>,
    pub processed_files: Option<i64>,
    pub error_count: Option<i64>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub error_message: Option<String>,
}

impl Default for UpdateDataProcessingJob {
    fn default() -> Self {
        Self {
            name: None,
            status: None,
            progress: None,
            total_files: None,
            processed_files: None,
            error_count: None,
            started_at: None,
            completed_at: None,
            error_message: None,
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProcessedFile {
    pub id: i64,
    pub job_id: i64,
    pub filename: String,
    pub filepath: String,
    pub file_size: i64,
    pub mime_type: String,
    pub status: String,
    pub chunks_count: i64,
    pub has_embeddings: bool,
    pub is_duplicate: bool,
    pub metadata: String,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DataChunk {
    pub id: i64,
    pub file_id: i64,
    pub chunk_index: i64,
    pub content: String,
    pub token_count: i64,
    pub has_embedding: bool,
    pub embedding_vector: Vec<f32>,
    pub metadata: String,
    pub created_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProcessingStats {
    pub total_jobs: i64,
    pub pending_jobs: i64,
    pub running_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub total_files_processed: i64,
    pub total_chunks_created: i64,
    pub total_embeddings_generated: i64,
    pub total_errors: i64,
}

pub struct DataOperationsService {
    db: Arc<Mutex<Database>>,
    ollama: Arc<Mutex<OllamaService>>,
}

impl DataOperationsService {
    pub fn new(db: Arc<Mutex<Database>>, ollama: Arc<Mutex<OllamaService>>) -> Self {
        Self {
            db,
            ollama,
        }
    }

    /// Initialize the data operations database tables
    pub async fn initialize_tables(&self) -> Result<()> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        // Create data processing jobs table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS data_processing_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                progress REAL NOT NULL DEFAULT 0.0,
                total_files INTEGER NOT NULL DEFAULT 0,
                processed_files INTEGER NOT NULL DEFAULT 0,
                error_count INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                completed_at DATETIME,
                error_message TEXT
            )",
            [],
        )?;

        // Create processed files table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS processed_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                original_path TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                chunks_count INTEGER NOT NULL DEFAULT 0,
                has_embeddings BOOLEAN NOT NULL DEFAULT 0,
                is_duplicate BOOLEAN NOT NULL DEFAULT 0,
                duplicate_of INTEGER,
                metadata TEXT,
                file_hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed_at DATETIME,
                FOREIGN KEY (job_id) REFERENCES data_processing_jobs (id)
            )",
            [],
        )?;

        // Create data chunks table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS data_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                token_count INTEGER NOT NULL DEFAULT 0,
                has_embedding BOOLEAN NOT NULL DEFAULT 0,
                embedding_vector BLOB,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (file_id) REFERENCES processed_files (id)
            )",
            [],
        )?;

        // Create vector index table for embeddings
        conn.execute(
            "CREATE TABLE IF NOT EXISTS vector_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id INTEGER NOT NULL,
                content_type TEXT NOT NULL,
                content TEXT NOT NULL,
                embedding_vector BLOB NOT NULL,
                model_name TEXT NOT NULL,
                chunk_index INTEGER,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Create indexes for better performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_processed_files_job_id ON processed_files (job_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_processed_files_hash ON processed_files (file_hash)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_data_chunks_file_id ON data_chunks (file_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_vector_index_content_id ON vector_index (content_id)",
            [],
        )?;

        // Add embedding_vector column to data_chunks if it doesn't exist (migration)
        conn.execute(
            "ALTER TABLE data_chunks ADD COLUMN embedding_vector BLOB",
            [],
        ).ok(); // Use ok() to ignore error if column already exists

        Ok(())
    }

    /// Create a new data processing job
    pub async fn create_processing_job(&self, name: String) -> Result<DataProcessingJob> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO data_processing_jobs (name, status, progress, total_files, processed_files, error_count, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![name, "pending", 0.0, 0, 0, 0, now],
        )?;
        
        let job_id = conn.last_insert_rowid();
        
        Ok(DataProcessingJob {
            id: job_id,
            name,
            status: "pending".to_string(),
            progress: 0.0,
            total_files: 0,
            processed_files: 0,
            error_count: 0,
            created_at: now,
            started_at: None,
            completed_at: None,
            error_message: None,
        })
    }

    /// Get a processing job by ID
    pub async fn get_processing_job(&self, id: i64) -> Result<DataProcessingJob> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, status, progress, total_files, processed_files, error_count, 
                    created_at, started_at, completed_at, error_message 
             FROM data_processing_jobs WHERE id = ?1"
        )?;
        
        let job = stmt.query_row(params![id], |row| {
            Ok(DataProcessingJob {
                id: row.get(0)?,
                name: row.get(1)?,
                status: row.get(2)?,
                progress: row.get(3)?,
                total_files: row.get(4)?,
                processed_files: row.get(5)?,
                error_count: row.get(6)?,
                created_at: row.get(7)?,
                started_at: row.get(8)?,
                completed_at: row.get(9)?,
                error_message: row.get(10)?,
            })
        })?;
        
        Ok(job)
    }

    /// Update a processing job
    pub async fn update_processing_job(&self, id: i64, update: UpdateDataProcessingJob) -> Result<DataProcessingJob> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        // For now, just update the basic fields
        if let Some(status) = update.status {
            conn.execute("UPDATE data_processing_jobs SET status = ?1 WHERE id = ?2", params![status, id])?;
        }
        if let Some(progress) = update.progress {
            conn.execute("UPDATE data_processing_jobs SET progress = ?1 WHERE id = ?2", params![progress, id])?;
        }
        if let Some(total_files) = update.total_files {
            conn.execute("UPDATE data_processing_jobs SET total_files = ?1 WHERE id = ?2", params![total_files, id])?;
        }
        if let Some(processed_files) = update.processed_files {
            conn.execute("UPDATE data_processing_jobs SET processed_files = ?1 WHERE id = ?2", params![processed_files, id])?;
        }
        if let Some(error_count) = update.error_count {
            conn.execute("UPDATE data_processing_jobs SET error_count = ?1 WHERE id = ?2", params![error_count, id])?;
        }
        if let Some(started_at) = update.started_at {
            conn.execute("UPDATE data_processing_jobs SET started_at = ?1 WHERE id = ?2", params![started_at, id])?;
        }
        if let Some(completed_at) = update.completed_at {
            conn.execute("UPDATE data_processing_jobs SET completed_at = ?1 WHERE id = ?2", params![completed_at, id])?;
        }
        if let Some(error_message) = update.error_message {
            conn.execute("UPDATE data_processing_jobs SET error_message = ?1 WHERE id = ?2", params![error_message, id])?;
        }
        
        self.get_processing_job(id).await
    }

    /// Get all processing jobs
    pub async fn get_all_processing_jobs(&self) -> Result<Vec<DataProcessingJob>> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        let mut stmt = conn.prepare(
            "SELECT id, name, status, progress, total_files, processed_files, error_count, 
                    created_at, started_at, completed_at, error_message 
             FROM data_processing_jobs ORDER BY created_at DESC"
        )?;
        
        let job_iter = stmt.query_map([], |row| {
            Ok(DataProcessingJob {
                id: row.get(0)?,
                name: row.get(1)?,
                status: row.get(2)?,
                progress: row.get(3)?,
                total_files: row.get(4)?,
                processed_files: row.get(5)?,
                error_count: row.get(6)?,
                created_at: row.get(7)?,
                started_at: row.get(8)?,
                completed_at: row.get(9)?,
                error_message: row.get(10)?,
            })
        })?;
        
        let mut jobs = Vec::new();
        for job in job_iter {
            jobs.push(job?);
        }
        
        Ok(jobs)
    }

    /// Get processing statistics
    pub async fn get_processing_stats(&self) -> Result<ProcessingStats> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        // Get job counts by status
        let total_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM data_processing_jobs", [], |row| row.get(0))?;
        let pending_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM data_processing_jobs WHERE status = 'pending'", [], |row| row.get(0))?;
        let running_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM data_processing_jobs WHERE status = 'running'", [], |row| row.get(0))?;
        let completed_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM data_processing_jobs WHERE status = 'completed'", [], |row| row.get(0))?;
        let failed_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM data_processing_jobs WHERE status = 'failed'", [], |row| row.get(0))?;
        
        // Get file and chunk counts
        let total_files_processed: i64 = conn.query_row("SELECT COUNT(*) FROM processed_files", [], |row| row.get(0))?;
        let total_chunks_created: i64 = conn.query_row("SELECT COUNT(*) FROM data_chunks", [], |row| row.get(0))?;
        let total_embeddings_generated: i64 = conn.query_row("SELECT COUNT(*) FROM data_chunks WHERE has_embedding = 1", [], |row| row.get(0))?;
        let total_errors: i64 = conn.query_row("SELECT COALESCE(SUM(error_count), 0) FROM data_processing_jobs", [], |row| row.get(0))?;
        
        Ok(ProcessingStats {
            total_jobs,
            pending_jobs,
            running_jobs,
            completed_jobs,
            failed_jobs,
            total_files_processed,
            total_chunks_created,
            total_embeddings_generated,
            total_errors,
        })
    }

    /// Get processed files for a job
    pub async fn get_processed_files(&self, job_id: i64) -> Result<Vec<ProcessedFile>> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        let mut stmt = conn.prepare(
            "SELECT id, job_id, filename, original_path, file_size, mime_type, status, 
                    chunks_count, has_embeddings, is_duplicate, metadata, created_at 
             FROM processed_files WHERE job_id = ?1 ORDER BY created_at"
        )?;
        
        let file_iter = stmt.query_map(params![job_id], |row| {
            Ok(ProcessedFile {
                id: row.get(0)?,
                job_id: row.get(1)?,
                filename: row.get(2)?,
                filepath: row.get(3)?,
                file_size: row.get(4)?,
                mime_type: row.get(5)?,
                status: row.get(6)?,
                chunks_count: row.get(7)?,
                has_embeddings: row.get(8)?,
                is_duplicate: row.get(9)?,
                metadata: row.get(10)?,
                created_at: row.get(11)?,
            })
        })?;
        
        let mut files = Vec::new();
        for file in file_iter {
            files.push(file?);
        }
        
        Ok(files)
    }

    /// Get data chunks for a file
    pub async fn get_data_chunks(&self, file_id: i64) -> Result<Vec<DataChunk>> {
        println!("DataOperationsService::get_data_chunks called with file_id: {}", file_id);
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        // First, let's check if the table exists and has data
        let mut check_stmt = conn.prepare("SELECT COUNT(*) FROM data_chunks WHERE file_id = ?1")?;
        let count: i64 = check_stmt.query_row(params![file_id], |row| row.get(0))?;
        println!("Found {} chunks in database for file_id: {}", count, file_id);
        
        // Let's also check if there are any chunks at all
        let mut total_stmt = conn.prepare("SELECT COUNT(*) FROM data_chunks")?;
        let total_count: i64 = total_stmt.query_row([], |row| row.get(0))?;
        println!("Total chunks in database: {}", total_count);
        
        let mut stmt = conn.prepare(
            "SELECT id, file_id, chunk_index, content, token_count, has_embedding, created_at 
             FROM data_chunks WHERE file_id = ?1 ORDER BY chunk_index"
        ).map_err(|e| {
            println!("Error preparing statement: {}", e);
            e
        })?;
        
        let chunk_iter = stmt.query_map(params![file_id], |row| {
            Ok(DataChunk {
                id: row.get(0)?,
                file_id: row.get(1)?,
                chunk_index: row.get(2)?,
                content: row.get(3)?,
                token_count: row.get(4)?,
                has_embedding: row.get(5)?,
                embedding_vector: Vec::new(), // Will be populated separately
                metadata: "{}".to_string(),
                created_at: row.get(6)?,
            })
        })?;
        
        let mut chunks = Vec::new();
        for chunk in chunk_iter {
            let chunk = chunk.map_err(|e| {
                println!("Error processing chunk row: {}", e);
                e
            })?;
            chunks.push(chunk);
        }
        
        println!("Successfully retrieved {} chunks for file_id: {}", chunks.len(), file_id);
        Ok(chunks)
    }

    /// Store a processed file and its chunks in the database
    pub async fn store_processed_file(
        &self,
        job_id: i64,
        filename: &str,
        filepath: &str,
        file_size: u64,
        mime_type: &str,
        _file_hash: &str,
        chunks_with_embeddings: &[(usize, String, Option<Vec<f32>>)],
    ) -> Result<i64> {
        let db = self.db.lock().await;
        let conn = db.get_connection();
        
        // Insert processed file
        let now = Utc::now().to_rfc3339();
        conn.execute(
            "INSERT INTO processed_files (job_id, filename, original_path, file_size, mime_type, status, chunks_count, has_embeddings, is_duplicate, metadata, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                job_id,
                filename,
                filepath,
                file_size as i64,
                mime_type,
                "completed",
                chunks_with_embeddings.len() as i64,
                true, // has_embeddings
                false, // is_duplicate
                "{}", // metadata as JSON string
                now
            ],
        )?;
        
        let file_id = conn.last_insert_rowid();
        
        // Insert chunks
        for (chunk_index, chunk_text, embedding) in chunks_with_embeddings {
            let (has_embedding, embedding_bytes) = match embedding {
                Some(embedding_vec) => {
                    let bytes = bincode::serialize(embedding_vec).map_err(|e| {
                        rusqlite::Error::InvalidParameterName(format!("Failed to serialize embedding: {}", e))
                    })?;
                    (true, bytes)
                },
                None => {
                    println!("Chunk {} has no embedding, storing without embedding vector", chunk_index);
                    (false, Vec::new())
                }
            };
            
            conn.execute(
                "INSERT INTO data_chunks (file_id, chunk_index, content, token_count, has_embedding, embedding_vector, created_at) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    file_id,
                    *chunk_index as i64,
                    chunk_text,
                    chunk_text.split_whitespace().count() as i64, // token_count
                    has_embedding,
                    embedding_bytes,
                    now
                ],
            )?;
        }
        
        Ok(file_id)
    }

    /// Export processed data in various formats
    pub async fn export_processed_data(&self, job_id: i64, format: &str) -> Result<String> {
        match format {
            "jsonl" => self.export_jsonl(job_id).await,
            "csv" => self.export_csv(job_id).await,
            "md" => self.export_markdown(job_id).await,
            _ => Err(rusqlite::Error::InvalidParameterName(format!("Unsupported format: {}", format))),
        }
    }

    async fn export_jsonl(&self, job_id: i64) -> Result<String> {
        let chunks = self.get_data_chunks(job_id).await?;
        let mut jsonl = String::new();
        
        for chunk in chunks {
            let json_obj = json!({
                "id": chunk.id,
                "text": chunk.content,
                "metadata": {
                    "file_id": chunk.file_id,
                    "chunk_index": chunk.chunk_index,
                    "created_at": chunk.created_at
                }
            });
            jsonl.push_str(&json_obj.to_string());
            jsonl.push('\n');
        }
        
        Ok(jsonl)
    }

    async fn export_csv(&self, job_id: i64) -> Result<String> {
        let files = self.get_processed_files(job_id).await?;
        let mut csv = String::new();
        
        // Header
        csv.push_str("id,filename,file_size,mime_type,status,chunks_count,has_embeddings,created_at\n");
        
        for file in files {
            csv.push_str(&format!(
                "{},{},{},{},{},{},{},{}\n",
                file.id, file.filename, file.file_size, file.mime_type,
                file.status, file.chunks_count, file.has_embeddings, file.created_at
            ));
        }
        
        Ok(csv)
    }

    async fn export_markdown(&self, job_id: i64) -> Result<String> {
        let files = self.get_processed_files(job_id).await?;
        let mut md = String::new();
        
        md.push_str("# Processed Files\n\n");
        
        for file in files {
            md.push_str(&format!("## {}\n\n", file.filename));
            md.push_str(&format!("- **Size**: {} bytes\n", file.file_size));
            md.push_str(&format!("- **Type**: {}\n", file.mime_type));
            md.push_str(&format!("- **Status**: {}\n", file.status));
            md.push_str(&format!("- **Chunks**: {}\n", file.chunks_count));
            md.push_str(&format!("- **Has Embeddings**: {}\n", file.has_embeddings));
            md.push_str(&format!("- **Created**: {}\n\n", file.created_at));
        }
        
        Ok(md)
    }
}