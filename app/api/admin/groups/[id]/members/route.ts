import { NextRequest, NextResponse } from 'next/server';
import { getGroup, updateGroup } from '@/lib/json-db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, userId } = body;
        // action: 'add' | 'remove'

        if (!userId || !action) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const group = getGroup(id);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        let newMemberIds = [...group.memberIds];

        if (action === 'add') {
            if (!newMemberIds.includes(userId)) {
                newMemberIds.push(userId);
            }
        } else if (action === 'remove') {
            newMemberIds = newMemberIds.filter(id => id !== userId);
        }

        const updatedGroup = updateGroup(id, { memberIds: newMemberIds });
        return NextResponse.json(updatedGroup);

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update group members' }, { status: 500 });
    }
}
