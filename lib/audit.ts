export interface AuditLog {
    id: string;
    action: string;
    module: string; // e.g., "Users", "Wallet", "Settings"
    target: string; // e.g., "User: John Doe"
    actor: string; // The admin who performed the action
    timestamp: string;
    severity?: 'info' | 'warning' | 'critical';
    ip?: string;
    userAgent?: string;
    oldValue?: any;
    newValue?: any;
    details?: any;
}

const STORAGE_KEY = 'vehix_audit_logs';

export const AuditService = {
    log: (action: string, module: string, target: string, actor: string, oldValue?: any, newValue?: any, details?: any, severity: 'info' | 'warning' | 'critical' = 'info') => {
        try {
            const logs = AuditService.getLogs();
            const newLog: AuditLog = {
                id: Math.random().toString(36).substr(2, 9),
                action,
                module,
                target,
                actor,
                severity,
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                oldValue,
                newValue,
                details
            };

            // Add to beginning of array
            logs.unshift(newLog);

            // Limit to 1000 logs to prevent storage issues
            if (logs.length > 1000) {
                logs.length = 1000;
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save audit log:', error);
        }
    },

    getLogs: (): AuditLog[] => {
        if (typeof window === 'undefined') return [];
        try {
            const logsData = localStorage.getItem(STORAGE_KEY);
            return logsData ? JSON.parse(logsData) : [];
        } catch (error) {
            console.error('Failed to retrieve audit logs:', error);
            return [];
        }
    }
};
