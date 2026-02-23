import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import {
    getPromotionTemplate,
    getWalletTemplate,
    getGeneralTemplate,
    getWelcomeTemplate,
    getServiceCompletedTemplate,
    getAccountApprovedTemplate,
    getWelcomeApprovalTemplate,
    type EmailTemplateType
} from '@/lib/email-templates';

const LOG_FILE = path.join(process.cwd(), 'data', 'sent_emails.json');

// Ensure data directory calls
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

interface EmailLog {
    to: string;
    type: string;
    timestamp: string;
}

function hasSentWelcomeEmail(email: string, type: string): boolean {
    if (!fs.existsSync(LOG_FILE)) return false;

    // Only check for Welcome/Approval types to avoid spamming checks for generic attempts
    if (!['WELCOME', 'ACCOUNT_APPROVED', 'WELCOME_APPROVAL'].includes(type) && !type.includes('WELCOME')) return false;

    try {
        const fileContent = fs.readFileSync(LOG_FILE, 'utf-8');
        const logs: EmailLog[] = JSON.parse(fileContent);
        // Check if this email has already received a Welcome/Approval/Welcome_Approval email
        // We treat them as a group of "Onboarding Emails" to be safe, or just exact type match?
        // User said "even though a user is disabled and approved, we do not send emails again".
        // Use exact type match for now, or match any onboarding type.
        return logs.some(log => log.to === email && ['WELCOME', 'ACCOUNT_APPROVED', 'WELCOME_APPROVAL'].includes(log.type) && ['WELCOME', 'ACCOUNT_APPROVED', 'WELCOME_APPROVAL'].includes(type));
    } catch (e) {
        return false;
    }
}

function logSentEmail(email: string, type: string) {
    let logs: EmailLog[] = [];
    if (fs.existsSync(LOG_FILE)) {
        try {
            logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
        } catch (e) {
            logs = [];
        }
    }
    logs.push({ to: email, type, timestamp: new Date().toISOString() });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { to, subject, type, data } = body;

        if (!to || !type || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // DUPLICATE CHECK
        if (hasSentWelcomeEmail(to, type)) {
            console.log(`Skipping duplicate email to ${to} of type ${type}`);
            return NextResponse.json({ success: true, message: 'Skipped duplicate email (already sent)' });
        }


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        let html = '';
        let finalSubject = subject;

        // Ensure subject is set based on type if not provided
        switch (type as EmailTemplateType) {
            case 'PROMOTION':
                html = getPromotionTemplate({ ...data, subject: finalSubject });
                finalSubject = data.subject || subject || 'Special Promotion';
                break;
            case 'WALLET_UPDATE':
                html = getWalletTemplate({ ...data, subject: finalSubject });
                finalSubject = data.subject || subject || 'Wallet Balanace Update';
                break;
            case 'GENERAL':
                html = getGeneralTemplate({ ...data, subject: finalSubject });
                finalSubject = data.title || subject || 'Notification';
                break;
            case 'WELCOME':
                html = getWelcomeTemplate({ ...data, subject: finalSubject });
                finalSubject = data.subject || subject || 'Welcome to Vehix';
                break;
            case 'SERVICE_COMPLETED':
                html = getServiceCompletedTemplate({ ...data, subject: finalSubject });
                finalSubject = data.subject || subject || 'Service Request Completed';
                break;
            case 'ACCOUNT_APPROVED':
                html = getAccountApprovedTemplate({ ...data, subject: finalSubject });
                finalSubject = data.subject || subject || 'Account Approved';
                break;
            case 'WELCOME_APPROVAL':
                html = getWelcomeApprovalTemplate({ ...data, subject: finalSubject });
                finalSubject = data.subject || subject || 'Welcome to Vehix - Account Approved';
                break;
            default:
                return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
        }

        const mailOptions = {
            from: `"Vehix App" <${process.env.GMAIL_USER}>`,
            to: Array.isArray(to) ? to.join(',') : to,
            subject: finalSubject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);

        // LOG SUCCESS
        logSentEmail(Array.isArray(to) ? to[0] : to, type);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
        console.error('Email send error:', error);
        return NextResponse.json({ error: 'Failed to send email', details: error.message }, { status: 500 });
    }
}
