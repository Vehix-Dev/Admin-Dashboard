export interface TwoFAStatus {
    enabled: boolean;
    error?: string;
}

export interface GenerateResponse {
    secret: string;
    qrCode: string;
    error?: string;
}

export async function get2FAStatus(username: string): Promise<TwoFAStatus> {
    console.log("get2FAStatus: fetching for", username);
    try {
        const res = await fetch(`/api/auth/2fa/status?username=${username}`);
        console.log("get2FAStatus: response status", res.status);
        const data = await res.json();
        console.log("get2FAStatus: data", data);
        return data;
    } catch (err) {
        console.error("get2FAStatus: error", err);
        throw err;
    }
}

export async function generate2FA(username: string): Promise<GenerateResponse> {
    console.log("generate2FA: initiating for", username);
    try {
        const res = await fetch('/api/auth/2fa/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
        console.log("generate2FA: response status", res.status);
        const data = await res.json();
        console.log("generate2FA: data", data);
        return data;
    } catch (err) {
        console.error("generate2FA: error", err);
        throw err;
    }
}

export async function enable2FA(username: string, token: string): Promise<{ success: boolean; error?: string }> {
    console.log("enable2FA: initiating for", username);
    try {
        const res = await fetch('/api/auth/2fa/enable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, token }),
        });
        console.log("enable2FA: response status", res.status);
        const data = await res.json();
        console.log("enable2FA: data", data);
        return data;
    } catch (err) {
        console.error("enable2FA: error", err);
        throw err;
    }
}

export async function verify2FA(username: string, token: string): Promise<{ valid: boolean; error?: string }> {
    console.log("verify2FA: initiating for", username);
    try {
        const res = await fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, token }),
        });
        console.log("verify2FA: response status", res.status);
        const data = await res.json();
        console.log("verify2FA: data", data);
        return data;
    } catch (err) {
        console.error("verify2FA: error", err);
        throw err;
    }
}
