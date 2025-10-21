pub mod messages;
pub mod settings;
pub mod files;
pub mod documents;
pub mod document_versions;
pub mod tasks;
pub mod links;
pub mod events;
pub mod ai;
pub mod notifications;
pub mod ics;
pub mod indexer;
pub mod setup;
pub mod clear;

// AI Mentor commands
pub mod ai_mentor_commands;

// Play v1.1 "Data Ready" commands
pub mod ingestion;
pub mod cleaning;
pub mod vector_search;
pub mod ai_insights;
pub mod data_operations;

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Play.", name)
}

