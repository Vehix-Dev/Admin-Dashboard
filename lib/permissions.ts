// Define all  permissions
export const PERMISSIONS = {
    // Admin Users
    ADMIN_USERS_VIEW: 'admin_users.view',
    ADMIN_USERS_ADD: 'admin_users.add',
    ADMIN_USERS_CHANGE: 'admin_users.change',
    ADMIN_USERS_DELETE: 'admin_users.delete',

    // Riders
    RIDERS_VIEW: 'riders.view',
    RIDERS_ADD: 'riders.add',
    RIDERS_CHANGE: 'riders.change',
    RIDERS_DELETE: 'riders.delete',
    RIDERS_APPROVE: 'riders.approve',

    // Roadies
    ROADIES_VIEW: 'roadies.view',
    ROADIES_ADD: 'roadies.add',
    ROADIES_CHANGE: 'roadies.change',
    ROADIES_DELETE: 'roadies.delete',
    ROADIES_APPROVE: 'roadies.approve',

    // Services
    SERVICES_VIEW: 'services.view',
    SERVICES_ADD: 'services.add',
    SERVICES_CHANGE: 'services.change',
    SERVICES_DELETE: 'services.delete',

    // Service Requests
    REQUESTS_VIEW: 'requests.view',
    REQUESTS_ADD: 'requests.add',
    REQUESTS_CHANGE: 'requests.change',
    REQUESTS_DELETE: 'requests.delete',
    REQUESTS_ASSIGN: 'requests.assign',

    // Dashboard
    DASHBOARD_VIEW: 'dashboard.view',

    // Live Map
    MAP_VIEW: 'map.view',

    // Moderation
    MEDIA_VIEW: 'media.view',
    MEDIA_MANAGE: 'media.manage',

    // Notifications
    NOTIFICATIONS_VIEW: 'notifications.view',
    NOTIFICATIONS_MANAGE: 'notifications.manage',
    EMAIL_SEND: 'notifications.email_send',

    // Referrals
    REFERRALS_VIEW: 'referrals.view',
    REFERRALS_MANAGE: 'referrals.manage',

    // Reports
    REPORTS_VIEW: 'reports.view',

    // Rodie Services
    RODIE_SERVICES_VIEW: 'rodie_services.view',
    RODIE_SERVICES_DELETE: 'rodie_services.delete',

    // Wallet
    WALLET_VIEW: 'wallet.view',
    WALLET_MANAGE: 'wallet.manage',

    // Support
    SUPPORT_VIEW: 'support.view',
    SUPPORT_MANAGE: 'support.manage',

    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_CHANGE: 'settings.change',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Define user roles and their permissions
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    VIEWER: 'VIEWER',
    OPERATOR: 'OPERATOR',
} as const

export type UserRole = keyof typeof ROLES

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    SUPER_ADMIN: Object.values(PERMISSIONS), // All permissions

    ADMIN: [
        // View everything
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        PERMISSIONS.SETTINGS_VIEW,

        // Manage users
        PERMISSIONS.ADMIN_USERS_VIEW,
        PERMISSIONS.ADMIN_USERS_ADD,
        PERMISSIONS.ADMIN_USERS_CHANGE,
        PERMISSIONS.ADMIN_USERS_DELETE,

        // Manage riders
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.RIDERS_ADD,
        PERMISSIONS.RIDERS_CHANGE,
        PERMISSIONS.RIDERS_DELETE,
        PERMISSIONS.RIDERS_APPROVE,

        // Manage roadies
        PERMISSIONS.ROADIES_VIEW,
        PERMISSIONS.ROADIES_ADD,
        PERMISSIONS.ROADIES_CHANGE,
        PERMISSIONS.ROADIES_DELETE,
        PERMISSIONS.ROADIES_APPROVE,

        // Manage services
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.SERVICES_ADD,
        PERMISSIONS.SERVICES_CHANGE,
        PERMISSIONS.SERVICES_DELETE,

        // Manage requests
        PERMISSIONS.REQUESTS_VIEW,
        PERMISSIONS.REQUESTS_ADD,
        PERMISSIONS.REQUESTS_CHANGE,
        PERMISSIONS.REQUESTS_DELETE,
        PERMISSIONS.REQUESTS_ASSIGN,

        // New Permissions
        PERMISSIONS.MEDIA_VIEW,
        PERMISSIONS.MEDIA_MANAGE,
        PERMISSIONS.NOTIFICATIONS_VIEW,
        PERMISSIONS.NOTIFICATIONS_MANAGE,
        PERMISSIONS.EMAIL_SEND,
        PERMISSIONS.REFERRALS_VIEW,
        PERMISSIONS.REFERRALS_MANAGE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.RODIE_SERVICES_VIEW,
        PERMISSIONS.RODIE_SERVICES_DELETE,
        PERMISSIONS.WALLET_VIEW,
        PERMISSIONS.WALLET_MANAGE,
        PERMISSIONS.SUPPORT_VIEW,
        PERMISSIONS.SUPPORT_MANAGE,
    ],

    MANAGER: [
        // View everything
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,

        // Manage riders (read-only)
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.RIDERS_APPROVE,

        // Manage roadies (read-only)
        PERMISSIONS.ROADIES_VIEW,
        PERMISSIONS.ROADIES_APPROVE,

        // View services
        PERMISSIONS.SERVICES_VIEW,

        // Manage requests
        PERMISSIONS.REQUESTS_VIEW,
        PERMISSIONS.REQUESTS_CHANGE,
        PERMISSIONS.REQUESTS_ASSIGN,
    ],

    VIEWER: [
        // View only
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.ROADIES_VIEW,
        PERMISSIONS.SERVICES_VIEW,
        PERMISSIONS.REQUESTS_VIEW,
    ],

    OPERATOR: [
        // Operational tasks
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MAP_VIEW,
        PERMISSIONS.REQUESTS_VIEW,
        PERMISSIONS.REQUESTS_CHANGE,
        PERMISSIONS.REQUESTS_ASSIGN,
        PERMISSIONS.RIDERS_VIEW,
        PERMISSIONS.ROADIES_VIEW,
    ],
}

// Helper functions
export function hasPermission(userRole: UserRole | null, permission: Permission): boolean {
    if (!userRole) return false
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function hasAnyPermission(userRole: UserRole | null, permissions: Permission[]): boolean {
    if (!userRole) return false
    return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole | null, permissions: Permission[]): boolean {
    if (!userRole) return false
    return permissions.every(permission => hasPermission(userRole, permission))
}

// Get user role from user object
export function getUserRole(user: any): UserRole {
    if (!user) return 'VIEWER'

    // 1. Try explicit role field
    if (user.role) {
        const roleStr = String(user.role).toUpperCase()
        if (Object.keys(ROLES).includes(roleStr)) {
            return roleStr as UserRole
        }
    }

    // 2. Try inferred roles
    if (user.is_superuser) return 'SUPER_ADMIN'

    // Often 'is_staff' means 'ADMIN' in Django default
    if (user.is_staff) return 'ADMIN'

    // 3. Fallback
    return 'VIEWER'
}