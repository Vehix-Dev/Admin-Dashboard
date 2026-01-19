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
    PlatformConfig
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
    created_at: string
    updated_at: string
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
            const walletsData = await getWallets() as unknown as WalletWithUser[]
            const configData = await getPlatformConfig()

            // Filter wallets to only show Riders (R prefix) and Roadies (BS prefix)
            const baseWallets = walletsData.filter(wallet => {
                const externalId = wallet.user_external_id
                return externalId && (externalId.startsWith('R') || externalId.startsWith('BS'))
            })

            setWallets(baseWallets)
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

        if (!matchesSearch) return false

        // Date range filter
        if (startDate || endDate) {
            const walletDate = new Date(wallet.created_at)
            const start = startDate ? startOfDay(startDate) : new Date(0)
            const end = endDate ? endOfDay(endDate) : new Date()
            return isWithinInterval(walletDate, { start, end })
        }

        return true
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
                totalRoadies: 0,
            }
        }

        const riderWallets = data.filter(w => w.user_external_id?.startsWith('R'))
        const roadieWallets = data.filter(w => w.user_external_id?.startsWith('BS'))

        const totalBalance = data.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0)
        const positiveBalanceCount = data.filter(wallet => parseFloat(wallet.balance) > 0).length
        const negativeBalanceCount = data.filter(wallet => parseFloat(wallet.balance) < 0).length

        return {
            totalWallets: data.length,
            totalBalance,
            positiveBalanceCount,
            negativeBalanceCount,
            totalRiders: riderWallets.length,
            totalRoadies: roadieWallets.length,
        }
    }

    const stats = calculateStats()

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount)
    }

    const getBalanceColor = (balance: number) => {
        if (balance > 0) return "text-emerald-500"
        if (balance === 0) return "text-muted-foreground"
        if (balance < 0 && balance >= -10000) return "text-amber-500"
        return "text-destructive"
    }

    const clearFilters = () => {
        setStartDate(undefined)
        setEndDate(undefined)
        setSearchQuery("")
    }

    const columns: Column<WalletWithUser>[] = [
        {
            header: "User",
            accessor: "user_username",
            cell: (value: string, row: WalletWithUser) => (
                <div className="space-y-1">
                    <div className="font-medium text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground font-mono">ID: {row.user_id}</div>
                </div>
            )
        },
        {
            header: "External ID",
            accessor: "user_external_id",
            cell: (value: string) => (
                <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-foreground">
                        {value}
                    </code>
                </div>
            )
        },
        {
            header: "Role",
            accessor: "user_external_id",
            cell: (value: string) => {
                const isRider = value?.startsWith('R')
                const color = isRider ? 'border-blue-500/20 bg-blue-500/10 text-blue-500' : 'border-purple-500/20 bg-purple-500/10 text-purple-500'
                return (
                    <Badge variant="outline" className={`${color} capitalize font-medium border-2`}>
                        {isRider ? 'Rider' : 'Roadie'}
                    </Badge>
                )
            }
        },
        {
            header: "Balance",
            accessor: "balance",
            cell: (value: string) => {
                const balance = parseFloat(value)
                return (
                    <div className={`text-lg font-bold ${getBalanceColor(balance)}`}>
                        {formatCurrency(value)}
                    </div>
                )
            }
        },
        {
            header: "Status",
            accessor: "balance",
            cell: (value: string) => {
                const balance = parseFloat(value)
                if (balance > 0) return <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">Positive</Badge>
                if (balance === 0) return <Badge variant="outline" className="border-border bg-muted/30 text-muted-foreground">Zero</Badge>
                if (balance < 0 && balance >= -10000) return <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-500">Warning</Badge>
                return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">Critical</Badge>
            }
        },
        {
            header: "Created",
            accessor: "created_at",
            cell: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            header: "Actions",
            accessor: "id",
            cell: (value: number) => (
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 h-8"
                    onClick={() => router.push(`/admin/wallet/${value}`)}
                >
                    <Eye className="h-4 w-4" />
                    Details
                </Button>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Wallets Management</h1>
                    <p className="text-muted-foreground mt-2">
                        View Rider and Roadie wallet balances
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2 h-10"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilters ? "Hide Filters" : "Filters"}
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            {showFilters && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-wrap items-end gap-6">
                        <div className="space-y-2 flex-grow max-w-sm">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Search</label>
                            <Input
                                placeholder="Username or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Created From</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[160px] justify-start text-left font-normal h-10 border-border bg-background",
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
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Created To</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[160px] justify-start text-left font-normal h-10 border-border bg-background",
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
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-10">
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <WalletIcon className="h-4 w-4" />
                            Total Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {isLoading ? <Skeleton className="h-8 w-16" /> : stats.totalWallets}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            {stats.totalRiders} riders, {stats.totalRoadies} roadies
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Total Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.totalBalance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(stats.totalBalance)}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Filtered wallet total
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Positive Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-500">
                            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.positiveBalanceCount}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            {stats.totalWallets > 0 ? `${((stats.positiveBalanceCount / stats.totalWallets) * 100).toFixed(1)}% of filtered` : '0%'}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Negative Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-destructive">
                            {isLoading ? <Skeleton className="h-8 w-12" /> : stats.negativeBalanceCount}
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            {stats.totalWallets > 0 ? `${((stats.negativeBalanceCount / stats.totalWallets) * 100).toFixed(1)}% of filtered` : '0%'}
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Config Info */}
            {platformConfig && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 py-3 flex flex-wrap items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-medium">Max Negative: </span>
                                <span className="font-bold text-foreground">{formatCurrency(platformConfig.max_negative_balance)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-medium">Service Fee: </span>
                                <span className="font-bold text-foreground">{formatCurrency(platformConfig.service_fee)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            * Threshold for disabling services: {formatCurrency(parseFloat(platformConfig.max_negative_balance) * -1)}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Main Table */}
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            ) : filteredWallets.length === 0 ? (
                <EmptyState
                    title={searchQuery || startDate || endDate ? "No matches found" : "No wallet data available"}
                    description="Try adjusting your filters or search criteria."
                    icon={WalletIcon}
                />
            ) : (
                <DataTable
                    data={filteredWallets}
                    columns={columns}
                    initialSortColumn={3}
                    initialSortDirection="desc"
                />
            )}
        </div>
    )
}
