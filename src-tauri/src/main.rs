// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;
mod utils;

use services::database::Database;
use services::ollama::OllamaService;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    // Initialize database
    let db = match Database::new() {
        Ok(db) => Arc::new(Mutex::new(db)),
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            std::process::exit(1);
        }
    };

    // Initialize Ollama service (defaults to localhost:8080)
    let ollama = Arc::new(Mutex::new(OllamaService::new(None)));

    tauri::Builder::default()
        .manage(db)
        .manage(ollama)
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::messages::get_messages,
            commands::messages::create_message,
            commands::messages::update_message,
            commands::messages::delete_message,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::files::upload_file,
            commands::files::get_file_metadata,
            commands::files::read_file_content,
            commands::files::delete_file,
            commands::files::list_files,
            commands::documents::create_document,
            commands::documents::get_document,
            commands::documents::get_all_documents,
            commands::documents::update_document,
            commands::documents::delete_document,
            commands::document_versions::get_document_versions,
            commands::document_versions::restore_document_version,
            commands::tasks::create_task,
            commands::tasks::get_task,
            commands::tasks::get_all_tasks,
            commands::tasks::update_task,
            commands::tasks::delete_task,
            commands::links::create_link,
            commands::links::get_links_for_item,
            commands::links::delete_link,
            commands::events::create_event,
            commands::events::get_event,
            commands::events::get_events_in_range,
            commands::events::update_event,
            commands::events::delete_event,
            commands::ai::summarize,
            commands::ai::rewrite,
            commands::ai::generate_tasks,
            commands::ai::chat_with_ai,
            commands::ai::generate_embedding,
            commands::ai::index_content,
            commands::ai::semantic_search,
            commands::ai::chat_with_context,
            commands::notifications::send_notification,
            commands::notifications::schedule_reminder,
            commands::ics::export_calendar_to_ics,
            commands::ics::import_calendar_from_ics,
            commands::indexer::index_all_content,
            commands::setup::check_setup_status,
            commands::setup::install_ollama,
            commands::setup::start_ollama,
            commands::setup::download_model,
            commands::clear::clear_all_messages,
            commands::clear::clear_all_documents,
            commands::clear::clear_all_tasks,
            commands::clear::clear_all_events,
            commands::clear::clear_all_links,
            // AI Mentor commands
            commands::ai_mentor_commands::explain_ai_output,
            commands::ai_mentor_commands::suggest_prompt_improvement,
            commands::ai_mentor_commands::get_learning_path,
            commands::ai_mentor_commands::generate_ai_quiz,
            commands::ai_mentor_commands::track_ai_feature_usage,
            commands::ai_mentor_commands::chat_with_mentor,
            // Play v1.1 "Data Ready" commands
            commands::ingestion::create_ingestion_job,
            commands::ingestion::get_ingestion_job,
            commands::ingestion::get_all_ingestion_jobs,
            commands::ingestion::update_ingestion_job,
            commands::ingestion::get_ingestion_stats,
            commands::ingestion::start_ingestion_job,
            commands::ingestion::cancel_ingestion_job,
            commands::ingestion::delete_ingestion_job,
            // Cleaning commands
            commands::cleaning::create_cleaning_task,
            commands::cleaning::get_cleaning_task,
            commands::cleaning::get_all_cleaning_tasks,
            commands::cleaning::get_pending_cleaning_tasks,
            commands::cleaning::update_cleaning_task,
            commands::cleaning::get_cleaning_stats,
            commands::cleaning::process_cleaning_task,
                commands::cleaning::process_pending_cleaning_tasks,
                commands::cleaning::process_pending_cleaning_tasks_with_progress,
                commands::cleaning::delete_cleaning_task,
                commands::cleaning::create_cleaning_tasks_for_files,
            commands::cleaning::fix_tasks_without_input_content,
                commands::cleaning::get_cleaning_task_summary,
                commands::cleaning::get_cleaning_output_directory,
                commands::cleaning::list_cleaning_output_files,
                commands::cleaning::read_cleaning_output_file,
                commands::cleaning::index_all_cleaned_files_with_progress,
                commands::cleaning::trigger_insight_generation,
                commands::cleaning::delete_all_cleaning_tasks,
            // Vector search commands
            commands::vector_search::create_vector_entry,
            commands::vector_search::get_vector_entry,
            commands::vector_search::get_entries_for_content,
            commands::vector_search::similarity_search,
            commands::vector_search::generate_vector_embedding,
            commands::vector_search::index_vector_content,
            commands::vector_search::search_similar_content,
            commands::vector_search::get_vector_stats,
            commands::vector_search::delete_content_vectors,
            commands::vector_search::delete_vector_entry,
            commands::vector_search::check_ollama_connection,
            commands::vector_search::get_all_vector_entries,
            commands::vector_search::clear_vector_database,
            commands::ai::list_ollama_models,
            // AI insights commands
            commands::ai_insights::create_insight,
            commands::ai_insights::get_insight,
            commands::ai_insights::get_insights,
            commands::ai_insights::mark_insight_read,
            commands::ai_insights::delete_insight,
            commands::ai_insights::get_insight_stats,
            commands::ai_insights::generate_content_recommendations,
            commands::ai_insights::analyze_content_patterns,
            commands::ai_insights::generate_insights,
            commands::ai_insights::get_real_time_analysis,
            commands::ai_insights::clear_all_insights,
            commands::ai_insights::clean_corrupted_insights,
            // Data Operations commands
            commands::data_operations::create_data_processing_job,
            commands::data_operations::get_data_processing_job,
            commands::data_operations::get_all_data_processing_jobs,
            commands::data_operations::update_data_processing_job,
            commands::data_operations::process_files_for_job,
            commands::data_operations::get_processing_stats,
            commands::data_operations::get_processed_files,
            commands::data_operations::get_data_chunks,
            commands::data_operations::export_processed_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}