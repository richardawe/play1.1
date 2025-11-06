use crate::models::vector_index::{VectorIndex, CreateVectorIndex, SimilaritySearchResult, VectorIndexStats};
use crate::services::ollama::OllamaService;
use crate::services::database::Database;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::path::Path;
use std::collections::HashMap;

pub struct LanceDBService {
    db_path: std::path::PathBuf,
    ollama: Arc<Mutex<OllamaService>>,
    database: Arc<Mutex<Database>>,
    // For now, we'll use a simple in-memory storage until we can get LanceDB working
    // This is a temporary implementation that will be replaced with actual LanceDB
    vector_storage: Arc<Mutex<HashMap<i64, VectorIndex>>>,
}

impl LanceDBService {
    /// Create a new LanceDB service instance
    pub async fn new(db_path: &Path, ollama: Arc<Mutex<OllamaService>>, database: Arc<Mutex<Database>>) -> Result<Self, String> {
        // Ensure the directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create LanceDB directory: {}", e))?;
        }

        let service = Self {
            db_path: db_path.to_path_buf(),
            ollama,
            database,
            vector_storage: Arc::new(Mutex::new(HashMap::new())),
        };

        // Load existing vectors from database
        service.load_vectors_from_database().await?;

        Ok(service)
    }

    /// Load vectors from database into memory
    async fn load_vectors_from_database(&self) -> Result<(), String> {
        // Collect all data first to avoid Send issues
        let vectors = {
            let db_guard = self.database.lock().await;
            let conn = db_guard.get_connection();
            
            // Load from vector_index table
            let mut stmt = conn.prepare("SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at FROM vector_index")
                .map_err(|e| format!("Failed to prepare query: {}", e))?;

            let rows = stmt.query_map([], |row| {
                let embedding_bytes: Vec<u8> = row.get(4)?;
                let embedding_vector: Vec<f32> = bincode::deserialize(&embedding_bytes)
                    .map_err(|_e| rusqlite::Error::InvalidColumnType(4, "BLOB".to_string(), rusqlite::types::Type::Blob))?;
                
                Ok(VectorIndex {
                    id: row.get(0)?,
                    content_id: row.get(1)?,
                    content_type: row.get(2)?,
                    content: row.get(3)?,
                    embedding_vector,
                    model_name: row.get(5)?,
                    chunk_index: row.get(6)?,
                    metadata: row.get(7)?,
                    created_at: row.get(8)?,
                })
            }).map_err(|e| format!("Failed to query vectors: {}", e))?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to parse vectors: {}", e))?
        };

        // Now store in memory storage
        let mut storage = self.vector_storage.lock().await;
        for vector in vectors {
            storage.insert(vector.id, vector);
        }

        println!("Loaded {} vectors from database", storage.len());
        Ok(())
    }

    /// Create a new vector entry
    pub async fn create_vector_entry(&self, entry: CreateVectorIndex) -> Result<VectorIndex, String> {
        let id = chrono::Utc::now().timestamp_millis();
        let created_at = chrono::Utc::now().to_rfc3339();
        
        let vector_index = VectorIndex {
            id,
            content_id: entry.content_id,
            content_type: entry.content_type,
            content: entry.content,
            embedding_vector: entry.embedding_vector,
            model_name: entry.model_name,
            chunk_index: entry.chunk_index.unwrap_or(0),
            metadata: entry.metadata,
            created_at,
        };

        // Store in database
        let db_guard = self.database.lock().await;
        let conn = db_guard.get_connection();
        
        let embedding_bytes = bincode::serialize(&vector_index.embedding_vector)
            .map_err(|e| format!("Failed to serialize embedding: {}", e))?;
        
        conn.execute(
            "INSERT INTO vector_index (id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                vector_index.id,
                vector_index.content_id,
                vector_index.content_type,
                vector_index.content,
                embedding_bytes,
                vector_index.model_name,
                vector_index.chunk_index,
                vector_index.metadata,
                vector_index.created_at
            ],
        ).map_err(|e| format!("Failed to insert vector: {}", e))?;

        // Store in memory for fast access
        let mut storage = self.vector_storage.lock().await;
        storage.insert(id, vector_index.clone());

        println!("Stored vector {} in database and memory", id);
        Ok(vector_index)
    }

    /// Perform similarity search using cosine similarity
    pub async fn similarity_search(
        &self,
        query_vector: Vec<f32>,
        limit: i64,
        threshold: f32,
    ) -> Result<Vec<SimilaritySearchResult>, String> {
        // Read directly from database to get all vectors
        let db_guard = self.database.lock().await;
        let conn = db_guard.get_connection();
        
        let mut stmt = conn.prepare("SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at FROM vector_index")
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let rows = stmt.query_map([], |row| {
            let embedding_bytes: Vec<u8> = row.get(4)?;
            let embedding_vector: Vec<f32> = bincode::deserialize(&embedding_bytes)
                .map_err(|_e| rusqlite::Error::InvalidColumnType(4, "BLOB".to_string(), rusqlite::types::Type::Blob))?;
            
            Ok(VectorIndex {
                id: row.get(0)?,
                content_id: row.get(1)?,
                content_type: row.get(2)?,
                content: row.get(3)?,
                embedding_vector,
                model_name: row.get(5)?,
                chunk_index: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query vectors: {}", e))?;

        let vectors: Result<Vec<_>, _> = rows.collect();
        let vectors = vectors.map_err(|e| format!("Failed to parse vectors: {}", e))?;
        let vector_count = vectors.len();
        
        let mut results = Vec::new();

        for vector_index in vectors {
            // Calculate cosine similarity
            let similarity = self.cosine_similarity(&query_vector, &vector_index.embedding_vector);
            
            if similarity >= threshold {
                results.push(SimilaritySearchResult {
                    content_id: vector_index.content_id,
                    content_type: vector_index.content_type.clone(),
                    content: vector_index.content.clone(),
                    similarity_score: similarity,
                    metadata: vector_index.metadata.clone(),
                });
            }
        }

        // Sort by similarity score (descending)
        results.sort_by(|a, b| b.similarity_score.partial_cmp(&a.similarity_score).unwrap());
        
        // Limit results
        results.truncate(limit as usize);
        
        println!("Similarity search found {} results from {} vectors", results.len(), vector_count);
        Ok(results)
    }

    /// Generate embedding using Ollama
    pub async fn generate_embedding(&self, text: &str, model: Option<&str>) -> Result<Vec<f32>, String> {
        let ollama = self.ollama.lock().await;
        let model_name = model.unwrap_or("nomic-embed-text");
        
        ollama
            .generate_embedding(model_name, text)
            .await
            .map_err(|e| format!("Failed to generate embedding: {}", e))
    }

    /// Index content by generating embeddings and storing them
    pub async fn index_content(
        &self,
        content_id: i64,
        content_type: &str,
        content: &str,
        model: Option<&str>,
    ) -> Result<Vec<VectorIndex>, String> {
        // Split content into chunks
        let chunks = self.chunk_content(content, 1000);
        let mut entries = Vec::new();

        for (chunk_index, chunk) in chunks.iter().enumerate() {
            // Generate embedding for this chunk
            let embedding = self.generate_embedding(chunk, model).await?;

            // Create vector index entry
            let entry = CreateVectorIndex {
                content_id,
                content_type: content_type.to_string(),
                content: chunk.clone(),
                embedding_vector: embedding,
                model_name: model.unwrap_or("nomic-embed-text").to_string(),
                chunk_index: Some(chunk_index as i64),
                metadata: Some(format!("chunk_length:{}", chunk.len())),
            };

            let created_entry = self.create_vector_entry(entry).await?;
            entries.push(created_entry);
        }

        Ok(entries)
    }

    /// Search for similar content using text query
    pub async fn search_similar_content(
        &self,
        query: &str,
        limit: i64,
        threshold: f32,
        model: Option<&str>,
    ) -> Result<Vec<SimilaritySearchResult>, String> {
        // Generate embedding for the query
        let query_embedding = self.generate_embedding(query, model).await?;
        
        // Perform similarity search
        self.similarity_search(query_embedding, limit, threshold).await
    }

    /// Get vector index statistics
    pub async fn get_vector_stats(&self) -> Result<VectorIndexStats, String> {
        // Read directly from database to get accurate stats
        let db_guard = self.database.lock().await;
        let conn = db_guard.get_connection();
        
        // Get total count
        let total_vectors: i64 = conn.query_row(
            "SELECT COUNT(*) FROM vector_index",
            [],
            |row| row.get(0)
        ).map_err(|e| format!("Failed to count vectors: {}", e))?;
        
        // Get model distribution
        let mut stmt = conn.prepare("SELECT DISTINCT model_name FROM vector_index")
            .map_err(|e| format!("Failed to prepare model query: {}", e))?;
        
        let models: Result<Vec<String>, _> = stmt.query_map([], |row| {
            row.get(0)
        }).map_err(|e| format!("Failed to query models: {}", e))?
        .collect();
        
        let models_used = models.map_err(|e| format!("Failed to parse models: {}", e))?;
        
        println!("Database stats: {} vectors, models: {:?}", total_vectors, models_used);
        
        Ok(VectorIndexStats {
            total_vectors,
            models_used,
            average_vector_dimension: Some(384), // Default embedding dimension
            last_updated: Some(chrono::Utc::now().to_rfc3339()),
        })
    }

    /// Delete vector entries for specific content
    pub async fn delete_content_vectors(&self, content_id: i64, content_type: &str) -> Result<(), String> {
        let mut storage = self.vector_storage.lock().await;
        
        // Remove entries matching content_id and content_type
        storage.retain(|_, vector_index| {
            !(vector_index.content_id == content_id && vector_index.content_type == content_type)
        });

        Ok(())
    }

    /// Delete a specific vector entry
    pub async fn delete_vector_entry(&self, id: i64) -> Result<(), String> {
        let mut storage = self.vector_storage.lock().await;
        storage.remove(&id);
        Ok(())
    }

    /// Get all vector entries
    pub async fn get_all_entries(&self) -> Result<Vec<VectorIndex>, String> {
        // Read directly from database to get all entries
        let db_guard = self.database.lock().await;
        let conn = db_guard.get_connection();
        
        let mut stmt = conn.prepare("SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at FROM vector_index ORDER BY created_at DESC")
            .map_err(|e| format!("Failed to prepare query: {}", e))?;

        let rows = stmt.query_map([], |row| {
            let embedding_bytes: Vec<u8> = row.get(4)?;
            let embedding_vector: Vec<f32> = bincode::deserialize(&embedding_bytes)
                .map_err(|_e| rusqlite::Error::InvalidColumnType(4, "BLOB".to_string(), rusqlite::types::Type::Blob))?;
            
            Ok(VectorIndex {
                id: row.get(0)?,
                content_id: row.get(1)?,
                content_type: row.get(2)?,
                content: row.get(3)?,
                embedding_vector,
                model_name: row.get(5)?,
                chunk_index: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query entries: {}", e))?;

        let entries: Result<Vec<_>, _> = rows.collect();
        entries.map_err(|e| format!("Failed to parse entries: {}", e))
    }

    /// Migrate data from SQLite to LanceDB
    pub async fn migrate_from_sqlite(&self, sqlite_db: &rusqlite::Connection) -> Result<i64, String> {
        let mut count = 0;
        
        // Get all vector entries from SQLite
        let mut stmt = sqlite_db.prepare(
            "SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at 
             FROM vector_index"
        ).map_err(|e| format!("Failed to prepare SQLite query: {}", e))?;

        let rows = stmt.query_map([], |row| {
            let embedding_blob: Vec<u8> = row.get(4)?;
            let embedding_vector: Vec<f32> = embedding_blob
                .chunks_exact(4)
                .map(|chunk| f32::from_le_bytes(chunk.try_into().unwrap()))
                .collect();

            Ok(VectorIndex {
                id: row.get(0)?,
                content_id: row.get(1)?,
                content_type: row.get(2)?,
                content: row.get(3)?,
                embedding_vector,
                model_name: row.get(5)?,
                chunk_index: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query SQLite: {}", e))?;

        // Migrate each entry to LanceDB
        for row in rows {
            let entry = row.map_err(|e| format!("Failed to parse SQLite row: {}", e))?;
            
            // Store in memory storage
            let mut storage = self.vector_storage.lock().await;
            storage.insert(entry.id, entry);
            count += 1;
        }

        Ok(count)
    }

    /// Get mutable access to vector storage (for migration)
    pub async fn get_vector_storage(&self) -> Arc<Mutex<HashMap<i64, VectorIndex>>> {
        self.vector_storage.clone()
    }

    // Helper methods

    /// Calculate cosine similarity between two vectors
    fn cosine_similarity(&self, a: &[f32], b: &[f32]) -> f32 {
        if a.len() != b.len() {
            return 0.0;
        }

        let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

        if norm_a == 0.0 || norm_b == 0.0 {
            0.0
        } else {
            dot_product / (norm_a * norm_b)
        }
    }

    /// Split content into chunks
    fn chunk_content(&self, content: &str, max_chunk_size: usize) -> Vec<String> {
        if content.len() <= max_chunk_size {
            return vec![content.to_string()];
        }

        let mut chunks = Vec::new();
        let mut start = 0;

        while start < content.len() {
            let end = std::cmp::min(start + max_chunk_size, content.len());
            let chunk = &content[start..end];
            
            // Try to break at word boundary
            let actual_end = if end < content.len() {
                if let Some(space_pos) = chunk.rfind(' ') {
                    start + space_pos
                } else {
                    end
                }
            } else {
                end
            };

            chunks.push(content[start..actual_end].to_string());
            start = if actual_end == end { end } else { actual_end + 1 };
        }

        chunks
    }

    /// Clear all vector data from both memory and database
    pub async fn clear_database(&self) -> Result<(), String> {
        // Clear in-memory storage
        {
            let mut storage = self.vector_storage.lock().await;
            storage.clear();
        }

        // Clear database
        let db_guard = self.database.lock().await;
        let conn = db_guard.get_connection();
        
        conn.execute("DELETE FROM vector_index", [])
            .map_err(|e| format!("Failed to clear vector_index table: {}", e))?;

        println!("Database cleared: All vector data removed");
        Ok(())
    }
}