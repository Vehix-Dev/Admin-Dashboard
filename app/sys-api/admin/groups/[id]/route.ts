import { NextRequest, NextResponse } from 'next/server';
import { getGroup, updateGroup, deleteGroup } from '@/lib/json-db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const group = getGroup(id);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        return NextResponse.json(group);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updatedGroup = updateGroup(id, body);

        if (!updatedGroup) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const success = deleteGroup(id);
        if (!success) {
            return NextResponse.json({ error: 'Failed to delete group' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}
