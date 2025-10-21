// ICS (iCalendar) Service - per prd.md calendar features
use crate::models::event::CalendarEvent;
use std::error::Error;

pub struct ICSService;

impl ICSService {
    pub fn new() -> Self {
        Self
    }

    pub fn export_to_ics(&self, events: &[CalendarEvent]) -> Result<String, Box<dyn Error>> {
        let mut ics = String::from("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Play//Play MVP//EN\r\n");
        
        for event in events {
            ics.push_str("BEGIN:VEVENT\r\n");
            ics.push_str(&format!("UID:{}\r\n", event.id));
            ics.push_str(&format!("SUMMARY:{}\r\n", escape_ics_text(&event.title)));
            
            if let Some(desc) = &event.description {
                ics.push_str(&format!("DESCRIPTION:{}\r\n", escape_ics_text(desc)));
            }
            
            // Convert ISO datetime to iCal format (YYYYMMDDTHHMMSSZ)
            let start = parse_ics_datetime(&event.start_time)?;
            let end = parse_ics_datetime(&event.end_time)?;
            
            ics.push_str(&format!("DTSTART:{}\r\n", start));
            ics.push_str(&format!("DTEND:{}\r\n", end));
            ics.push_str("END:VEVENT\r\n");
        }
        
        ics.push_str("END:VCALENDAR\r\n");
        Ok(ics)
    }

    pub fn import_from_ics(&self, ics_content: &str) -> Result<Vec<CalendarEvent>, Box<dyn Error>> {
        // Simple ICS parser for MVP
        let mut events = Vec::new();
        let lines: Vec<&str> = ics_content.lines().collect();
        
        let mut current_event: Option<CalendarEvent> = None;
        let mut in_event = false;
        
        for line in lines {
            let line = line.trim();
            
            if line == "BEGIN:VEVENT" {
                in_event = true;
                current_event = Some(CalendarEvent {
                    id: 0, // Will be assigned by database
                    title: String::new(),
                    description: None,
                    start_time: String::new(),
                    end_time: String::new(),
                    reminder_time: None,
                    recurrence: None,
                    created_at: chrono::Utc::now().to_rfc3339(),
                });
            } else if line == "END:VEVENT" {
                if let Some(event) = current_event.take() {
                    events.push(event);
                }
                in_event = false;
            } else if in_event {
                if let Some(event) = current_event.as_mut() {
                    if let Some(summary) = line.strip_prefix("SUMMARY:") {
                        event.title = summary.to_string();
                    } else if let Some(desc) = line.strip_prefix("DESCRIPTION:") {
                        event.description = Some(desc.to_string());
                    } else if let Some(start) = line.strip_prefix("DTSTART:") {
                        event.start_time = parse_ics_to_iso(start)?;
                    } else if let Some(end) = line.strip_prefix("DTEND:") {
                        event.end_time = parse_ics_to_iso(end)?;
                    }
                }
            }
        }
        
        Ok(events)
    }
}

fn escape_ics_text(text: &str) -> String {
    text.replace(',', "\\,")
        .replace(';', "\\;")
        .replace('\n', "\\n")
}

fn parse_ics_datetime(iso_datetime: &str) -> Result<String, Box<dyn Error>> {
    let dt = chrono::DateTime::parse_from_rfc3339(iso_datetime)?;
    Ok(dt.format("%Y%m%dT%H%M%SZ").to_string())
}

fn parse_ics_to_iso(ics_datetime: &str) -> Result<String, Box<dyn Error>> {
    // Parse YYYYMMDDTHHMMSSZ format to ISO8601
    let clean = ics_datetime.trim_end_matches('Z');
    
    if clean.len() >= 15 {
        let year = &clean[0..4];
        let month = &clean[4..6];
        let day = &clean[6..8];
        let hour = &clean[9..11];
        let minute = &clean[11..13];
        let second = &clean[13..15];
        
        Ok(format!("{}-{}-{}T{}:{}:{}Z", year, month, day, hour, minute, second))
    } else {
        Err("Invalid iCal datetime format".into())
    }
}

