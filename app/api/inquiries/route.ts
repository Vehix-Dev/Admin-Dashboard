import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const stmt = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC');
        const inquiries = stmt.all();
        return NextResponse.json(inquiries);
    } catch (error) {
        console.error('Fetch Inquiries Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const stmt = db.prepare('DELETE FROM inquiries WHERE id = ?');
        stmt.run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Inquiry Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
