"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
    getWallets,
    getPlatformConfig,
    getRiders,
    getRoadies,
    type PlatformConfig
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Eye,
    ExternalLink,
    Wallet as WalletIcon,
    User,
    Users,
    ArrowRight,
    Calendar as CalendarIcon,
    Filter,
    X
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Updated Wallet interface to match new API response
interface WalletWithUser {
    id: number
    user_id: number
    user_external_id: string | null
    user_username: string
    user_type: "Rider" | "Roadie" | "Unknown"
    balance: string
    transactions: Array<{
        id: number | string
        type?: string
        amount: string
        reason: string
        status?: string
        reference?: string
        created_at: string
    }>
}

export default function WalletsPage() {
    const router = useRouter()
    const [wallets, setWallets] = useState<WalletWithUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)
    const [userTypeFilter, setUserTypeFilter] = useState<string>("all")
    const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)
    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.WALLET_VIEW)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [walletsData, ridersData, roadiesData, configData] = await Promise.all([
                getWallets(),
                getRiders(),
                getRoadies(),
                getPlatformConfig()
            ])

            // Map wallets to users (Riders and Roadies)
            const enrichedWallets: WalletWithUser[] = walletsData.map((wallet: any) => {
                // Find owner of this wallet
                const rider = ridersData.find(r => r.wallet?.id === wallet.id)
                const roadie = roadiesData.find(r => r.wallet?.id === wallet.id)
                const user = rider || roadie

                return {
                    id: wallet.id,
                    user_id: user?.id || wallet.user, // Use profile ID if found, else generic user ID
                    user_external_id: user?.external_id || null,
                    user_username: user?.username || 'Unknown User',
                    user_type: rider ? "Rider" : roadie ? "Roadie" : "Unknown",
                    balance: wallet.balance,
                    transactions: (wallet.transactions || []).filter((t: any) => t.status === 'completed')
                }
            })

            // Filter out system wallets or unknown users if desired. 
            // For now we keep them but maybe sort them to bottom?
            // Actually, let's keep all, but search helps finding specific ones.
            // The previous logic filtered by 'R' or 'BS' prefix. Let's keep that broadly but allow 'Unknown User' to be visible so admins know there's a detached wallet.

            setWallets(enrichedWallets)
            setPlatformConfig(configData)

        } catch (err: any) {
            console.error("Failed to fetch data:", err)
            toast({
                title: "Error",
                description: "Failed to load wallet data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Filter wallets based on search query and date range
    const filteredWallets = wallets.filter(wallet => {
        // Search filter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = (
            wallet.user_username.toLowerCase().includes(searchLower) ||
            (wallet.user_external_id && wallet.user_external_id.toLowerCase().includes(searchLower)) ||
            (wallet.user_id && wallet.user_id.toString().includes(searchLower))
        )

        const matchesUserType = userTypeFilter === "all" || wallet.user_type.toLowerCase() === userTypeFilter
        const matchesDate = (!startDate && !endDate) || wallet.transactions.some((transaction) => {
            const transactionDate = new Date(transaction.created_at)
            const start = startDate ? startOfDay(startDate) : new Date(0)
            const end = endDate ? endOfDay(endDate) : new Date()
            return isWithinInterval(transactionDate, { start, end })
        })

        return matchesSearch && matchesUserType && matchesDate
    })

    // Stats based on all filtered wallets
    const getSignedTransactionAmount = (transaction: WalletWithUser["transactions"][number]) => {
        const amount = parseFloat(transaction.amount || "0")
        if (transaction.type === "WITHDRAWAL" && amount > 0) return -amount
        return amount
    }

    const calculateStats = () => {
        const data = filteredWallets
        if (data.length === 0) {
            return {
                totalWallets: 0,
                totalBalance: 0,
                positiveBalanceCount: 0,
                negativeBalanceCount: 0,
                totalRiders: 0,
                totalRoadies: 0,
                totalRiderBalance: 0,
                totalRoadieBalance: 0,
                totalDeposits: 0,
                totalWithdrawals: 0,
                outstandingRoadieBalance: 0,
            }
        }

        const totalBalance = data.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0)
        const positiveBalanceCount = data.filter(wallet => parseFloat(wallet.balance) > 0).length
        const negativeBalanceCount = data.filter(wallet => parseFloat(wallet.balance) < 0).length

        const totalRiders = data.filter(w => w.user_external_id?.startsWith('R')).length
        const totalRoadies = data.filter(w => w.user_external_id?.startsWith('BS')).length
        const totalRiderBalance = data.filter(w => w.user_type === "Rider").reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0)
        const totalRoadieBalance = data.filter(w => w.user_type === "Roadie").reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0)
        const allTransactions = data.flatMap(wallet => wallet.transactions || [])
        const totalDeposits = allTransactions.filter(t => getSignedTransactionAmount(t) > 0).reduce((sum, t) => sum + getSignedTransactionAmount(t), 0)
        const totalWithdrawals = allTransactions.filter(t => getSignedTransactionAmount(t) < 0).reduce((sum, t) => sum + Math.abs(getSignedTransactionAmount(t)), 0)
        const outstandingRoadieBalance = Math.abs(data.filter(w => w.user_type === "Roadie" && parseFloat(w.balance) < 0).reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0))

        return {
            totalWallets: data.length,
            totalBalance,
            positiveBalanceCount,
            negativeBalanceCount,
            totalRiders,
            totalRoadies,
            totalRiderBalance,
            totalRoadieBalance,
            totalDeposits,
            totalWithdrawals,
            outstandingRoadieBalance,
        }
    }

    const stats = calculateStats()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const columns: Column<WalletWithUser>[] = [
        {
            header: "User",
            accessor: "user_username",
            cell: (value, wallet) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{value}</span>
                    <span className="text-xs text-muted-foreground">{wallet.user_external_id || `#${wallet.user_id}`}</span>
                </div>
            )
        },
        {
            header: "User Type",
            accessor: "user_type",
            cell: (value) => {
                if (value === "Rider") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Rider</Badge>
                if (value === "Roadie") return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">Roadie</Badge>
                return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>
            }
        },
        {
            header: "Total Deposits",
            accessor: (row: WalletWithUser) => row.transactions.filter(t => getSignedTransactionAmount(t) > 0).reduce((sum, t) => sum + getSignedTransactionAmount(t), 0),
            cell: (value: number) => <span className="font-mono text-emerald-600">{formatCurrency(value)}</span>,
        },
        {
            header: "Total Withdrawals",
            accessor: (row: WalletWithUser) => row.transactions.filter(t => getSignedTransactionAmount(t) < 0).reduce((sum, t) => sum + Math.abs(getSignedTransactionAmount(t)), 0),
            cell: (value: number) => <span className="font-mono text-destructive">{formatCurrency(value)}</span>,
        },
        {
            header: "Balance",
            accessor: "balance",
            cell: (value) => {
                const amount = parseFloat(value as string)
                const isNegative = amount < 0
                return (
                    <span className={cn(
                        "font-mono font-medium",
                        isNegative ? "text-destructive" : "text-emerald-600"
                    )}>
                        {formatCurrency(amount)}
                    </span>
                )
            }
        },
        {
            header: "Actions",
            accessor: "id",
            cell: (value) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/sys-admin/wallet/${value}`)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ]

    if (!canView) {
        return null // Protected route handles redirect/error, this is just extra safety
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Wallet Management</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                        Monitor user balances and transactions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/wallet/transactions')}
                        className="gap-2"
                    >
                        <ArrowRight className="h-4 w-4" />
                        All Transactions
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                    <Skeleton className="h-[400px]" />
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-500">{formatCurrency(stats.totalBalance)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Across {stats.totalWallets} wallets</p>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Rider Wallet Balance</CardTitle>
                                <User className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-blue-500">{formatCurrency(stats.totalRiderBalance)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Roadie Wallet Balance</CardTitle>
                                <Wrench className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-purple-500">{formatCurrency(stats.totalRoadieBalance)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-emerald-500">{formatCurrency(stats.totalDeposits)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                                <TrendingDown className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-destructive">{formatCurrency(stats.totalWithdrawals)}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rider Wallets</CardTitle>
                                <User className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-500">{stats.totalRiders}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-emerald-500">{filteredWallets.filter(w => w.user_external_id?.startsWith('R') && parseFloat(w.balance) > 0).length}</span> positive
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Roadie Wallets</CardTitle>
                                <Wrench className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-500">{stats.totalRoadies}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-destructive">{filteredWallets.filter(w => w.user_external_id?.startsWith('BS') && parseFloat(w.balance) < 0).length}</span> negative
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                                <TrendingDown className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-destructive">{formatCurrency(stats.outstandingRoadieBalance)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Negative Roadie wallets</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters & Table */}
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 font-mono text-sm"
                                />
                                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)} className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                            </Button>
                        </div>

                        {showFilters && (
                            <div className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">User Type</label>
                                    <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All users" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            <SelectItem value="rider">Rider</SelectItem>
                                            <SelectItem value="roadie">Roadie</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Start Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">End Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="md:col-span-3 flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => { setUserTypeFilter("all"); setStartDate(undefined); setEndDate(undefined) }}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        )}

                        {filteredWallets.length === 0 ? (
                            <EmptyState
                                icon={WalletIcon}
                                title="No wallets found"
                                description="Try adjusting your search criteria"
                            />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredWallets}
                                onView={(row) => router.push(`/sys-admin/wallet/${row.id}`)}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

function Wrench(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    )
}
