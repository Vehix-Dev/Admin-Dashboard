import { NextResponse } from 'next/server';
import { get2FAStatus } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({
                status: "error",
                message: "No username provided",
                info: "Add ?username=... to the URL"
            });
        }

        const status = await get2FAStatus(username);
        return NextResponse.json({
            status: "success",
            username,
            dbResult: status
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
