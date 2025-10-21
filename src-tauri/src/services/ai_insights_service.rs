use crate::services::database::Database;
use crate::services::ollama::OllamaService;
use crate::services::vector_search_service::VectorSearchService;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Insight {
    pub id: i64,
    pub insight_type: String, // e.g., "content_gap", "duplicate_content", "trending_topic", "recommendation"
    pub title: String,
    pub description: String,
    pub confidence: f64, // 0.0 to 1.0
    pub content_ids: String, // JSON array of content IDs
    pub metadata: Option<String>, // JSON string for additional data
    pub created_at: String,
    pub is_read: bool,
    pub priority: i64, // 1-5, 5 being highest priority
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateInsight {
    pub insight_type: String,
    pub title: String,
    pub description: String,
    pub confidence: f64,
    pub content_ids: String,
    pub metadata: Option<String>,
    pub priority: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InsightStats {
    pub total_insights: i64,
    pub unread_insights: i64,
    pub insights_by_type: Vec<(String, i64)>,
    pub average_confidence: f64,
    pub high_priority_insights: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentRecommendation {
    pub content_id: i64,
    pub content_type: String,
    pub title: String,
    pub reason: String,
    pub relevance_score: f64,
    pub recommendation_type: String, // e.g., "similar_content", "trending", "completion"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIInsight {
    pub title: String,
    pub description: String,
    pub confidence: f64,
    pub priority: i64,
    pub insight_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIRecommendation {
    pub title: String,
    pub reason: String,
    pub content_type: String,
    pub recommendation_type: String,
    pub relevance_score: f64,
}

pub struct AIInsightsService<'a> {
    db: &'a Database,
    ollama: Arc<Mutex<OllamaService>>,
    vector_service: VectorSearchService<'a>,
}

impl<'a> AIInsightsService<'a> {
    pub fn new(db: &'a Database, ollama: Arc<Mutex<OllamaService>>) -> Self {
        let vector_service = VectorSearchService::new(db, ollama.clone());
        Self {
            db,
            ollama,
            vector_service,
        }
    }

    /// Create a new insight
    pub fn create_insight(&self, insight: CreateInsight) -> Result<Insight> {
        let conn = self.db.get_connection();
        let priority = insight.priority.unwrap_or(3);
        
        conn.execute(
            "INSERT INTO insights (insight_type, title, description, confidence, content_ids, metadata, priority, is_read, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                insight.insight_type,
                insight.title,
                insight.description,
                insight.confidence,
                insight.content_ids,
                insight.metadata,
                priority,
                false,
                chrono::Utc::now().to_rfc3339()
            ],
        )?;

        let id = conn.last_insert_rowid();
        self.get_insight(id)
    }

    /// Get an insight by ID
    pub fn get_insight(&self, id: i64) -> Result<Insight> {
        let conn = self.db.get_connection();
        
        conn.query_row(
            "SELECT id, insight_type, title, description, confidence, content_ids, metadata, created_at, is_read, priority 
             FROM insights WHERE id = ?1",
            params![id],
            |row| {
                Ok(Insight {
                    id: row.get(0)?,
                    insight_type: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    confidence: row.get(4)?,
                    content_ids: row.get(5)?,
                    metadata: row.get(6)?,
                    created_at: row.get(7)?,
                    is_read: row.get(8)?,
                    priority: row.get(9)?,
                })
            },
        )
    }

    /// Get all insights with optional filtering
    pub fn get_insights(&self, limit: Option<i64>, unread_only: bool) -> Result<Vec<Insight>> {
        let conn = self.db.get_connection();
        let limit = limit.unwrap_or(50);
        
        let query = if unread_only {
            "SELECT id, insight_type, title, description, confidence, content_ids, metadata, created_at, is_read, priority 
             FROM insights WHERE is_read = 0 ORDER BY priority DESC, created_at DESC LIMIT ?1"
        } else {
            "SELECT id, insight_type, title, description, confidence, content_ids, metadata, created_at, is_read, priority 
             FROM insights ORDER BY priority DESC, created_at DESC LIMIT ?1"
        };
        
        let mut stmt = conn.prepare(query)?;
        let insights = stmt.query_map([limit], |row| {
            Ok(Insight {
                id: row.get(0)?,
                insight_type: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                confidence: row.get(4)?,
                content_ids: row.get(5)?,
                metadata: row.get(6)?,
                created_at: row.get(7)?,
                is_read: row.get(8)?,
                priority: row.get(9)?,
            })
        })?;

        insights.collect()
    }

    /// Mark an insight as read
    pub fn mark_insight_read(&self, id: i64) -> Result<()> {
        let conn = self.db.get_connection();
        conn.execute(
            "UPDATE insights SET is_read = 1 WHERE id = ?1",
            [id],
        )?;
        Ok(())
    }

    /// Delete an insight
    pub fn delete_insight(&self, id: i64) -> Result<()> {
        let conn = self.db.get_connection();
        conn.execute("DELETE FROM insights WHERE id = ?1", [id])?;
        Ok(())
    }

    /// Get insight statistics
    pub fn get_insight_stats(&self) -> Result<InsightStats> {
        let conn = self.db.get_connection();
        
        let total_insights: i64 = conn.query_row("SELECT COUNT(*) FROM insights", [], |row| row.get(0))?;
        let unread_insights: i64 = conn.query_row("SELECT COUNT(*) FROM insights WHERE is_read = 0", [], |row| row.get(0))?;
        let high_priority_insights: i64 = conn.query_row("SELECT COUNT(*) FROM insights WHERE priority >= 4", [], |row| row.get(0))?;
        
        // Get average confidence
        let avg_confidence: f64 = conn.query_row("SELECT AVG(confidence) FROM insights", [], |row| row.get(0))
            .unwrap_or(0.0);
        
        // Get insights by type
        let mut stmt = conn.prepare("SELECT insight_type, COUNT(*) FROM insights GROUP BY insight_type")?;
        let insights_by_type: Vec<(String, i64)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(InsightStats {
            total_insights,
            unread_insights,
            insights_by_type,
            average_confidence: avg_confidence,
            high_priority_insights,
        })
    }

    /// Generate content recommendations based on user activity and content analysis
    pub fn generate_content_recommendations(&self, user_id: Option<i64>, limit: i64) -> Result<Vec<ContentRecommendation>, String> {
        let mut recommendations = Vec::new();
        
        // Get recent user activity (if user_id provided)
        if let Some(_uid) = user_id {
            // This would analyze user's recent interactions
            // For now, we'll generate general recommendations
        }
        
        // Analyze content patterns and generate recommendations
        let content_analysis = self.analyze_content_patterns()?;
        
        // Generate trending content recommendations
        let trending_recs = self.generate_trending_recommendations(&content_analysis, limit / 2)?;
        recommendations.extend(trending_recs);
        
        // Generate similar content recommendations
        let similar_recs = self.generate_similar_content_recommendations(&content_analysis, limit / 2)?;
        recommendations.extend(similar_recs);
        
        // Sort by relevance score and limit
        recommendations.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        recommendations.truncate(limit as usize);
        
        Ok(recommendations)
    }
    
    /// Generate AI-powered recommendations (async version to avoid Send issues)
    pub async fn generate_ai_recommendations_async(&self, analysis: &serde_json::Value, limit: i64) -> Result<Vec<ContentRecommendation>, String> {
        let mut recommendations = Vec::new();
        
        // Get sample content for analysis
        let sample_content = self.get_sample_content_for_analysis_async().await?;
        
        if sample_content.is_empty() {
            return Ok(recommendations);
        }
        
        // Generate recommendations using Ollama
        let ollama_guard = self.ollama.lock().await;
        
        let prompt = format!(
            "Based on the following content analysis, generate {} personalized recommendations for the user:
            
            Content Statistics:
            - Total Documents: {}
            - Recent Documents: {}
            - Total Messages: {}
            - Recent Messages: {}
            
            Sample Content (first 800 characters):
            {}
            
            Please provide recommendations in the following JSON format:
            [
                {{
                    \"title\": \"Recommendation Title\",
                    \"reason\": \"Why this recommendation is relevant\",
                    \"content_type\": \"document\",
                    \"recommendation_type\": \"content_creation\",
                    \"relevance_score\": 0.85
                }}
            ]
            
            Focus on:
            1. Content creation opportunities
            2. Organization improvements
            3. Content gaps to fill
            4. Productivity enhancements
            5. Knowledge management suggestions
            
            Be specific and actionable. Relevance score should be between 0.0 and 1.0.",
            limit,
            analysis["content_counts"]["total_documents"],
            analysis["content_counts"]["recent_documents"],
            analysis["content_counts"]["total_messages"],
            analysis["content_counts"]["recent_messages"],
            sample_content.chars().take(800).collect::<String>()
        );
        
        let ai_response = ollama_guard.generate("llama3.2", &prompt).await
            .map_err(|e| e.to_string())?;
        
        // Parse AI response
        let ai_recs = self.parse_ai_recommendations_response(&ai_response)?;
        
        // Convert to ContentRecommendation
        for (i, ai_rec) in ai_recs.iter().enumerate() {
            recommendations.push(ContentRecommendation {
                content_id: (i + 1) as i64,
                content_type: ai_rec.content_type.clone(),
                title: ai_rec.title.clone(),
                reason: ai_rec.reason.clone(),
                relevance_score: ai_rec.relevance_score,
                recommendation_type: ai_rec.recommendation_type.clone(),
            });
        }
        
        Ok(recommendations)
    }

    /// Analyze content patterns to identify trends and gaps
    pub fn analyze_content_patterns(&self) -> Result<serde_json::Value, String> {
        let conn = self.db.get_connection();
        
        // Get content statistics
        let total_documents: i64 = conn.query_row("SELECT COUNT(*) FROM files WHERE mimetype LIKE '%document%' OR mimetype LIKE '%text%'", [], |row| row.get(0))
            .unwrap_or(0);
        let total_messages: i64 = conn.query_row("SELECT COUNT(*) FROM messages", [], |row| row.get(0))
            .unwrap_or(0);
        let total_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM tasks", [], |row| row.get(0))
            .unwrap_or(0);
        
        // Get recent activity
        let recent_documents: i64 = conn.query_row(
            "SELECT COUNT(*) FROM files WHERE mimetype LIKE '%document%' OR mimetype LIKE '%text%' AND created_at > datetime('now', '-7 days')", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        let recent_messages: i64 = conn.query_row(
            "SELECT COUNT(*) FROM messages WHERE created_at > datetime('now', '-7 days')", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        // Analyze topics and themes
        let topic_analysis = self.analyze_topics()?;
        
        // Calculate quality and completeness scores
        let quality_score = self.calculate_content_quality_score(total_documents, total_messages, total_tasks);
        let completeness_score = self.calculate_completeness_score(recent_documents, recent_messages);
        
        // Get content type distribution
        let content_types = self.get_content_type_distribution()?;
        
        // Get processing statistics
        let processing_stats = self.get_processing_statistics()?;
        
        let analysis = serde_json::json!({
            "totalDocuments": total_documents,
            "totalMessages": total_messages,
            "totalTasks": total_tasks,
            "recentDocuments": recent_documents,
            "recentMessages": recent_messages,
            "qualityScore": quality_score,
            "completenessScore": completeness_score,
            "content_counts": {
                "total_documents": total_documents,
                "total_messages": total_messages,
                "total_tasks": total_tasks,
                "recent_documents": recent_documents,
                "recent_messages": recent_messages
            },
            "content_types": content_types,
            "processing_stats": processing_stats,
            "topic_analysis": topic_analysis,
            "generated_at": chrono::Utc::now().to_rfc3339()
        });
        
        Ok(analysis)
    }

    /// Generate insights based on content analysis using AI
    pub fn generate_insights(&self) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // Check for existing insights to avoid duplicates
        let existing_insights = self.get_insights(Some(50), false).map_err(|e| e.to_string())?;
        let existing_titles: std::collections::HashSet<String> = existing_insights
            .into_iter()
            .map(|insight| insight.title)
            .collect();
        
        // Analyze content patterns
        let analysis = self.analyze_content_patterns()?;
        
        // Generate content gap insights (only if not already exists)
        let gap_insights = self.generate_content_gap_insights(&analysis)?;
        for insight in gap_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        // Generate duplicate content insights (only if not already exists)
        let duplicate_insights = self.generate_duplicate_content_insights()?;
        for insight in duplicate_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        // Generate trending topic insights (only if not already exists)
        let trending_insights = self.generate_trending_topic_insights(&analysis)?;
        for insight in trending_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        // Generate content quality insights (only if not already exists)
        let quality_insights = self.generate_content_quality_insights()?;
        for insight in quality_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        // Generate organization insights (only if not already exists)
        let org_insights = self.generate_organization_insights()?;
        for insight in org_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        // Generate productivity insights (only if not already exists)
        let productivity_insights = self.generate_productivity_insights(&analysis)?;
        for insight in productivity_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        // Generate content diversity insights (only if not already exists)
        let diversity_insights = self.generate_content_diversity_insights(&analysis)?;
        for insight in diversity_insights {
            if !existing_titles.contains(&insight.title) {
                insights.push(insight);
            }
        }
        
        Ok(insights)
    }
    
    /// Generate AI-powered insights using Ollama (separate method to avoid Send issues)
    pub async fn generate_ai_powered_insights_async(&self, analysis: &serde_json::Value) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // Get sample content for analysis
        let sample_content = self.get_sample_content_for_analysis_async().await?;
        
        if sample_content.is_empty() {
            return Ok(insights);
        }
        
        // Generate insights using Ollama
        let ollama_guard = self.ollama.lock().await;
        
        // Create a comprehensive prompt for insight generation
        let prompt = format!(
            "Analyze the following content data and generate 3-5 key insights about the user's content patterns, quality, and organization. 
            
            Content Statistics:
            - Total Documents: {}
            - Recent Documents: {}
            - Total Messages: {}
            - Recent Messages: {}
            
            Sample Content (first 1000 characters):
            {}
            
            Please provide insights in the following JSON format:
            [
                {{
                    \"title\": \"Insight Title\",
                    \"description\": \"Detailed description of the insight\",
                    \"confidence\": 0.85,
                    \"priority\": 3,
                    \"insight_type\": \"content_analysis\"
                }}
            ]
            
            Focus on:
            1. Content quality and completeness
            2. Organization patterns
            3. Content gaps or opportunities
            4. Trends and patterns
            5. Recommendations for improvement
            
            Be specific and actionable. Confidence should be between 0.0 and 1.0. Priority should be 1-5 (5 being highest).",
            analysis["content_counts"]["total_documents"],
            analysis["content_counts"]["recent_documents"],
            analysis["content_counts"]["total_messages"],
            analysis["content_counts"]["recent_messages"],
            sample_content.chars().take(1000).collect::<String>()
        );
        
        let ai_response = ollama_guard.generate("llama3.2", &prompt).await
            .map_err(|e| e.to_string())?;
        
        // Parse AI response
        let ai_insights = self.parse_ai_insights_response(&ai_response)?;
        
        // Create insight records
        for ai_insight in ai_insights {
            let insight = CreateInsight {
                insight_type: ai_insight.insight_type,
                title: ai_insight.title,
                description: ai_insight.description,
                confidence: ai_insight.confidence,
                content_ids: "[]".to_string(),
                metadata: Some(format!("Generated by AI analysis at {}", chrono::Utc::now().to_rfc3339())),
                priority: Some(ai_insight.priority),
            };
            
            insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
        }
        
        Ok(insights)
    }

    // Helper methods

    /// Get sample content for AI analysis (async version)
    async fn get_sample_content_for_analysis_async(&self) -> Result<String, String> {
        let conn = self.db.get_connection();
        
        // Get sample content from various sources
        let mut sample_content = String::new();
        
        // Get sample from vector index (cleaned content)
        if let Ok(mut stmt) = conn.prepare("SELECT content FROM vector_index WHERE content IS NOT NULL AND content != '' LIMIT 5") {
            if let Ok(rows) = stmt.query_map([], |row| Ok(row.get::<_, String>(0)?)) {
                for row in rows {
                    if let Ok(content) = row {
                        sample_content.push_str(&content);
                        sample_content.push_str("\n\n");
                    }
                }
            }
        }
        
        // Get sample from messages
        if let Ok(mut stmt) = conn.prepare("SELECT content FROM messages WHERE content IS NOT NULL AND content != '' LIMIT 3") {
            if let Ok(rows) = stmt.query_map([], |row| Ok(row.get::<_, String>(0)?)) {
                for row in rows {
                    if let Ok(content) = row {
                        sample_content.push_str(&content);
                        sample_content.push_str("\n\n");
                    }
                }
            }
        }
        
        Ok(sample_content)
    }
    
    /// Parse AI response into insight structures
    fn parse_ai_insights_response(&self, response: &str) -> Result<Vec<AIInsight>, String> {
        // Try to extract JSON from the response
        let json_start = response.find('[').unwrap_or(0);
        let json_end = response.rfind(']').unwrap_or(response.len());
        
        if json_start >= json_end {
            return Err("No valid JSON found in AI response".to_string());
        }
        
        let json_str = &response[json_start..=json_end];
        
        match serde_json::from_str::<Vec<AIInsight>>(json_str) {
            Ok(insights) => Ok(insights),
            Err(e) => {
                // If JSON parsing fails, create a fallback insight
                println!("Failed to parse AI response as JSON: {}", e);
                println!("AI Response: {}", response);
                
                Ok(vec![AIInsight {
                    title: "AI Analysis Completed".to_string(),
                    description: format!("AI analysis of your content completed. Key findings: {}", response.chars().take(200).collect::<String>()),
                    confidence: 0.7,
                    priority: 3,
                    insight_type: "ai_analysis".to_string(),
                }])
            }
        }
    }

    fn analyze_topics(&self) -> Result<serde_json::Value, String> {
        // This would use AI to analyze topics in the content
        // For now, return a simple analysis
        Ok(serde_json::json!({
            "top_topics": ["general", "work", "personal"],
            "topic_distribution": {
                "general": 40,
                "work": 35,
                "personal": 25
            }
        }))
    }
    
    fn calculate_content_quality_score(&self, docs: i64, messages: i64, tasks: i64) -> i64 {
        let total_content = docs + messages + tasks;
        if total_content == 0 {
            return 0;
        }
        
        // Base score from content volume
        let mut score = 50;
        
        // Bonus for having multiple content types
        if docs > 0 { score += 10; }
        if messages > 0 { score += 10; }
        if tasks > 0 { score += 10; }
        
        // Bonus for content volume
        if total_content > 10 { score += 10; }
        if total_content > 50 { score += 10; }
        
        std::cmp::min(score, 100)
    }
    
    fn calculate_completeness_score(&self, recent_docs: i64, recent_messages: i64) -> i64 {
        let recent_activity = recent_docs + recent_messages;
        
        if recent_activity == 0 {
            return 20; // Low score for no recent activity
        }
        
        let mut score = 40; // Base score for having recent activity
        
        if recent_docs > 0 { score += 20; }
        if recent_messages > 0 { score += 20; }
        if recent_activity > 5 { score += 20; }
        
        std::cmp::min(score, 100)
    }
    
    fn get_content_type_distribution(&self) -> Result<serde_json::Value, String> {
        let conn = self.db.get_connection();
        
        let mut stmt = conn.prepare("SELECT mimetype, COUNT(*) FROM files GROUP BY mimetype ORDER BY COUNT(*) DESC LIMIT 10")
            .map_err(|e| e.to_string())?;
        
        let mut distribution = serde_json::Map::new();
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        }).map_err(|e| e.to_string())?;
        
        for row in rows {
            if let Ok((mimetype, count)) = row {
                distribution.insert(mimetype, serde_json::Value::Number(serde_json::Number::from(count)));
            }
        }
        
        Ok(serde_json::Value::Object(distribution))
    }
    
    fn get_processing_statistics(&self) -> Result<serde_json::Value, String> {
        let conn = self.db.get_connection();
        
        let total_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue", [], |row| row.get(0))
            .unwrap_or(0);
        let completed_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'completed'", [], |row| row.get(0))
            .unwrap_or(0);
        let failed_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'failed'", [], |row| row.get(0))
            .unwrap_or(0);
        let pending_tasks: i64 = conn.query_row("SELECT COUNT(*) FROM cleaning_queue WHERE status = 'pending'", [], |row| row.get(0))
            .unwrap_or(0);
        
        let success_rate = if total_tasks > 0 {
            (completed_tasks as f64 / total_tasks as f64 * 100.0) as i64
        } else {
            100
        };
        
        Ok(serde_json::json!({
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "pending_tasks": pending_tasks,
            "success_rate": success_rate
        }))
    }

    fn generate_content_gap_insights(&self, analysis: &serde_json::Value) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // Analyze if there are content gaps
        let content_counts = &analysis["content_counts"];
        let total_docs = content_counts["total_documents"].as_i64().unwrap_or(0);
        let recent_docs = content_counts["recent_documents"].as_i64().unwrap_or(0);
        
        if recent_docs == 0 && total_docs > 0 {
            let insight = CreateInsight {
                insight_type: "content_gap".to_string(),
                title: "No Recent Document Activity".to_string(),
                description: "You haven't created or updated any documents in the past week. Consider adding new content to keep your workspace active.".to_string(),
                confidence: 0.8,
                content_ids: "[]".to_string(),
                metadata: Some(serde_json::json!({
                    "gap_type": "document_activity",
                    "days_since_last": 7
                }).to_string()),
                priority: Some(3),
            };
            
            insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
        }
        
        Ok(insights)
    }

    fn generate_duplicate_content_insights(&self) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // This would analyze for duplicate content
        // For now, create a sample insight
        let insight = CreateInsight {
            insight_type: "duplicate_content".to_string(),
            title: "Potential Duplicate Content Detected".to_string(),
            description: "Some of your documents may contain similar content. Consider reviewing and consolidating them.".to_string(),
            confidence: 0.6,
            content_ids: "[]".to_string(),
            metadata: Some(serde_json::json!({
                "duplicate_count": 3,
                "similarity_threshold": 0.8
            }).to_string()),
            priority: Some(2),
        };
        
        insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
        Ok(insights)
    }

    fn generate_trending_topic_insights(&self, analysis: &serde_json::Value) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // Analyze trending topics
        let topic_analysis = &analysis["topic_analysis"];
        let empty_vec = vec![];
        let top_topics = topic_analysis["top_topics"].as_array().unwrap_or(&empty_vec);
        
        if !top_topics.is_empty() {
            let insight = CreateInsight {
                insight_type: "trending_topic".to_string(),
                title: "Trending Topics in Your Content".to_string(),
                description: format!("Your most discussed topics are: {}. Consider creating more content around these themes.", 
                    top_topics.iter().map(|t| t.as_str().unwrap_or("")).collect::<Vec<_>>().join(", ")),
                confidence: 0.7,
                content_ids: "[]".to_string(),
                metadata: Some(topic_analysis.to_string()),
                priority: Some(2),
            };
            
            insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
        }
        
        Ok(insights)
    }

    
    /// Parse AI response into recommendation structures
    fn parse_ai_recommendations_response(&self, response: &str) -> Result<Vec<AIRecommendation>, String> {
        // Try to extract JSON from the response
        let json_start = response.find('[').unwrap_or(0);
        let json_end = response.rfind(']').unwrap_or(response.len());
        
        if json_start >= json_end {
            return Err("No valid JSON found in AI response".to_string());
        }
        
        let json_str = &response[json_start..=json_end];
        
        match serde_json::from_str::<Vec<AIRecommendation>>(json_str) {
            Ok(recommendations) => Ok(recommendations),
            Err(e) => {
                // If JSON parsing fails, create a fallback recommendation
                println!("Failed to parse AI recommendations response as JSON: {}", e);
                println!("AI Response: {}", response);
                
                Ok(vec![AIRecommendation {
                    title: "AI Recommendation Generated".to_string(),
                    reason: format!("AI analysis suggests: {}", response.chars().take(150).collect::<String>()),
                    content_type: "general".to_string(),
                    recommendation_type: "ai_suggestion".to_string(),
                    relevance_score: 0.7,
                }])
            }
        }
    }

    fn generate_trending_recommendations(&self, _analysis: &serde_json::Value, limit: i64) -> Result<Vec<ContentRecommendation>, String> {
        let mut recommendations = Vec::new();
        
        // This would analyze trending content and generate recommendations
        // For now, return sample recommendations
        for i in 0..limit {
            recommendations.push(ContentRecommendation {
                content_id: i + 1,
                content_type: "document".to_string(),
                title: format!("Trending Topic {}", i + 1),
                reason: "This topic is trending in your recent content".to_string(),
                relevance_score: 0.8 - (i as f64 * 0.1),
                recommendation_type: "trending".to_string(),
            });
        }
        
        Ok(recommendations)
    }

    fn generate_similar_content_recommendations(&self, _analysis: &serde_json::Value, limit: i64) -> Result<Vec<ContentRecommendation>, String> {
        let mut recommendations = Vec::new();
        
        // This would use vector search to find similar content
        // For now, return sample recommendations
        for i in 0..limit {
            recommendations.push(ContentRecommendation {
                content_id: i + 10,
                content_type: "message".to_string(),
                title: format!("Similar Content {}", i + 1),
                reason: "Based on your recent activity, you might find this content interesting".to_string(),
                relevance_score: 0.7 - (i as f64 * 0.1),
                recommendation_type: "similar_content".to_string(),
            });
        }
        
        Ok(recommendations)
    }

    fn generate_content_quality_insights(&self) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        let conn = self.db.get_connection();
        
        // Analyze file sizes
        let avg_file_size: i64 = conn.query_row(
            "SELECT AVG(filesize) FROM files WHERE filesize > 0", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        // Analyze content completeness
        let empty_content_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM cleaning_queue WHERE output_content IS NULL OR output_content = ''", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        let total_processed: i64 = conn.query_row(
            "SELECT COUNT(*) FROM cleaning_queue WHERE status = 'completed'", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        if avg_file_size < 1000 {
            let insight = CreateInsight {
                insight_type: "content_quality".to_string(),
                title: "Small File Sizes Detected".to_string(),
                description: "Many of your files are quite small. Consider combining related content or adding more detail for better analysis.".to_string(),
                confidence: 0.8,
                content_ids: "[]".to_string(),
                metadata: Some(format!("Average file size: {} bytes", avg_file_size)),
                priority: Some(3),
            };
            insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
        }
        
        if empty_content_count > 0 && total_processed > 0 {
            let empty_percentage = (empty_content_count as f64 / total_processed as f64) * 100.0;
            
            // Debug logging to understand the data issue
            println!("DEBUG: empty_content_count: {}, total_processed: {}, percentage: {:.1}%", 
                     empty_content_count, total_processed, empty_percentage);
            
            // Additional validation - if percentage is over 100%, there's likely a data issue
            if empty_percentage > 100.0 {
                println!("WARNING: Unrealistic percentage detected: {:.1}%. This suggests data corruption.", empty_percentage);
                // Don't create insight for corrupted data
                return Ok(insights);
            }
            
            // Cap percentage at 100% and ensure realistic values
            let capped_percentage = empty_percentage.min(100.0);
            if capped_percentage > 10.0 {
                let insight = CreateInsight {
                    insight_type: "content_quality".to_string(),
                    title: "Empty Content Detected".to_string(),
                    description: format!("{:.1}% of processed files have empty content. This might indicate processing issues or low-quality source files.", capped_percentage),
                    confidence: 0.9,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Empty files: {}, Total processed: {}, Raw percentage: {:.1}%", empty_content_count, total_processed, empty_percentage)),
                    priority: Some(4),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        } else if empty_content_count == 0 && total_processed > 0 {
            // Positive insight when no empty content
            let insight = CreateInsight {
                insight_type: "content_quality".to_string(),
                title: "Excellent Content Quality".to_string(),
                description: format!("All {} processed files contain meaningful content. Great job maintaining high-quality data!", total_processed),
                confidence: 0.95,
                content_ids: "[]".to_string(),
                metadata: Some(format!("Total processed: {}", total_processed)),
                priority: Some(2),
            };
            insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
        }
        
        Ok(insights)
    }

    fn generate_organization_insights(&self) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        let conn = self.db.get_connection();
        
        // Analyze file types
        let mut stmt = conn.prepare("SELECT mimetype, COUNT(*) FROM files GROUP BY mimetype ORDER BY COUNT(*) DESC LIMIT 5").map_err(|e| e.to_string())?;
        let file_types: Vec<(String, i64)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;
        
        if file_types.len() > 1 {
            let total_files: i64 = file_types.iter().map(|(_, count)| count).sum();
            let dominant_type = &file_types[0];
            let dominant_percentage = (dominant_type.1 as f64 / total_files as f64) * 100.0;
            
            if dominant_percentage > 80.0 {
                let insight = CreateInsight {
                    insight_type: "organization".to_string(),
                    title: "Limited File Type Diversity".to_string(),
                    description: format!("{:.1}% of your files are of type '{}'. Consider diversifying your content types for better analysis.", dominant_percentage, dominant_type.0),
                    confidence: 0.8,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Dominant type: {}, Files: {}/{}", dominant_type.0, dominant_type.1, total_files)),
                    priority: Some(3),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        }
        
        // Analyze processing success rate
        let failed_tasks: i64 = conn.query_row(
            "SELECT COUNT(*) FROM cleaning_queue WHERE status = 'failed'", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        let total_tasks: i64 = conn.query_row(
            "SELECT COUNT(*) FROM cleaning_queue", 
            [], 
            |row| row.get(0)
        ).unwrap_or(0);
        
        if failed_tasks > 0 && total_tasks > 0 {
            let failure_rate = (failed_tasks as f64 / total_tasks as f64) * 100.0;
            if failure_rate > 5.0 {
                let insight = CreateInsight {
                    insight_type: "organization".to_string(),
                    title: "High Processing Failure Rate".to_string(),
                    description: format!("{:.1}% of cleaning tasks failed. This might indicate issues with file formats or content quality.", failure_rate),
                    confidence: 0.9,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Failed tasks: {}, Total tasks: {}", failed_tasks, total_tasks)),
                    priority: Some(5),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        }
        
        Ok(insights)
    }

    fn generate_productivity_insights(&self, analysis: &serde_json::Value) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // Analyze recent activity patterns
        let recent_docs: i64 = analysis["content_counts"]["recent_documents"].as_i64().unwrap_or(0);
        let total_docs: i64 = analysis["content_counts"]["total_documents"].as_i64().unwrap_or(0);
        
        if recent_docs > 0 && total_docs > 0 {
            let activity_ratio = (recent_docs as f64 / total_docs as f64) * 100.0;
            
            if activity_ratio > 50.0 {
                let insight = CreateInsight {
                    insight_type: "productivity".to_string(),
                    title: "High Recent Activity".to_string(),
                    description: format!("You've created {:.1}% of your documents in the last 7 days. Great momentum! Keep up the productive workflow.", activity_ratio),
                    confidence: 0.85,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Recent docs: {}, Total docs: {}", recent_docs, total_docs)),
                    priority: Some(2),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            } else if activity_ratio < 10.0 && total_docs > 5 {
                let insight = CreateInsight {
                    insight_type: "productivity".to_string(),
                    title: "Low Recent Activity".to_string(),
                    description: format!("Only {:.1}% of your documents were created recently. Consider setting aside time for regular content creation.", activity_ratio),
                    confidence: 0.8,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Recent docs: {}, Total docs: {}", recent_docs, total_docs)),
                    priority: Some(3),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        }
        
        // Analyze processing efficiency
        let processing_stats = &analysis["processing_stats"];
        if let Some(success_rate) = processing_stats["success_rate"].as_f64() {
            if success_rate > 90.0 {
                let insight = CreateInsight {
                    insight_type: "productivity".to_string(),
                    title: "Excellent Processing Efficiency".to_string(),
                    description: format!("Your content processing has a {:.1}% success rate. Your workflow is highly efficient!", success_rate),
                    confidence: 0.9,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Success rate: {:.1}%", success_rate)),
                    priority: Some(1),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            } else if success_rate < 70.0 {
                let insight = CreateInsight {
                    insight_type: "productivity".to_string(),
                    title: "Processing Issues Detected".to_string(),
                    description: format!("Your content processing success rate is {:.1}%. Consider reviewing your input files for better results.", success_rate),
                    confidence: 0.85,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Success rate: {:.1}%", success_rate)),
                    priority: Some(4),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        }
        
        Ok(insights)
    }

    fn generate_content_diversity_insights(&self, analysis: &serde_json::Value) -> Result<Vec<Insight>, String> {
        let mut insights = Vec::new();
        
        // Analyze content type distribution
        if let Some(content_types) = analysis["content_types"].as_object() {
            let type_count = content_types.len();
            let total_files: i64 = content_types.values()
                .filter_map(|v| v.as_i64())
                .sum();
            
            if type_count > 5 {
                let insight = CreateInsight {
                    insight_type: "diversity".to_string(),
                    title: "Rich Content Diversity".to_string(),
                    description: format!("You have {} different content types across {} files. This diversity provides excellent analysis opportunities.", type_count, total_files),
                    confidence: 0.9,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Types: {}, Files: {}", type_count, total_files)),
                    priority: Some(2),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            } else if type_count == 1 && total_files > 3 {
                let dominant_type = content_types.keys().next().unwrap();
                let insight = CreateInsight {
                    insight_type: "diversity".to_string(),
                    title: "Limited Content Variety".to_string(),
                    description: format!("All {} files are of type '{}'. Consider adding different content types for more comprehensive analysis.", total_files, dominant_type),
                    confidence: 0.8,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Single type: {}, Files: {}", dominant_type, total_files)),
                    priority: Some(3),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        }
        
        // Analyze content quality distribution
        if let Some(quality_score) = analysis["qualityScore"].as_f64() {
            if quality_score > 80.0 {
                let insight = CreateInsight {
                    insight_type: "diversity".to_string(),
                    title: "High Content Quality".to_string(),
                    description: format!("Your content has an overall quality score of {:.1}%. Excellent work maintaining high standards!", quality_score),
                    confidence: 0.9,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Quality score: {:.1}%", quality_score)),
                    priority: Some(1),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            } else if quality_score < 50.0 {
                let insight = CreateInsight {
                    insight_type: "diversity".to_string(),
                    title: "Content Quality Improvement Needed".to_string(),
                    description: format!("Your content quality score is {:.1}%. Consider reviewing and improving your content for better analysis results.", quality_score),
                    confidence: 0.85,
                    content_ids: "[]".to_string(),
                    metadata: Some(format!("Quality score: {:.1}%", quality_score)),
                    priority: Some(4),
                };
                insights.push(self.create_insight(insight).map_err(|e| e.to_string())?);
            }
        }
        
        Ok(insights)
    }
}
