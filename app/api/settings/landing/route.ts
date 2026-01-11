import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const stmt = db.prepare('SELECT key, value FROM settings');
        const rows = stmt.all() as { key: string, value: string }[];

        // Convert array of {key, value} to object { key: value }
        const settings = rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const settings = await request.json();

        // Upsert settings
        const upsert = db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `);

        // Run transaction
        const updateMany = db.transaction((data) => {
            for (const [key, value] of Object.entries(data)) {
                upsert.run(key, String(value));
            }
        });

        updateMany(settings);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
