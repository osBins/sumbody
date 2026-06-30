mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:sumbody.db", db::init::get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::db::init_database,
            commands::db::get_db_path,
            commands::members::get_all_members,
            commands::members::import_members,
            commands::members::update_member,
            commands::members::create_member,
            commands::members::delete_member,
            commands::call_logs::add_call_log,
            commands::call_logs::get_call_logs,
            commands::call_logs::get_member_call_logs,
            commands::call_logs::get_last_call,
            commands::call_logs::delete_call_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
