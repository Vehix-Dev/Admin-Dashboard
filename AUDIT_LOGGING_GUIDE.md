# Admin Audit Logging Implementation Guide

## Overview

The audit logging system tracks all admin actions with:
- **Clear action descriptions** - What was done
- **Admin identification** - Who did it
- **Target information** - What was affected
- **Change details** - Old vs. new values
- **Severity levels** - Critical, Warning, Info
- **Timestamps** - When it happened

## Quick Start

### Basic Usage

```typescript
import { logAdminAction } from '@/lib/audit-logger';

// Log an admin action
await logAdminAction({
  action: 'Delete User',
  module: 'Users',
  target: 'john.doe@example.com',
  targetId: 123,
  targetType: 'User',
  severity: 'critical',
  description: 'Permanently deleted user account',
});
```

### Using Helper Functions

The library provides specialized helpers for common scenarios:

```typescript
import { logUserAction, logRoadieAction, logModerationAction } from '@/lib/audit-logger';

// Log user management action
await logUserAction(
  'Delete',
  userId,
  username,
  { is_active: true }, // old value
  { is_active: false }, // new value
);

// Log roadie action
await logRoadieAction(
  'Disable Account',
  roadieId,
  roadieName,
  { status: 'active' },
  { status: 'disabled' },
);

// Log moderation action
await logModerationAction(
  'Reject Media',
  mediaId,
  'Image',
  'profile_photo.jpg',
  { reason: 'Inappropriate content' },
);
```

## Implementation Examples

### 1. User Management - Delete Action

**File:** `app/sys-admin/users/page.tsx`

```typescript
import { logUserAction } from '@/lib/audit-logger';

const handleDelete = async (admin: AdminUser) => {
  try {
    await deleteAdminUser(admin.id);

    // Log the action
    await logUserAction(
      'Delete User',
      admin.id,
      admin.username,
      {
        email: admin.email,
        role: admin.role,
        is_active: admin.is_active,
      },
      null, // deleted = no new value
      {
        reason: 'User deletion',
        permanent: true,
      },
    );

    toast({
      title: "Success",
      description: "Admin user deleted successfully"
    });
    fetchAdmins();
  } catch (err) {
    toast({
      title: "Error",
      description: err.message || "Failed to delete admin user",
      variant: "destructive"
    });
  }
};
```

### 2. User Management - Status Toggle

```typescript
const handleStatusToggle = async (admin: AdminUser) => {
  const newStatus = !admin.is_active;
  
  try {
    await updateAdminUser(admin.id, { is_active: newStatus });

    // Log the action
    await logUserAction(
      newStatus ? 'Enable User' : 'Disable User',
      admin.id,
      admin.username,
      { is_active: admin.is_active },
      { is_active: newStatus },
      {
        action: newStatus ? 'enabled' : 'disabled',
        previous_status: admin.is_active,
      },
    );

    toast({
      title: "Success",
      description: `User ${newStatus ? 'enabled' : 'disabled'}`
    });
    fetchAdmins();
  } catch (err) {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive"
    });
  }
};
```

### 3. Roadies Management - Suspend Action

**File:** `app/sys-admin/roadies/page.tsx`

```typescript
import { logRoadieAction } from '@/lib/audit-logger';

const handleSuspendRoadie = async (roadie: Roadie) => {
  try {
    await updateRoadie(roadie.id, { status: 'suspended' });

    await logRoadieAction(
      'Suspend Account',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      { status: roadie.status },
      { status: 'suspended' },
      {
        reason: 'Violation of terms',
        suspension_type: 'temporary',
      },
    );

    toast({ title: "Success", description: "Roadie account suspended" });
  } catch (err) {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive"
    });
  }
};
```

### 4. Media Moderation - Approve/Reject

**File:** `app/sys-admin/moderation/media/page.tsx`

```typescript
import { logModerationAction } from '@/lib/audit-logger';

const handleUpdateStatus = async (image: AdminImage, status: 'APPROVED' | 'REJECTED') => {
  try {
    await updateImageStatus(image.id, status);

    await logModerationAction(
      status === 'APPROVED' ? 'Approve Media' : 'Reject Media',
      image.id,
      'Image',
      `${image.user_type}:${image.user_id}`,
      {
        previous_status: image.status,
        new_status: status,
        file_name: image.file_name,
        user_type: image.user_type,
      },
    );

    toast({
      title: "Success",
      description: `Image ${status.toLowerCase()} successfully`
    });
    fetchImages();
  } catch (err) {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive"
    });
  }
};
```

### 5. System Settings - Configuration Change

**File:** `app/sys-admin/settings/page.tsx`

```typescript
import { logSystemAction } from '@/lib/audit-logger';

const handleUpdateSettings = async (newSettings: SystemSettings) => {
  try {
    const oldSettings = await getSystemSettings();
    await updateSystemSettings(newSettings);

    await logSystemAction(
      'Update System Settings',
      oldSettings,
      newSettings,
      {
        settings_type: 'global',
        changed_fields: Object.keys(newSettings),
      },
    );

    toast({
      title: "Success",
      description: "System settings updated successfully"
    });
  } catch (err) {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive"
    });
  }
};
```

### 6. Batch Operations

```typescript
import { logUserAction } from '@/lib/audit-logger';

const handleBulkApprove = async (selectedIds: number[]) => {
  try {
    // Perform the bulk operation
    await bulkApproveUsers(selectedIds);

    // Log each affected user
    for (const userId of selectedIds) {
      const user = users.find(u => u.id === userId);
      if (user) {
        await logUserAction(
          'Approve User',
          userId,
          user.username,
          { is_approved: false },
          { is_approved: true },
          { batch_operation: true },
        );
      }
    }

    toast({
      title: "Success",
      description: `${selectedIds.length} users approved`
    });
  } catch (err) {
    toast({
      title: "Error",
      description: err.message,
      variant: "destructive"
    });
  }
};
```

## Audit Log Display

### Viewing Logs

Visit the audit logs page at: `/sys-admin/users/audit`

Features:
- **Real-time viewing** - See actions as they happen
- **Severity filtering** - Critical, Warning, Info
- **Module filtering** - Filter by Users, Services, Roadies, etc.
- **Search** - Find actions by admin name, action type, or target
- **Diff viewer** - Click "Detail Diff" to see before/after changes
- **Statistics** - View critical action count and unique admin count

### Log Details

Each log entry includes:
- **Timestamp** - Date and time of action
- **Severity** - Visual indicator (🔴 Critical, ⚠️ Warning, ℹ️ Info)
- **Action** - What was done (e.g., "Delete User")
- **Module** - Category (Users, Services, Roadies, etc.)
- **Admin (Actor)** - Which admin performed the action
- **Target** - What was affected (user, roadie, file, etc.)
- **Details** - Before/after comparison of changes

## API Integration

The audit logger automatically:
1. **Logs to localStorage** - Immediate real-time display
2. **Sends to backend API** - `/sys-api/auth/audit-log/` endpoint
3. **Handles failures gracefully** - Local logging succeeds even if backend fails

### Backend Expected Format

```typescript
POST /sys-api/auth/audit-log/
{
  "action_type": "Delete User",
  "action_description": "User permanently deleted",
  "target_entity_type": "User",
  "target_entity_id": "123",
  "target_username": "john.doe",
  "changes": {
    "old": { /* previous values */ },
    "new": { /* new values */ },
  },
  "severity": "critical"
}
```

## Severity Levels

### Critical (🔴)
- User deletion
- Permission changes
- Role modifications
- Account suspension/ban
- Password resets
- System purges

### Warning (⚠️)
- User updates
- Account disabling
- Feature overrides
- Configuration changes
- Data modifications

### Info (ℹ️)
- User creation
- View access
- Data retrieval
- Routine operations
- Settings queries

## Best Practices

1. **Always log destructive actions** - Deletes, suspensions, bans
2. **Include context** - Reason, justification, or notes
3. **Capture before/after** - Use oldValue/newValue for updates
4. **Use appropriate severity** - Let the system auto-detect or set explicitly
5. **Be descriptive** - Use clear action names and descriptions
6. **Handle errors gracefully** - Don't let logging failures break operations
7. **Include details** - Extra context in the details object
8. **Consistent naming** - Use verb+object format (e.g., "Delete User", "Approve Media")

## Troubleshooting

### Logs not appearing

1. Check browser console for errors
2. Verify admin profile is loading
3. Check localStorage for audit logs
4. Ensure PERMISSIONS.ADMIN_USERS_VIEW is granted

### Missing old/new values

1. Capture values before and after action
2. Ensure objects are serializable
3. Check for circular references

### Backend integration issues

1. Verify `/sys-api/auth/audit-log/` endpoint exists
2. Check authentication headers
3. Review backend error logs
4. Local logging should still work as fallback

## Common Patterns

### Pattern: Approval Workflow

```typescript
const handleApprove = async (itemId: number, itemName: string) => {
  await logAdminAction({
    action: 'Approve Item',
    module: 'Approvals',
    target: itemName,
    targetId: itemId,
    targetType: 'Item',
    oldValue: { status: 'pending' },
    newValue: { status: 'approved' },
    severity: 'warning',
  });
};
```

### Pattern: Data Import

```typescript
const handleImportData = async (count: number, source: string) => {
  await logSystemAction(
    'Import Data',
    null,
    { count },
    { source, import_type: 'bulk', timestamp: new Date().toISOString() },
  );
};
```

### Pattern: Permission Changes

```typescript
const handlePermissionChange = async (userId: number, username: string, permissions: string[]) => {
  await logUserAction(
    'Update Permissions',
    userId,
    username,
    { permissions: oldPermissions },
    { permissions: permissions },
    { permission_count: permissions.length },
  );
};
```

---

**Note:** This audit logging system is designed to be production-ready and includes comprehensive error handling to ensure that logging failures never disrupt the admin interface.
