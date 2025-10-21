use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub channel_id: i64,
    pub user_id: i64,
    pub content: String,
    pub attachments: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMessage {
    pub channel_id: i64,
    pub user_id: i64,
    pub content: String,
    pub attachments: Option<String>,
}

