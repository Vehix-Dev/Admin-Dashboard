import { NextResponse } from 'next/server';
import { getLandingSections, addLandingSection, updateLandingSection, deleteLandingSection } from '@/lib/json-db';

export async function GET() {
    try {
        const sections = getLandingSections();
        return NextResponse.json(sections);
    } catch (error) {
        console.error('Fetch Sections Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, title, content, image_url, video_url, order_index, style_config } = body;

        const newSection = addLandingSection({
            type,
            title: title || null,
            content: content || null,
            image_url: image_url || null,
            video_url: video_url || null,
            order_index: order_index || 0,
            style_config: JSON.stringify(style_config || {}),
        });

        return NextResponse.json({ success: true, section: newSection });
    } catch (error) {
        console.error('Create Section Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, content, image_url, video_url, order_index, style_config } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const success = updateLandingSection(id, {
            title: title || null,
            content: content || null,
            image_url: image_url || null,
            video_url: video_url || null,
            order_index: order_index || 0,
            style_config: JSON.stringify(style_config || {}),
        });

        if (!success) {
            return NextResponse.json({ error: 'Section not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Section Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const success = deleteLandingSection(parseInt(id));

        if (!success) {
            return NextResponse.json({ error: 'Section not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Section Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

