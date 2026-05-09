"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getPendingDeletionUsers, updateAdminUser, permanentlyDeleteUser, type AdminUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { RefreshCw, ArrowLeft, Clock, Trash2 } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function PendingDeletionRequestsPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchPendingUsers = async () => {
    setIsLoading(true)
    try {
      const data = await getPendingDeletionUsers()
      setUsers(data)
    } catch (err: any) {
      console.error("Failed to load pending deletion requests", err)
      toast({
        title: "Error",
        description: err.message || "Unable to load deletion requests.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const handleCancelRequest = async (user: AdminUser) => {
    try {
      await updateAdminUser(user.id, {
        deletion_status: null,
        deletion_requested_at: null,
        deletion_reason: null,
      })
      toast({
        title: "Success",
        description: `Deletion request for ${user.username} has been cancelled.`,
      })
      fetchPendingUsers()
    } catch (err: any) {
      console.error("Failed to cancel deletion request", err)
      toast({
        title: "Error",
        description: err.message || "Unable to cancel deletion request.",
        variant: "destructive",
      })
    }
  }

  const handlePermanentDelete = async (user: AdminUser) => {
    try {
      await permanentlyDeleteUser(user.id, user.role)
      toast({
        title: "Success",
        description: `${user.username} has been permanently deleted.`,
      })
      fetchPendingUsers()
    } catch (err: any) {
      console.error("Failed to permanently delete user", err)
      toast({
        title: "Error",
        description: err.message || "Unable to permanently delete user.",
        variant: "destructive",
      })
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      header: "External ID",
      accessor: "external_id" as const,
      cell: (value: string) => <span className="font-mono text-xs text-muted-foreground">{value}</span>,
    },
    {
      header: "Name",
      accessor: (row: AdminUser) => `${row.first_name} ${row.last_name}`,
      cell: (value: string, row: AdminUser) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-xs text-muted-foreground">@{row.username}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessor: "email" as const,
    },
    {
      header: "Phone",
      accessor: "phone" as const,
    },
    {
      header: "Role",
      accessor: "role" as const,
      cell: (value: string) => (
        <Badge variant="outline" className="text-xs uppercase">
          {value}
        </Badge>
      ),
    },
    {
      header: "Requested At",
      accessor: "deletion_requested_at" as const,
      cell: (value: string | null) => value ? format(new Date(value), "MMM dd, yyyy h:mm a") : "—",
    },
    {
      header: "Reason",
      accessor: "deletion_reason" as const,
      cell: (value: string | null) => value ? <span className="whitespace-pre-wrap text-sm">{value}</span> : "—",
    },
    {
      header: "Status",
      accessor: "deletion_status" as const,
      cell: (value: string | null) => (
        <Badge variant="destructive" className="text-xs uppercase">
          {value || "None"}
        </Badge>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Pending Deletion Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and cancel deletion requests submitted by users.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/sys-admin/users">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Admin Users
              </Button>
            </Link>
            <Link href="/sys-admin/users/deleted">
              <Button variant="secondary" className="gap-2">
                <Trash2 className="h-4 w-4" /> Deleted Admins
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-border bg-card p-4 w-full md:w-1/3">
            <div className="text-sm text-muted-foreground">Pending Requests</div>
            <div className="text-3xl font-bold mt-2">{users.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 w-full md:w-1/3">
            <div className="text-sm text-muted-foreground">Latest Request</div>
            <div className="text-lg font-semibold mt-2">
              {users[0]?.deletion_requested_at ? format(new Date(users[0].deletion_requested_at), "MMM dd, yyyy") : "N/A"}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 w-full md:w-1/3">
            <div className="text-sm text-muted-foreground">Review Action</div>
            <div className="text-lg font-semibold mt-2">Cancel or inspect requests</div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-96 rounded bg-slate-900/10 animate-pulse" />
        ) : users.length === 0 ? (
          <EmptyState
            title="No pending deletion requests"
            description="No users have submitted deletion requests at this time."
          />
        ) : (
          <DataTable
            data={users}
            columns={columns}
            onRestore={handleCancelRequest}
            onDelete={handlePermanentDelete}
            restoreConfirmTitle={(user) => `Cancel deletion request for ${user.username}?`}
            restoreConfirmDescription={(user) => `This will remove the pending deletion request and keep ${user.first_name} ${user.last_name} active on the platform.`}
            deleteConfirmTitle={(user) => `Permanently delete ${user.username}?`}
            deleteConfirmDescription={(user) => `This will permanently delete ${user.first_name} ${user.last_name} and all associated data. This action cannot be undone.`}
            title="Pending Deletion Requests"
            defaultSortBy="externalId"
            initialSortDirection="desc"
            externalIdKey="external_id"
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
