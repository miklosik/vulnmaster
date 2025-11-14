// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::Value;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool, FromRow};
use tauri::Manager;
use tauri_plugin_dialog;
use tauri_plugin_shell;

pub struct DbState(pub SqlitePool);

// --- DTO Structs for Frontend Communication ---

#[derive(serde::Serialize, FromRow)]
struct VulnRecord {
    id: String,
    dataset_id: String,
    cve_id: String,
    product: String,
    original_severity: String,
    original_score: f64,
    expert_severity: Option<String>,
    expert_vector: Option<String>,
    expert_score: Option<f64>,
    expert_justification: Option<String>,
    updated_at: Option<String>, // For FR3.6 (Tracking time)
}

#[derive(serde::Deserialize)]
struct ExpertUpdate {
    id: String,
    severity: String,
    vector: Option<String>,
    score: Option<f64>,
    justification: String,
}

// --- COMMANDS ---

#[tauri::command]
async fn get_dataset_records(dataset_id: String, db_state: tauri::State<'_, DbState>) -> Result<Vec<VulnRecord>, String> {
    let pool = &db_state.0;

    let records = sqlx::query_as::<_, VulnRecord>(
        "SELECT 
            id, dataset_id, cve_id, product, original_severity, original_score, 
            expert_severity, expert_vector, expert_score, expert_justification, updated_at
         FROM vulnerability_records 
         WHERE dataset_id = ?"
    )
    .bind(dataset_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(records)
}

#[tauri::command]
async fn update_expert_assessment(update: ExpertUpdate, db_state: tauri::State<'_, DbState>) -> Result<String, String> {
    let pool = &db_state.0;

    // FR3.4: Validation (Backend enforcement)
    if update.justification.trim().len() < 10 {
        return Err("Justification must be at least 10 characters long.".to_string());
    }

    // FR3.6: Track time of assessment
    let now = chrono::Utc::now().to_string();

    sqlx::query(
        "UPDATE vulnerability_records 
         SET expert_severity = ?, expert_vector = ?, expert_score = ?, expert_justification = ?, updated_at = ?
         WHERE id = ?"
    )
    .bind(update.severity)
    .bind(update.vector)
    .bind(update.score)
    .bind(update.justification)
    .bind(now)
    .bind(update.id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok("Assessment saved successfully".to_string())
}

#[tauri::command]
async fn ingest_csv(filepath: String, db_state: tauri::State<'_, DbState>) -> Result<String, String> {
    let pool = &db_state.0;

    // FR1.5: Assign unique ID and timestamp
    let dataset_id = uuid::Uuid::new_v4().to_string();
    let file_name = std::path::Path::new(&filepath)
        .file_name().and_then(|s| s.to_str()).unwrap_or("unknown_file").to_string();
    let created_at = chrono::Utc::now().to_string();

    // Start a database transaction
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    // 1. Create the Dataset entry
    sqlx::query("INSERT INTO datasets (id, file_name, created_at) VALUES (?, ?, ?)")
        .bind(&dataset_id)
        .bind(&file_name)
        .bind(&created_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    // 2. Parse CSV
    let mut rdr = csv::Reader::from_path(&filepath).map_err(|e| e.to_string())?;
    let headers = rdr.headers().cloned().map_err(|e| e.to_string())?;
    let mut record_count = 0;

    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        record_count += 1;

        let json_map: Value = headers.iter()
            .zip(record.iter())
            .map(|(header, value)| (header.to_string(), Value::String(value.to_string())))
            .collect::<serde_json::Map<String, _>>()
            .into();
        let raw_data = json_map.to_string();

        // Basic mapping - ensure these match your CSV headers exactly
        let cve_id = json_map.get("CVE ID").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let product = json_map.get("Product").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let original_severity = json_map.get("Original Severity").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let original_score: f64 = json_map.get("Original Score")
            .and_then(|v| v.as_str())
            .unwrap_or("0.0")
            .parse()
            .unwrap_or(0.0);

        if cve_id.is_empty() && product.is_empty() { continue; }

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

    let pool = SqlitePoolOptions::new().max_connections(5).connect(&db_url).await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY,
            file_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )"
    ).execute(&pool).await?;

    // Added 'updated_at' column for FR3.6
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS vulnerability_records (
            id TEXT PRIMARY KEY,
            dataset_id TEXT NOT NULL,
            cve_id TEXT,
            product TEXT,
            original_severity TEXT,
            original_score REAL,
            expert_severity TEXT,
            expert_vector TEXT,
            expert_score REAL,
            expert_justification TEXT,
            updated_at TEXT, 
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
        // Register the new commands here
        .invoke_handler(tauri::generate_handler![ingest_csv, get_dataset_records, update_expert_assessment])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}