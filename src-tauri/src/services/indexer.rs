// Background Indexer - per prd.md AI features
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use crate::services::vector_search_service::VectorSearchService;
use crate::models::vector_index::CreateVectorIndex;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct BackgroundIndexer {
    db: Arc<Mutex<Database>>,
    ollama: Arc<Mutex<OllamaService>>,
}

impl BackgroundIndexer {
    pub fn new(
        db: Arc<Mutex<Database>>,
        ollama: Arc<Mutex<OllamaService>>,
    ) -> Self {
        Self { db, ollama }
    }

    pub async fn index_all_content(&self) -> Result<usize, Box<dyn std::error::Error>> {
        let mut total_indexed = 0;

        // Index messages
        total_indexed += self.index_messages().await?;
        
        // Index documents
        total_indexed += self.index_documents().await?;
        
        // Index tasks
        total_indexed += self.index_tasks().await?;

        Ok(total_indexed)
    }

    async fn index_messages(&self) -> Result<usize, Box<dyn std::error::Error>> {
        let database = self.db.lock().await;
        let messages = database.get_messages_by_channel(1, 1000)?; // Channel 1, limit 1000
        drop(database);

        let mut count = 0;
        for msg in messages {
            if let Ok(_) = self.generate_and_store_embedding(
                "message",
                msg.id,
                &msg.content,
            ).await {
                count += 1;
            }
        }

        Ok(count)
    }

    async fn index_documents(&self) -> Result<usize, Box<dyn std::error::Error>> {
        let database = self.db.lock().await;
        let documents = database.get_all_documents(1000)?; // Limit 1000 docs
        drop(database);

        let mut count = 0;
        for doc in documents {
            let text = format!("{} {}", doc.title, doc.content);
            if let Ok(_) = self.generate_and_store_embedding(
                "document",
                doc.id,
                &text,
            ).await {
                count += 1;
            }
        }

        Ok(count)
    }

    async fn index_tasks(&self) -> Result<usize, Box<dyn std::error::Error>> {
        let database = self.db.lock().await;
        let tasks = database.get_all_tasks()?;
        drop(database);

        let mut count = 0;
        for task in tasks {
            let text = format!("{} {}", task.title, task.description.unwrap_or_default());
            if let Ok(_) = self.generate_and_store_embedding(
                "task",
                task.id,
                &text,
            ).await {
                count += 1;
            }
        }

        Ok(count)
    }

    async fn generate_and_store_embedding(
        &self,
        content_type: &str,
        content_id: i64,
        text: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Generate embedding
        let service = self.ollama.lock().await;
        let embedding = service.generate_embedding("nomic-embed-text", text).await?;
        drop(service);

        // Store in vector database using VectorSearchService
        let db_guard = self.db.lock().await;
        let vector_service = VectorSearchService::new(&*db_guard, self.ollama.clone());
        
        let create_entry = CreateVectorIndex {
            content_id,
            content_type: content_type.to_string(),
            content: text.to_string(),
            embedding_vector: embedding,
            model_name: "nomic-embed-text".to_string(),
            chunk_index: Some(0),
            metadata: Some("Background indexed content".to_string()),
        };
        
        vector_service.create_vector_entry(create_entry)?;
        Ok(())
    }
}

