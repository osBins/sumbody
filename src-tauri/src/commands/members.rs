use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Row;
use tauri::{AppHandle, Manager};

/// Result of an import operation with counts of imported, updated, and skipped records.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: u32,
    pub updated: u32,
    pub skipped: u32,
    pub errors: Vec<String>,
}

/// Represents a single member record with all 27 fields matching the database schema.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct MemberRecord {
    pub MEMBERNO: String,
    pub MEMBERSHIPDATE: String,
    pub MEMCAT: String,
    pub SAL: String,
    pub NAME: String,
    pub DOB: String,
    pub AQUALI: String,
    pub RADD1: String,
    pub RADD2: String,
    pub RADD3: String,
    pub RADD4: String,
    pub RCITY: String,
    pub RPIN: String,
    pub RSTATE: String,
    pub DESIGNATION: String,
    pub ORGANISATION_NAME: String,
    pub PADD1: String,
    pub PADD2: String,
    pub PADD3: String,
    pub PADD4: String,
    pub PCITY: String,
    pub PPIN: String,
    pub PSTATE: String,
    pub REGIONNAME: String,
    pub TELEPHONE: String,
    pub MOBILENO: String,
    pub EMAIL: String,
    pub TOTALDUES: f64,
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
/// Also ensures the members table exists (in case tauri-plugin-sql migrations haven't run yet).
async fn get_db_pool(app: &AppHandle) -> Result<sqlx::SqlitePool, String> {
    let db_path = get_db_path(app)?;

    // Ensure the parent directory exists
    if let Some(parent) = std::path::Path::new(&db_path).parent() {
        std::fs::create_dir_all(parent).ok();
    }

    let url = format!("sqlite://{}?mode=rwc", db_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&url)
        .await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;

    // Ensure the members table exists (idempotent)
    sqlx::query(crate::db::init::CREATE_MEMBERS_TABLE)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to ensure members table exists: {}", e))?;

    // Ensure the call_logs table exists (idempotent)
    sqlx::query(crate::db::init::CREATE_CALL_LOGS_TABLE)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to ensure call_logs table exists: {}", e))?;

    Ok(pool)
}

/// Creates a new member record in the database.
///
/// Validation:
/// - MEMBERNO must be non-empty (after trimming whitespace)
/// - MEMBERNO must not already exist in the database
///
/// Returns Ok(()) on success, or Err with a descriptive message on failure.
#[tauri::command]
pub async fn create_member(app: AppHandle, record: MemberRecord) -> Result<(), String> {
    // 1. Validate MEMBERNO is non-empty
    if record.MEMBERNO.trim().is_empty() {
        return Err("MEMBERNO is required and cannot be empty.".to_string());
    }

    let pool = get_db_pool(&app).await?;

    // 2. Check if MEMBERNO already exists
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM members WHERE MEMBERNO = ?)",
    )
    .bind(&record.MEMBERNO)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Failed to check for existing member: {}", e))?;

    if exists {
        return Err(format!(
            "A member with MEMBERNO '{}' already exists.",
            record.MEMBERNO
        ));
    }

    // 3. Insert the new record
    sqlx::query(
        r#"INSERT INTO members (
            MEMBERNO, MEMBERSHIPDATE, MEMCAT, SAL, NAME, DOB, AQUALI,
            RADD1, RADD2, RADD3, RADD4, RCITY, RPIN, RSTATE,
            DESIGNATION, ORGANISATION_NAME,
            PADD1, PADD2, PADD3, PADD4, PCITY, PPIN, PSTATE,
            REGIONNAME, TELEPHONE, MOBILENO, EMAIL, TOTALDUES
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&record.MEMBERNO)
    .bind(&record.MEMBERSHIPDATE)
    .bind(&record.MEMCAT)
    .bind(&record.SAL)
    .bind(&record.NAME)
    .bind(&record.DOB)
    .bind(&record.AQUALI)
    .bind(&record.RADD1)
    .bind(&record.RADD2)
    .bind(&record.RADD3)
    .bind(&record.RADD4)
    .bind(&record.RCITY)
    .bind(&record.RPIN)
    .bind(&record.RSTATE)
    .bind(&record.DESIGNATION)
    .bind(&record.ORGANISATION_NAME)
    .bind(&record.PADD1)
    .bind(&record.PADD2)
    .bind(&record.PADD3)
    .bind(&record.PADD4)
    .bind(&record.PCITY)
    .bind(&record.PPIN)
    .bind(&record.PSTATE)
    .bind(&record.REGIONNAME)
    .bind(&record.TELEPHONE)
    .bind(&record.MOBILENO)
    .bind(&record.EMAIL)
    .bind(record.TOTALDUES)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to insert member record: {}", e))?;

    Ok(())
}

/// Deletes a member record by MEMBERNO within a transaction.
///
/// The delete operation is wrapped in a transaction to ensure atomicity.
/// Returns Ok(()) on success, or Err with a descriptive message on failure.
///
/// Validates: Requirement 7.3
#[tauri::command]
pub async fn delete_member(app: AppHandle, memberno: String) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    sqlx::query("DELETE FROM members WHERE MEMBERNO = ?")
        .bind(&memberno)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to delete member '{}': {}", memberno, e))?;

    tx.commit()
        .await
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}

/// Updates a single member record in the database.
///
/// Accepts the original `memberno` (in case MEMBERNO is being changed) and the full
/// updated `MemberRecord`. If the MEMBERNO field in the record differs from the original,
/// a duplicate check is performed before applying the update.
///
/// The operation is wrapped in a transaction for atomicity:
/// - If MEMBERNO changed: DELETE old row + INSERT new one
/// - If MEMBERNO unchanged: UPDATE all fields in place
///
/// Validates: Requirements 5.3, 5.5
#[tauri::command]
pub async fn update_member(
    app: AppHandle,
    memberno: String,
    record: MemberRecord,
) -> Result<(), String> {
    let pool = get_db_pool(&app).await?;

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    // If MEMBERNO is being changed, check for duplicates
    if record.MEMBERNO != memberno {
        let existing: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM members WHERE MEMBERNO = ?)",
        )
        .bind(&record.MEMBERNO)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| format!("Failed to check for duplicate MEMBERNO: {}", e))?;

        if existing {
            return Err("MEMBERNO already exists".to_string());
        }

        // MEMBERNO changed: DELETE old row, INSERT new one
        sqlx::query("DELETE FROM members WHERE MEMBERNO = ?")
            .bind(&memberno)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to delete old record: {}", e))?;

        sqlx::query(
            r#"INSERT INTO members (
                MEMBERNO, MEMBERSHIPDATE, MEMCAT, SAL, NAME, DOB, AQUALI,
                RADD1, RADD2, RADD3, RADD4, RCITY, RPIN, RSTATE,
                DESIGNATION, ORGANISATION_NAME,
                PADD1, PADD2, PADD3, PADD4, PCITY, PPIN, PSTATE,
                REGIONNAME, TELEPHONE, MOBILENO, EMAIL, TOTALDUES
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&record.MEMBERNO)
        .bind(&record.MEMBERSHIPDATE)
        .bind(&record.MEMCAT)
        .bind(&record.SAL)
        .bind(&record.NAME)
        .bind(&record.DOB)
        .bind(&record.AQUALI)
        .bind(&record.RADD1)
        .bind(&record.RADD2)
        .bind(&record.RADD3)
        .bind(&record.RADD4)
        .bind(&record.RCITY)
        .bind(&record.RPIN)
        .bind(&record.RSTATE)
        .bind(&record.DESIGNATION)
        .bind(&record.ORGANISATION_NAME)
        .bind(&record.PADD1)
        .bind(&record.PADD2)
        .bind(&record.PADD3)
        .bind(&record.PADD4)
        .bind(&record.PCITY)
        .bind(&record.PPIN)
        .bind(&record.PSTATE)
        .bind(&record.REGIONNAME)
        .bind(&record.TELEPHONE)
        .bind(&record.MOBILENO)
        .bind(&record.EMAIL)
        .bind(record.TOTALDUES)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to insert updated record: {}", e))?;
    } else {
        // MEMBERNO unchanged: UPDATE all fields in place
        sqlx::query(
            r#"UPDATE members SET
                MEMBERSHIPDATE = ?, MEMCAT = ?, SAL = ?, NAME = ?, DOB = ?,
                AQUALI = ?, RADD1 = ?, RADD2 = ?, RADD3 = ?, RADD4 = ?,
                RCITY = ?, RPIN = ?, RSTATE = ?, DESIGNATION = ?, ORGANISATION_NAME = ?,
                PADD1 = ?, PADD2 = ?, PADD3 = ?, PADD4 = ?,
                PCITY = ?, PPIN = ?, PSTATE = ?, REGIONNAME = ?,
                TELEPHONE = ?, MOBILENO = ?, EMAIL = ?, TOTALDUES = ?
            WHERE MEMBERNO = ?"#,
        )
        .bind(&record.MEMBERSHIPDATE)
        .bind(&record.MEMCAT)
        .bind(&record.SAL)
        .bind(&record.NAME)
        .bind(&record.DOB)
        .bind(&record.AQUALI)
        .bind(&record.RADD1)
        .bind(&record.RADD2)
        .bind(&record.RADD3)
        .bind(&record.RADD4)
        .bind(&record.RCITY)
        .bind(&record.RPIN)
        .bind(&record.RSTATE)
        .bind(&record.DESIGNATION)
        .bind(&record.ORGANISATION_NAME)
        .bind(&record.PADD1)
        .bind(&record.PADD2)
        .bind(&record.PADD3)
        .bind(&record.PADD4)
        .bind(&record.PCITY)
        .bind(&record.PPIN)
        .bind(&record.PSTATE)
        .bind(&record.REGIONNAME)
        .bind(&record.TELEPHONE)
        .bind(&record.MOBILENO)
        .bind(&record.EMAIL)
        .bind(record.TOTALDUES)
        .bind(&memberno)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to update record: {}", e))?;
    }

    tx.commit()
        .await
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}

/// Fetches all member records from the database.
/// Returns them as a Vec<MemberRecord> serialized to JSON.
///
/// Validates: Requirements 3.4, 10.1
#[tauri::command]
pub async fn get_all_members(app: AppHandle) -> Result<Vec<MemberRecord>, String> {
    let pool = get_db_pool(&app).await?;

    let rows = sqlx::query(
        "SELECT MEMBERNO, MEMBERSHIPDATE, MEMCAT, SAL, NAME, DOB, AQUALI, RADD1, RADD2, RADD3, RADD4, RCITY, RPIN, RSTATE, DESIGNATION, ORGANISATION_NAME, PADD1, PADD2, PADD3, PADD4, PCITY, PPIN, PSTATE, REGIONNAME, TELEPHONE, MOBILENO, EMAIL, TOTALDUES FROM members"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch members: {}", e))?;

    let members: Vec<MemberRecord> = rows
        .iter()
        .map(|row| MemberRecord {
            MEMBERNO: row.get("MEMBERNO"),
            MEMBERSHIPDATE: row.get("MEMBERSHIPDATE"),
            MEMCAT: row.get("MEMCAT"),
            SAL: row.get("SAL"),
            NAME: row.get("NAME"),
            DOB: row.get("DOB"),
            AQUALI: row.get("AQUALI"),
            RADD1: row.get("RADD1"),
            RADD2: row.get("RADD2"),
            RADD3: row.get("RADD3"),
            RADD4: row.get("RADD4"),
            RCITY: row.get("RCITY"),
            RPIN: row.get("RPIN"),
            RSTATE: row.get("RSTATE"),
            DESIGNATION: row.get("DESIGNATION"),
            ORGANISATION_NAME: row.get("ORGANISATION_NAME"),
            PADD1: row.get("PADD1"),
            PADD2: row.get("PADD2"),
            PADD3: row.get("PADD3"),
            PADD4: row.get("PADD4"),
            PCITY: row.get("PCITY"),
            PPIN: row.get("PPIN"),
            PSTATE: row.get("PSTATE"),
            REGIONNAME: row.get("REGIONNAME"),
            TELEPHONE: row.get("TELEPHONE"),
            MOBILENO: row.get("MOBILENO"),
            EMAIL: row.get("EMAIL"),
            TOTALDUES: row.get("TOTALDUES"),
        })
        .collect();

    Ok(members)
}

/// Imports member records into the database using INSERT OR REPLACE (upsert).
/// The entire operation is wrapped in a BEGIN/COMMIT transaction.
/// On failure, ROLLBACK is performed and an error is returned.
///
/// Validates: Requirements 2.5, 2.7
#[tauri::command]
pub async fn import_members(app: AppHandle, records: Vec<MemberRecord>) -> Result<ImportResult, String> {
    let pool = get_db_pool(&app).await?;

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;

    let mut imported: u32 = 0;
    let mut updated: u32 = 0;
    let mut skipped: u32 = 0;
    let mut errors: Vec<String> = Vec::new();

    for record in &records {
        if record.MEMBERNO.trim().is_empty() {
            skipped += 1;
            errors.push("Row skipped: empty MEMBERNO".to_string());
            continue;
        }

        // Check if member already exists (for counting updates vs inserts)
        let exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM members WHERE MEMBERNO = ?)",
        )
        .bind(&record.MEMBERNO)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| format!("Failed to check existing member: {}", e))?;

        let result = sqlx::query(
            r#"INSERT OR REPLACE INTO members (
                MEMBERNO, MEMBERSHIPDATE, MEMCAT, SAL, NAME, DOB, AQUALI,
                RADD1, RADD2, RADD3, RADD4, RCITY, RPIN, RSTATE,
                DESIGNATION, ORGANISATION_NAME,
                PADD1, PADD2, PADD3, PADD4, PCITY, PPIN, PSTATE,
                REGIONNAME, TELEPHONE, MOBILENO, EMAIL, TOTALDUES
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&record.MEMBERNO)
        .bind(&record.MEMBERSHIPDATE)
        .bind(&record.MEMCAT)
        .bind(&record.SAL)
        .bind(&record.NAME)
        .bind(&record.DOB)
        .bind(&record.AQUALI)
        .bind(&record.RADD1)
        .bind(&record.RADD2)
        .bind(&record.RADD3)
        .bind(&record.RADD4)
        .bind(&record.RCITY)
        .bind(&record.RPIN)
        .bind(&record.RSTATE)
        .bind(&record.DESIGNATION)
        .bind(&record.ORGANISATION_NAME)
        .bind(&record.PADD1)
        .bind(&record.PADD2)
        .bind(&record.PADD3)
        .bind(&record.PADD4)
        .bind(&record.PCITY)
        .bind(&record.PPIN)
        .bind(&record.PSTATE)
        .bind(&record.REGIONNAME)
        .bind(&record.TELEPHONE)
        .bind(&record.MOBILENO)
        .bind(&record.EMAIL)
        .bind(record.TOTALDUES)
        .execute(&mut *tx)
        .await;

        match result {
            Ok(_) => {
                if exists {
                    updated += 1;
                } else {
                    imported += 1;
                }
            }
            Err(e) => {
                skipped += 1;
                errors.push(format!("Failed to import MEMBERNO '{}': {}", record.MEMBERNO, e));
            }
        }
    }

    tx.commit()
        .await
        .map_err(|e| format!("Failed to commit import transaction: {}", e))?;

    Ok(ImportResult {
        imported,
        updated,
        skipped,
        errors,
    })
}
