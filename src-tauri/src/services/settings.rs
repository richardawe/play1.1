use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub theme: String,
    pub language: String,
    pub notifications_enabled: bool,
    pub auto_save_interval: i64,
    pub default_module: String,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            language: "en".to_string(),
            notifications_enabled: true,
            auto_save_interval: 2000, // 2 seconds
            default_module: "chat".to_string(),
        }
    }
}

pub struct SettingsService<'a> {
    conn: &'a Connection,
}

impl<'a> SettingsService<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let result = self.conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        );

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP)",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_user_settings(&self) -> Result<UserSettings> {
        let theme = self.get_setting("theme")?.unwrap_or_else(|| "light".to_string());
        let language = self.get_setting("language")?.unwrap_or_else(|| "en".to_string());
        let notifications = self.get_setting("notifications_enabled")?
            .unwrap_or_else(|| "true".to_string());
        let auto_save = self.get_setting("auto_save_interval")?
            .unwrap_or_else(|| "2000".to_string());
        let default_module = self.get_setting("default_module")?
            .unwrap_or_else(|| "chat".to_string());

        Ok(UserSettings {
            theme,
            language,
            notifications_enabled: notifications == "true",
            auto_save_interval: auto_save.parse().unwrap_or(2000),
            default_module,
        })
    }

    pub fn update_user_settings(&self, settings: UserSettings) -> Result<()> {
        self.set_setting("theme", &settings.theme)?;
        self.set_setting("language", &settings.language)?;
        self.set_setting("notifications_enabled", &settings.notifications_enabled.to_string())?;
        self.set_setting("auto_save_interval", &settings.auto_save_interval.to_string())?;
        self.set_setting("default_module", &settings.default_module)?;
        Ok(())
    }

    pub fn initialize_defaults(&self) -> Result<()> {
        let defaults = UserSettings::default();
        
        // Only set if not already set
        if self.get_setting("theme")?.is_none() {
            self.update_user_settings(defaults)?;
        }
        
        Ok(())
    }
}

