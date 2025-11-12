// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::Value;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tauri::Manager;
use tauri_plugin_dialog;
use tauri_plugin_shell;

pub struct DbState(pub SqlitePool);

#[tauri::command]
async fn ingest_csv(filepath: String, db_state: tauri::State<'_, DbState>) -> Result<String, String> {
    let pool = &db_state.0;

    // FR1.5: Assign unique ID and timestamp
    let dataset_id = uuid::Uuid::new_v4().to_string();
    let file_name = std::path::Path::new(&filepath)
        .file_name().and_then(|s| s.to_str()).unwrap_or("unknown_file").to_string();
    let created_at = chrono::Utc::now().to_string();

    // Start a database transaction for data integrity
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Create the Dataset entry
    sqlx::query("INSERT INTO datasets (id, file_name, created_at) VALUES (?, ?, ?)")
        .bind(&dataset_id)
        .bind(&file_name)
        .bind(&created_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // 2. Parse the CSV file (FR1.1)
    let mut rdr = csv::Reader::from_path(&filepath).map_err(|e| e.to_string())?;
    let headers = rdr.headers().cloned().map_err(|e| e.to_string())?;
    let mut record_count = 0;

    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        record_count += 1;

        // Combine headers + record into a proper JSON map (Value::Object)
        let json_map: Value = headers.iter()
            .zip(record.iter())
            .map(|(header, value)| (header.to_string(), Value::String(value.to_string())))
            .collect::<serde_json::Map<String, _>>()
            .into();
        let raw_data = json_map.to_string(); // This is a proper JSON object string

        // --- Field Mapping ---
        // We pull out key fields for indexed columns and quick access
        // We use .get() and .and_then() for safe JSON parsing
        let cve_id = json_map.get("CVE ID").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let product = json_map.get("Product").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let original_severity = json_map.get("Original Severity").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let original_score: f64 = json_map.get("Original Score")
            .and_then(|v| v.as_str())
            .unwrap_or("0.0")
            .parse()
            .unwrap_or(0.0);

        // FR1.6: Simple validation
        if cve_id.is_empty() && product.is_empty() {
            continue; // Skip rows that are clearly invalid
        }

        // FR1.7: Store in SQLite
        sqlx::query(
            "INSERT INTO vulnerability_records (id, dataset_id, cve_id, product, original_severity, original_score, raw_data) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(uuid::Uuid::new_v4().to_string())
        .bind(&dataset_id)
        .bind(cve_id)
        .bind(product)
        .bind(original_severity)
        .bind(original_score)
        .bind(raw_data)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    // 3. Commit the transaction
    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(format!("Successfully ingested {} records from {}", record_count, file_name))
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
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
