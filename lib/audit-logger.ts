/**
 * Enhanced Audit Logger for Admin Actions
 * 
 * Provides a clean, consistent API for logging admin actions throughout the dashboard.
 * All logs are sent to both the backend API and stored locally for real-time display.
 */

import { AuditService, type AuditLog } from './audit';
import { getAdminProfile } from './auth';

export interface AdminAction {
  action: string;
  module: string;
  target?: string;
  targetId?: string | number;
  targetType?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  details?: Record<string, any>;
  severity?: 'info' | 'warning' | 'critical';
  description?: string;
}

/**
 * Get the current admin user's name for logging
 */
async function getCurrentAdminName(): Promise<string> {
  try {
    const profile = await getAdminProfile();
    return profile?.username || profile?.name || profile?.email || 'Unknown Admin';
  } catch (error) {
    console.warn('Failed to get admin profile for audit logging:', error);
    return 'Unknown Admin';
  }
}

/**
 * Determine severity level based on action
 */
function determineSeverity(action: string): 'info' | 'warning' | 'critical' {
  const criticalActions = [
    'DELETE',
    'PERMANENT_DELETE',
    'SUSPEND',
    'BAN',
    'DISABLE',
    'DEACTIVATE',
    'REMOVE',
    'PURGE',
    'ROLE_CHANGE',
    'PERMISSION_UPDATE',
    'PASSWORD_RESET'
  ];

  const warningActions = [
    'UPDATE',
    'MODIFY',
    'EDIT',
    'CHANGE',
    'OVERRIDE',
    'FORCE'
  ];

  const actionUpper = action.toUpperCase();

  if (criticalActions.some(a => actionUpper.includes(a))) {
    return 'critical';
  }
  if (warningActions.some(a => actionUpper.includes(a))) {
    return 'warning';
  }
  return 'info';
}

/**
 * Format the target description
 */
function formatTarget(target?: string, targetId?: string | number, targetType?: string): string {
  if (target) return target;
  
  let formatted = targetType || 'Entity';
  if (targetId) formatted += ` (${targetId})`;
  
  return formatted || 'System';
}

/**
 * Main audit logging function
 */
export async function logAdminAction(action: AdminAction): Promise<void> {
  try {
    const adminName = await getCurrentAdminName();
    const severity = action.severity || determineSeverity(action.action);
    const target = formatTarget(action.target, action.targetId, action.targetType);

    // Create a comprehensive description
    const description = action.description || `${action.action} on ${action.module}`;

    // Log to localStorage and local audit service
    AuditService.log(
      action.action,
      action.module,
      target,
      adminName,
      action.oldValue,
      action.newValue,
      {
        ...action.details,
        description,
        targetId: action.targetId,
        targetType: action.targetType,
      },
      severity
    );

    // Send to backend API if available
    await logToBackendAPI({
      action,
      adminName,
      severity,
      target,
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failures shouldn't break the admin UI
  }
}

/**
 * Helper to log user-related actions
 */
export async function logUserAction(
  action: string,
  userId: string | number,
  username: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction({
    action,
    module: 'Users',
    target: `${username} (${userId})`,
    targetId: userId,
    targetType: 'User',
    oldValue,
    newValue,
    details,
    severity: determineSeverity(action),
  });
}

/**
 * Helper to log service-related actions
 */
export async function logServiceAction(
  action: string,
  serviceId: string | number,
  serviceName: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction({
    action,
    module: 'Services',
    target: `${serviceName} (${serviceId})`,
    targetId: serviceId,
    targetType: 'Service',
    oldValue,
    newValue,
    details,
    severity: determineSeverity(action),
  });
}

/**
 * Helper to log roadie-related actions
 */
export async function logRoadieAction(
  action: string,
  roadieId: string | number,
  roadieName: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction({
    action,
    module: 'Roadies',
    target: `${roadieName} (${roadieId})`,
    targetId: roadieId,
    targetType: 'Roadie',
    oldValue,
    newValue,
    details,
    severity: determineSeverity(action),
  });
}

/**
 * Helper to log rider-related actions
 */
export async function logRiderAction(
  action: string,
  riderId: string | number,
  riderName: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction({
    action,
    module: 'Riders',
    target: `${riderName} (${riderId})`,
    targetId: riderId,
    targetType: 'Rider',
    oldValue,
    newValue,
    details,
    severity: determineSeverity(action),
  });
}

/**
 * Helper to log moderation actions
 */
export async function logModerationAction(
  action: string,
  targetId: string | number,
  targetType: string,
  targetName?: string,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction({
    action,
    module: 'Moderation',
    target: targetName ? `${targetName} (${targetId})` : `${targetType} (${targetId})`,
    targetId,
    targetType,
    details,
    severity: determineSeverity(action),
  });
}

/**
 * Helper to log system/settings actions
 */
export async function logSystemAction(
  action: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction({
    action,
    module: 'System',
    target: 'System Settings',
    oldValue,
    newValue,
    details,
    severity: determineSeverity(action),
  });
}

/**
 * Get formatted audit logs for display
 */
export function getFormattedAuditLogs(): AuditLog[] {
  return AuditService.getLogs();
}

/**
 * Send audit log to backend API
 */
async function logToBackendAPI(params: {
  action: AdminAction;
  adminName: string;
  severity: string;
  target: string;
}): Promise<void> {
  try {
    // Only attempt if we have the backend endpoint
    const response = await fetch('/sys-api/auth/audit-log/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action_type: params.action.action,
        action_description: params.action.description || params.action.action,
        target_entity_type: params.action.targetType,
        target_entity_id: params.action.targetId?.toString(),
        target_username: params.target,
        changes: {
          old: params.action.oldValue,
          new: params.action.newValue,
          ...params.action.details,
        },
        severity: params.severity,
      }),
    });

    if (!response.ok) {
      console.warn('Backend audit logging failed:', response.status);
      // Don't throw - let local logging succeed even if backend fails
    }
  } catch (error) {
    console.warn('Failed to send audit log to backend:', error);
    // Silently fail - local logging should still work
  }
}
