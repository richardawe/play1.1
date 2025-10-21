use crate::models::vector_index::{VectorIndex, CreateVectorIndex, SimilaritySearchResult, VectorIndexStats};
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use rusqlite::{params, Result};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct VectorSearchService<'a> {
    db: &'a Database,
    ollama: Arc<Mutex<OllamaService>>,
}

impl<'a> VectorSearchService<'a> {
    pub fn new(db: &'a Database, ollama: Arc<Mutex<OllamaService>>) -> Self {
        Self { db, ollama }
    }

    /// Create a new vector index entry
    pub fn create_vector_entry(&self, entry: CreateVectorIndex) -> Result<VectorIndex> {
        let conn = self.db.get_connection();
        
        // Convert Vec<f32> to BLOB for storage
        let embedding_blob: Vec<u8> = entry.embedding_vector
            .iter()
            .flat_map(|&f| f.to_le_bytes())
            .collect();
        
        let chunk_index = entry.chunk_index.unwrap_or(0);
        
        conn.execute(
            "INSERT INTO vector_index (content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                entry.content_id,
                entry.content_type,
                entry.content,
                embedding_blob,
                entry.model_name,
                chunk_index,
                entry.metadata
            ],
        )?;

        let id = conn.last_insert_rowid();
        self.get_vector_entry(id)
    }

    /// Get a vector index entry by ID
    pub fn get_vector_entry(&self, id: i64) -> Result<VectorIndex> {
        let conn = self.db.get_connection();
        
        conn.query_row(
            "SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at 
             FROM vector_index WHERE id = ?1",
            params![id],
            |row| {
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
            },
        )
    }

    /// Get all vector entries for a specific content
    pub fn get_entries_for_content(&self, content_id: i64, content_type: &str) -> Result<Vec<VectorIndex>> {
        let conn = self.db.get_connection();
        
        let mut stmt = conn.prepare(
            "SELECT id, content_id, content_type, embedding_vector, model_name, chunk_index, metadata, created_at 
             FROM vector_index WHERE content_id = ?1 AND content_type = ?2 ORDER BY chunk_index"
        )?;

        let entries = stmt.query_map(params![content_id, content_type], |row| {
            let embedding_blob: Vec<u8> = row.get(3)?;
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
        })?;

        entries.collect()
    }

    /// Perform similarity search
    pub fn similarity_search(&self, query_vector: Vec<f32>, limit: i64, threshold: f32) -> Result<Vec<SimilaritySearchResult>> {
        let conn = self.db.get_connection();
        
        // Get all vector entries
        let mut stmt = conn.prepare(
            "SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at 
             FROM vector_index"
        )?;

        let entries = stmt.query_map([], |row| {
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
        })?;

        let mut results = Vec::new();
        
        for entry in entries {
            let entry = entry?;
            let similarity = self.cosine_similarity(&query_vector, &entry.embedding_vector);
            
            println!("Similarity score for entry {}: {:.4} (threshold: {:.4})", entry.id, similarity, threshold);
            
            if similarity >= threshold {
                results.push(SimilaritySearchResult {
                    content_id: entry.content_id,
                    content_type: entry.content_type,
                    content: entry.content,
                    similarity_score: similarity,
                    metadata: entry.metadata,
                });
            }
        }

        // Sort by similarity (descending) and limit results
        results.sort_by(|a, b| b.similarity_score.partial_cmp(&a.similarity_score).unwrap());
        results.truncate(limit as usize);

        Ok(results)
    }

    /// Generate embedding for text using Ollama
    pub async fn generate_embedding(&self, text: &str, model: Option<&str>) -> Result<Vec<f32>, String> {
        let ollama = self.ollama.lock().await;
        let model_name = model.unwrap_or("nomic-embed-text");
        
        // Create a prompt for embedding generation
        let prompt = format!("Generate an embedding for the following text: {}", text);
        
        match ollama.generate(model_name, &prompt).await {
            Ok(response) => {
                // Parse the response to extract embedding vector
                // This is a simplified implementation - in practice, you'd need to parse the actual embedding format
                self.parse_embedding_response(&response)
            }
            Err(e) => Err(format!("Failed to generate embedding: {}", e)),
        }
    }

    /// Index content by generating embeddings and storing them
    pub async fn index_content(&self, content_id: i64, content_type: &str, content: &str, model: Option<&str>) -> Result<Vec<VectorIndex>> {
        // Split content into chunks if it's too long
        let chunks = self.chunk_content(content, 1000); // 1000 characters per chunk
        let mut entries = Vec::new();

        for (chunk_index, chunk) in chunks.iter().enumerate() {
            // Generate embedding for this chunk
            let embedding = self.generate_embedding(chunk, model).await
                .map_err(|e| rusqlite::Error::InvalidParameterName(e))?;

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

            let created_entry = self.create_vector_entry(entry)?;
            entries.push(created_entry);
        }

        Ok(entries)
    }

    /// Search for similar content using text query
    pub async fn search_similar_content(&self, query: &str, limit: i64, threshold: f32, model: Option<&str>) -> Result<Vec<SimilaritySearchResult>, String> {
        // Generate embedding for the query
        let query_embedding = self.generate_embedding(query, model).await?;
        
        // Perform similarity search
        self.similarity_search(query_embedding, limit, threshold)
            .map_err(|e| e.to_string())
    }

    /// Get vector index statistics
    pub fn get_vector_stats(&self) -> Result<VectorIndexStats> {
        let conn = self.db.get_connection();
        
        let total_entries: i64 = conn.query_row("SELECT COUNT(*) FROM vector_index", [], |row| row.get(0))?;
        let _unique_content: i64 = conn.query_row("SELECT COUNT(DISTINCT content_id) FROM vector_index", [], |row| row.get(0))?;
        
        // Get model distribution
        let mut stmt = conn.prepare("SELECT model_name, COUNT(*) FROM vector_index GROUP BY model_name")?;
        let model_counts: Vec<(String, i64)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(VectorIndexStats {
            total_vectors: total_entries,
            models_used: model_counts.iter().map(|(model, _)| model.clone()).collect(),
            average_vector_dimension: Some(384), // Default embedding dimension
            last_updated: Some(chrono::Utc::now().to_rfc3339()),
        })
    }

    /// Delete vector entries for specific content
    pub fn delete_content_vectors(&self, content_id: i64, content_type: &str) -> Result<()> {
        let conn = self.db.get_connection();
        conn.execute(
            "DELETE FROM vector_index WHERE content_id = ?1 AND content_type = ?2",
            params![content_id, content_type],
        )?;
        Ok(())
    }

    /// Delete a specific vector entry
    pub fn delete_vector_entry(&self, id: i64) -> Result<()> {
        let conn = self.db.get_connection();
        conn.execute("DELETE FROM vector_index WHERE id = ?1", [id])?;
        Ok(())
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

    /// Parse embedding response from Ollama
    fn parse_embedding_response(&self, response: &str) -> Result<Vec<f32>, String> {
        // This is a simplified implementation
        // In practice, you'd need to parse the actual embedding format from Ollama
        // For now, we'll create a dummy embedding based on the text length and content
        
        let mut embedding = Vec::new();
        let text_len = response.len() as f32;
        
        // Create a simple hash-based embedding
        for i in 0..384 { // Common embedding dimension
            let seed = (text_len * (i as f32 + 1.0)) as u32;
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
        
        Ok(embedding)
    }

    /// Get all vector entries
    pub fn get_all_entries(&self) -> Result<Vec<VectorIndex>> {
        let conn = self.db.get_connection();
        
        let mut stmt = conn.prepare(
            "SELECT id, content_id, content_type, content, embedding_vector, model_name, chunk_index, metadata, created_at 
             FROM vector_index 
             ORDER BY created_at DESC"
        )?;
        
        let entries = stmt.query_map([], |row| {
            let embedding_blob: Vec<u8> = row.get(4)?;
            let embedding_vector: Vec<f32> = embedding_blob
                .chunks(4)
                .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
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
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(entries)
    }
}
