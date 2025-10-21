use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MentorResponse {
    pub explanation: String,
    pub suggestion: Option<String>,
    pub learning_resources: Vec<String>,
    pub difficulty_level: DifficultyLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DifficultyLevel {
    Beginner,
    Intermediate,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptSuggestion {
    pub original: String,
    pub improved: String,
    pub explanation: String,
    pub improvements: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningMetrics {
    pub feature_usage: HashMap<String, u32>,
    pub ai_interactions: u32,
    pub avg_prompt_quality: f64,
    pub topics_explored: Vec<String>,
    pub skill_level: DifficultyLevel,
}

pub struct AIMentorService {
    learning_metrics: LearningMetrics,
}

impl AIMentorService {
    pub fn new() -> Self {
        Self {
            learning_metrics: LearningMetrics {
                feature_usage: HashMap::new(),
                ai_interactions: 0,
                avg_prompt_quality: 0.0,
                topics_explored: Vec::new(),
                skill_level: DifficultyLevel::Beginner,
            },
        }
    }

    /// Explain AI decision or output
    pub fn explain_decision(&self, context: &str, output: &str) -> MentorResponse {
        // Simplified explanation logic
        // In production, this would use AI to generate explanations
        
        MentorResponse {
            explanation: format!(
                "Based on the context '{}', the AI generated '{}' by analyzing patterns and relationships in the data.",
                context, output
            ),
            suggestion: Some("Try providing more specific context for better results.".to_string()),
            learning_resources: vec![
                "Understanding AI Prompts".to_string(),
                "Context in AI Systems".to_string(),
            ],
            difficulty_level: DifficultyLevel::Beginner,
        }
    }

    /// Suggest improvements to a prompt
    pub fn suggest_prompt_improvement(&self, original_prompt: &str) -> PromptSuggestion {
        // Simplified suggestion logic
        // In production, use AI to analyze and improve prompts
        
        let improvements = vec![
            "Add more specific details".to_string(),
            "Clarify the desired output format".to_string(),
            "Include relevant context".to_string(),
        ];

        let improved = format!("{} (Please be specific and provide context)", original_prompt);

        PromptSuggestion {
            original: original_prompt.to_string(),
            improved,
            explanation: "A good prompt includes context, specificity, and clear expectations.".to_string(),
            improvements,
        }
    }

    /// Get learning metrics
    pub fn get_metrics(&self) -> &LearningMetrics {
        &self.learning_metrics
    }

    /// Track feature usage
    pub fn track_feature_usage(&mut self, feature: String) {
        *self.learning_metrics.feature_usage.entry(feature).or_insert(0) += 1;
        self.learning_metrics.ai_interactions += 1;
    }

    /// Generate learning path based on current skill level
    pub fn generate_learning_path(&self) -> Vec<String> {
        match self.learning_metrics.skill_level {
            DifficultyLevel::Beginner => vec![
                "Introduction to AI".to_string(),
                "Basic Prompt Writing".to_string(),
                "Understanding AI Responses".to_string(),
            ],
            DifficultyLevel::Intermediate => vec![
                "Advanced Prompt Techniques".to_string(),
                "Context Engineering".to_string(),
                "AI Model Selection".to_string(),
            ],
            DifficultyLevel::Advanced => vec![
                "Fine-tuning Strategies".to_string(),
                "Custom Model Training".to_string(),
                "AI Ethics and Bias".to_string(),
            ],
        }
    }

    /// Provide interactive quiz questions
    pub fn generate_quiz(&self, topic: &str) -> Vec<String> {
        vec![
            format!("What are the key principles of {}?", topic),
            format!("How can {} improve your workflow?", topic),
            format!("What are common pitfalls when using {}?", topic),
        ]
    }
}

impl Default for AIMentorService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_explain_decision() {
        let mentor = AIMentorService::new();
        let response = mentor.explain_decision("user query", "AI response");
        
        assert!(!response.explanation.is_empty());
        assert_eq!(response.difficulty_level, DifficultyLevel::Beginner);
    }

    #[test]
    fn test_prompt_suggestion() {
        let mentor = AIMentorService::new();
        let suggestion = mentor.suggest_prompt_improvement("write code");
        
        assert_eq!(suggestion.original, "write code");
        assert!(!suggestion.improved.is_empty());
        assert!(!suggestion.improvements.is_empty());
    }

    #[test]
    fn test_learning_path() {
        let mentor = AIMentorService::new();
        let path = mentor.generate_learning_path();
        
        assert!(!path.is_empty());
    }
}

