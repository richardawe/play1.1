use crate::models::message::{CreateMessage, Message};
use crate::models::document::{CreateDocument, Document, UpdateDocument};
use crate::models::task::{CreateTask, Task, UpdateTask};
use crate::models::event::{CalendarEvent, CreateEvent, UpdateEvent};
use crate::services::settings::SettingsService;
use rusqlite::{params, Connection, Result};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn get_connection(&self) -> &Connection {
        &self.conn
    }
    
    pub fn get_data_dir() -> PathBuf {
        let mut path = tauri::api::path::app_data_dir(&tauri::Config::default())
            .unwrap_or_else(|| PathBuf::from("."));
        path.push("play");
        path.push("data");
        path
    }
    
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path();
        
        // Create parent directory if it doesn't exist
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                rusqlite::Error::ToSqlConversionFailure(Box::new(e))
            })?;
        }

        let conn = Connection::open(&db_path)?;
        
        let db = Database { conn };
        db.init_schema()?;
        
        Ok(db)
    }

    fn get_db_path() -> PathBuf {
        let mut path = tauri::api::path::app_data_dir(&tauri::Config::default())
            .unwrap_or_else(|| PathBuf::from("."));
        path.push("play");
        path.push("data");
        path.push("play.db");
        path
    }

    fn init_schema(&self) -> Result<()> {
        // User table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT,
                theme TEXT DEFAULT 'light',
                preferences TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Messages table (no foreign keys for MVP simplicity)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                attachments TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // Insert default user records if they don't exist
        self.conn.execute(
            "INSERT OR IGNORE INTO user (id, username) VALUES (1, 'User')",
            [],
        )?;
        self.conn.execute(
            "INSERT OR IGNORE INTO user (id, username) VALUES (2, 'AI Assistant')",
            [],
        )?;

        // Documents table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                version INTEGER DEFAULT 1,
                tags TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Tasks table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo',
                priority TEXT DEFAULT 'medium',
                due_date DATETIME,
                reminder_time DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Events table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                reminder_time DATETIME,
                recurrence TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Files table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                filesize INTEGER,
                mimetype TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Embeddings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS embeddings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_type TEXT NOT NULL,
                content_id INTEGER NOT NULL,
                embedding BLOB,
                model TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Links table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL,
                source_id INTEGER NOT NULL,
                target_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source_type, source_id, target_type, target_id)
            )",
            [],
        )?;

        // Settings table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // P2P Peers table (Phase 1)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS peers (
                id TEXT PRIMARY KEY,
                peer_id TEXT UNIQUE NOT NULL,
                display_name TEXT,
                public_key TEXT NOT NULL,
                last_seen INTEGER,
                trust_level INTEGER DEFAULT 0,
                metadata TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )",
            [],
        )?;

        // P2P Peer Connections table (Phase 1)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS peer_connections (
                id TEXT PRIMARY KEY,
                peer_id TEXT NOT NULL,
                connection_type TEXT,
                status TEXT,
                started_at INTEGER,
                ended_at INTEGER,
                FOREIGN KEY(peer_id) REFERENCES peers(peer_id)
            )",
            [],
        )?;

        // P2P Channels table (Phase 2)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS channels (
                id TEXT PRIMARY KEY,
                channel_type TEXT,
                name TEXT,
                peer_ids TEXT,
                created_by TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )",
            [],
        )?;

        // P2P Messages table (Phase 2)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS p2p_messages (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                sender_peer_id TEXT NOT NULL,
                content TEXT NOT NULL,
                message_type TEXT,
                metadata TEXT,
                sent_at INTEGER,
                delivered_at INTEGER,
                read_at INTEGER,
                FOREIGN KEY(channel_id) REFERENCES channels(id)
            )",
            [],
        )?;

        // Organizations table (Phase 6)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                admin_peer_ids TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )",
            [],
        )?;

        // Federation Policies table (Phase 6)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS federation_policies (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                policy_type TEXT,
                policy_config TEXT,
                enforced INTEGER DEFAULT 1,
                FOREIGN KEY(org_id) REFERENCES organizations(id)
            )",
            [],
        )?;

        // Organization Members table (Phase 6)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS org_members (
                id TEXT PRIMARY KEY,
                org_id TEXT NOT NULL,
                peer_id TEXT NOT NULL,
                role TEXT,
                joined_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY(org_id) REFERENCES organizations(id)
            )",
            [],
        )?;

        // Model Registry table (Phase 6)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS model_registry (
                id TEXT PRIMARY KEY,
                org_id TEXT,
                model_name TEXT,
                model_path TEXT,
                model_config TEXT,
                shared_by_peer TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )",
            [],
        )?;

        // Play v1.1 "Data Ready" Tables
        
        // Ingestion Jobs table - Track import sessions, status, and metrics
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS ingestion_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_path TEXT NOT NULL,
                job_type TEXT NOT NULL DEFAULT 'folder',
                status TEXT NOT NULL DEFAULT 'pending',
                progress REAL DEFAULT 0.0,
                total_files INTEGER DEFAULT 0,
                processed_files INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                completed_at DATETIME,
                error_message TEXT
            )",
            [],
        )?;

        // Metadata table - Extracted attributes (author, topic, date)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                author TEXT,
                topic TEXT,
                date TEXT,
                tags TEXT,
                extracted_content TEXT,
                custom_metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Cleaning Queue table - Queue of pending AI cleaning tasks
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS cleaning_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                task_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                priority INTEGER DEFAULT 0,
                input_content TEXT,
                output_content TEXT,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                completed_at DATETIME,
                FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Drop and recreate vector_index table to ensure no foreign key constraints
        self.conn.execute("DROP TABLE IF EXISTS vector_index", [])?;
        
        // Vector Index table - Embeddings for AI search and linking
        self.conn.execute(
            "CREATE TABLE vector_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id INTEGER NOT NULL,
                content_type TEXT NOT NULL,
                content TEXT NOT NULL,
                embedding_vector BLOB NOT NULL,
                model_name TEXT NOT NULL,
                chunk_index INTEGER DEFAULT 0,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Add content column to vector_index if it doesn't exist (migration)
        self.conn.execute(
            "ALTER TABLE vector_index ADD COLUMN content TEXT DEFAULT '';",
            [],
        ).ok(); // Ignore error if column already exists

        // Insights table - AI-generated insights and recommendations
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                insight_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                confidence REAL NOT NULL,
                content_ids TEXT NOT NULL,
                metadata TEXT,
                priority INTEGER DEFAULT 3,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Document Versions table (missing from original schema)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS document_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                version INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes
        self.create_indexes()?;

        // Insert default user if not exists
        self.create_default_user()?;

        // Initialize default settings
        let settings_service = SettingsService::new(&self.conn);
        settings_service.initialize_defaults()?;

        Ok(())
    }

    fn create_indexes(&self) -> Result<()> {
        self.conn.execute_batch(
            "CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
             CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
             CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
             CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
             CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
             CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
             CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
             CREATE INDEX IF NOT EXISTS idx_embeddings_content ON embeddings(content_type, content_id);
             CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_type, source_id);
             CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_type, target_id);
             
             -- Play v1.1 Data Ready indexes
             CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);
             CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_created ON ingestion_jobs(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_metadata_file_id ON metadata(file_id);
             CREATE INDEX IF NOT EXISTS idx_metadata_author ON metadata(author);
             CREATE INDEX IF NOT EXISTS idx_metadata_topic ON metadata(topic);
             CREATE INDEX IF NOT EXISTS idx_cleaning_queue_status ON cleaning_queue(status);
             CREATE INDEX IF NOT EXISTS idx_cleaning_queue_priority ON cleaning_queue(priority DESC);
             CREATE INDEX IF NOT EXISTS idx_cleaning_queue_file_id ON cleaning_queue(file_id);
            -- Add content column to vector_index if it doesn't exist (migration)
            -- This will be handled in Rust code to avoid duplicate column errors
            CREATE INDEX IF NOT EXISTS idx_vector_index_content ON vector_index(content_type, content_id);
            CREATE INDEX IF NOT EXISTS idx_vector_index_model ON vector_index(model_name);
            CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(insight_type);
            CREATE INDEX IF NOT EXISTS idx_insights_priority ON insights(priority);
            CREATE INDEX IF NOT EXISTS idx_insights_read ON insights(is_read);
             CREATE INDEX IF NOT EXISTS idx_document_versions_doc_id ON document_versions(document_id);
             CREATE INDEX IF NOT EXISTS idx_document_versions_version ON document_versions(document_id, version DESC);"
        )?;
        Ok(())
    }

    fn create_default_user(&self) -> Result<()> {
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM user",
            [],
            |row| row.get(0),
        )?;

        if count == 0 {
            self.conn.execute(
                "INSERT INTO user (username, email, theme) VALUES (?1, ?2, ?3)",
                params!["Default User", "user@play.local", "light"],
            )?;
        }

        Ok(())
    }

    // Message CRUD operations
    pub fn create_message(&self, message: CreateMessage) -> Result<Message> {
        self.conn.execute(
            "INSERT INTO messages (channel_id, user_id, content, attachments) VALUES (?1, ?2, ?3, ?4)",
            params![
                message.channel_id,
                message.user_id,
                message.content,
                message.attachments
            ],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_message(id)
    }

    pub fn get_message(&self, id: i64) -> Result<Message> {
        self.conn.query_row(
            "SELECT id, channel_id, user_id, content, attachments, created_at, updated_at 
             FROM messages WHERE id = ?1",
            params![id],
            |row| {
                Ok(Message {
                    id: row.get(0)?,
                    channel_id: row.get(1)?,
                    user_id: row.get(2)?,
                    content: row.get(3)?,
                    attachments: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
    }

    pub fn get_messages_by_channel(&self, channel_id: i64, limit: i64) -> Result<Vec<Message>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, channel_id, user_id, content, attachments, created_at, updated_at 
             FROM messages WHERE channel_id = ?1 ORDER BY created_at DESC LIMIT ?2",
        )?;

        let messages = stmt.query_map(params![channel_id, limit], |row| {
            Ok(Message {
                id: row.get(0)?,
                channel_id: row.get(1)?,
                user_id: row.get(2)?,
                content: row.get(3)?,
                attachments: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        messages.collect()
    }

    pub fn update_message(&self, id: i64, content: String) -> Result<Message> {
        self.conn.execute(
            "UPDATE messages SET content = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
            params![content, id],
        )?;

        self.get_message(id)
    }

    pub fn delete_message(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM messages WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn clear_messages(&self, channel_id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM messages WHERE channel_id = ?1", params![channel_id])?;
        Ok(())
    }

    // Document CRUD operations
    pub fn create_document(&self, doc: CreateDocument) -> Result<Document> {
        self.conn.execute(
            "INSERT INTO documents (title, content, tags) VALUES (?1, ?2, ?3)",
            params![doc.title, doc.content, doc.tags],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_document(id)
    }

    pub fn get_document(&self, id: i64) -> Result<Document> {
        self.conn.query_row(
            "SELECT id, title, content, version, tags, created_at, updated_at 
             FROM documents WHERE id = ?1",
            params![id],
            |row| {
                Ok(Document {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    version: row.get(3)?,
                    tags: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
    }

    pub fn get_all_documents(&self, limit: i64) -> Result<Vec<Document>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, version, tags, created_at, updated_at 
             FROM documents ORDER BY updated_at DESC LIMIT ?1",
        )?;

        let documents = stmt.query_map(params![limit], |row| {
            Ok(Document {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                version: row.get(3)?,
                tags: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        documents.collect()
    }

    pub fn update_document(&self, id: i64, update: UpdateDocument) -> Result<Document> {
        // Get current document to save version
        let current = self.get_document(id)?;
        
        // Save version history if content is being updated - per prd.md §3️⃣.C
        if update.content.is_some() {
            self.save_document_version(id, &current.content, current.version)?;
        }
        
        // Build dynamic UPDATE query based on what's being updated
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(title) = &update.title {
            updates.push("title = ?");
            params_vec.push(Box::new(title.clone()));
        }
        if let Some(content) = &update.content {
            updates.push("content = ?");
            params_vec.push(Box::new(content.clone()));
            
            // Increment version on content update
            updates.push("version = version + 1");
        }
        if let Some(tags) = &update.tags {
            updates.push("tags = ?");
            params_vec.push(Box::new(tags.clone()));
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");
        
        let query = format!("UPDATE documents SET {} WHERE id = ?", updates.join(", "));
        params_vec.push(Box::new(id));
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        
        self.conn.execute(&query, params_refs.as_slice())?;
        
        self.get_document(id)
    }

    // Version history operations - per prd.md §3️⃣.C "Version history stored locally"
    fn save_document_version(&self, document_id: i64, content: &str, version: i64) -> Result<()> {
        self.conn.execute(
            "INSERT INTO document_versions (document_id, content, version) VALUES (?1, ?2, ?3)",
            params![document_id, content, version],
        )?;
        Ok(())
    }

    pub fn get_document_versions(&self, document_id: i64, limit: i64) -> Result<Vec<(i64, i64, String, String)>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, version, content, created_at 
             FROM document_versions 
             WHERE document_id = ?1 
             ORDER BY version DESC 
             LIMIT ?2",
        )?;

        let versions = stmt.query_map(params![document_id, limit], |row| {
            Ok((
                row.get(0)?, // id
                row.get(1)?, // version
                row.get(2)?, // content
                row.get(3)?, // created_at
            ))
        })?;

        versions.collect()
    }

    pub fn restore_document_version(&self, document_id: i64, version_id: i64) -> Result<Document> {
        // Get the version content
        let (_, _version_num, content, _): (i64, i64, String, String) = self.conn.query_row(
            "SELECT id, version, content, created_at FROM document_versions WHERE id = ?1",
            params![version_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )?;

        // Update document with version content
        self.update_document(document_id, UpdateDocument {
            content: Some(content),
            title: None,
            tags: None,
        })
    }

    pub fn delete_document(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM documents WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Task CRUD operations
    pub fn create_task(&self, task: CreateTask) -> Result<Task> {
        let status = task.status.unwrap_or_else(|| "todo".to_string());
        let priority = task.priority.unwrap_or_else(|| "medium".to_string());
        
        self.conn.execute(
            "INSERT INTO tasks (title, description, status, priority, due_date, reminder_time) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![task.title, task.description, status, priority, task.due_date, task.reminder_time],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_task(id)
    }

    pub fn get_task(&self, id: i64) -> Result<Task> {
        self.conn.query_row(
            "SELECT id, title, description, status, priority, due_date, reminder_time, created_at, updated_at 
             FROM tasks WHERE id = ?1",
            params![id],
            |row| {
                Ok(Task {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    status: row.get(3)?,
                    priority: row.get(4)?,
                    due_date: row.get(5)?,
                    reminder_time: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, description, status, priority, due_date, reminder_time, created_at, updated_at 
             FROM tasks ORDER BY created_at DESC",
        )?;

        let tasks = stmt.query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                reminder_time: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        tasks.collect()
    }

    pub fn update_task(&self, id: i64, update: UpdateTask) -> Result<Task> {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(title) = &update.title {
            updates.push("title = ?");
            params_vec.push(Box::new(title.clone()));
        }
        if let Some(description) = &update.description {
            updates.push("description = ?");
            params_vec.push(Box::new(description.clone()));
        }
        if let Some(status) = &update.status {
            updates.push("status = ?");
            params_vec.push(Box::new(status.clone()));
        }
        if let Some(priority) = &update.priority {
            updates.push("priority = ?");
            params_vec.push(Box::new(priority.clone()));
        }
        if let Some(due_date) = &update.due_date {
            updates.push("due_date = ?");
            params_vec.push(Box::new(due_date.clone()));
        }
        if let Some(reminder_time) = &update.reminder_time {
            updates.push("reminder_time = ?");
            params_vec.push(Box::new(reminder_time.clone()));
        }

        updates.push("updated_at = CURRENT_TIMESTAMP");
        
        let query = format!("UPDATE tasks SET {} WHERE id = ?", updates.join(", "));
        params_vec.push(Box::new(id));
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        
        self.conn.execute(&query, params_refs.as_slice())?;
        
        self.get_task(id)
    }

    pub fn delete_task(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Calendar Event CRUD operations
    pub fn create_event(&self, event: CreateEvent) -> Result<CalendarEvent> {
        self.conn.execute(
            "INSERT INTO events (title, description, start_time, end_time, reminder_time, recurrence) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                event.title,
                event.description,
                event.start_time,
                event.end_time,
                event.reminder_time,
                event.recurrence
            ],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_event(id)
    }

    pub fn get_event(&self, id: i64) -> Result<CalendarEvent> {
        self.conn.query_row(
            "SELECT id, title, description, start_time, end_time, reminder_time, recurrence, created_at 
             FROM events WHERE id = ?1",
            params![id],
            |row| {
                Ok(CalendarEvent {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    start_time: row.get(3)?,
                    end_time: row.get(4)?,
                    reminder_time: row.get(5)?,
                    recurrence: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        )
    }

    pub fn get_events_in_range(&self, start: &str, end: &str) -> Result<Vec<CalendarEvent>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, description, start_time, end_time, reminder_time, recurrence, created_at 
             FROM events 
             WHERE start_time >= ?1 AND start_time <= ?2
             ORDER BY start_time ASC",
        )?;

        let events = stmt.query_map(params![start, end], |row| {
            Ok(CalendarEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                reminder_time: row.get(5)?,
                recurrence: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        events.collect()
    }

    pub fn update_event(&self, id: i64, update: UpdateEvent) -> Result<CalendarEvent> {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(title) = &update.title {
            updates.push("title = ?");
            params_vec.push(Box::new(title.clone()));
        }
        if let Some(description) = &update.description {
            updates.push("description = ?");
            params_vec.push(Box::new(description.clone()));
        }
        if let Some(start_time) = &update.start_time {
            updates.push("start_time = ?");
            params_vec.push(Box::new(start_time.clone()));
        }
        if let Some(end_time) = &update.end_time {
            updates.push("end_time = ?");
            params_vec.push(Box::new(end_time.clone()));
        }
        if let Some(reminder_time) = &update.reminder_time {
            updates.push("reminder_time = ?");
            params_vec.push(Box::new(reminder_time.clone()));
        }
        if let Some(recurrence) = &update.recurrence {
            updates.push("recurrence = ?");
            params_vec.push(Box::new(recurrence.clone()));
        }

        if updates.is_empty() {
            return self.get_event(id);
        }

        let query = format!("UPDATE events SET {} WHERE id = ?", updates.join(", "));
        params_vec.push(Box::new(id));
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        
        self.conn.execute(&query, params_refs.as_slice())?;
        
        self.get_event(id)
    }

    pub fn delete_event(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM events WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Clear all data methods
    pub fn clear_all_messages(&self) -> Result<usize> {
        let count = self.conn.execute("DELETE FROM messages", [])?;
        Ok(count)
    }

    pub fn clear_all_documents(&self) -> Result<usize> {
        // Also clear document versions
        self.conn.execute("DELETE FROM document_versions", [])?;
        let count = self.conn.execute("DELETE FROM documents", [])?;
        Ok(count)
    }

    pub fn clear_all_tasks(&self) -> Result<usize> {
        let count = self.conn.execute("DELETE FROM tasks", [])?;
        Ok(count)
    }

    pub fn clear_all_events(&self) -> Result<usize> {
        let count = self.conn.execute("DELETE FROM events", [])?;
        Ok(count)
    }

    pub fn clear_all_links(&self) -> Result<usize> {
        let count = self.conn.execute("DELETE FROM links", [])?;
        Ok(count)
    }

    // Link management methods
    pub fn create_link(&self, from_type: &str, from_id: i64, to_type: &str, to_id: i64) -> Result<crate::commands::links::Link, rusqlite::Error> {
        self.conn.execute(
            "INSERT INTO links (from_type, from_id, to_type, to_id, created_at)
             VALUES (?1, ?2, ?3, ?4, datetime('now'))",
            params![from_type, from_id, to_type, to_id],
        )?;

        let id = self.conn.last_insert_rowid();
        
        let link: crate::commands::links::Link = self.conn.query_row(
            "SELECT id, from_type, from_id, to_type, to_id, created_at FROM links WHERE id = ?1",
            params![id],
            |row| {
                Ok(crate::commands::links::Link {
                    id: row.get(0)?,
                    from_type: row.get(1)?,
                    from_id: row.get(2)?,
                    to_type: row.get(3)?,
                    to_id: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )?;

        Ok(link)
    }

    pub fn get_links_for_item(&self, item_type: &str, item_id: i64) -> Result<Vec<crate::commands::links::Link>, rusqlite::Error> {
        let mut stmt = self.conn.prepare(
            "SELECT id, from_type, from_id, to_type, to_id, created_at
             FROM links
             WHERE (from_type = ?1 AND from_id = ?2) OR (to_type = ?1 AND to_id = ?2)
             ORDER BY created_at DESC"
        )?;

        let links = stmt.query_map(params![item_type, item_id], |row| {
            Ok(crate::commands::links::Link {
                id: row.get(0)?,
                from_type: row.get(1)?,
                from_id: row.get(2)?,
                to_type: row.get(3)?,
                to_id: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(links)
    }

    pub fn delete_link(&self, id: i64) -> Result<(), rusqlite::Error> {
        self.conn.execute("DELETE FROM links WHERE id = ?1", params![id])?;
        Ok(())
    }
}


