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

// Updated Wallet interface to match new API response
interface WalletWithUser {
    id: number
    user_id: number
    user_external_id: string | null
    user_username: string
    balance: string
    transactions: Array<{
        id: number
        amount: string
        reason: string
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
                    balance: wallet.balance,
                    transactions: wallet.transactions || []
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
            wallet.user_id.toString().includes(searchLower)
        )

        return matchesSearch
    })

    // Stats based on all filtered wallets
    const calculateStats = () => {
        const data = filteredWallets
        if (data.length === 0) {
            return {
                totalWallets: 0,
                totalBalance: 0,
                positiveBalanceCount: 0,
                negativeBalanceCount: 0,
                totalRiders: 0,
                totalRoadies: 0
            }
        }

        const totalBalance = data.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0)
        const positiveBalanceCount = data.filter(wallet => parseFloat(wallet.balance) > 0).length
        const negativeBalanceCount = data.filter(wallet => parseFloat(wallet.balance) < 0).length

        const totalRiders = data.filter(w => w.user_external_id?.startsWith('R')).length
        const totalRoadies = data.filter(w => w.user_external_id?.startsWith('BS')).length

        return {
            totalWallets: data.length,
            totalBalance,
            positiveBalanceCount,
            negativeBalanceCount,
            totalRiders,
            totalRoadies
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
            header: "Role",
            accessor: "user_external_id",
            cell: (value) => {
                if (!value) return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>
                if (value.startsWith('R')) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Rider</Badge>
                if (value.startsWith('BS')) return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">Roadie</Badge>
                return <Badge variant="outline">{value}</Badge>
            }
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
                        onClick={() => router.push(`/admin/wallet/${value}`)}
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                                <CardTitle className="text-sm font-medium">Negative Balances</CardTitle>
                                <TrendingDown className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">{stats.negativeBalanceCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">Users owing fees</p>
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
                        </div>

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
                                onView={(row) => router.push(`/admin/wallet/${row.id}`)}
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
