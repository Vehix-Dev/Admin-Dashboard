"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getDeletedAdminUsers, restoreAdminUser, type DeletedAdminUser } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { UserX, Calendar as CalendarIcon, Filter, X, RotateCcw } from "lucide-react"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
            setDeletedAdmins(data)
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

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
    }

    const handleRestore = async (admin: DeletedAdminUser) => {
        if (!confirm(`Are you sure you want to restore ${admin.username}? This will make the user active again.`)) return

        try {
            await restoreAdminUser(Number(admin.id))
            toast({
                title: "Success",
                description: `User ${admin.username} has been restored successfully.`,
            })
            fetchDeletedAdmins()
        } catch (err) {
            console.error("Restore error:", err)
            toast({
                title: "Error",
                description: "Failed to restore user. Please try again.",
                variant: "destructive",
            })
        }
    }

    const filteredAdmins = deletedAdmins.filter(admin => {
        if (!startDate && !endDate) return true
        const requestDate = new Date(admin.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(requestDate, { start, end })
    })

    const columns: Column<DeletedAdminUser>[] = [
        { header: "ID", accessor: "external_id" as const },
        { header: "First Name", accessor: "first_name" as const },
        { header: "Last Name", accessor: "last_name" as const },
        { header: "Email", accessor: "email" as const },
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
        { header: "NIN", accessor: "nin" as const },
        {
            header: "Wallet Balance",
            accessor: (row: DeletedAdminUser) => row.wallet?.balance || "0.00",
            cell: (value: string) => (
                <span className={`font-medium ${parseFloat(value) < 0 ? "text-destructive" : "text-emerald-500"}`}>
                    {formatCurrency(value)}
                </span>
            )
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
                        <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Deleted Users</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">View historical data for deleted system users</p>
                    </div>
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2 h-10 font-mono"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? "Hide Filters" : "Filter by Date"}
                    </Button>
                </div>

                {showFilters && (
                    <Card className="border-primary/20 bg-primary/5 transition-all">
                        <CardContent className="p-4 flex flex-wrap items-end gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">Deleted From</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[160px] justify-start text-left font-mono text-xs h-10 border-border bg-card",
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
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">Deleted To</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[160px] justify-start text-left font-mono text-xs h-10 border-border bg-card",
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
                        title={startDate || endDate ? "No matches in range" : "No deleted users found"}
                        description={startDate || endDate ? "Try adjusting your date filters." : "There are currently no deleted users in the system."}
                        icon={UserX}
                        action={(startDate || endDate) ? (
                            <Button variant="outline" onClick={clearFilters} className="font-mono">Clear Filters</Button>
                        ) : undefined}
                    />
                ) : (
                    <DataTable
                        data={filteredAdmins}
                        columns={columns}
                        initialSortColumn={8}
                        initialSortDirection="desc"
                        onRestore={handleRestore}
                    />
                )}
            </div>
        </ProtectedRoute>
    )
}
