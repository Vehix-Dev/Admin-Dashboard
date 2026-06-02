/**
 * Example: Adding Audit Logging to Roadies Management Page
 * 
 * This file shows how to integrate comprehensive audit logging into an existing admin page.
 * Copy these patterns to your roadies page or other admin management pages.
 * 
 * File: app/sys-admin/roadies/page.tsx
 */

// 1. Import the audit logger helper
import { logRoadieAction } from '@/lib/audit-logger';

// 2. Add these functions to your component:

/**
 * Example: Log roadie suspension/status change
 */
async function handleSuspendRoadie(roadie: RoadieWithThumbnail, reason?: string) {
  try {
    const newStatus = 'suspended';
    
    // Perform the API call
    await updateRoadieStatus(roadie.id, newStatus);
    
    // Log the action with comprehensive details
    await logRoadieAction(
      'Suspend Account',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      {
        status: roadie.status,
        is_verified: roadie.is_verified,
        rating: roadie.rating,
      },
      {
        status: newStatus,
      },
      {
        reason: reason || 'Violation of terms and conditions',
        suspension_type: 'account_suspension',
        timestamp: new Date().toISOString(),
      }
    );

    toast({
      title: "Success",
      description: "Roadie account has been suspended"
    });

    // Refresh the list
    fetchRoadies();
  } catch (error) {
    console.error('Failed to suspend roadie:', error);
    toast({
      title: "Error",
      description: "Failed to suspend roadie account",
      variant: "destructive"
    });
  }
}

/**
 * Example: Log roadie deletion
 */
async function handleDeleteRoadie(roadie: RoadieWithThumbnail) {
  try {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${roadie.first_name} ${roadie.last_name}?`
    );
    
    if (!confirmed) return;

    // Perform deletion
    await deleteRoadie(roadie.id);
    
    // Log with comprehensive details
    await logRoadieAction(
      'Delete Account',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      {
        status: roadie.status,
        email: roadie.email,
        phone: roadie.phone,
        rating: roadie.rating,
        total_rides: roadie.rides_completed,
        is_verified: roadie.is_verified,
      },
      null, // deleted = no new values
      {
        reason: 'Permanent account deletion',
        deletionReason: 'user_request_or_violation',
        timestamp: new Date().toISOString(),
      }
    );

    toast({
      title: "Success",
      description: "Roadie account permanently deleted"
    });

    fetchRoadies();
  } catch (error) {
    console.error('Failed to delete roadie:', error);
    toast({
      title: "Error",
      description: "Failed to delete roadie account",
      variant: "destructive"
    });
  }
}

/**
 * Example: Log roadie verification status change
 */
async function handleVerificationChange(roadie: RoadieWithThumbnail, newVerificationStatus: boolean) {
  try {
    // Update verification status
    await updateRoadie(roadie.id, { is_verified: newVerificationStatus });
    
    // Log the change
    await logRoadieAction(
      newVerificationStatus ? 'Verify Roadie' : 'Unverify Roadie',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      { is_verified: roadie.is_verified },
      { is_verified: newVerificationStatus },
      {
        verification_action: newVerificationStatus ? 'verified' : 'unverified',
        reason: newVerificationStatus ? 'Met verification requirements' : 'Failed verification',
      }
    );

    toast({
      title: "Success",
      description: `Roadie ${newVerificationStatus ? 'verified' : 'unverified'}`
    });

    fetchRoadies();
  } catch (error) {
    console.error('Failed to update verification:', error);
    toast({
      title: "Error",
      description: "Failed to update verification status",
      variant: "destructive"
    });
  }
}

/**
 * Example: Log bulk suspension (batch operation)
 */
async function handleBulkSuspend(selectedRoadies: RoadieWithThumbnail[], reason: string) {
  try {
    // Perform bulk suspension
    await bulkUpdateRoadies(
      selectedRoadies.map(r => r.id),
      { status: 'suspended' }
    );

    // Log each roadie's suspension
    for (const roadie of selectedRoadies) {
      await logRoadieAction(
        'Suspend Account (Bulk)',
        roadie.id,
        `${roadie.first_name} ${roadie.last_name}`,
        { status: roadie.status },
        { status: 'suspended' },
        {
          batch_operation: true,
          batch_size: selectedRoadies.length,
          reason,
          timestamp: new Date().toISOString(),
        }
      );
    }

    toast({
      title: "Success",
      description: `${selectedRoadies.length} roadies have been suspended`
    });

    fetchRoadies();
  } catch (error) {
    console.error('Failed to bulk suspend:', error);
    toast({
      title: "Error",
      description: "Failed to suspend selected roadies",
      variant: "destructive"
    });
  }
}

/**
 * Example: Log rating or documentation update
 */
async function handleUpdateRoadieProfile(roadie: RoadieWithThumbnail, updates: Record<string, any>) {
  try {
    // Update the profile
    await updateRoadie(roadie.id, updates);

    // Log the update with old and new values
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    Object.keys(updates).forEach(key => {
      oldValues[key] = (roadie as any)[key];
      newValues[key] = updates[key];
    });

    await logRoadieAction(
      'Update Profile',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      oldValues,
      newValues,
      {
        fields_updated: Object.keys(updates),
        update_count: Object.keys(updates).length,
      }
    );

    toast({
      title: "Success",
      description: "Roadie profile updated successfully"
    });

    fetchRoadies();
  } catch (error) {
    console.error('Failed to update profile:', error);
    toast({
      title: "Error",
      description: "Failed to update roadie profile",
      variant: "destructive"
    });
  }
}

/**
 * Example: Log document/compliance update
 */
async function handleDocumentUpload(roadie: RoadieWithThumbnail, documentType: string, status: 'approved' | 'rejected') {
  try {
    await updateRoadieDocument(roadie.id, documentType, status);

    await logRoadieAction(
      status === 'approved' ? 'Approve Document' : 'Reject Document',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      { [documentType]: 'pending' },
      { [documentType]: status },
      {
        document_type: documentType,
        approval_status: status,
        reviewer_notes: 'Document review completed',
        timestamp: new Date().toISOString(),
      }
    );

    toast({
      title: "Success",
      description: `Document ${status}`
    });

    fetchRoadies();
  } catch (error) {
    console.error('Failed to update document:', error);
    toast({
      title: "Error",
      description: "Failed to update document status",
      variant: "destructive"
    });
  }
}

/**
 * Integration into existing delete handler:
 * 
 * Replace your current handleDelete function with:
 */
const handleDelete = async (roadie: RoadieWithThumbnail) => {
  await handleDeleteRoadie(roadie);
};

/**
 * Integration into existing status toggle:
 * 
 * Replace your current status toggle with:
 */
const handleStatusChange = async (roadie: RoadieWithThumbnail) => {
  const newStatus = roadie.status === 'active' ? 'inactive' : 'active';
  try {
    await updateRoadieStatus(roadie.id, newStatus);
    
    await logRoadieAction(
      newStatus === 'active' ? 'Activate Account' : 'Deactivate Account',
      roadie.id,
      `${roadie.first_name} ${roadie.last_name}`,
      { status: roadie.status },
      { status: newStatus }
    );

    toast({
      title: "Success",
      description: `Roadie account ${newStatus === 'active' ? 'activated' : 'deactivated'}`
    });

    fetchRoadies();
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to update roadie status",
      variant: "destructive"
    });
  }
};

/**
 * What gets logged:
 * 
 * ✅ Admin who made the change (auto-detected from auth context)
 * ✅ Exact action (Suspend Account, Delete Account, Verify Roadie, etc.)
 * ✅ Roadie affected (name and ID)
 * ✅ Previous values (status, verification, etc.)
 * ✅ New values (updated status)
 * ✅ Additional context (reason, batch operation, document type, etc.)
 * ✅ Severity level (auto-detected: DELETE = critical, UPDATE = warning)
 * ✅ Exact timestamp
 * ✅ IP address and user agent (captured server-side if available)
 * 
 * All logs appear in: /sys-admin/users/audit
 */
