import { NextResponse } from 'next/server';
import { verify } from 'otplib';
import { get2FAStatus, enable2FA } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { username, token } = await req.json();

        if (!username || !token) {
            return NextResponse.json({ error: 'Username and token are required' }, { status: 400 });
        }

        const { secret } = await get2FAStatus(username);

        if (!secret) {
            return NextResponse.json({ error: '2FA setup not initiated' }, { status: 400 });
        }

        const result = await verify({
            token,
            secret,
            period: 30,
            digits: 6,
            algorithm: 'sha1'
        });

        if (result.valid) {
            await enable2FA(username);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ valid: false, error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
