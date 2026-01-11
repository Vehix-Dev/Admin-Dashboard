import { NextResponse } from 'next/server';
import { getInquiries, deleteInquiry } from '@/lib/json-db';

export async function GET() {
    try {
        const inquiries = getInquiries();
        return NextResponse.json(inquiries);
    } catch (error) {
        console.error('Fetch Inquiries Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const success = deleteInquiry(parseInt(id));

        if (!success) {
            return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Inquiry Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

