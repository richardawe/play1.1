// Embedded Ollama Service - Auto-start bundled Ollama
use std::process::{Child, Command};
use std::path::PathBuf;
use std::time::Duration;

pub struct EmbeddedOllama {
    process: Option<Child>,
    port: u16,
}

impl EmbeddedOllama {
    pub fn new(port: u16) -> Self {
        Self {
            process: None,
            port,
        }
    }

    pub fn start(&mut self, ollama_path: PathBuf, models_path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        println!("🚀 Starting embedded Ollama from: {:?}", ollama_path);
        println!("📂 Models path: {:?}", models_path);

        // Start Ollama with custom settings
        let process = Command::new(&ollama_path)
            .env("OLLAMA_MODELS", models_path.to_string_lossy().to_string())
            .env("OLLAMA_HOST", format!("127.0.0.1:{}", self.port))
            .spawn()?;

        self.process = Some(process);
        println!("✅ Ollama started on port {}", self.port);
        Ok(())
    }

    pub async fn wait_for_ready(&self, max_wait_secs: u64) -> bool {
        let client = reqwest::Client::new();
        let url = format!("http://localhost:{}/api/tags", self.port);
        
        for i in 0..max_wait_secs {
            if let Ok(response) = client.get(&url).send().await {
                if response.status().is_success() {
                    println!("✅ Ollama ready after {}s", i);
                    return true;
                }
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
        
        println!("⚠️  Ollama not ready after {}s", max_wait_secs);
        false
    }

    pub fn stop(&mut self) {
        if let Some(mut process) = self.process.take() {
            println!("🛑 Stopping embedded Ollama...");
            process.kill().ok();
        }
    }
}

impl Drop for EmbeddedOllama {
    fn drop(&mut self) {
        self.stop();
    }
}

