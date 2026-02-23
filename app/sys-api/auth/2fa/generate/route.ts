import { NextResponse } from 'next/server';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { saveSecret } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const secret = generateSecret();
        const otpauth = generateURI({
            issuer: 'VehixAdmin',
            label: username,
            secret,
            algorithm: 'sha1',
            digits: 6,
            period: 30
        });
        const qrCode = await QRCode.toDataURL(otpauth);

        // Save secret as "pending"
        await saveSecret(username, secret);

        return NextResponse.json({ secret, qrCode });
    } catch (error) {
        console.error('Error generating 2FA:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
