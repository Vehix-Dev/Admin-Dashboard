import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
    inquiries: path.join(DATA_DIR, 'inquiries.json'),
    settings: path.join(DATA_DIR, 'settings.json'),
    landingSections: path.join(DATA_DIR, 'landing_sections.json'),
    userPermissions: path.join(DATA_DIR, 'user_permissions.json'),
    roles: path.join(DATA_DIR, 'roles.json'),
    groups: path.join(DATA_DIR, 'groups.json'),
    messages: path.join(DATA_DIR, 'messages.json'),
};

export interface Inquiry {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    is_replied: number;
    created_at: string;
}

export interface LandingSection {
    id: number;
    type: string;
    title: string | null;
    content: string | null;
    image_url: string | null;
    video_url: string | null;
    order_index: number;
    style_config: string;
}

export interface UserPermission {
    user_id: string;
    permissions: string;
    updated_at: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[]; // List of permission strings
    isSystem?: boolean; // If true, cannot be deleted
    created_at?: string;
    updated_at?: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    roleIds: string[]; // Roles assigned to this group
    memberIds: string[]; // User IDs in this group
    created_at?: string;
    updated_at?: string;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    isStaff: boolean;
}


function readJSON<T>(filePath: string, defaultValue: T): T {
    try {
        if (!fs.existsSync(filePath)) {
            writeJSON(filePath, defaultValue);
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        // Recovery: If file exists but is invalid JSON, overwrite with default to prevent persistent errors
        if (error instanceof SyntaxError) {
            try {
                fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
                console.log(`Recovered corrupted file: ${filePath}`);
            } catch (writeError) {
                console.error(`Failed to recover file ${filePath}:`, writeError);
            }
        }
        return defaultValue;
    }
}

function writeJSON<T>(filePath: string, data: T): void {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
}


function initializeDefaults() {
    const settings = readJSON<Record<string, string>>(FILES.settings, {});
    if (Object.keys(settings).length === 0) {
        settings['hero_title'] = 'Get Back on Road Fast';
        settings['hero_subtitle'] = 'Your reliable partner for roadside assistance';
        settings['contact_email'] = 'vehixapp@gmail.com';
        writeJSON(FILES.settings, settings);
    }

    readJSON<Inquiry[]>(FILES.inquiries, []);
    readJSON<LandingSection[]>(FILES.landingSections, []);
    readJSON<Record<string, UserPermission>>(FILES.userPermissions, {});

    // Initialize System Roles
    const roles = readJSON<Role[]>(FILES.roles, []);
    if (roles.length === 0) {
        // We can seed initial system roles later or let the UI handle it, 
        // but let's seed a Super Admin role for safety.
        const initialRoles: Role[] = [
            {
                id: 'SUPER_ADMIN',
                name: 'Super Admin',
                description: 'Full system access',
                permissions: [], // Empty implies all access in some systems, or we fill it. 
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
        readJSON<Role[]>(FILES.roles, []);
    }

    readJSON<Group[]>(FILES.groups, []);
    readJSON<Message[]>(FILES.messages, []);
}

initializeDefaults();

export function getInquiries(): Inquiry[] {
    const inquiries = readJSON<Inquiry[]>(FILES.inquiries, []);
    return inquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addInquiry(inquiry: Omit<Inquiry, 'id' | 'created_at' | 'is_replied'>): Inquiry {
    const inquiries = readJSON<Inquiry[]>(FILES.inquiries, []);
    const newId = inquiries.length > 0 ? Math.max(...inquiries.map(i => i.id)) + 1 : 1;

    const newInquiry: Inquiry = {
        id: newId,
        ...inquiry,
        is_replied: 0,
        created_at: new Date().toISOString(),
    };

    inquiries.push(newInquiry);
    writeJSON(FILES.inquiries, inquiries);
    return newInquiry;
}

export function deleteInquiry(id: number): boolean {
    const inquiries = readJSON<Inquiry[]>(FILES.inquiries, []);
    const filtered = inquiries.filter(i => i.id !== id);

    if (filtered.length === inquiries.length) {
        return false;
    }

    writeJSON(FILES.inquiries, filtered);
    return true;
}

export function getSettings(): Record<string, string> {
    return readJSON<Record<string, string>>(FILES.settings, {});
}

export function saveSetting(key: string, value: string): void {
    const settings = readJSON<Record<string, string>>(FILES.settings, {});
    settings[key] = value;
    writeJSON(FILES.settings, settings);
}

export function saveSettings(newSettings: Record<string, string>): void {
    const settings = readJSON<Record<string, string>>(FILES.settings, {});
    Object.assign(settings, newSettings);
    writeJSON(FILES.settings, settings);
}

export function getLandingSections(): LandingSection[] {
    const sections = readJSON<LandingSection[]>(FILES.landingSections, []);
    return sections.sort((a, b) => a.order_index - b.order_index);
}

export function addLandingSection(section: Omit<LandingSection, 'id'>): LandingSection {
    const sections = readJSON<LandingSection[]>(FILES.landingSections, []);
    const newId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1;

    const newSection: LandingSection = {
        id: newId,
        ...section,
    };

    sections.push(newSection);
    writeJSON(FILES.landingSections, sections);
    return newSection;
}

export function updateLandingSection(id: number, updates: Partial<Omit<LandingSection, 'id'>>): boolean {
    const sections = readJSON<LandingSection[]>(FILES.landingSections, []);
    const index = sections.findIndex(s => s.id === id);

    if (index === -1) {
        return false;
    }

    sections[index] = { ...sections[index], ...updates };
    writeJSON(FILES.landingSections, sections);
    return true;
}

export function deleteLandingSection(id: number): boolean {
    const sections = readJSON<LandingSection[]>(FILES.landingSections, []);
    const filtered = sections.filter(s => s.id !== id);

    if (filtered.length === sections.length) {
        return false;
    }

    writeJSON(FILES.landingSections, filtered);
    return true;
}

// --- Roles & Groups Functions ---

export function getRoles(): Role[] {
    return readJSON<Role[]>(FILES.roles, []);
}

export function getRole(id: string): Role | undefined {
    return getRoles().find(r => r.id === id);
}

export function addRole(role: Omit<Role, 'created_at' | 'updated_at'>): Role {
    const roles = getRoles();
    if (roles.some(r => r.id === role.id)) {
        throw new Error('Role ID already exists');
    }
    const newRole: Role = {
        ...role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    roles.push(newRole);
    writeJSON(FILES.roles, roles);
    return newRole;
}

export function updateRole(id: string, updates: Partial<Omit<Role, 'id' | 'created_at' | 'updated_at' | 'isSystem'>>): Role | null {
    const roles = getRoles();
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedRole = {
        ...roles[index],
        ...updates,
        updated_at: new Date().toISOString(),
    };
    roles[index] = updatedRole;
    writeJSON(FILES.roles, roles);
    return updatedRole;
}

export function deleteRole(id: string): boolean {
    const roles = getRoles();
    const role = roles.find(r => r.id === id);
    if (!role || role.isSystem) return false;

    const filtered = roles.filter(r => r.id !== id);
    writeJSON(FILES.roles, filtered);
    return true;
}

export function getGroups(): Group[] {
    return readJSON<Group[]>(FILES.groups, []);
}

export function getGroup(id: string): Group | undefined {
    return getGroups().find(g => g.id === id);
}

export function addGroup(group: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Group {
    const groups = getGroups();
    const newId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newGroup: Group = {
        id: newId,
        ...group,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    groups.push(newGroup);
    writeJSON(FILES.groups, groups);
    return newGroup;
}

export function updateGroup(id: string, updates: Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>): Group | null {
    const groups = getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) return null;

    const updatedGroup = {
        ...groups[index],
        ...updates,
        updated_at: new Date().toISOString(),
    };
    groups[index] = updatedGroup;
    writeJSON(FILES.groups, groups);
    return updatedGroup;
}

export function deleteGroup(id: string): boolean {
    const groups = getGroups();
    const filtered = groups.filter(g => g.id !== id);
    if (filtered.length === groups.length) return false;
    writeJSON(FILES.groups, filtered);
    return true;
}


export function getUserPermissions(userId: string): string[] | null {
    // 1. Get Direct Permissions
    const userPermissionsDB = readJSON<Record<string, UserPermission>>(FILES.userPermissions, {});
    const userPerm = userPermissionsDB[userId];
    const directPermissions = userPerm ? (JSON.parse(userPerm.permissions) as string[]) : [];

    // 2. Get Permissions from Groups
    const groups = getGroups();
    const roles = getRoles();

    const userGroups = groups.filter(g => g.memberIds.includes(userId));

    let groupPermissions: string[] = [];
    userGroups.forEach(group => {
        group.roleIds.forEach(roleId => {
            const role = roles.find(r => r.id === roleId);
            if (role && role.permissions) {
                groupPermissions = [...groupPermissions, ...role.permissions];
            }
        });
    });

    // 3. Merge and Unique
    const allPermissions = Array.from(new Set([...directPermissions, ...groupPermissions]));

    // If no direct permissions and no group permissions, return null or empty?
    // Start returning [] if found nothing, but maybe null if user has NO record at all?
    // The previous implementation returned null if !userPerm. 
    // But now we support groups even if no direct permissions exist.
    if (!userPerm && userGroups.length === 0) return null;

    return allPermissions;
}

export function saveUserPermissions(userId: string, perms: string[]): void {
    const permissions = readJSON<Record<string, UserPermission>>(FILES.userPermissions, {});

    permissions[userId] = {
        user_id: userId,
        permissions: JSON.stringify(perms),
        updated_at: new Date().toISOString(),
    };

    writeJSON(FILES.userPermissions, permissions);
}

// --- Messenger Functions ---

export function cleanupMessages(): void {
    const messages = readJSON<Message[]>(FILES.messages, []);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const filtered = messages.filter(m => m.timestamp > twentyFourHoursAgo);

    if (filtered.length !== messages.length) {
        writeJSON(FILES.messages, filtered);
    }
}

export function getMessages(): Message[] {
    cleanupMessages(); // Auto-cleanup on read
    return readJSON<Message[]>(FILES.messages, []);
}

export function addMessage(message: Omit<Message, 'id'>): Message {
    const messages = readJSON<Message[]>(FILES.messages, []);
    const newMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

export default db;
