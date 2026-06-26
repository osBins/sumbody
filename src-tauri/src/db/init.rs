use tauri_plugin_sql::{Migration, MigrationKind};

/// SQL statement to create the members table with the full 27-column schema.
/// All TEXT columns default to empty string, TOTALDUES defaults to 0.0.
/// MEMBERNO is the PRIMARY KEY.
pub const CREATE_MEMBERS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS members (
  MEMBERNO TEXT PRIMARY KEY,
  MEMBERSHIPDATE TEXT DEFAULT '',
  MEMCAT TEXT DEFAULT '',
  SAL TEXT DEFAULT '',
  NAME TEXT DEFAULT '',
  DOB TEXT DEFAULT '',
  AQUALI TEXT DEFAULT '',
  RADD1 TEXT DEFAULT '',
  RADD2 TEXT DEFAULT '',
  RADD3 TEXT DEFAULT '',
  RADD4 TEXT DEFAULT '',
  RCITY TEXT DEFAULT '',
  RPIN TEXT DEFAULT '',
  RSTATE TEXT DEFAULT '',
  DESIGNATION TEXT DEFAULT '',
  ORGANISATION_NAME TEXT DEFAULT '',
  PADD1 TEXT DEFAULT '',
  PADD2 TEXT DEFAULT '',
  PADD3 TEXT DEFAULT '',
  PADD4 TEXT DEFAULT '',
  PCITY TEXT DEFAULT '',
  PPIN TEXT DEFAULT '',
  PSTATE TEXT DEFAULT '',
  REGIONNAME TEXT DEFAULT '',
  TELEPHONE TEXT DEFAULT '',
  MOBILENO TEXT DEFAULT '',
  EMAIL TEXT DEFAULT '',
  TOTALDUES REAL DEFAULT 0.0
);
"#;

/// Returns the migration that creates the members table.
/// This should be passed to the `tauri-plugin-sql` builder via `.add_migrations()`.
pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_members_table",
        sql: CREATE_MEMBERS_TABLE,
        kind: MigrationKind::Up,
    }]
}
