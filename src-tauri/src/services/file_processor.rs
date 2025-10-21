use std::path::Path;
use std::fs;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum FileProcessingError {
    #[error("File not found: {0}")]
    FileNotFound(String),
    #[error("Unsupported file type: {0}")]
    UnsupportedFileType(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("PDF processing error: {0}")]
    PdfError(String),
    #[error("DOCX processing error: {0}")]
    DocxError(String),
    #[error("Excel processing error: {0}")]
    ExcelError(String),
    #[error("HTML processing error: {0}")]
    HtmlError(String),
    #[error("JSON parsing error: {0}")]
    JsonError(#[from] serde_json::Error),
    #[error("ZIP processing error: {0}")]
    ZipError(#[from] zip::result::ZipError),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessedContent {
    pub text: String,
    pub metadata: ContentMetadata,
    pub tables: Vec<TableData>,
    pub images: Vec<ImageData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub created_date: Option<String>,
    pub modified_date: Option<String>,
    pub page_count: Option<u32>,
    pub word_count: Option<u32>,
    pub language: Option<String>,
    pub subject: Option<String>,
    pub keywords: Vec<String>,
    pub file_size: u64,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub id: String,
    pub title: Option<String>,
    pub rows: Vec<Vec<String>>,
    pub headers: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageData {
    pub id: String,
    pub alt_text: Option<String>,
    pub caption: Option<String>,
    pub file_path: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

pub struct FileProcessor;

impl FileProcessor {
    /// Process a file and extract clean text content with metadata
    pub async fn process_file(file_path: &Path) -> Result<ProcessedContent, FileProcessingError> {
        if !file_path.exists() {
            return Err(FileProcessingError::FileNotFound(file_path.to_string_lossy().to_string()));
        }

        let file_metadata = fs::metadata(file_path)?;
        let mime_type = mime_guess::from_path(file_path).first_or_text_plain().to_string();
        
        let mut content = ProcessedContent {
            text: String::new(),
            metadata: ContentMetadata {
                file_size: file_metadata.len(),
                mime_type: mime_type.clone(),
                title: None,
                author: None,
                created_date: None,
                modified_date: None,
                page_count: None,
                word_count: None,
                language: None,
                subject: None,
                keywords: Vec::new(),
            },
            tables: Vec::new(),
            images: Vec::new(),
        };

        // Process based on file type
        match mime_type.as_str() {
            mime if mime.starts_with("text/") => {
                Self::process_text_file(file_path, &mut content).await?;
            }
            "application/pdf" => {
                Self::process_pdf_file(file_path, &mut content).await?;
            }
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => {
                Self::process_docx_file(file_path, &mut content).await?;
            }
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => {
                Self::process_xlsx_file(file_path, &mut content).await?;
            }
            "application/vnd.ms-excel" => {
                Self::process_xls_file(file_path, &mut content).await?;
            }
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" => {
                Self::process_pptx_file(file_path, &mut content).await?;
            }
            "text/html" | "application/xhtml+xml" => {
                Self::process_html_file(file_path, &mut content).await?;
            }
            "application/json" => {
                Self::process_json_file(file_path, &mut content).await?;
            }
            _ => {
                // Try to read as plain text
                Self::process_text_file(file_path, &mut content).await?;
            }
        }

        // Calculate word count
        content.metadata.word_count = Some(content.text.split_whitespace().count() as u32);

        Ok(content)
    }

    /// Process plain text files
    async fn process_text_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        let text = fs::read_to_string(file_path)?;
        content.text = Self::clean_text(&text);
        
        // Extract basic metadata from text content
        Self::extract_text_metadata(&content.text, &mut content.metadata);
        
        Ok(())
    }

    /// Process PDF files
    async fn process_pdf_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        use pdf_extract::extract_text;
        
        println!("Attempting to extract text from PDF: {:?}", file_path);
        
        // Try to extract text with better error handling and timeout
        let text = match tokio::time::timeout(std::time::Duration::from_secs(30), async {
            std::panic::catch_unwind(|| {
                extract_text(file_path)
            })
        }).await {
            Ok(Ok(Ok(text))) => {
                println!("PDF text extracted: {} characters", text.len());
                text
            },
            Ok(Ok(Err(e))) => {
                println!("PDF extraction error: {}", e);
                println!("Using fallback for PDF with extraction issues");
                "PDF file processed - extraction failed due to font/format issues. This document may require OCR or manual processing.".to_string()
            },
            Ok(Err(_)) => {
                println!("PDF extraction panicked (likely font parsing issue), using fallback");
                "PDF file processed - extraction failed due to font parsing issues. This document may require OCR or manual processing.".to_string()
            },
            Err(_) => {
                println!("PDF extraction timed out, using fallback");
                "PDF file processed - extraction timed out. This document may be too complex or corrupted.".to_string()
            }
        };
        
        if text.trim().is_empty() || text.contains("extraction failed") {
            println!("PDF appears to be scanned or has no extractable text, using fallback");
            content.text = "PDF file processed - no extractable text found. This may be a scanned document that requires OCR.".to_string();
        } else {
            content.text = Self::clean_text(&text);
        }
        
        println!("PDF text after processing: {} characters", content.text.len());
        
        // Extract PDF metadata
        Self::extract_pdf_metadata(file_path, &mut content.metadata);
        
        Ok(())
    }

    /// Process DOCX files
    async fn process_docx_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        
        let file = fs::File::open(file_path)?;
        let mut archive = zip::ZipArchive::new(file)?;
        
        // Read document.xml
        let mut doc_xml = String::new();
        let mut doc_file = archive.by_name("word/document.xml")
            .map_err(|e| FileProcessingError::DocxError(e.to_string()))?;
        std::io::Read::read_to_string(&mut doc_file, &mut doc_xml)?;
        
        // Parse DOCX content (simplified - in production you'd use a proper DOCX parser)
        content.text = Self::extract_text_from_docx_xml(&doc_xml);
        content.text = Self::clean_text(&content.text);
        
        // Extract DOCX metadata
        Self::extract_docx_metadata(file_path, &mut content.metadata);
        
        Ok(())
    }

    /// Process XLSX files
    async fn process_xlsx_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        // For now, treat Excel files as plain text
        // In production, you'd use a proper Excel library
        content.text = "Excel file processing not yet implemented".to_string();
        Self::extract_excel_metadata(file_path, &mut content.metadata);
        Ok(())
    }

    /// Process XLS files
    async fn process_xls_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        // For now, treat Excel files as plain text
        // In production, you'd use a proper Excel library
        content.text = "Excel file processing not yet implemented".to_string();
        Self::extract_excel_metadata(file_path, &mut content.metadata);
        Ok(())
    }

    /// Process PPTX files
    async fn process_pptx_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        // For now, we'll treat PPTX as a ZIP and extract text from XML files
        // In production, you'd use a proper PPTX parser
        let file = fs::File::open(file_path)?;
        let mut archive = zip::ZipArchive::new(file)?;
        
        let mut all_text = String::new();
        
        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let file_name = file.name().to_string();
            
            if file_name.ends_with(".xml") && file_name.contains("slide") {
                let mut xml_content = String::new();
                std::io::Read::read_to_string(&mut file, &mut xml_content)?;
                
                // Extract text from slide XML (simplified)
                let slide_text = Self::extract_text_from_xml(&xml_content);
                all_text.push_str(&slide_text);
                all_text.push('\n');
            }
        }
        
        content.text = Self::clean_text(&all_text);
        Self::extract_pptx_metadata(file_path, &mut content.metadata);
        
        Ok(())
    }

    /// Process HTML files
    async fn process_html_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        let html_content = fs::read_to_string(file_path)?;
        
        // Simple HTML to text conversion - remove common tags
        let text = html_content
            .replace("<br>", "\n")
            .replace("<br/>", "\n")
            .replace("<br />", "\n")
            .replace("<p>", "\n")
            .replace("</p>", "\n")
            .replace("<div>", "\n")
            .replace("</div>", "\n")
            .replace("<h1>", "\n")
            .replace("</h1>", "\n")
            .replace("<h2>", "\n")
            .replace("</h2>", "\n")
            .replace("<h3>", "\n")
            .replace("</h3>", "\n")
            .replace("<li>", "\n• ")
            .replace("</li>", "\n")
            .replace("<ul>", "\n")
            .replace("</ul>", "\n")
            .replace("<ol>", "\n")
            .replace("</ol>", "\n");
        
        // Simple tag removal - remove anything between < and >
        let mut result = String::new();
        let mut in_tag = false;
        for ch in text.chars() {
            if ch == '<' {
                in_tag = true;
            } else if ch == '>' {
                in_tag = false;
            } else if !in_tag {
                result.push(ch);
            }
        }
        
        content.text = Self::clean_text(&result);
        
        // Extract HTML metadata
        Self::extract_html_metadata(&html_content, &mut content.metadata);
        
        Ok(())
    }

    /// Process JSON files
    async fn process_json_file(file_path: &Path, content: &mut ProcessedContent) -> Result<(), FileProcessingError> {
        let json_content = fs::read_to_string(file_path)?;
        
        // Parse JSON and convert to readable text
        let json_value: serde_json::Value = serde_json::from_str(&json_content)?;
        content.text = Self::json_to_text(&json_value);
        
        // Extract JSON metadata
        Self::extract_json_metadata(&json_value, &mut content.metadata);
        
        Ok(())
    }

    /// Clean and normalize text content
    fn clean_text(text: &str) -> String {
        // Simple text cleaning without regex
        let cleaned = text
            .replace("\r\n", "\n")
            .replace("\r", "\n")
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<&str>>()
            .join("\n");
        
        cleaned.trim().to_string()
    }

    /// Extract text from DOCX XML (simplified)
    fn extract_text_from_docx_xml(xml: &str) -> String {
        // This is a simplified extraction - in production you'd use a proper XML parser
        let mut text = String::new();
        
        // Extract text between <w:t> tags
        let re = regex::Regex::new(r"<w:t[^>]*>([^<]*)</w:t>").unwrap();
        for cap in re.captures_iter(xml) {
            if let Some(match_text) = cap.get(1) {
                text.push_str(match_text.as_str());
                text.push(' ');
            }
        }
        
        text
    }

    /// Extract text from XML (simplified)
    fn extract_text_from_xml(xml: &str) -> String {
        // This is a simplified extraction - in production you'd use a proper XML parser
        let mut text = String::new();
        
        // Extract text between tags
        let re = regex::Regex::new(r">([^<]+)<").unwrap();
        for cap in re.captures_iter(xml) {
            if let Some(match_text) = cap.get(1) {
                let text_part = match_text.as_str().trim();
                if !text_part.is_empty() {
                    text.push_str(text_part);
                    text.push(' ');
                }
            }
        }
        
        text
    }

    /// Convert JSON to readable text
    fn json_to_text(json: &serde_json::Value) -> String {
        match json {
            serde_json::Value::Object(map) => {
                let mut text = String::new();
                for (key, value) in map {
                    text.push_str(&format!("{}: {}\n", key, Self::json_value_to_string(value)));
                }
                text
            }
            _ => json.to_string(),
        }
    }

    /// Convert JSON value to string
    fn json_value_to_string(value: &serde_json::Value) -> String {
        match value {
            serde_json::Value::String(s) => s.clone(),
            serde_json::Value::Number(n) => n.to_string(),
            serde_json::Value::Bool(b) => b.to_string(),
            serde_json::Value::Array(arr) => {
                arr.iter()
                    .map(Self::json_value_to_string)
                    .collect::<Vec<String>>()
                    .join(", ")
            }
            serde_json::Value::Object(obj) => {
                let mut text = String::new();
                for (key, val) in obj {
                    text.push_str(&format!("{}: {}", key, Self::json_value_to_string(val)));
                }
                text
            }
            serde_json::Value::Null => "null".to_string(),
        }
    }

    /// Extract metadata from text content
    fn extract_text_metadata(text: &str, metadata: &mut ContentMetadata) {
        let lines: Vec<&str> = text.lines().take(10).collect();
        
        // Look for title in first line
        if let Some(first_line) = lines.first() {
            if first_line.len() > 10 && first_line.len() < 100 {
                metadata.title = Some(first_line.trim().to_string());
            }
        }
        
        // Look for author patterns
        for line in lines {
            if line.contains("@author") || line.contains("Author:") || line.contains("By:") {
                metadata.author = Some(line.trim().to_string());
                break;
            }
        }
        
        // Extract keywords from text
        let words: Vec<&str> = text.split_whitespace().collect();
        let mut word_freq: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
        
        for word in words {
            let clean_word = word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
            if clean_word.len() > 3 {
                *word_freq.entry(clean_word).or_insert(0) += 1;
            }
        }
        
        let mut keywords: Vec<String> = word_freq
            .into_iter()
            .filter(|(_, count)| *count > 2)
            .map(|(word, _)| word.to_string())
            .collect();
        keywords.sort();
        metadata.keywords = keywords.into_iter().take(10).collect();
    }

    /// Extract PDF metadata
    fn extract_pdf_metadata(_file_path: &Path, metadata: &mut ContentMetadata) {
        // In production, you'd use a PDF metadata library
        metadata.page_count = Some(1); // Placeholder
    }

    /// Extract DOCX metadata
    fn extract_docx_metadata(_file_path: &Path, metadata: &mut ContentMetadata) {
        // In production, you'd extract from app.xml and core.xml
        metadata.page_count = Some(1); // Placeholder
    }

    /// Extract Excel metadata
    fn extract_excel_metadata(_file_path: &Path, metadata: &mut ContentMetadata) {
        // In production, you'd extract from workbook properties
        metadata.page_count = Some(1); // Placeholder
    }

    /// Extract PPTX metadata
    fn extract_pptx_metadata(_file_path: &Path, metadata: &mut ContentMetadata) {
        // In production, you'd extract from app.xml and core.xml
        metadata.page_count = Some(1); // Placeholder
    }

    /// Extract HTML metadata
    fn extract_html_metadata(html: &str, metadata: &mut ContentMetadata) {
        // Extract title from <title> tag
        if let Some(title_start) = html.find("<title>") {
            if let Some(title_end) = html[title_start..].find("</title>") {
                let title = &html[title_start + 7..title_start + title_end];
                metadata.title = Some(title.trim().to_string());
            }
        }
        
        // Extract meta tags
        let meta_re = regex::Regex::new(r#"<meta\s+name="([^"]+)"\s+content="([^"]+)""#).unwrap();
        for cap in meta_re.captures_iter(html) {
            if let (Some(name), Some(content)) = (cap.get(1), cap.get(2)) {
                match name.as_str() {
                    "author" => metadata.author = Some(content.as_str().to_string()),
                    "description" => metadata.subject = Some(content.as_str().to_string()),
                    "keywords" => {
                        metadata.keywords = content.as_str()
                            .split(',')
                            .map(|s| s.trim().to_string())
                            .collect();
                    }
                    _ => {}
                }
            }
        }
    }

    /// Extract JSON metadata
    fn extract_json_metadata(json: &serde_json::Value, metadata: &mut ContentMetadata) {
        if let Some(obj) = json.as_object() {
            if let Some(title) = obj.get("title").and_then(|v| v.as_str()) {
                metadata.title = Some(title.to_string());
            }
            if let Some(author) = obj.get("author").and_then(|v| v.as_str()) {
                metadata.author = Some(author.to_string());
            }
            if let Some(subject) = obj.get("description").and_then(|v| v.as_str()) {
                metadata.subject = Some(subject.to_string());
            }
        }
    }
}
