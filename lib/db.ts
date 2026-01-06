import Database from 'better-sqlite3';
import path from 'path';

// ensure the database file exists in the project root or similar
const dbPath = path.join(process.cwd(), 'permissions.db');

const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS user_permissions (
    user_id TEXT PRIMARY KEY,
    permissions TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

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
