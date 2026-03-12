import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, "data.db");

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      filename TEXT,
      journey_id TEXT,
      description TEXT,
      story_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
      story_id TEXT,
      title TEXT NOT NULL,
      theme TEXT,
      content TEXT,
      difficulty TEXT,
      lesson_number INTEGER,
      key_learning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      segment_name TEXT NOT NULL,
      logic_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      language TEXT NOT NULL CHECK(language IN ('English','Hindi','Hinglish')),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      cta TEXT NOT NULL,
      image_prompt TEXT,
      image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_stories_batch ON stories(batch_id);
    CREATE INDEX IF NOT EXISTS idx_segments_story ON segments(story_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_segment ON notifications(segment_id);
  `);

  // Migration: add image_path column to notifications if missing
  const notifCols = db.prepare("PRAGMA table_info(notifications)").all();
  if (!notifCols.find((c) => c.name === "image_path")) {
    db.exec("ALTER TABLE notifications ADD COLUMN image_path TEXT");
  }

  // Migration: add batch_id column if missing (existing databases)
  const cols = db.prepare("PRAGMA table_info(stories)").all();
  if (!cols.find((c) => c.name === "batch_id")) {
    db.exec("ALTER TABLE stories ADD COLUMN batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE");
  }
  // Create batches table if not yet present (covers existing dbs)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='batches'").get();
  if (!tables) {
    db.exec(`
      CREATE TABLE batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        filename TEXT,
        journey_id TEXT,
        description TEXT,
        story_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
