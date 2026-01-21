"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getAdminUsers, updateAdminUser, deleteAdminUser, type AdminUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Shield, ShieldOff, Eye, EyeOff, Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AuditService } from "@/lib/audit"
import { getAdminProfile } from "@/lib/auth"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminUsersPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)
    const { toast } = useToast()

    // Permission checks
    const canChange = useCan(PERMISSIONS.ADMIN_USERS_CHANGE)
    const canDelete = useCan(PERMISSIONS.ADMIN_USERS_DELETE)
    const canAdd = useCan(PERMISSIONS.ADMIN_USERS_ADD)
    const canDisable = useCan(PERMISSIONS.ADMIN_USERS_DISABLE)
    const canApprove = useCan(PERMISSIONS.ADMIN_USERS_APPROVE)

    // Approval implies Disable permission
    const hasDisablePermission = canDisable || canApprove

    const fetchAdmins = async () => {
        setIsLoading(true)
        try {
            const data = await getAdminUsers()
            setAdmins(data)
        } catch (err) {
            console.error(" Admin users fetch error:", err)
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
        try {
            await deleteAdminUser(admin.id)

            // Audit Log
            const currentUser = await getAdminProfile()
            AuditService.log(
                "Delete User",
                `User: ${admin.first_name} ${admin.last_name} (${admin.username})`,
                currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
                { userId: admin.id, email: admin.email }
            )

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

            // Audit Log
            const currentUser = await getAdminProfile()
            AuditService.log(
                !admin.is_active ? "Enable User" : "Disable User",
                `User: ${admin.first_name} ${admin.last_name} (${admin.username})`,
                currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
                { userId: admin.id, newState: !admin.is_active }
            )

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

            // Audit Log
            const currentUser = await getAdminProfile()
            AuditService.log(
                !admin.is_approved ? "Approve User" : "Unapprove User",
                `User: ${admin.first_name} ${admin.last_name} (${admin.username})`,
                currentUser?.username || currentUser?.name || currentUser?.email || "Unknown",
                { userId: admin.id, newState: !admin.is_approved }
            )

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

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
    }

    const filteredAdmins = admins.filter(admin => {
        if (!startDate && !endDate) return true
        const requestDate = new Date(admin.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(requestDate, { start, end })
    })

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
                <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded border border-blue-500/20">
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
                        disabled={!hasDisablePermission}
                        className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-xs font-medium ${value ? "text-emerald-500" : "text-destructive"}`}>
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
                        disabled={!canApprove}
                        className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-xs font-medium ${value ? "text-emerald-500" : "text-amber-500"}`}>
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
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Users</h2>
                        <p className="text-sm text-muted-foreground mt-1">Manage system administrators</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2 h-10"
                        >
                            <Filter className="h-4 w-4" />
                            {showFilters ? "Hide Filters" : "Date Filters"}
                        </Button>
                        <PermissionButton
                            permissions={PERMISSIONS.ADMIN_USERS_ADD}
                            className="gap-2 bg-primary hover:bg-primary/90 text-white h-10"
                            onClick={() => window.location.href = "/admin/users/add"}
                        >
                            <Plus className="h-4 w-4" />
                            New Admin
                        </PermissionButton>
                        <Link href="/admin/users/audit">
                            <Button variant="outline" className="gap-2 h-10">
                                <Filter className="h-4 w-4" /> {/* Reusing Filter icon for now or use FileText if available */}
                                Audit Logs
                            </Button>
                        </Link>
                    </div>
                </div>

                {showFilters && (
                    <Card className="border-primary/20 bg-primary/5 transition-all">
                        <CardContent className="p-4 flex flex-wrap items-end gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Start Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[160px] justify-start text-left font-normal h-10 border-border bg-card",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                            {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">End Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[160px] justify-start text-left font-normal h-10 border-border bg-card",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                            {endDate ? format(endDate, "MMM d, yyyy") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground hover:text-foreground h-10 px-4"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Reset Range
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <Skeleton className="h-96 rounded" />
                ) : filteredAdmins.length === 0 ? (
                    <EmptyState
                        title={startDate || endDate ? "No admins in range" : "No admin users found"}
                        description={startDate || endDate ? "Try adjusting your filters." : "Add your first admin user to manage the system."}
                        action={
                            canAdd && !startDate && !endDate ? (
                                <Link href="/admin/users/add">
                                    <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
                                        <Plus className="h-4 w-4" />
                                        Add Admin User
                                    </Button>
                                </Link>
                            ) : (startDate || endDate) ? (
                                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <DataTable
                        data={filteredAdmins}
                        columns={columns}
                        onEdit={canChange ? handleEdit : undefined}
                        onDelete={canDelete ? handleDelete : undefined}
                        deleteConfirmTitle={(admin) => `Delete ${admin.first_name} ${admin.last_name}?`}
                        deleteConfirmDescription={(admin) => `Are you sure you want to delete this admin user?`}
                        renderConfirmDetails={(admin) => (
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">{admin.first_name} {admin.last_name}</span>
                                <span className="text-slate-400 text-xs">{admin.email}</span>
                                <span className="text-blue-400 text-[10px] mt-1 uppercase tracking-wider font-bold">Role: {admin.role}</span>
                            </div>
                        )}
                        initialSortColumn={9}
                        initialSortDirection="desc"
                        onExport={() => {
                            // Export logic here
                        }}
                    />
                )}
            </div>
        </ProtectedRoute>
    )
}
