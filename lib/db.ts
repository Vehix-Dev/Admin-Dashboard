import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Initialize DB
let db: Database | null = null;

async function getDb() {
    if (db) return db;

    const filename = path.join(process.cwd(), 'auth.db');

    db = await open({
        filename,
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS user_2fa (
      username TEXT PRIMARY KEY,
      secret TEXT,
      enabled BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    return db;
}

export interface User2FA {
    username: string;
    secret: string;
    enabled: boolean;
    created_at: string;
}

export async function saveSecret(username: string, secret: string) {
    const database = await getDb();
    await database.run(
        `INSERT INTO user_2fa (username, secret, enabled) 
     VALUES (?, ?, 0) 
     ON CONFLICT(username) DO UPDATE SET secret = excluded.secret, enabled = 0`,
        [username, secret]
    );
}

export async function enable2FA(username: string) {
    const database = await getDb();
    await database.run(
        'UPDATE user_2fa SET enabled = 1 WHERE username = ?',
        [username]
    );
}

export async function get2FAStatus(username: string): Promise<{ enabled: boolean, secret?: string | null }> {
    const database = await getDb();
    const result = await database.get<User2FA>(
        'SELECT * FROM user_2fa WHERE username = ?',
        [username]
    );

    if (!result) {
        return { enabled: false, secret: null };
    }

    return { enabled: !!result.enabled, secret: result.secret };
}

export async function disable2FA(username: string) {
    const database = await getDb();
    await database.run('DELETE FROM user_2fa WHERE username = ?', [username]);
}
