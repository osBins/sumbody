use serde::{Deserialize, Serialize};
use sqlx::Row;
use tauri::{AppHandle, Manager};
use sqlx::sqlite::SqlitePoolOptions;

/// Represents a single call log entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct CallLog {
    pub id: i64,
    pub memberno: String,
    pub call_date: String,
    pub call_time: String,
    pub call_type: String,
    pub summary: String,
    pub created_at: String,
}

fn get_db_path(app: &AppHandle) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;
    let db_path = app_data_dir.join("sumbody.db");
    Ok(db_path.to_string_lossy().to_string())
}

/// Helper to open a SQLite connection pool to the app's database.
async fn get_db_pool(app: &AppHandle) -> Result<sqlx::SqlitePool, String> {
    let db_path = get_db_path(app)?;

    if let Some(parent) = std::path::Path::new(&db_path).parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let url = format!("sqlite://{}?mode=rwc", db_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Ensure the call_logs table exists (idempotent)
    sqlx::query(crate::db::init::CREATE_CALL_LOGS_TABLE)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to ensure call_logs table exists: {}", e))?;

    Ok(pool)
}

/// Adds a new call log entry.
#[tauri::command]
pub async fn add_call_log(
    app: AppHandle,
    memberno: String,
    call_date: String,
    call_time: String,
    call_type: String,
    summary: String,
) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    sqlx::query(
        "INSERT INTO call_logs (memberno, call_date, call_time, call_type, summary) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&memberno)
    .bind(&call_date)
    .bind(&call_time)
    .bind(&call_type)
    .bind(&summary)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to add call log: {}", e))?;

    Ok(())
}

/// Fetches all call logs, ordered by call_date DESC, created_at DESC.
#[tauri::command]
pub async fn get_call_logs(app: AppHandle) -> Result<Vec<CallLog>, String> {
    let pool = get_db_pool(&app).await?;

    let rows = sqlx::query(
        "SELECT id, memberno, call_date, call_time, call_type, summary, created_at FROM call_logs ORDER BY call_date DESC, created_at DESC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch call logs: {}", e))?;

    let logs: Vec<CallLog> = rows
        .iter()
        .map(|row| CallLog {
            id: row.get("id"),
            memberno: row.get("memberno"),
            call_date: row.get("call_date"),
            call_time: row.get("call_time"),
            call_type: row.get("call_type"),
            summary: row.get("summary"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(logs)
}

/// Fetches call logs for a single member, ordered by call_date DESC, created_at DESC.
#[tauri::command]
pub async fn get_member_call_logs(app: AppHandle, memberno: String) -> Result<Vec<CallLog>, String> {
    let pool = get_db_pool(&app).await?;

    let rows = sqlx::query(
        "SELECT id, memberno, call_date, call_time, call_type, summary, created_at FROM call_logs WHERE memberno = ? ORDER BY call_date DESC, created_at DESC",
    )
    .bind(&memberno)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch member call logs: {}", e))?;

    let logs: Vec<CallLog> = rows
        .iter()
        .map(|row| CallLog {
            id: row.get("id"),
            memberno: row.get("memberno"),
            call_date: row.get("call_date"),
            call_time: row.get("call_time"),
            call_type: row.get("call_type"),
            summary: row.get("summary"),
            created_at: row.get("created_at"),
        })
        .collect();

    Ok(logs)
}

/// Deletes a call log entry by ID.
#[tauri::command]
pub async fn delete_call_log(app: AppHandle, id: i64) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    sqlx::query("DELETE FROM call_logs WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to delete call log: {}", e))?;

    Ok(())
}

/// Fetches the most recent call log for a member.
#[tauri::command]
pub async fn get_last_call(app: AppHandle, memberno: String) -> Result<Option<CallLog>, String> {
    let pool = get_db_pool(&app).await?;

    let row = sqlx::query(
        "SELECT id, memberno, call_date, call_time, call_type, summary, created_at FROM call_logs WHERE memberno = ? ORDER BY call_date DESC, created_at DESC LIMIT 1",
    )
    .bind(&memberno)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Failed to fetch last call: {}", e))?;

    Ok(row.map(|r| CallLog {
        id: r.get("id"),
        memberno: r.get("memberno"),
        call_date: r.get("call_date"),
        call_time: r.get("call_time"),
        call_type: r.get("call_type"),
        summary: r.get("summary"),
        created_at: r.get("created_at"),
    }))
}
