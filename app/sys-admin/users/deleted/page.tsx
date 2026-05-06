"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getDeletedAdminUsers, restoreAdminUser, type DeletedAdminUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { UserX, Calendar as CalendarIcon, Filter, X, RotateCcw, Shield, Mail, Clock } from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function DeletedUsersPage() {
    const [deletedAdmins, setDeletedAdmins] = useState<DeletedAdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)
    const { toast } = useToast()

    const fetchDeletedAdmins = async () => {
        setIsLoading(true)
        try {
            const data = await getDeletedAdminUsers()
            // Filter to only include users with role "ADMIN"
            const adminOnlyUsers = data.filter(user => user.role?.toUpperCase() === "ADMIN")
            setDeletedAdmins(adminOnlyUsers)
        } catch (err) {
            console.error("Deleted admin users fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load deleted admin users data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDeletedAdmins()
    }, [])

    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return format(date, "MMM dd, yyyy 'at' h:mm a")
    }

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
    }

    const handleRestore = async (admin: DeletedAdminUser) => {
        try {
            await restoreAdminUser(Number(admin.id))
            toast({
                title: "Success",
                description: `Admin user ${admin.username} has been restored successfully.`,
            })
            fetchDeletedAdmins()
        } catch (err) {
            console.error("Restore error:", err)
            toast({
                title: "Error",
                description: "Failed to restore admin user. Please try again.",
                variant: "destructive",
            })
        }
    }

    const filteredAdmins = deletedAdmins.filter(admin => {
        if (!startDate && !endDate) return true
        const deletionDate = new Date(admin.deleted_at || admin.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(deletionDate, { start, end })
    })

    const columns: Column<DeletedAdminUser>[] = [
        {
            header: "ID",
            accessor: "external_id" as const,
            cell: (value: string) => (
                <span className="font-mono text-xs text-muted-foreground">#{value}</span>
            )
        },
        {
            header: "Full Name",
            accessor: (row: DeletedAdminUser) => `${row.first_name} ${row.last_name}`,
            cell: (value: string, row: DeletedAdminUser) => (
                <div className="flex flex-col">
                    <span className="font-medium">{value}</span>
                    <span className="text-xs text-muted-foreground">@{row.username}</span>
                </div>
            )
        },
        {
            header: "Email",
            accessor: "email" as const,
            cell: (value: string) => (
                <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{value}</span>
                </div>
            )
        },
        {
            header: "Role",
            accessor: "role" as const,
            cell: (value: string) => (
                <Badge variant="destructive" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {value}
                </Badge>
            ),
        },
        {
            header: "NIN",
            accessor: "nin" as const,
            cell: (value: string) => (
                <span className="font-mono text-xs">{value || '—'}</span>
            )
        },
        {
            header: "Wallet Balance",
            accessor: (row: DeletedAdminUser) => row.wallet?.balance || "0.00",
            cell: (value: string) => (
                <Badge variant={parseFloat(value) > 0 ? "success" : "secondary"} className="font-mono">
                    {formatCurrency(value)}
                </Badge>
            )
        },
        {
            header: "Deleted On",
            accessor: (row: DeletedAdminUser) => row.deleted_at || row.created_at,
            cell: (value: string) => (
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-xs">{formatDate(value)}</span>
                </div>
            ),
        },
    ]

    const stats = {
        total: filteredAdmins.length,
        totalBalance: filteredAdmins.reduce((sum, admin) => sum + parseFloat(admin.wallet?.balance || "0"), 0),
        uniqueRoles: [...new Set(filteredAdmins.map(admin => admin.role))].length,
    }

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">
                            Deleted Admin Users
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                            View and restore permanently deleted administrator accounts
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={showFilters ? "default" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2 h-10 font-mono"
                        >
                            <Filter className="h-4 w-4" />
                            {showFilters ? "Hide Filters" : "Filter by Date"}
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Deleted Admins</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <UserX className="h-8 w-8 text-destructive/60" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Wallet Value</p>
                                    <p className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
                                </div>
                                <Shield className="h-8 w-8 text-primary/60" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Unique Roles</p>
                                    <p className="text-2xl font-bold">{stats.uniqueRoles}</p>
                                </div>
                                <Clock className="h-8 w-8 text-muted-foreground/60" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {showFilters && (
                    <Card className="border-primary/20 bg-primary/5 transition-all">
                        <CardContent className="p-4 flex flex-wrap items-end gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">
                                    Deleted From
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[180px] justify-start text-left font-mono text-xs h-10 border-border bg-card",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                            {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
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
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">
                                    Deleted To
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[180px] justify-start text-left font-mono text-xs h-10 border-border bg-card",
                                                !endDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                            {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
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
                                    className="text-muted-foreground hover:text-foreground h-10 px-4 font-mono text-xs"
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
                        title={startDate || endDate ? "No admin deletions in range" : "No deleted admin users found"}
                        description={startDate || endDate
                            ? "No administrator accounts were deleted during the selected period."
                            : "There are currently no deleted administrator accounts in the system."}
                        icon={UserX}
                        action={(startDate || endDate) ? (
                            <Button variant="outline" onClick={clearFilters} className="font-mono">
                                Clear Filters
                            </Button>
                        ) : undefined}
                    />
                ) : (
                    <>
                        <div className="text-sm text-muted-foreground mb-2">
                            Showing {filteredAdmins.length} deleted admin {filteredAdmins.length === 1 ? 'account' : 'accounts'}
                        </div>
                        <DataTable
                            data={filteredAdmins}
                            columns={columns}
                            initialSortColumn={6}
                            initialSortDirection="desc"
                            onRestore={handleRestore}
                            restoreConfirmTitle={(admin) => `Restore Admin: ${admin.username}?`}
                            restoreConfirmDescription={(admin) => `This action will restore ${admin.first_name} ${admin.last_name}'s administrator account with all previous permissions and data.`}
                            renderConfirmDetails={(admin) => (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-white">
                                        <Shield className="h-4 w-4 text-destructive" />
                                        <span className="font-medium">{admin.first_name} {admin.last_name}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-400">Email:</span>
                                            <span className="text-white ml-2">{admin.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Username:</span>
                                            <span className="text-white ml-2">@{admin.username}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Role:</span>
                                            <Badge variant="destructive" className="ml-2 text-[10px]">{admin.role}</Badge>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Wallet:</span>
                                            <span className="text-emerald-400 ml-2">{formatCurrency(admin.wallet?.balance || "0")}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-amber-400/80 mt-1">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        Deleted on: {formatDate(admin.deleted_at || admin.created_at)}
                                    </div>
                                </div>
                            )}
                            restoreButtonText="Restore Admin"
                        />
                    </>
                )}
            </div>
        </ProtectedRoute>
    )
}