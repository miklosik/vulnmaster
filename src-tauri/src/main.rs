// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tauri::Manager;
use tauri_plugin_dialog; // <-- ADDED
use tauri_plugin_shell;  // <-- ADDED

pub struct DbState(pub SqlitePool);

#[tauri::command]
async fn ingest_csv(filepath: String, db_state: tauri::State<'_, DbState>) -> Result<String, String> {
    let dataset_id = uuid::Uuid::new_v4().to_string();
    let file_name = std::path::Path::new(&filepath)
        .file_name().unwrap_or_default().to_str().unwrap_or_default().to_string();

    let pool = &db_state.0;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // Create Dataset Record
    sqlx::query("INSERT INTO datasets (id, file_name, created_at) VALUES (?, ?, ?)")
        .bind(&dataset_id).bind(&file_name).bind(chrono::Utc::now().to_string())
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;

    // Read CSV
    let mut rdr = csv::Reader::from_path(&filepath).map_err(|e| e.to_string())?;
    let mut count = 0;
    
    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        // Mapping based on standard CSV structure (Modify indices as needed)
        let cve_id = record.get(7).unwrap_or("").to_string(); 
        let product = record.get(2).unwrap_or("").to_string();
        let severity = record.get(21).unwrap_or("").to_string();

        sqlx::query("INSERT INTO vulnerability_records (id, dataset_id, cve_id, product, original_severity) VALUES (?, ?, ?, ?, ?)")
            .bind(uuid::Uuid::new_v4().to_string()).bind(&dataset_id).bind(cve_id).bind(product).bind(severity)
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
        count += 1;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(format!("Ingested '{}': {} records.", file_name, count))
}

async fn setup_database(app_handle: &tauri::AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    //let app_dir = app_handle.path_resolver().app_local_data_dir().ok_or("No data dir")?;
    // --- THIS IS THE NEW, CORRECT LINE ---
    //let app_dir = app_handle.path().app_local_data_dir().ok_or("No data dir")?;
    let app_dir = app_handle.path().app_local_data_dir()?;

    if !app_dir.exists() { std::fs::create_dir_all(&app_dir)?; }
    
    let db_url = format!("sqlite:{}", app_dir.join("vulnmaster.db").to_str().unwrap());
    
    // Create the file if it doesn't exist
    if !std::path::Path::new(&app_dir.join("vulnmaster.db")).exists() {
        std::fs::File::create(app_dir.join("vulnmaster.db"))?;
    }

    let pool = SqlitePoolOptions::new().connect(&db_url).await?;
    
    sqlx::query("CREATE TABLE IF NOT EXISTS datasets (id TEXT PRIMARY KEY, file_name TEXT, created_at TEXT)").execute(&pool).await?;
    sqlx::query("CREATE TABLE IF NOT EXISTS vulnerability_records (id TEXT PRIMARY KEY, dataset_id TEXT, cve_id TEXT, product TEXT, original_severity TEXT)").execute(&pool).await?;
    
    Ok(pool)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) // <-- ADD THIS LINE
        .plugin(tauri_plugin_shell::init())  // <-- ADD THIS LINE
        .setup(|app| {
            let handle = app.handle();
            tauri::async_runtime::block_on(async {
                let pool = setup_database(&handle).await.expect("DB Setup Failed");
                handle.manage(DbState(pool));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ingest_csv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}