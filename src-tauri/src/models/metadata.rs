use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metadata {
    pub id: i64,
    pub file_id: i64,
    pub author: Option<String>,
    pub topic: Option<String>,
    pub date: Option<String>,
    pub tags: Option<String>,
    pub extracted_content: Option<String>,
    pub custom_metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMetadata {
    pub file_id: i64,
    pub author: Option<String>,
    pub topic: Option<String>,
    pub date: Option<String>,
    pub tags: Option<String>,
    pub extracted_content: Option<String>,
    pub custom_metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMetadata {
    pub author: Option<String>,
    pub topic: Option<String>,
    pub date: Option<String>,
    pub tags: Option<String>,
    pub extracted_content: Option<String>,
    pub custom_metadata: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataExtractionResult {
    pub file_id: i64,
    pub success: bool,
    pub author: Option<String>,
    pub topic: Option<String>,
    pub date: Option<String>,
    pub tags: Vec<String>,
    pub extracted_content: Option<String>,
    pub error_message: Option<String>,
}
