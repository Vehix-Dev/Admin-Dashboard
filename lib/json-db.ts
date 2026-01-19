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

export function getUserPermissions(userId: string): string[] | null {
    const permissions = readJSON<Record<string, UserPermission>>(FILES.userPermissions, {});
    const userPerm = permissions[userId];

    if (!userPerm) return null;

    try {
        return JSON.parse(userPerm.permissions);
    } catch (e) {
        console.error("Failed to parse permissions json", e);
        return [];
    }
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
};

export default db;
