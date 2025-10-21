use crate::services::ai_insights_service::{AIInsightsService, CreateInsight, InsightStats, ContentRecommendation};
use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;

#[tauri::command]
pub async fn create_insight(
    insight: CreateInsight,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<crate::services::ai_insights_service::Insight, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .create_insight(insight)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_insight(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<crate::services::ai_insights_service::Insight, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .get_insight(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_insights(
    limit: Option<i64>,
    unread_only: Option<bool>,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::services::ai_insights_service::Insight>, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .get_insights(limit, unread_only.unwrap_or(false))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_insight_read(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .mark_insight_read(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_insight(
    id: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<(), String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .delete_insight(id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_insight_stats(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<InsightStats, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .get_insight_stats()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_content_recommendations(
    user_id: Option<i64>,
    limit: i64,
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<ContentRecommendation>, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .generate_content_recommendations(user_id, limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn analyze_content_patterns(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .analyze_content_patterns()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_insights(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<Vec<crate::services::ai_insights_service::Insight>, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    insights_service
        .generate_insights()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_real_time_analysis(
    db: State<'_, Arc<Mutex<Database>>>,
    ollama: State<'_, Arc<Mutex<OllamaService>>>,
) -> Result<serde_json::Value, String> {
    let db = db.lock().await;
    let insights_service = AIInsightsService::new(&*db, ollama.inner().clone());
    
    // Get comprehensive real-time analysis
    let analysis = insights_service.analyze_content_patterns().map_err(|e| e.to_string())?;
    let insights = insights_service.generate_insights().map_err(|e| e.to_string())?;
    let recommendations = insights_service.generate_content_recommendations(None, 5).map_err(|e| e.to_string())?;
    
    let real_time_data = serde_json::json!({
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "analysis": analysis,
        "recent_insights": insights.into_iter().take(3).collect::<Vec<_>>(),
        "recent_recommendations": recommendations.into_iter().take(3).collect::<Vec<_>>(),
        "status": "active"
    });
    
    Ok(real_time_data)
}

#[tauri::command]
pub async fn clear_all_insights(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<i64, String> {
    let db = db.lock().await;
    let conn = db.get_connection();
    
    let deleted_count = conn.execute("DELETE FROM insights", [])
        .map_err(|e| e.to_string())?;
    
    Ok(deleted_count as i64)
}

#[tauri::command]
pub async fn clean_corrupted_insights(
    db: State<'_, Arc<Mutex<Database>>>,
) -> Result<i64, String> {
    let db = db.lock().await;
    let conn = db.get_connection();
    
    // Delete insights with unrealistic percentages (over 100%)
    // This targets the "Empty Content Detected" insights with corrupted percentages
    let deleted_count = conn.execute(
        "DELETE FROM insights WHERE title = 'Empty Content Detected' AND description LIKE '%%.%' AND description LIKE '%%%'",
        []
    ).map_err(|e| e.to_string())?;
    
    Ok(deleted_count as i64)
}

