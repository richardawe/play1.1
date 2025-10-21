use crate::models::ingestion::{CreateIngestionJob, IngestionJob, UpdateIngestionJob, IngestionJobStats};
use crate::models::metadata::MetadataExtractionResult;
use crate::services::database::Database;
use rusqlite::{params, Result};
use std::path::Path;
use std::fs;
use sha2::{Sha256, Digest};
use mime_guess::from_path;
use zip::ZipArchive;

pub struct IngestionService<'a> {
    db: &'a Database,
}

impl<'a> IngestionService<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    /// Create a new ingestion job
    pub fn create_ingestion_job(&self, job: CreateIngestionJob) -> Result<IngestionJob> {
        let conn = self.db.get_connection();
        
        conn.execute(
            "INSERT INTO ingestion_jobs (source_path, job_type, status) VALUES (?1, ?2, ?3)",
            params![job.source_path, job.job_type, "pending"],
        )?;

        let id = conn.last_insert_rowid();
        self.get_ingestion_job(id)
    }

    /// Get an ingestion job by ID
    pub fn get_ingestion_job(&self, id: i64) -> Result<IngestionJob> {
        let conn = self.db.get_connection();
        
        conn.query_row(
            "SELECT id, source_path, job_type, status, progress, total_files, processed_files, 
                    error_count, created_at, started_at, completed_at, error_message 
             FROM ingestion_jobs WHERE id = ?1",
            params![id],
            |row| {
                Ok(IngestionJob {
                    id: row.get(0)?,
                    source_path: row.get(1)?,
                    job_type: row.get(2)?,
                    status: row.get(3)?,
                    progress: row.get(4)?,
                    total_files: row.get(5)?,
                    processed_files: row.get(6)?,
                    error_count: row.get(7)?,
                    created_at: row.get(8)?,
                    started_at: row.get(9)?,
                    completed_at: row.get(10)?,
                    error_message: row.get(11)?,
                })
            },
        )
    }

    /// Update an ingestion job
    pub fn update_ingestion_job(&self, id: i64, update: UpdateIngestionJob) -> Result<IngestionJob> {
        let conn = self.db.get_connection();
        
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(status) = &update.status {
            updates.push("status = ?");
            params_vec.push(Box::new(status.clone()));
        }
        if let Some(progress) = update.progress {
            updates.push("progress = ?");
            params_vec.push(Box::new(progress));
        }
        if let Some(total_files) = update.total_files {
            updates.push("total_files = ?");
            params_vec.push(Box::new(total_files));
        }
        if let Some(processed_files) = update.processed_files {
            updates.push("processed_files = ?");
            params_vec.push(Box::new(processed_files));
        }
        if let Some(error_count) = update.error_count {
            updates.push("error_count = ?");
            params_vec.push(Box::new(error_count));
        }
        if let Some(started_at) = &update.started_at {
            updates.push("started_at = ?");
            params_vec.push(Box::new(started_at.clone()));
        }
        if let Some(completed_at) = &update.completed_at {
            updates.push("completed_at = ?");
            params_vec.push(Box::new(completed_at.clone()));
        }
        if let Some(error_message) = &update.error_message {
            updates.push("error_message = ?");
            params_vec.push(Box::new(error_message.clone()));
        }

        if !updates.is_empty() {
            let query = format!("UPDATE ingestion_jobs SET {} WHERE id = ?", updates.join(", "));
            params_vec.push(Box::new(id));
            
            let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
            conn.execute(&query, params_refs.as_slice())?;
        }

        self.get_ingestion_job(id)
    }

    /// Get all ingestion jobs
    pub fn get_all_ingestion_jobs(&self, limit: Option<i64>) -> Result<Vec<IngestionJob>> {
        let conn = self.db.get_connection();
        let limit = limit.unwrap_or(100);
        
        let mut stmt = conn.prepare(
            "SELECT id, source_path, job_type, status, progress, total_files, processed_files, 
                    error_count, created_at, started_at, completed_at, error_message 
             FROM ingestion_jobs ORDER BY created_at DESC LIMIT ?1"
        )?;

        let jobs = stmt.query_map(params![limit], |row| {
            Ok(IngestionJob {
                id: row.get(0)?,
                source_path: row.get(1)?,
                job_type: row.get(2)?,
                status: row.get(3)?,
                progress: row.get(4)?,
                total_files: row.get(5)?,
                processed_files: row.get(6)?,
                error_count: row.get(7)?,
                created_at: row.get(8)?,
                started_at: row.get(9)?,
                completed_at: row.get(10)?,
                error_message: row.get(11)?,
            })
        })?;

        jobs.collect()
    }

    /// Get ingestion job statistics
    pub fn get_ingestion_stats(&self) -> Result<IngestionJobStats> {
        let conn = self.db.get_connection();
        
        let total_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM ingestion_jobs", [], |row| row.get(0))?;
        let pending_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM ingestion_jobs WHERE status = 'pending'", [], |row| row.get(0))?;
        let running_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM ingestion_jobs WHERE status = 'running'", [], |row| row.get(0))?;
        let completed_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM ingestion_jobs WHERE status = 'completed'", [], |row| row.get(0))?;
        let failed_jobs: i64 = conn.query_row("SELECT COUNT(*) FROM ingestion_jobs WHERE status = 'failed'", [], |row| row.get(0))?;
        let total_files_processed: i64 = conn.query_row("SELECT COALESCE(SUM(processed_files), 0) FROM ingestion_jobs", [], |row| row.get(0))?;
        let total_errors: i64 = conn.query_row("SELECT COALESCE(SUM(error_count), 0) FROM ingestion_jobs", [], |row| row.get(0))?;

        Ok(IngestionJobStats {
            total_jobs,
            pending_jobs,
            running_jobs,
            completed_jobs,
            failed_jobs,
            total_files_processed,
            total_errors,
        })
    }

    /// Process a folder or ZIP file for ingestion
    pub fn process_source(&self, job_id: i64, source_path: &str) -> Result<()> {
        let path = Path::new(source_path);
        
        if !path.exists() {
            return Err(rusqlite::Error::InvalidParameterName(format!("Source path does not exist: {}", source_path)));
        }

        // Update job status to running
        self.update_ingestion_job(job_id, UpdateIngestionJob {
            status: Some("running".to_string()),
            started_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        })?;

        let mut processed_count = 0;
        let mut error_count = 0;

        // Count total files first
        let file_count = self.count_files_recursive(path)?;
        
        // Update total files
        self.update_ingestion_job(job_id, UpdateIngestionJob {
            total_files: Some(file_count),
            ..Default::default()
        })?;

        // Process files
        if let Err(e) = self.process_files_recursive(job_id, path, &mut processed_count, &mut error_count) {
            // Update job with error
            self.update_ingestion_job(job_id, UpdateIngestionJob {
                status: Some("failed".to_string()),
                error_message: Some(e.to_string()),
                completed_at: Some(chrono::Utc::now().to_rfc3339()),
                ..Default::default()
            })?;
            return Err(e);
        }

        // Mark job as completed
        self.update_ingestion_job(job_id, UpdateIngestionJob {
            status: Some("completed".to_string()),
            processed_files: Some(processed_count),
            error_count: Some(error_count),
            progress: Some(100.0),
            completed_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        })?;

        Ok(())
    }

    /// Count files recursively in a directory
    fn count_files_recursive(&self, path: &Path) -> Result<i64> {
        let mut count = 0;
        
        if path.is_file() {
            return Ok(1);
        }

        if path.is_dir() {
            for entry in fs::read_dir(path).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))? {
                let entry = entry.map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
                let entry_path = entry.path();
                
                if entry_path.is_file() {
                    count += 1;
                } else if entry_path.is_dir() {
                    count += self.count_files_recursive(&entry_path)?;
                }
            }
        }

        Ok(count)
    }

    /// Process files recursively
    fn process_files_recursive(&self, job_id: i64, path: &Path, processed_count: &mut i64, error_count: &mut i64) -> Result<()> {
        if path.is_file() {
            if let Err(e) = self.process_single_file(job_id, path) {
                *error_count += 1;
                eprintln!("Error processing file {:?}: {}", path, e);
            } else {
                *processed_count += 1;
            }
            return Ok(());
        }

        if path.is_dir() {
            for entry in fs::read_dir(path).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))? {
                let entry = entry.map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
                let entry_path = entry.path();
                
                self.process_files_recursive(job_id, &entry_path, processed_count, error_count)?;
            }
        }

        Ok(())
    }

    /// Process a single file
    fn process_single_file(&self, job_id: i64, file_path: &Path) -> Result<()> {
        let conn = self.db.get_connection();
        
        // Get file info
        let metadata = fs::metadata(file_path).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let file_size = metadata.len() as i64;
        let mime_type = from_path(file_path).first_or_text_plain().to_string();
        
        // Check if it's a ZIP file
        if self.is_zip_file(file_path) {
            return self.process_zip_file(job_id, file_path);
        }
        
        // Calculate file hash for duplicate detection
        let _file_hash = self.calculate_file_hash(file_path)?;
        
        // Check if file already exists (by hash)
        let existing_file: Option<i64> = conn.query_row(
            "SELECT id FROM files WHERE filepath = ?1",
            params![file_path.to_string_lossy()],
            |row| row.get(0)
        ).ok();

        let file_id = if let Some(id) = existing_file {
            // File already exists, update metadata
            conn.execute(
                "UPDATE files SET filesize = ?1, mimetype = ?2 WHERE id = ?3",
                params![file_size, mime_type, id],
            )?;
            id
        } else {
            // Insert new file
            conn.execute(
                "INSERT INTO files (filename, filepath, filesize, mimetype) VALUES (?1, ?2, ?3, ?4)",
                params![
                    file_path.file_name().unwrap_or_default().to_string_lossy(),
                    file_path.to_string_lossy(),
                    file_size,
                    mime_type
                ],
            )?;
            conn.last_insert_rowid()
        };

        // Try to read file content and create cleaning tasks
        // First check if it's a known text file type
        let is_text = self.is_text_file(&mime_type);
        
        // If not a known text type, try to read it anyway (fallback for unknown text files)
        if is_text || self.try_read_as_text(file_path) {
            if let Ok(content) = fs::read_to_string(file_path) {
                let metadata_result = self.extract_metadata(file_id, &content, &mime_type);
                
                // Store metadata
                if let Ok(metadata) = metadata_result {
                    self.store_metadata(file_id, metadata)?;
                }
                
                // Create cleaning tasks for all readable text files
                self.create_cleaning_tasks(file_id, &content, &mime_type)?;
            }
        }

        Ok(())
    }

    /// Create cleaning tasks for a file
    fn create_cleaning_tasks(&self, file_id: i64, content: &str, _mime_type: &str) -> Result<()> {
        let conn = self.db.get_connection();
        
        // Create different types of cleaning tasks based on file type and content
        let tasks = vec![
            ("text_cleanup", 1), // High priority
            ("metadata_extraction", 2), // Medium priority
            ("format_conversion", 3), // Low priority
        ];
        
        for (task_type, priority) in tasks {
            // Check if task already exists
            let existing_task: Option<i64> = conn.query_row(
                "SELECT id FROM cleaning_queue WHERE file_id = ?1 AND task_type = ?2",
                params![file_id, task_type],
                |row| row.get(0)
            ).ok();
            
            if existing_task.is_none() {
                // Create new cleaning task
                conn.execute(
                    "INSERT INTO cleaning_queue (file_id, task_type, status, priority, input_content) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![
                        file_id,
                        task_type,
                        "pending",
                        priority,
                        if task_type == "text_cleanup" { Some(content.to_string()) } else { None }
                    ],
                )?;
            }
        }
        
        Ok(())
    }

    /// Calculate SHA256 hash of a file
    fn calculate_file_hash(&self, file_path: &Path) -> Result<String> {
        let mut file = fs::File::open(file_path).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let mut hasher = Sha256::new();
        std::io::copy(&mut file, &mut hasher).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let hash = hasher.finalize();
        Ok(format!("{:x}", hash))
    }

    /// Check if file is text-based
    fn is_text_file(&self, mime_type: &str) -> bool {
        mime_type.starts_with("text/") || 
        mime_type == "application/json" ||
        mime_type == "application/xml" ||
        mime_type == "application/javascript" ||
        mime_type == "application/x-python" ||
        mime_type == "application/x-rust" ||
        mime_type == "application/x-typescript" ||
        mime_type == "application/rtf" ||
        mime_type == "application/x-tex" ||
        mime_type == "application/x-latex" ||
        mime_type == "application/markdown" ||
        mime_type == "application/x-markdown" ||
        mime_type == "application/vnd.oasis.opendocument.text" ||
        mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mime_type == "application/msword" ||
        mime_type == "application/pdf" ||
        mime_type == "application/octet-stream" // Often used for text files
    }

    /// Try to read a file as text to detect if it's readable
    fn try_read_as_text(&self, file_path: &Path) -> bool {
        // Check file extension first
        if let Some(extension) = file_path.extension() {
            let ext_str = extension.to_string_lossy().to_lowercase();
            let text_extensions = vec![
                "txt", "md", "json", "xml", "csv", "log", "cfg", "conf", "ini", 
                "yml", "yaml", "toml", "sql", "sh", "bat", "ps1", "py", "js", 
                "ts", "html", "css", "scss", "less", "php", "rb", "go", "rs", 
                "cpp", "c", "h", "hpp", "java", "kt", "swift", "dart", "r", 
                "m", "pl", "lua", "vim", "vimrc", "gitignore", "dockerfile", 
                "makefile", "cmake", "gradle", "pom", "sbt", "gemfile", "lock"
            ];
            if text_extensions.contains(&ext_str.as_str()) {
                return true;
            }
        }

        // Try to read first few bytes to check if it's text
        if let Ok(mut file) = fs::File::open(file_path) {
            let mut buffer = [0; 1024];
            if let Ok(bytes_read) = std::io::Read::read(&mut file, &mut buffer) {
                // Check if the content is valid UTF-8 and mostly printable characters
                if let Ok(text) = std::str::from_utf8(&buffer[..bytes_read]) {
                    let printable_chars = text.chars().filter(|c| c.is_ascii() && (c.is_alphanumeric() || c.is_whitespace() || c.is_ascii_punctuation())).count();
                    let total_chars = text.chars().count();
                    if total_chars > 0 && printable_chars as f32 / total_chars as f32 > 0.8 {
                        return true;
                    }
                }
            }
        }
        
        false
    }

    /// Extract metadata from content
    fn extract_metadata(&self, file_id: i64, content: &str, _mime_type: &str) -> Result<MetadataExtractionResult> {
        // Basic metadata extraction
        let mut author = None;
        let mut topic = None;
        let date = None;
        let mut tags = Vec::new();

        // Extract basic information from content
        if content.len() > 100 {
            // Look for common patterns
            if content.contains("@author") || content.contains("Author:") {
                // Extract author information
                for line in content.lines().take(20) {
                    if line.contains("@author") || line.contains("Author:") {
                        author = Some(line.trim().to_string());
                        break;
                    }
                }
            }

            // Extract topic from first few lines
            let first_lines: Vec<&str> = content.lines().take(5).collect();
            if !first_lines.is_empty() {
                topic = Some(first_lines[0].trim().to_string());
            }

            // Extract tags from content
            if content.contains("#") {
                for line in content.lines() {
                    if line.trim().starts_with("#") {
                        tags.push(line.trim().to_string());
                    }
                }
            }
        }

        Ok(MetadataExtractionResult {
            file_id,
            success: true,
            author,
            topic,
            date,
            tags,
            extracted_content: Some(content.to_string()),
            error_message: None,
        })
    }

    /// Store metadata in database
    fn store_metadata(&self, file_id: i64, metadata: MetadataExtractionResult) -> Result<()> {
        let conn = self.db.get_connection();
        
        // Check if metadata already exists
        let existing: Option<i64> = conn.query_row(
            "SELECT id FROM metadata WHERE file_id = ?1",
            params![file_id],
            |row| row.get(0)
        ).ok();

        let tags_json = serde_json::to_string(&metadata.tags).unwrap_or_default();

        if let Some(id) = existing {
            // Update existing metadata
            conn.execute(
                "UPDATE metadata SET author = ?1, topic = ?2, date = ?3, tags = ?4, 
                        extracted_content = ?5, updated_at = CURRENT_TIMESTAMP WHERE id = ?6",
                params![
                    metadata.author,
                    metadata.topic,
                    metadata.date,
                    tags_json,
                    metadata.extracted_content,
                    id
                ],
            )?;
        } else {
            // Insert new metadata
            conn.execute(
                "INSERT INTO metadata (file_id, author, topic, date, tags, extracted_content) 
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    file_id,
                    metadata.author,
                    metadata.topic,
                    metadata.date,
                    tags_json,
                    metadata.extracted_content
                ],
            )?;
        }

        Ok(())
    }

    /// Check if file is a ZIP file
    fn is_zip_file(&self, file_path: &Path) -> bool {
        // Check by extension
        if let Some(extension) = file_path.extension() {
            let ext_str = extension.to_string_lossy().to_lowercase();
            if ext_str == "zip" {
                return true;
            }
        }
        
        // Check by MIME type
        let mime_type = from_path(file_path).first_or_text_plain();
        if mime_type == "application/zip" {
            return true;
        }
        
        // Check by file header (ZIP files start with "PK")
        if let Ok(mut file) = fs::File::open(file_path) {
            let mut header = [0; 4];
            if let Ok(_) = std::io::Read::read(&mut file, &mut header) {
                if header[0] == 0x50 && header[1] == 0x4B {
                    return true;
                }
            }
        }
        
        false
    }

    /// Process a ZIP file by extracting and processing its contents
    fn process_zip_file(&self, job_id: i64, zip_path: &Path) -> Result<()> {
        println!("Processing ZIP file: {:?}", zip_path);
        
        // Create extraction directory
        let extraction_dir = zip_path.parent()
            .unwrap_or_else(|| Path::new("."))
            .join(format!("{}_extracted", zip_path.file_stem().unwrap_or_default().to_string_lossy()));
        
        if extraction_dir.exists() {
            fs::remove_dir_all(&extraction_dir).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        }
        fs::create_dir_all(&extraction_dir).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        
        // Open and extract ZIP file
        let file = fs::File::open(zip_path).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        let mut archive = ZipArchive::new(file).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        
        let mut extracted_files = Vec::new();
        
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            let outpath = match file.enclosed_name() {
                Some(path) => extraction_dir.join(path),
                None => continue,
            };
            
            // Skip directories
            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
                continue;
            }
            
            // Create parent directories
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
                }
            }
            
            // Extract file
            let mut outfile = fs::File::create(&outpath).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
            
            extracted_files.push(outpath.clone());
            println!("Extracted: {:?}", outpath);
        }
        
        println!("Extracted {} files from ZIP", extracted_files.len());
        
        // Process extracted files
        for extracted_file in extracted_files {
            if let Err(e) = self.process_single_file(job_id, &extracted_file) {
                eprintln!("Error processing extracted file {:?}: {}", extracted_file, e);
            }
        }
        
        // Clean up extraction directory (optional - you might want to keep it)
        // fs::remove_dir_all(&extraction_dir).map_err(|e| rusqlite::Error::InvalidParameterName(e.to_string()))?;
        
        Ok(())
    }
}

impl Default for UpdateIngestionJob {
    fn default() -> Self {
        Self {
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
