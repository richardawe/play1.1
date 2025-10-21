// Ollama Service - per ARCHITECTURE.md §6️⃣ AI Integration
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug, Serialize)]
pub struct OllamaRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
}

#[derive(Debug, Deserialize)]
pub struct OllamaResponse {
    pub model: String,
    pub created_at: String,
    pub response: String,
    pub done: bool,
}

#[derive(Debug, Serialize)]
pub struct EmbeddingRequest {
    pub model: String,
    pub prompt: String,
}

#[derive(Debug, Deserialize)]
pub struct EmbeddingResponse {
    pub embedding: Vec<f32>,
}

#[derive(Clone)]
pub struct OllamaService {
    base_url: String,
    client: reqwest::Client,
}

impl OllamaService {
    pub fn new(base_url: Option<String>) -> Self {
        Self {
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434".to_string()),
            client: reqwest::Client::new(),
        }
    }

    pub async fn check_connection(&self) -> Result<bool, Box<dyn Error>> {
        let response = self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await?;
        
        Ok(response.status().is_success())
    }

    pub async fn list_models(&self) -> Result<Vec<String>, Box<dyn Error>> {
        let response = self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await?;
        
        if response.status().is_success() {
            let models_response: serde_json::Value = response.json().await?;
            let models = models_response["models"]
                .as_array()
                .unwrap_or(&vec![])
                .iter()
                .map(|model| model["name"].as_str().unwrap_or("").to_string())
                .collect();
            Ok(models)
        } else {
            Err("Failed to fetch models".into())
        }
    }

    pub async fn generate(&self, model: &str, prompt: &str) -> Result<String, Box<dyn Error>> {
        let request = OllamaRequest {
            model: model.to_string(),
            prompt: prompt.to_string(),
            stream: false,
        };

        let response = self.client
            .post(format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Ollama request failed: {}", response.status()).into());
        }

        let result: OllamaResponse = response.json().await?;
        Ok(result.response)
    }

    pub async fn generate_embedding(&self, model: &str, text: &str) -> Result<Vec<f32>, Box<dyn Error>> {
        let request = EmbeddingRequest {
            model: model.to_string(),
            prompt: text.to_string(),
        };

        println!("Ollama: Sending embedding request for model: {}, text length: {}", model, text.len());
        println!("Ollama: Text preview (first 100 chars): {}", &text.chars().take(100).collect::<String>());

        let response = self.client
            .post(format!("{}/api/embeddings", self.base_url))
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        println!("Ollama: Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            println!("Ollama: Error response body: {}", error_text);
            return Err(format!("Embedding request failed: {}", status).into());
        }

        let result: EmbeddingResponse = response.json().await?;
        println!("Ollama: Successfully generated embedding with {} dimensions", result.embedding.len());
        Ok(result.embedding)
    }

    pub async fn summarize(&self, text: &str) -> Result<String, Box<dyn Error>> {
        let prompt = format!(
            "Summarize the following text concisely:\n\n{}\n\nSummary:",
            text
        );
        self.generate("llama3.2", &prompt).await
    }

    pub async fn rewrite(&self, text: &str, style: &str) -> Result<String, Box<dyn Error>> {
        let prompt = format!(
            "Rewrite the following text in a {} style:\n\n{}\n\nRewritten text:",
            style, text
        );
        self.generate("llama3.2", &prompt).await
    }

    pub async fn generate_tasks(&self, text: &str) -> Result<Vec<String>, Box<dyn Error>> {
        let prompt = format!(
            "Extract actionable tasks from this text. Return only the tasks, one per line:\n\n{}\n\nTasks:",
            text
        );
        let response = self.generate("llama3.2", &prompt).await?;
        
        let tasks: Vec<String> = response
            .lines()
            .filter(|line| !line.trim().is_empty())
            .map(|line| line.trim().to_string())
            .collect();
        
        Ok(tasks)
    }

    pub async fn chat(&self, message: &str) -> Result<String, Box<dyn Error>> {
        self.generate("llama3.2", message).await
    }
}

