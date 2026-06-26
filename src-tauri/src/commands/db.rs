use tauri::{AppHandle, Manager};

/// Verifies that the SQLite database is initialized and accessible.
///
/// This command is called by the frontend on app startup to confirm database readiness.
/// The `tauri-plugin-sql` plugin handles schema creation via migrations automatically
/// when the frontend calls `Database.load()`. This command performs a pre-flight check
/// to ensure the app data directory is writable and the database file can be accessed.
///
/// Returns `Ok(())` if the database environment is ready, or `Err` with a descriptive
/// message if something is wrong.
#[tauri::command]
pub async fn init_database(app: AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    // Ensure the app data directory exists and is writable
    std::fs::create_dir_all(&app_data_dir).map_err(|e| {
        format!(
            "Failed to create app data directory '{}': {}",
            app_data_dir.display(),
            e
        )
    })?;

    // Verify the directory is writable by checking metadata
    let metadata = std::fs::metadata(&app_data_dir).map_err(|e| {
        format!(
            "Cannot access app data directory '{}': {}",
            app_data_dir.display(),
            e
        )
    })?;

    if metadata.permissions().readonly() {
        return Err(format!(
            "App data directory '{}' is read-only. The application needs write access to store the database.",
            app_data_dir.display()
        ));
    }

    let db_path = app_data_dir.join("sumbody.db");

    // If the database file already exists, verify it's accessible and writable
    if db_path.exists() {
        let file_meta = std::fs::metadata(&db_path).map_err(|e| {
            format!(
                "Database file exists but cannot be accessed '{}': {}",
                db_path.display(),
                e
            )
        })?;

        if file_meta.permissions().readonly() {
            return Err(format!(
                "Database file '{}' is read-only. The application needs write access to update records.",
                db_path.display()
            ));
        }
    }

    Ok(())
}

/// Returns the absolute filesystem path to the SQLite `.db` file.
/// Uses Tauri's `app_data_dir` to resolve the path and appends "sumbody.db".
///
/// Validates: Requirement 9.3
#[tauri::command]
pub async fn get_db_path(app: AppHandle) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    let db_path = app_data_dir.join("sumbody.db");

    Ok(db_path
        .to_str()
        .ok_or_else(|| "Database path contains invalid UTF-8".to_string())?
        .to_string())
}
