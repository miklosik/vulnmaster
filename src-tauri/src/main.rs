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
    let app_dir = app_handle.path().app_local_data_dir()?;
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)?;
    }
    
    let db_path = app_dir.join("vulnmaster.db");
    let db_url = format!("sqlite:{}", db_path.to_str().unwrap());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // FR1.7 - Create the datasets table (tracks file uploads)
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY,
            file_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    ).execute(&pool).await?;

    // FR1.7 - Create the main vulnerability records table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS vulnerability_records (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            
            -- Key fields from CSV for quick filtering
            cve_id TEXT,
            product TEXT,
            original_severity TEXT,
            original_score REAL,
            
            -- Expert fields (for future use)
            expert_severity TEXT,
            expert_vector TEXT,
            expert_score REAL,
            expert_justification TEXT,

            -- Catch-all for all other 60+ columns as a JSON blob
            raw_data TEXT, 
            
            FOREIGN KEY (dataset_id) REFERENCES datasets (id)
        )"
    ).execute(&pool).await?;
    
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