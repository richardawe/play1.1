use crate::models::cleaning::{CleaningTask, CreateCleaningTask, UpdateCleaningTask, CleaningTaskStats};
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use rusqlite::{params, Result};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct CleaningService<'a> {
    db: &'a Database,
    ollama: Arc<Mutex<OllamaService>>,
}

impl<'a> CleaningService<'a> {
    pub fn new(db: &'a Database, ollama: Arc<Mutex<OllamaService>>) -> Self {
        Self { db, ollama }
    }

    /// Create a new cleaning task
    pub fn create_cleaning_task(&self, task: CreateCleaningTask) -> Result<CleaningTask> {
        let conn = self.db.get_connection();
        
        let priority = task.priority.unwrap_or(0);
        
        conn.execute(
            "INSERT INTO cleaning_queue (file_id, task_type, priority, input_content, status) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                task.file_id,
                task.task_type,
                priority,
                task.input_content,
                "pending"
            ],
        )?;

        let id = conn.last_insert_rowid();
        self.get_cleaning_task(id)
    }

    /// Get a cleaning task by ID
    pub fn get_cleaning_task(&self, id: i64) -> Result<CleaningTask> {
        let conn = self.db.get_connection();
        
        let result = conn.query_row(
            "SELECT id, file_id, task_type, status, priority, input_content, output_content, 
                    error_message, created_at, started_at, completed_at 
             FROM cleaning_queue WHERE id = ?1",
            params![id],
            |row| {
                let input_content: Option<String> = row.get(5)?;
                println!("DEBUG: Retrieved task {} - input_content length: {:?}", 
                         id, input_content.as_ref().map(|c| c.len()));
                Ok(CleaningTask {
                    id: row.get(0)?,
                    file_id: row.get(1)?,
                    task_type: row.get(2)?,
                    status: row.get(3)?,
                    priority: row.get(4)?,
                    input_content,
                    output_content: row.get(6)?,
                    error_message: row.get(7)?,
                    created_at: row.get(8)?,
                    started_at: row.get(9)?,
                    completed_at: row.get(10)?,
                })
            },
        );
        
        result
    }

    /// Get all cleaning tasks
    pub fn get_all_cleaning_tasks(&self, limit: Option<i64>) -> Result<Vec<CleaningTask>> {
        let conn = self.db.get_connection();
        // Use a very large limit if none specified to effectively get all tasks
        let limit = limit.unwrap_or(100000);
        
        let mut stmt = conn.prepare(
            "SELECT id, file_id, task_type, status, priority, input_content, output_content, 
                    error_message, created_at, started_at, completed_at 
             FROM cleaning_queue ORDER BY priority DESC, created_at ASC LIMIT ?1"
        )?;

        let tasks = stmt.query_map(params![limit], |row| {
            Ok(CleaningTask {
                id: row.get(0)?,
                file_id: row.get(1)?,
                task_type: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                input_content: row.get(5)?,
                output_content: row.get(6)?,
                error_message: row.get(7)?,
                created_at: row.get(8)?,
                started_at: row.get(9)?,
                completed_at: row.get(10)?,
            })
        })?;

        tasks.collect()
    }

    /// Get pending cleaning tasks
    pub fn get_pending_tasks(&self, limit: Option<i64>) -> Result<Vec<CleaningTask>> {
        let conn = self.db.get_connection();
        let limit = limit.unwrap_or(10);
        
        let mut stmt = conn.prepare(
            "SELECT id, file_id, task_type, status, priority, input_content, output_content, 
                    error_message, created_at, started_at, completed_at 
             FROM cleaning_queue WHERE status = 'pending' 
             ORDER BY priority DESC, created_at ASC LIMIT ?1"
        )?;

        let tasks = stmt.query_map(params![limit], |row| {
            Ok(CleaningTask {
                id: row.get(0)?,
                file_id: row.get(1)?,
                task_type: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                input_content: row.get(5)?,
                output_content: row.get(6)?,
                error_message: row.get(7)?,
                created_at: row.get(8)?,
                started_at: row.get(9)?,
                completed_at: row.get(10)?,
            })
        })?;

        tasks.collect()
    }

    /// Update a cleaning task
    pub fn update_cleaning_task(&self, id: i64, update: UpdateCleaningTask) -> Result<CleaningTask> {
        let conn = self.db.get_connection();
        
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(status) = &update.status {
            updates.push("status = ?");
            params_vec.push(Box::new(status.clone()));
        }
        if let Some(output_content) = &update.output_content {
            updates.push("output_content = ?");
            params_vec.push(Box::new(output_content.clone()));
        }
        if let Some(error_message) = &update.error_message {
            updates.push("error_message = ?");
            params_vec.push(Box::new(error_message.clone()));
        }
        if let Some(started_at) = &update.started_at {
            updates.push("started_at = ?");
            params_vec.push(Box::new(started_at.clone()));
        }
        if let Some(completed_at) = &update.completed_at {
            updates.push("completed_at = ?");
            params_vec.push(Box::new(completed_at.clone()));
        }

        if !updates.is_empty() {
            let query = format!("UPDATE cleaning_queue SET {} WHERE id = ?", updates.join(", "));
            params_vec.push(Box::new(id));
            
            let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
            conn.execute(&query, params_refs.as_slice())?;
        }

        self.get_cleaning_task(id)
    }

    /// Get cleaning task statistics
    pub fn get_cleaning_stats(&self) -> Result<CleaningTaskStats> {
        let conn = self.db.get_connection();
        
        let total_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue", [], |row| row.get(0))?;
        let pending_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'pending'", [], |row| row.get(0))?;
        let running_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'running'", [], |row| row.get(0))?;
        let completed_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'completed'", [], |row| row.get(0))?;
        let failed_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'failed'", [], |row| row.get(0))?;

        // Calculate average processing time
        let avg_processing_time: Option<f64> = conn.query_row(
            "SELECT AVG(
                (julianday(completed_at) - julianday(started_at)) * 24 * 60 * 60
            ) FROM cleaning_queue WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL",
            [],
            |row| row.get(0)
        ).ok();

        Ok(CleaningTaskStats {
            total_tasks,
            pending_tasks,
            running_tasks,
            completed_tasks,
            failed_tasks,
            average_processing_time: avg_processing_time,
        })
    }

    /// Process a cleaning task using AI
    pub async fn process_cleaning_task(&self, task_id: i64) -> Result<()> {
        let task = self.get_cleaning_task(task_id)?;
        
        if task.status != "pending" {
            return Err(rusqlite::Error::InvalidParameterName("Task is not pending".to_string()));
        }

        // Mark task as running
        self.update_cleaning_task(task_id, UpdateCleaningTask {
            status: Some("running".to_string()),
            started_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        })?;

        let input_content = task.input_content.unwrap_or_default();
        let task_type = task.task_type.clone();

        // Process based on task type
        let result = match task_type.as_str() {
            "text_cleanup" => self.clean_text_content(&input_content).await,
            "structure_repair" => self.repair_structure(&input_content).await,
            "metadata_extraction" => self.extract_metadata(&input_content).await,
            "content_normalization" => self.normalize_content(&input_content).await,
            "duplicate_removal" => self.remove_duplicates(&input_content).await,
            "format_conversion" => self.convert_format(&input_content).await,
            _ => Err("Unknown task type".to_string()),
        };

        match result {
            Ok(output) => {
                // Mark task as completed
                self.update_cleaning_task(task_id, UpdateCleaningTask {
                    status: Some("completed".to_string()),
                    output_content: Some(output),
                    completed_at: Some(chrono::Utc::now().to_rfc3339()),
                    ..Default::default()
                })?;
            }
            Err(error) => {
                // Mark task as failed
                self.update_cleaning_task(task_id, UpdateCleaningTask {
                    status: Some("failed".to_string()),
                    error_message: Some(error),
                    completed_at: Some(chrono::Utc::now().to_rfc3339()),
                    ..Default::default()
                })?;
            }
        }

        Ok(())
    }

    /// Clean text content using AI
    async fn clean_text_content(&self, content: &str) -> Result<String, String> {
        let prompt = format!(
            "Please clean and improve the following text content. Remove any formatting issues, fix typos, improve readability, and ensure proper structure. Return only the cleaned text without any explanations:\n\n{}",
            content
        );

        self.call_ollama(&prompt).await
    }

    /// Repair document structure using AI
    async fn repair_structure(&self, content: &str) -> Result<String, String> {
        let prompt = format!(
            "Please analyze and repair the structure of the following document. Fix headings, paragraphs, lists, and other structural elements. Return only the repaired document:\n\n{}",
            content
        );

        self.call_ollama(&prompt).await
    }

    /// Extract metadata using AI
    async fn extract_metadata(&self, content: &str) -> Result<String, String> {
        let prompt = format!(
            "Please extract metadata from the following content. Return a JSON object with fields for: title, author, date, topic, tags (array), and summary. Only return the JSON object:\n\n{}",
            content
        );

        self.call_ollama(&prompt).await
    }

    /// Normalize content using AI
    async fn normalize_content(&self, content: &str) -> Result<String, String> {
        let prompt = format!(
            "Please normalize the following content to a consistent format. Standardize formatting, spacing, and structure. Return only the normalized content:\n\n{}",
            content
        );

        self.call_ollama(&prompt).await
    }

    /// Remove duplicates using AI
    async fn remove_duplicates(&self, content: &str) -> Result<String, String> {
        let prompt = format!(
            "Please identify and remove duplicate content from the following text. Keep only unique content and maintain the original structure. Return only the deduplicated content:\n\n{}",
            content
        );

        self.call_ollama(&prompt).await
    }

    /// Convert format using AI
    async fn convert_format(&self, content: &str) -> Result<String, String> {
        let prompt = format!(
            "Please convert the following content to a clean, well-formatted document. Use proper headings, paragraphs, and formatting. Return only the converted content:\n\n{}",
            content
        );

        self.call_ollama(&prompt).await
    }

    /// Call Ollama service
    async fn call_ollama(&self, prompt: &str) -> Result<String, String> {
        let ollama = self.ollama.lock().await;
        
        match ollama.chat(prompt).await {
            Ok(response) => Ok(response),
            Err(e) => Err(format!("Ollama error: {}", e)),
        }
    }

    /// Process all pending tasks
    pub async fn process_pending_tasks(&self) -> Result<()> {
        let pending_tasks = self.get_pending_tasks(Some(5))?; // Process up to 5 tasks at a time
        
        for task in pending_tasks {
            if let Err(e) = self.process_cleaning_task(task.id).await {
                eprintln!("Error processing cleaning task {}: {}", task.id, e);
            }
        }

        Ok(())
    }

    /// Delete a cleaning task
    pub fn delete_cleaning_task(&self, id: i64) -> Result<()> {
        let conn = self.db.get_connection();
        conn.execute("DELETE FROM cleaning_queue WHERE id = ?1", [id])?;
        Ok(())
    }
}

impl Default for UpdateCleaningTask {
    fn default() -> Self {
        Self {
            status: None,
            output_content: None,
            error_message: None,
            started_at: None,
            completed_at: None,
        }
    }
}
