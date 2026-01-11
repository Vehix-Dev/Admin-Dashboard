import Database from 'better-sqlite3';
import path from 'path';

// ensure the database file exists in the project root or similar
// using a general purpose database for the app
const dbPath = path.join(process.cwd(), 'vehix.db');

const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS user_permissions (
    user_id TEXT PRIMARY KEY,
    permissions TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_replied INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS landing_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'hero', 'features', 'text_image', 'full_banner', 'video'
    title TEXT,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    style_config TEXT -- JSON string for colors, alignment, etc.
  );
`);

// Seed default settings
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('hero_title', 'Get Back on Road Fast');
insertSetting.run('hero_subtitle', 'Your reliable partner for roadside assistance');
insertSetting.run('contact_email', 'vehixapp@gmail.com');

export default db;

export interface UserPermissionRecord {
  user_id: string;
  permissions: string[]; // Stored as JSON string
}

export function getUserPermissions(userId: string): string[] | null {
  const row = db.prepare('SELECT permissions FROM user_permissions WHERE user_id = ?').get(userId) as { permissions: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.permissions);
  } catch (e) {
    console.error("Failed to parse permissions json", e);
    return [];
  }
}

export function saveUserPermissions(userId: string, permissions: string[]): void {
  const json = JSON.stringify(permissions);
  db.prepare(`
        INSERT INTO user_permissions (user_id, permissions, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            permissions = excluded.permissions,
            updated_at = CURRENT_TIMESTAMP
    `).run(userId, json);
}
