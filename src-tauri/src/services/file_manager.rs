use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileMetadata {
    pub id: i64,
    pub filename: String,
    pub filepath: String,
    pub filesize: i64,
    pub mimetype: String,
    pub created_at: String,
}

pub struct FileManager<'a> {
    conn: &'a Connection,
    base_path: PathBuf,
}

impl<'a> FileManager<'a> {
    pub fn new(conn: &'a Connection) -> std::io::Result<Self> {
        let base_path = Self::get_base_path()?;
        
        // Create base directories
        fs::create_dir_all(&base_path)?;
        fs::create_dir_all(base_path.join("attachments"))?;
        fs::create_dir_all(base_path.join("exports"))?;
        
        Ok(Self { conn, base_path })
    }

    fn get_base_path() -> std::io::Result<PathBuf> {
        let mut path = tauri::api::path::app_data_dir(&tauri::Config::default())
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Could not find app data directory"))?;
        path.push("play");
        path.push("files");
        Ok(path)
    }

    pub fn save_file(&self, filename: &str, content: &[u8], mimetype: &str) -> Result<FileMetadata, Box<dyn std::error::Error>> {
        // Generate unique filename
        let uuid = Uuid::new_v4();
        let extension = Path::new(filename)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("dat");
        
        let unique_filename = format!("{}.{}", uuid, extension);
        
        // Create subdirectory based on current date
        let now = chrono::Local::now();
        let date_path = format!("{}/{:02}", now.format("%Y"), now.format("%m"));
        let file_dir = self.base_path.join("attachments").join(&date_path);
        
        fs::create_dir_all(&file_dir)?;
        
        // Full file path
        let file_path = file_dir.join(&unique_filename);
        
        // Write file
        fs::write(&file_path, content)?;
        
        // Store metadata in database
        let filesize = content.len() as i64;
        let relative_path = format!("attachments/{}/{}", date_path, unique_filename);
        
        self.conn.execute(
            "INSERT INTO files (filename, filepath, filesize, mimetype) VALUES (?1, ?2, ?3, ?4)",
            params![filename, relative_path, filesize, mimetype],
        )?;
        
        let id = self.conn.last_insert_rowid();
        
        Ok(FileMetadata {
            id,
            filename: filename.to_string(),
            filepath: relative_path,
            filesize,
            mimetype: mimetype.to_string(),
            created_at: now.to_rfc3339(),
        })
    }

    pub fn get_file(&self, id: i64) -> Result<FileMetadata, Box<dyn std::error::Error>> {
        let metadata = self.conn.query_row(
            "SELECT id, filename, filepath, filesize, mimetype, created_at FROM files WHERE id = ?1",
            params![id],
            |row| {
                Ok(FileMetadata {
                    id: row.get(0)?,
                    filename: row.get(1)?,
                    filepath: row.get(2)?,
                    filesize: row.get(3)?,
                    mimetype: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )?;
        
        Ok(metadata)
    }

    pub fn read_file(&self, id: i64) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let metadata = self.get_file(id)?;
        let full_path = self.base_path.parent().unwrap().join(&metadata.filepath);
        let content = fs::read(full_path)?;
        Ok(content)
    }

    pub fn delete_file(&self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        let metadata = self.get_file(id)?;
        let full_path = self.base_path.parent().unwrap().join(&metadata.filepath);
        
        // Delete physical file
        if full_path.exists() {
            fs::remove_file(full_path)?;
        }
        
        // Delete from database
        self.conn.execute("DELETE FROM files WHERE id = ?1", params![id])?;
        
        Ok(())
    }

    pub fn list_files(&self, limit: i64) -> Result<Vec<FileMetadata>, Box<dyn std::error::Error>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, filename, filepath, filesize, mimetype, created_at 
             FROM files ORDER BY created_at DESC LIMIT ?1"
        )?;
        
        let files = stmt.query_map(params![limit], |row| {
            Ok(FileMetadata {
                id: row.get(0)?,
                filename: row.get(1)?,
                filepath: row.get(2)?,
                filesize: row.get(3)?,
                mimetype: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;
        
        let mut result = Vec::new();
        for file in files {
            result.push(file?);
        }
        
        Ok(result)
    }

    pub fn export_file(&self, id: i64, export_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let content = self.read_file(id)?;
        let metadata = self.get_file(id)?;
        
        let export_file_path = export_path.join(&metadata.filename);
        fs::write(export_file_path, content)?;
        
        Ok(())
    }
}

