"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getAdminUsers, updateAdminUser, deleteAdminUser, type AdminUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Edit, Trash2, Shield, ShieldOff, Eye, EyeOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    // Permission checks
    const canChange = useCan(PERMISSIONS.ADMIN_USERS_CHANGE)
    const canDelete = useCan(PERMISSIONS.ADMIN_USERS_DELETE)
    const canAdd = useCan(PERMISSIONS.ADMIN_USERS_ADD)

    const fetchAdmins = async () => {
        setIsLoading(true)
        try {
            const data = await getAdminUsers()
            setAdmins(data)
        } catch (err) {
            console.error("[v0] Admin users fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load admin users data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAdmins()
    }, [])

    const handleDelete = async (admin: AdminUser) => {
        if (!confirm(`Are you sure you want to delete ${admin.first_name} ${admin.last_name}?`)) return
        try {
            await deleteAdminUser(admin.id)
            toast({
                title: "Success",
                description: "Admin user deleted successfully"
            })
            fetchAdmins()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to delete admin user",
                variant: "destructive"
            })
        }
    }

    const handleStatusToggle = async (admin: AdminUser) => {
        try {
            await updateAdminUser(admin.id, { is_active: !admin.is_active })
            toast({
                title: "Success",
                description: `Admin user ${!admin.is_active ? "enabled" : "disabled"} successfully`
            })
            fetchAdmins()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update admin user status",
                variant: "destructive"
            })
        }
    }

    const handleApprovalToggle = async (admin: AdminUser) => {
        try {
            await updateAdminUser(admin.id, { is_approved: !admin.is_approved })
            toast({
                title: "Success",
                description: `Admin user ${!admin.is_approved ? "approved" : "unapproved"} successfully`
            })
            fetchAdmins()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update admin user approval",
                variant: "destructive"
            })
        }
    }

    const handleEdit = (admin: AdminUser) => {
        window.location.href = `/admin/users/${admin.id}`
    }

    const columns: Column<AdminUser>[] = [
        { header: "ID", accessor: "external_id" as const },
        { header: "First Name", accessor: "first_name" as const },
        { header: "Last Name", accessor: "last_name" as const },
        { header: "Email", accessor: "email" as const },
        { header: "Phone", accessor: "phone" as const },
        { header: "Username", accessor: "username" as const },
        {
            header: "Role",
            accessor: "role" as const,
            cell: (value: string) => (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {value}
                </span>
            ),
        },
        {
            header: "Active",
            accessor: (row: AdminUser) => row.is_active,
            cell: (value: boolean, row: AdminUser) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={value}
                        onCheckedChange={() => handleStatusToggle(row)}
                        disabled={!canChange}
                        className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-xs font-medium ${value ? "text-green-700" : "text-red-700"}`}>
                        {value ? (
                            <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Active
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <EyeOff className="h-3 w-3" />
                                Disabled
                            </div>
                        )}
                    </span>
                </div>
            ),
        },
        {
            header: "Approved",
            accessor: (row: AdminUser) => row.is_approved,
            cell: (value: boolean, row: AdminUser) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={value}
                        onCheckedChange={() => handleApprovalToggle(row)}
                        disabled={!canChange}
                        className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-xs font-medium ${value ? "text-green-700" : "text-yellow-700"}`}>
                        {value ? (
                            <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Approved
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <ShieldOff className="h-3 w-3" />
                                Pending
                            </div>
                        )}
                    </span>
                </div>
            ),
        },
        {
            header: "Created",
            accessor: "created_at" as const,
            cell: (value: string) => new Date(value).toLocaleDateString(),
        },
    ]

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Admin Users</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage system administrators</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchAdmins}
                            className="gap-2 border-gray-300 bg-transparent"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                        <PermissionButton
                            permissions={PERMISSIONS.ADMIN_USERS_ADD}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.location.href = "/admin/users/add"}
                        >
                            <Plus className="h-4 w-4" />
                            New Admin
                        </PermissionButton>
                    </div>
                </div>

                {isLoading ? (
                    <Skeleton className="h-96 rounded" />
                ) : admins.length === 0 ? (
                    <EmptyState
                        title="No admin users found"
                        description="Add your first admin user to manage the system."
                        action={
                            canAdd ? (
                                <Link href="/admin/users/add">
                                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Plus className="h-4 w-4" />
                                        Add Admin User
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                ) : (
                    <DataTable
                        data={admins}
                        columns={columns}
                        onEdit={canChange ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        onExport={() => {
                            // Export logic here
                        }}
                    />
                )}
            </div>
        </ProtectedRoute>
    )
}