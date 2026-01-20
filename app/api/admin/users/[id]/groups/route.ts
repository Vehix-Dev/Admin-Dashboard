import { NextRequest, NextResponse } from 'next/server';
import { getGroups, updateGroup } from '@/lib/json-db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userId = id;
        const body = await request.json();
        const { groupIds } = body;

        if (!Array.isArray(groupIds)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const allGroups = getGroups();

        // 1. Remove user from groups not in groupIds
        allGroups.forEach(group => {
            if (group.memberIds.includes(userId) && !groupIds.includes(group.id)) {
                // Remove
                const newMembers = group.memberIds.filter(id => id !== userId);
                updateGroup(group.id, { memberIds: newMembers });
            }

            if (!group.memberIds.includes(userId) && groupIds.includes(group.id)) {
                // Add
                const newMembers = [...group.memberIds, userId];
                updateGroup(group.id, { memberIds: newMembers });
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to update user groups' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userId = id;
        const allGroups = getGroups();
        const userGroupIds = allGroups.filter(g => g.memberIds.includes(userId)).map(g => g.id);

        return NextResponse.json({ groupIds: userGroupIds });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch user groups' }, { status: 500 });
    }
}
