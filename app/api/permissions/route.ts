import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissions, saveUserPermissions } from '@/lib/json-db';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserID is required' }, { status: 400 });
    }

    try {
        const permissions = getUserPermissions(userId);
        return NextResponse.json({ userId, permissions: permissions || [] });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, permissions } = body;

        if (!userId || !Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        saveUserPermissions(String(userId), permissions);
        return NextResponse.json({ success: true, userId, permissions });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
    }
}
