"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getReferrals,
    deleteReferral,
    type Referral
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Trash2, UserPlus, Gift, TrendingUp, Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export default function ReferralsPage() {
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)
    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.REFERRALS_MANAGE)

    const fetchReferrals = async () => {
        setIsLoading(true)
        try {
            const data = await getReferrals()
            setReferrals(data)
        } catch (err) {
            console.error(" Referrals fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to load referrals data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReferrals()
    }, [])

    const handleDelete = async (referral: Referral) => {
        if (!confirm(`Are you sure you want to delete this referral?`)) return
        try {
            await deleteReferral(referral.id)
            toast({
                title: "Success",
                description: "Referral deleted successfully"
            })
            fetchReferrals()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to delete referral",
                variant: "destructive"
            })
        }
    }

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
    }

    // Filtered data based on date range
    const filteredReferrals = referrals.filter(r => {
        if (!startDate && !endDate) return true
        const requestDate = new Date(r.created_at)
        const start = startDate ? startOfDay(startDate) : new Date(0)
        const end = endDate ? endOfDay(endDate) : new Date()
        return isWithinInterval(requestDate, { start, end })
    })

    // Stats based on filtered data
    const totalReferrals = filteredReferrals.length
    const totalPaid = filteredReferrals
        .filter(r => r.status === 'PAID' || r.status === 'COMPLETED')
        .reduce((acc, curr) => acc + parseFloat(curr.reward_amount || '0'), 0)
    const pendingCount = filteredReferrals.filter(r => r.status === 'PENDING').length

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const columns: Column<Referral>[] = [
        {
            header: "Referrer",
            accessor: "referrer_username",
            cell: (value: string) => <span className="font-medium">{value}</span>
        },
        {
            header: "Referee",
            accessor: "referee_username",
            cell: (value: string) => <span className="font-medium">{value}</span>
        },
        {
            header: "Reward",
            accessor: "reward_amount",
            cell: (value: string) => formatCurrency(parseFloat(value || '0'))
        },
        {
            header: "Status",
            accessor: "status",
            cell: (value: string) => {
                const colors: Record<string, string> = {
                    'PENDING': 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/30 dark:bg-yellow-900/20 dark:text-yellow-400',
                    'PAID': 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400',
                    'COMPLETED': 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400',
                    'REJECTED': 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
                }
                return (
                    <Badge variant="outline" className={`capitalize font-medium border-2 ${colors[value] || 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800/20 dark:text-gray-400'}`}>
                        {value}
                    </Badge>
                )
            }
        },
        {
            header: "Date",
            accessor: "created_at",
            cell: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            header: "Actions",
            accessor: "id",
            cell: (_: any, row: Referral) => canManage ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(row)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ) : null,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Referrals</h1>
                    <p className="text-muted-foreground mt-1">Track user referrals and rewards</p>
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

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalReferrals}</div>
                        <p className="text-xs text-muted-foreground">{startDate || endDate ? 'In selected range' : 'All time referrals'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-muted-foreground">{startDate || endDate ? 'In selected range' : 'Rewards distributed'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">{startDate || endDate ? 'In selected range' : 'Referrals awaiting payout'}</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <Skeleton className="h-96 rounded" />
            ) : filteredReferrals.length === 0 ? (
                <EmptyState
                    title={startDate || endDate ? "No referrals in range" : "No referrals found"}
                    description={startDate || endDate ? "Try adjusting your date filters." : "When users invite others, referrals will appear here."}
                    icon={UserPlus}
                />
            ) : (
                <DataTable
                    data={filteredReferrals}
                    columns={columns}
                    initialSortColumn={4}
                    initialSortDirection="desc"
                />
            )}
        </div>
    )
}
