use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleaningTask {
    pub id: i64,
    pub file_id: i64,
    pub task_type: String,
    pub status: String,
    pub priority: i64,
    pub input_content: Option<String>,
    pub output_content: Option<String>,
    pub error_message: Option<String>,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCleaningTask {
    pub file_id: i64,
    pub task_type: String,
    pub priority: Option<i64>,
    pub input_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCleaningTask {
    pub status: Option<String>,
    pub output_content: Option<String>,
    pub error_message: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleaningTaskStats {
    pub total_tasks: i64,
    pub pending_tasks: i64,
    pub running_tasks: i64,
    pub completed_tasks: i64,
    pub failed_tasks: i64,
    pub average_processing_time: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CleaningTaskType {
    TextCleanup,
    StructureRepair,
    MetadataExtraction,
    ContentNormalization,
    DuplicateRemoval,
    FormatConversion,
}

impl std::fmt::Display for CleaningTaskType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CleaningTaskType::TextCleanup => write!(f, "text_cleanup"),
            CleaningTaskType::StructureRepair => write!(f, "structure_repair"),
            CleaningTaskType::MetadataExtraction => write!(f, "metadata_extraction"),
            CleaningTaskType::ContentNormalization => write!(f, "content_normalization"),
            CleaningTaskType::DuplicateRemoval => write!(f, "duplicate_removal"),
            CleaningTaskType::FormatConversion => write!(f, "format_conversion"),
        }
    }
}

impl std::str::FromStr for CleaningTaskType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "text_cleanup" => Ok(CleaningTaskType::TextCleanup),
            "structure_repair" => Ok(CleaningTaskType::StructureRepair),
            "metadata_extraction" => Ok(CleaningTaskType::MetadataExtraction),
            "content_normalization" => Ok(CleaningTaskType::ContentNormalization),
            "duplicate_removal" => Ok(CleaningTaskType::DuplicateRemoval),
            "format_conversion" => Ok(CleaningTaskType::FormatConversion),
            _ => Err(format!("Unknown cleaning task type: {}", s)),
        }
    }
}
