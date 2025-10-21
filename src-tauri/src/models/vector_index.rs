use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorIndex {
    pub id: i64,
    pub content_id: i64,
    pub content_type: String,
    pub content: String,
    pub embedding_vector: Vec<f32>,
    pub model_name: String,
    pub chunk_index: i64,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVectorIndex {
    pub content_id: i64,
    pub content_type: String,
    pub content: String,
    pub embedding_vector: Vec<f32>,
    pub model_name: String,
    pub chunk_index: Option<i64>,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateVectorIndex {
    pub embedding_vector: Option<Vec<f32>>,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilaritySearchResult {
    pub content_id: i64,
    pub content_type: String,
    pub content: String,
    pub similarity_score: f32,
    pub metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorIndexStats {
    pub total_vectors: i64,
    pub models_used: Vec<String>,
    pub average_vector_dimension: Option<i64>,
    pub last_updated: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingRequest {
    pub content: String,
    pub model_name: String,
    pub chunk_size: Option<usize>,
    pub overlap: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingResponse {
    pub embeddings: Vec<Vec<f32>>,
    pub model_name: String,
    pub processing_time: f64,
    pub chunk_count: usize,
}
