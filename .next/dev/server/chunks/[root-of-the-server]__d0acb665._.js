module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/sqlite3 [external] (sqlite3, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("sqlite3", () => require("sqlite3"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "disable2FA",
    ()=>disable2FA,
    "enable2FA",
    ()=>enable2FA,
    "get2FAStatus",
    ()=>get2FAStatus,
    "saveSecret",
    ()=>saveSecret
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/sqlite3 [external] (sqlite3, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sqlite$2f$build$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/sqlite/build/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
// Initialize DB
let db = null;
async function getDb() {
    if (db) return db;
    const filename = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'auth.db');
    db = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sqlite$2f$build$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["open"])({
        filename,
        driver: __TURBOPACK__imported__module__$5b$externals$5d2f$sqlite3__$5b$external$5d$__$28$sqlite3$2c$__cjs$29$__["default"].Database
    });
    await db.exec(`
    CREATE TABLE IF NOT EXISTS user_2fa (
      username TEXT PRIMARY KEY,
      secret TEXT,
      enabled BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    return db;
}
async function saveSecret(username, secret) {
    const database = await getDb();
    await database.run(`INSERT INTO user_2fa (username, secret, enabled) 
     VALUES (?, ?, 0) 
     ON CONFLICT(username) DO UPDATE SET secret = excluded.secret, enabled = 0`, [
        username,
        secret
    ]);
}
async function enable2FA(username) {
    const database = await getDb();
    await database.run('UPDATE user_2fa SET enabled = 1 WHERE username = ?', [
        username
    ]);
}
async function get2FAStatus(username) {
    const database = await getDb();
    const result = await database.get('SELECT * FROM user_2fa WHERE username = ?', [
        username
    ]);
    if (!result) {
        return {
            enabled: false,
            secret: null
        };
    }
    return {
        enabled: !!result.enabled,
        secret: result.secret
    };
}
async function disable2FA(username) {
    const database = await getDb();
    await database.run('DELETE FROM user_2fa WHERE username = ?', [
        username
    ]);
}
}),
"[project]/app/sys-api/auth/2fa/verify/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$otplib$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/otplib/dist/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
;
;
;
async function POST(req) {
    try {
        const { username, token } = await req.json();
        if (!username || !token) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Username and token are required'
            }, {
                status: 400
            });
        }
        const { enabled, secret } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["get2FAStatus"])(username);
        console.log(`[2FA Verify] User: ${username}, Enabled: ${enabled}, HasSecret: ${!!secret}`);
        if (!enabled || !secret) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: '2FA is not enabled for this user'
            }, {
                status: 400
            });
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$otplib$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["verify"])({
            token,
            secret,
            // Google Authenticator defaults
            period: 30,
            digits: 6,
            algorithm: 'sha1'
        });
        console.log(`[2FA Verify] Result for ${username}:`, result);
        if (result.valid) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                valid: true
            });
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                valid: false,
                error: 'Invalid authentication code'
            });
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal Server Error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d0acb665._.js.map