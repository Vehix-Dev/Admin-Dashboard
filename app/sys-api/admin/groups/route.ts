import { NextRequest, NextResponse } from 'next/server';
import { getGroups, addGroup } from '@/lib/json-db';

export async function GET(request: NextRequest) {
    try {
        const groups = getGroups();
        // Calculate member count for UI convenience
        const groupsWithCounts = groups.map(g => ({
            ...g,
            memberCount: g.memberIds.length
        }));
        return NextResponse.json(groupsWithCounts);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, roleIds, memberIds } = body;

        if (!name) {
            return NextResponse.json({ error: 'Invalid data: Name is required' }, { status: 400 });
        }

        const newGroup = addGroup({
            name,
            description,
            roleIds: roleIds || [],
            memberIds: memberIds || []
        });
        return NextResponse.json(newGroup);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}
