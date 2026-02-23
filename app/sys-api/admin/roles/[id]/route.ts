import { NextRequest, NextResponse } from 'next/server';
import { getRole, updateRole, deleteRole } from '@/lib/json-db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const role = getRole(id);
        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }
        return NextResponse.json(role);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updatedRole = updateRole(id, body);

        if (!updatedRole) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRole);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const success = deleteRole(id);
        if (!success) {
            return NextResponse.json({ error: 'Failed to delete role (may be system role or not found)' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
}
