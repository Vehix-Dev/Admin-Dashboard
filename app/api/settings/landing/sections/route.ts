import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const stmt = db.prepare('SELECT * FROM landing_sections ORDER BY order_index ASC');
        const sections = stmt.all();
        return NextResponse.json(sections);
    } catch (error) {
        console.error('Fetch Sections Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, title, content, image_url, video_url, order_index, style_config } = body;

        const insert = db.prepare(`
            INSERT INTO landing_sections (type, title, content, image_url, video_url, order_index, style_config)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insert.run(
            type,
            title || null,
            content || null,
            image_url || null,
            video_url || null,
            order_index || 0,
            JSON.stringify(style_config || {})
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create Section Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, content, image_url, video_url, order_index, style_config } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const update = db.prepare(`
            UPDATE landing_sections 
            SET title = ?, content = ?, image_url = ?, video_url = ?, order_index = ?, style_config = ?
            WHERE id = ?
        `);

        update.run(
            title || null,
            content || null,
            image_url || null,
            video_url || null,
            order_index || 0,
            JSON.stringify(style_config || {}),
            id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Section Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const del = db.prepare('DELETE FROM landing_sections WHERE id = ?');
        del.run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Section Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
