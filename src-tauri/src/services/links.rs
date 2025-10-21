// Cross-module linking service - per prd.md §3️⃣.C "Document linking"
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub id: i64,
    pub source_type: String,
    pub source_id: i64,
    pub target_type: String,
    pub target_id: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLink {
    pub source_type: String,
    pub source_id: i64,
    pub target_type: String,
    pub target_id: i64,
}

pub struct LinksService<'a> {
    conn: &'a Connection,
}

impl<'a> LinksService<'a> {
    pub fn new(conn: &'a Connection) -> Self {
        Self { conn }
    }

    pub fn create_link(&self, link: CreateLink) -> Result<Link> {
        self.conn.execute(
            "INSERT OR IGNORE INTO links (source_type, source_id, target_type, target_id) 
             VALUES (?1, ?2, ?3, ?4)",
            params![link.source_type, link.source_id, link.target_type, link.target_id],
        )?;

        let id = self.conn.last_insert_rowid();
        self.get_link(id)
    }

    pub fn get_link(&self, id: i64) -> Result<Link> {
        self.conn.query_row(
            "SELECT id, source_type, source_id, target_type, target_id, created_at 
             FROM links WHERE id = ?1",
            params![id],
            |row| {
                Ok(Link {
                    id: row.get(0)?,
                    source_type: row.get(1)?,
                    source_id: row.get(2)?,
                    target_type: row.get(3)?,
                    target_id: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
    }

    pub fn get_links_for_item(&self, item_type: &str, item_id: i64) -> Result<Vec<Link>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, source_type, source_id, target_type, target_id, created_at 
             FROM links 
             WHERE (source_type = ?1 AND source_id = ?2) OR (target_type = ?1 AND target_id = ?2)
             ORDER BY created_at DESC",
        )?;

        let links = stmt.query_map(params![item_type, item_id], |row| {
            Ok(Link {
                id: row.get(0)?,
                source_type: row.get(1)?,
                source_id: row.get(2)?,
                target_type: row.get(3)?,
                target_id: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        links.collect()
    }

    pub fn delete_link(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM links WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn delete_links_for_item(&self, item_type: &str, item_id: i64) -> Result<()> {
        self.conn.execute(
            "DELETE FROM links 
             WHERE (source_type = ?1 AND source_id = ?2) OR (target_type = ?1 AND target_id = ?2)",
            params![item_type, item_id],
        )?;
        Ok(())
    }
}

