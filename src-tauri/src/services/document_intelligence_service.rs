use crate::models::vector_index::SimilaritySearchResult;
use crate::services::lancedb_service::LanceDBService;
use crate::services::ollama::OllamaService;
use crate::services::database::Database;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::path::Path;

pub struct DocumentIntelligenceService {
    lancedb: LanceDBService,
    db: Arc<Mutex<Database>>,
    ollama: Arc<Mutex<OllamaService>>,
}

impl DocumentIntelligenceService {
    pub async fn new(
        lancedb_path: &Path,
        db: Arc<Mutex<Database>>,
        ollama: Arc<Mutex<OllamaService>>,
    ) -> Result<Self, String> {
        let lancedb = LanceDBService::new(lancedb_path, ollama.clone(), db.clone()).await?;
        
        Ok(Self {
            lancedb,
            db,
            ollama,
        })
    }

    /// Process a document and create intelligent insights
    pub async fn process_document(&self, document_id: i64, content: &str, title: &str) -> Result<Vec<SimilaritySearchResult>, String> {
        // Index the document content
        let entries = self.lancedb
            .index_content(document_id, "document", content, Some("nomic-embed-text"))
            .await?;

        println!("Indexed {} chunks for document: {}", entries.len(), title);

        // Generate document insights
        let insights = self.generate_document_insights(document_id, content, title).await?;
        
        Ok(insights)
    }

    /// Generate intelligent insights about a document
    async fn generate_document_insights(
        &self,
        document_id: i64,
        content: &str,
        title: &str,
    ) -> Result<Vec<SimilaritySearchResult>, String> {
        // Find similar content in the knowledge base
        let similar_content = self.lancedb
            .search_similar_content(content, 5, 0.7, Some("nomic-embed-text"))
            .await?;

        // Filter out the document itself
        let insights: Vec<SimilaritySearchResult> = similar_content
            .into_iter()
            .filter(|result| result.content_id != document_id)
            .collect();

        println!("Found {} related documents for: {}", insights.len(), title);
        
        Ok(insights)
    }

    /// Auto-tag documents based on content analysis
    pub async fn auto_tag_document(&self, content: &str) -> Result<Vec<String>, String> {
        let ollama = self.ollama.lock().await;
        
        let prompt = format!(
            "Analyze the following document content and suggest 3-5 relevant tags. Return only the tags, one per line:\n\n{}",
            content
        );

        let response = ollama
            .generate("llama3.2", &prompt)
            .await
            .map_err(|e| format!("Failed to generate tags: {}", e))?;

        // Parse tags from response
        let tags: Vec<String> = response
            .lines()
            .map(|line| line.trim().to_string())
            .filter(|tag| !tag.is_empty())
            .collect();

        Ok(tags)
    }

    /// Generate document summary
    pub async fn summarize_document(&self, content: &str) -> Result<String, String> {
        let ollama = self.ollama.lock().await;
        
        let prompt = format!(
            "Summarize the following document in 2-3 sentences:\n\n{}",
            content
        );

        let summary = ollama
            .generate("llama3.2", &prompt)
            .await
            .map_err(|e| format!("Failed to generate summary: {}", e))?;

        Ok(summary)
    }

    /// Find related documents
    pub async fn find_related_documents(&self, document_id: i64, limit: i64) -> Result<Vec<SimilaritySearchResult>, String> {
        // Get the document content first
        let db_guard = self.db.lock().await;
        let conn = db_guard.get_connection();
        
        let document_content: String = conn.query_row(
            "SELECT content FROM documents WHERE id = ?1",
            [document_id],
            |row| row.get(0)
        ).map_err(|e| format!("Failed to get document content: {}", e))?;

        // Find similar documents
        let similar_docs = self.lancedb
            .search_similar_content(&document_content, limit, 0.6, Some("nomic-embed-text"))
            .await?;

        // Filter out the document itself
        let related: Vec<SimilaritySearchResult> = similar_docs
            .into_iter()
            .filter(|result| result.content_id != document_id)
            .collect();

        Ok(related)
    }

    /// Process all documents for intelligence
    pub async fn process_all_documents(&self) -> Result<i64, String> {
        // Get all documents first to avoid Send issues
        let documents = {
            let db_guard = self.db.lock().await;
            let conn = db_guard.get_connection();
            
            let mut stmt = conn.prepare("SELECT id, title, content FROM documents")
                .map_err(|e| format!("Failed to prepare query: {}", e))?;
            
            let rows = stmt.query_map([], |row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
            }).map_err(|e| format!("Failed to query documents: {}", e))?;
            
            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| format!("Failed to parse documents: {}", e))?
        };

        let mut processed_count = 0;
        
        for (id, title, content) in documents {
            // Process the document
            self.process_document(id, &content, &title).await?;
            processed_count += 1;
            
            println!("Processed document: {} ({})", title, id);
        }

        Ok(processed_count)
    }

    /// Get document intelligence stats
    pub async fn get_intelligence_stats(&self) -> Result<DocumentIntelligenceStats, String> {
        let stats = self.lancedb.get_vector_stats().await?;
        
        Ok(DocumentIntelligenceStats {
            total_documents_processed: stats.total_vectors,
            vector_dimensions: stats.average_vector_dimension.unwrap_or(384),
            models_used: stats.models_used,
            last_updated: stats.last_updated,
        })
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentIntelligenceStats {
    pub total_documents_processed: i64,
    pub vector_dimensions: i64,
    pub models_used: Vec<String>,
    pub last_updated: Option<String>,
}
