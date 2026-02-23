import { NextRequest, NextResponse } from 'next/server';
import { getRoles, addRole } from '@/lib/json-db';

export async function GET(request: NextRequest) {
    try {
        const roles = getRoles();
        return NextResponse.json(roles);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, permissions } = body;

        if (!id || !name || !Array.isArray(permissions)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const newRole = addRole({ id, name, description, permissions });
        return NextResponse.json(newRole);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}
