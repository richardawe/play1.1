// Setup Commands - First-run setup for Ollama
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SetupStatus {
    pub ollama_installed: bool,
    pub models_installed: Vec<String>,
    pub ollama_running: bool,
}

#[tauri::command]
pub async fn check_setup_status() -> Result<SetupStatus, String> {
    let ollama_installed = check_ollama_installed();
    let ollama_running = check_ollama_running().await;
    let models_installed = list_installed_models().await;

    Ok(SetupStatus {
        ollama_installed,
        models_installed,
        ollama_running,
    })
}

#[tauri::command]
pub async fn install_ollama() -> Result<(), String> {
    // For macOS/Linux: Download and install Ollama
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("curl")
            .args(&["-fsSL", "https://ollama.com/install.sh"])
            .output()
            .map_err(|e| format!("Failed to download installer: {}", e))?;

        let script = String::from_utf8_lossy(&output.stdout);
        
        // Execute installer script
        Command::new("sh")
            .arg("-c")
            .arg(&script.to_string())
            .status()
            .map_err(|e| format!("Failed to install: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Download .exe installer
        let output = Command::new("curl")
            .args(&["-L", "https://ollama.com/download/OllamaSetup.exe", "-o", "OllamaSetup.exe"])
            .status()
            .map_err(|e| format!("Failed to download: {}", e))?;

        // Run installer
        Command::new("OllamaSetup.exe")
            .arg("/S") // Silent install
            .status()
            .map_err(|e| format!("Failed to install: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("curl")
            .args(&["-fsSL", "https://ollama.com/install.sh"])
            .output()
            .map_err(|e| format!("Failed to download installer: {}", e))?;

        let script = String::from_utf8_lossy(&output.stdout);
        
        Command::new("sh")
            .arg("-c")
            .arg(&script.to_string())
            .status()
            .map_err(|e| format!("Failed to install: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn start_ollama() -> Result<(), String> {
    // Start Ollama service in background
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("ollama")
            .arg("serve")
            .spawn()
            .map_err(|e| format!("Failed to start Ollama: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("ollama")
            .arg("serve")
            .spawn()
            .map_err(|e| format!("Failed to start Ollama: {}", e))?;
    }

    // Wait for it to be ready
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    Ok(())
}

#[tauri::command]
pub async fn download_model(model: String) -> Result<(), String> {
    let output = Command::new("ollama")
        .args(&["pull", &model])
        .output()
        .map_err(|e| format!("Failed to download model: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Model download failed: {}", stderr));
    }

    Ok(())
}

// Helper functions
fn check_ollama_installed() -> bool {
    Command::new("ollama")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

async fn check_ollama_running() -> bool {
    let client = reqwest::Client::new();
    
    // Try default port 11434 first
    if let Ok(response) = client.get("http://localhost:11434/api/tags").send().await {
        if response.status().is_success() {
            return true;
        }
    }
    
    // Try port 8080 as fallback
    if let Ok(response) = client.get("http://localhost:8080/api/tags").send().await {
        if response.status().is_success() {
            return true;
        }
    }
    
    false
}

async fn list_installed_models() -> Vec<String> {
    let output = Command::new("ollama")
        .arg("list")
        .output();

    if let Ok(output) = output {
        if !output.status.success() {
            return Vec::new();
        }
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        let models: Vec<String> = stdout
            .lines()
            .skip(1) // Skip header
            .filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() > 0 {
                    // Extract model name (before the colon)
                    let model_name = parts[0].split(':').next().unwrap_or(parts[0]);
                    Some(model_name.to_string())
                } else {
                    None
                }
            })
            .collect();
        
        println!("Detected models: {:?}", models);
        models
    } else {
        Vec::new()
    }
}

