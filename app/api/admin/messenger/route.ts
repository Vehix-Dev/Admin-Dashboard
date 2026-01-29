import { NextResponse } from 'next/server';
import db from '@/lib/json-db';

export async function GET() {
    try {
        const messages = db.getMessages();
        return NextResponse.json(messages);
    } catch (error) {
        console.error('Messenger GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const newMessage = db.addMessage(body);
        return NextResponse.json(newMessage);
    } catch (error) {
        console.error('Messenger POST error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
