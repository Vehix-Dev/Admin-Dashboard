import { NextResponse } from 'next/server';
import { verify } from 'otplib';
import { get2FAStatus } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { username, token } = await req.json();

        if (!username || !token) {
            return NextResponse.json({ error: 'Username and token are required' }, { status: 400 });
        }

        const { enabled, secret } = await get2FAStatus(username);
        console.log(`[2FA Verify] User: ${username}, Enabled: ${enabled}, HasSecret: ${!!secret}`);

        if (!enabled || !secret) {
            return NextResponse.json({ error: '2FA is not enabled for this user' }, { status: 400 });
        }

        const result = await verify({
            token,
            secret,
            // Google Authenticator defaults
            period: 30,
            digits: 6,
            algorithm: 'sha1'
        });

        console.log(`[2FA Verify] Result for ${username}:`, result);

        if (result.valid) {
            return NextResponse.json({ valid: true });
        } else {
            return NextResponse.json({ valid: false, error: 'Invalid authentication code' });
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
