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
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/lib/json-db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addGroup",
    ()=>addGroup,
    "addInquiry",
    ()=>addInquiry,
    "addLandingSection",
    ()=>addLandingSection,
    "addMessage",
    ()=>addMessage,
    "addRole",
    ()=>addRole,
    "cleanupMessages",
    ()=>cleanupMessages,
    "default",
    ()=>__TURBOPACK__default__export__,
    "deleteGroup",
    ()=>deleteGroup,
    "deleteInquiry",
    ()=>deleteInquiry,
    "deleteLandingSection",
    ()=>deleteLandingSection,
    "deleteRole",
    ()=>deleteRole,
    "getGroup",
    ()=>getGroup,
    "getGroups",
    ()=>getGroups,
    "getInquiries",
    ()=>getInquiries,
    "getLandingSections",
    ()=>getLandingSections,
    "getMessages",
    ()=>getMessages,
    "getRole",
    ()=>getRole,
    "getRoles",
    ()=>getRoles,
    "getSettings",
    ()=>getSettings,
    "getUserPermissions",
    ()=>getUserPermissions,
    "saveSetting",
    ()=>saveSetting,
    "saveSettings",
    ()=>saveSettings,
    "saveUserPermissions",
    ()=>saveUserPermissions,
    "updateGroup",
    ()=>updateGroup,
    "updateLandingSection",
    ()=>updateLandingSection,
    "updateRole",
    ()=>updateRole
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const DATA_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'data');
if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(DATA_DIR)) {
    __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(DATA_DIR, {
        recursive: true
    });
}
const FILES = {
    inquiries: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'inquiries.json'),
    settings: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'settings.json'),
    landingSections: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'landing_sections.json'),
    userPermissions: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'user_permissions.json'),
    roles: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'roles.json'),
    groups: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'groups.json'),
    messages: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(DATA_DIR, 'messages.json')
};
function readJSON(filePath, defaultValue) {
    try {
        if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(filePath)) {
            writeJSON(filePath, defaultValue);
            return defaultValue;
        }
        const data = __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        // Recovery: If file exists but is invalid JSON, overwrite with default to prevent persistent errors
        if (error instanceof SyntaxError) {
            try {
                __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
                console.log(`Recovered corrupted file: ${filePath}`);
            } catch (writeError) {
                console.error(`Failed to recover file ${filePath}:`, writeError);
            }
        }
        return defaultValue;
    }
}
function writeJSON(filePath, data) {
    try {
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}
function initializeDefaults() {
    const settings = readJSON(FILES.settings, {});
    if (Object.keys(settings).length === 0) {
        settings['hero_title'] = 'Get Back on Road Fast';
        settings['hero_subtitle'] = 'Your reliable partner for roadside assistance';
        settings['contact_email'] = 'vehixapp@gmail.com';
        writeJSON(FILES.settings, settings);
    }
    readJSON(FILES.inquiries, []);
    readJSON(FILES.landingSections, []);
    readJSON(FILES.userPermissions, {});
    // Initialize System Roles
    const roles = readJSON(FILES.roles, []);
    if (roles.length === 0) {
        // We can seed initial system roles later or let the UI handle it, 
        // but let's seed a Super Admin role for safety.
        const initialRoles = [
            {
                id: 'SUPER_ADMIN',
                name: 'Super Admin',
                description: 'Full system access',
                permissions: [],
                // For now, let's leave it empty and rely on existing ROLES logic or fill it
                // Actually, let's keep it empty and let the app handle it via code constants if needed,
                // OR better, we will migrate ROLES from code to here later.
                isSystem: true,
                created_at: new Date().toISOString()
            }
        ];
        writeJSON(FILES.roles, initialRoles);
    } else {
        // Ensure roles exists
        readJSON(FILES.roles, []);
    }
    readJSON(FILES.groups, []);
    readJSON(FILES.messages, []);
}
initializeDefaults();
function getInquiries() {
    const inquiries = readJSON(FILES.inquiries, []);
    return inquiries.sort((a, b)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
function addInquiry(inquiry) {
    const inquiries = readJSON(FILES.inquiries, []);
    const newId = inquiries.length > 0 ? Math.max(...inquiries.map((i)=>i.id)) + 1 : 1;
    const newInquiry = {
        id: newId,
        ...inquiry,
        is_replied: 0,
        created_at: new Date().toISOString()
    };
    inquiries.push(newInquiry);
    writeJSON(FILES.inquiries, inquiries);
    return newInquiry;
}
function deleteInquiry(id) {
    const inquiries = readJSON(FILES.inquiries, []);
    const filtered = inquiries.filter((i)=>i.id !== id);
    if (filtered.length === inquiries.length) {
        return false;
    }
    writeJSON(FILES.inquiries, filtered);
    return true;
}
function getSettings() {
    return readJSON(FILES.settings, {});
}
function saveSetting(key, value) {
    const settings = readJSON(FILES.settings, {});
    settings[key] = value;
    writeJSON(FILES.settings, settings);
}
function saveSettings(newSettings) {
    const settings = readJSON(FILES.settings, {});
    Object.assign(settings, newSettings);
    writeJSON(FILES.settings, settings);
}
function getLandingSections() {
    const sections = readJSON(FILES.landingSections, []);
    return sections.sort((a, b)=>a.order_index - b.order_index);
}
function addLandingSection(section) {
    const sections = readJSON(FILES.landingSections, []);
    const newId = sections.length > 0 ? Math.max(...sections.map((s)=>s.id)) + 1 : 1;
    const newSection = {
        id: newId,
        ...section
    };
    sections.push(newSection);
    writeJSON(FILES.landingSections, sections);
    return newSection;
}
function updateLandingSection(id, updates) {
    const sections = readJSON(FILES.landingSections, []);
    const index = sections.findIndex((s)=>s.id === id);
    if (index === -1) {
        return false;
    }
    sections[index] = {
        ...sections[index],
        ...updates
    };
    writeJSON(FILES.landingSections, sections);
    return true;
}
function deleteLandingSection(id) {
    const sections = readJSON(FILES.landingSections, []);
    const filtered = sections.filter((s)=>s.id !== id);
    if (filtered.length === sections.length) {
        return false;
    }
    writeJSON(FILES.landingSections, filtered);
    return true;
}
function getRoles() {
    return readJSON(FILES.roles, []);
}
function getRole(id) {
    return getRoles().find((r)=>r.id === id);
}
function addRole(role) {
    const roles = getRoles();
    if (roles.some((r)=>r.id === role.id)) {
        throw new Error('Role ID already exists');
    }
    const newRole = {
        ...role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    roles.push(newRole);
    writeJSON(FILES.roles, roles);
    return newRole;
}
function updateRole(id, updates) {
    const roles = getRoles();
    const index = roles.findIndex((r)=>r.id === id);
    if (index === -1) return null;
    const updatedRole = {
        ...roles[index],
        ...updates,
        updated_at: new Date().toISOString()
    };
    roles[index] = updatedRole;
    writeJSON(FILES.roles, roles);
    return updatedRole;
}
function deleteRole(id) {
    const roles = getRoles();
    const role = roles.find((r)=>r.id === id);
    if (!role || role.isSystem) return false;
    const filtered = roles.filter((r)=>r.id !== id);
    writeJSON(FILES.roles, filtered);
    return true;
}
function getGroups() {
    return readJSON(FILES.groups, []);
}
function getGroup(id) {
    return getGroups().find((g)=>g.id === id);
}
function addGroup(group) {
    const groups = getGroups();
    const newId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGroup = {
        id: newId,
        ...group,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    groups.push(newGroup);
    writeJSON(FILES.groups, groups);
    return newGroup;
}
function updateGroup(id, updates) {
    const groups = getGroups();
    const index = groups.findIndex((g)=>g.id === id);
    if (index === -1) return null;
    const updatedGroup = {
        ...groups[index],
        ...updates,
        updated_at: new Date().toISOString()
    };
    groups[index] = updatedGroup;
    writeJSON(FILES.groups, groups);
    return updatedGroup;
}
function deleteGroup(id) {
    const groups = getGroups();
    const filtered = groups.filter((g)=>g.id !== id);
    if (filtered.length === groups.length) return false;
    writeJSON(FILES.groups, filtered);
    return true;
}
function getUserPermissions(userId) {
    // 1. Get Direct Permissions
    const userPermissionsDB = readJSON(FILES.userPermissions, {});
    const userPerm = userPermissionsDB[userId];
    const directPermissions = userPerm ? JSON.parse(userPerm.permissions) : [];
    // 2. Get Permissions from Groups
    const groups = getGroups();
    const roles = getRoles();
    const userGroups = groups.filter((g)=>g.memberIds.includes(userId));
    let groupPermissions = [];
    userGroups.forEach((group)=>{
        group.roleIds.forEach((roleId)=>{
            const role = roles.find((r)=>r.id === roleId);
            if (role && role.permissions) {
                groupPermissions = [
                    ...groupPermissions,
                    ...role.permissions
                ];
            }
        });
    });
    // 3. Merge and Unique
    const allPermissions = Array.from(new Set([
        ...directPermissions,
        ...groupPermissions
    ]));
    // If no direct permissions and no group permissions, return null or empty?
    // Start returning [] if found nothing, but maybe null if user has NO record at all?
    // The previous implementation returned null if !userPerm. 
    // But now we support groups even if no direct permissions exist.
    if (!userPerm && userGroups.length === 0) return null;
    return allPermissions;
}
function saveUserPermissions(userId, perms) {
    const permissions = readJSON(FILES.userPermissions, {});
    permissions[userId] = {
        user_id: userId,
        permissions: JSON.stringify(perms),
        updated_at: new Date().toISOString()
    };
    writeJSON(FILES.userPermissions, permissions);
}
function cleanupMessages() {
    const messages = readJSON(FILES.messages, []);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = messages.filter((m)=>m.timestamp > twentyFourHoursAgo);
    if (filtered.length !== messages.length) {
        writeJSON(FILES.messages, filtered);
    }
}
function getMessages() {
    cleanupMessages(); // Auto-cleanup on read
    return readJSON(FILES.messages, []);
}
function addMessage(message) {
    const messages = readJSON(FILES.messages, []);
    const newMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    messages.push(newMessage);
    writeJSON(FILES.messages, messages);
    return newMessage;
}
const db = {
    getInquiries,
    addInquiry,
    deleteInquiry,
    getSettings,
    saveSetting,
    saveSettings,
    getLandingSections,
    addLandingSection,
    updateLandingSection,
    deleteLandingSection,
    getUserPermissions,
    saveUserPermissions,
    // Role/Group Exports
    getRoles,
    addRole,
    updateRole,
    deleteRole,
    getGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    getRole,
    // Messenger
    getMessages,
    addMessage,
    cleanupMessages
};
const __TURBOPACK__default__export__ = db;
}),
"[project]/app/sys-api/admin/messenger/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$json$2d$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/json-db.ts [app-route] (ecmascript)");
;
;
async function GET() {
    try {
        const messages = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$json$2d$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].getMessages();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(messages);
    } catch (error) {
        console.error('Messenger GET error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch messages'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const newMessage = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$json$2d$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].addMessage(body);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(newMessage);
    } catch (error) {
        console.error('Messenger POST error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to send message'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3d55ebc4._.js.map