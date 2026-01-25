import { NextResponse } from 'next/server';
import { get2FAStatus } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const { enabled } = await get2FAStatus(username);
        return NextResponse.json({ enabled });
    } catch (error) {
        console.error('Error checking 2FA status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
