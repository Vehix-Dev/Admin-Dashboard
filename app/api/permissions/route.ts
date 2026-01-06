import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissions, saveUserPermissions } from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    try {
        const permissions = getUserPermissions(userId);
        // If no permissions found, we return null, which the frontend can interpret as "default allow" or "no specific config"
        return NextResponse.json({ permissions });
    } catch (error) {
        console.error('Failed to fetch permissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, permissions } = body;

        if (!userId || !Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        saveUserPermissions(String(userId), permissions);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save permissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
