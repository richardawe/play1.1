use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestionJob {
    pub id: i64,
    pub source_path: String,
    pub job_type: String,
    pub status: String,
    pub progress: f64,
    pub total_files: i64,
    pub processed_files: i64,
    pub error_count: i64,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateIngestionJob {
    pub source_path: String,
    pub job_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateIngestionJob {
    pub status: Option<String>,
    pub progress: Option<f64>,
    pub total_files: Option<i64>,
    pub processed_files: Option<i64>,
    pub error_count: Option<i64>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IngestionJobStats {
    pub total_jobs: i64,
    pub pending_jobs: i64,
    pub running_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub total_files_processed: i64,
    pub total_errors: i64,
}
