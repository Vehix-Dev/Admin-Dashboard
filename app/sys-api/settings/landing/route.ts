import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/json-db';

export async function GET() {
    try {
        const settings = getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const settings = await request.json();
        saveSettings(settings);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

