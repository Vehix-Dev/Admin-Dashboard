"use client"

import { useEffect, useState } from "react"
import {
    getWallets,
    getServiceRequests,
    getPlatformConfig,
    getRiders,
    getRoadies,
    type Wallet,
    type ServiceRequest,
    type PlatformConfig
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    Download,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Wallet as WalletIcon,
    Receipt,
    Calendar as CalendarIcon,
    Filter,
    X,
    ArrowUpRight,
    ArrowDownRight,
    Percent
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts"
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import ProtectedRoute from "@/components/auth/protected-route"

interface FinancialMetrics {
    totalWalletBalance: number
    positiveBalances: number
    negativeBalances: number
    totalServiceFees: number
    completedServices: number
    averageServiceFee: number
    projectedMonthlyRevenue: number
    walletDistribution: Array<{ name: string; value: number; count: number }>
    dailyRevenue: Array<{ date: string; revenue: number; services: number }>
    topEarners: Array<{ username: string; balance: number; role: string }>
}

const COLORS = ['#F05A28', '#1F2A44', '#10B981', '#F59E0B', '#EF4444']

export default function FinancialReportPage() {
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()))
    const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()))
    const [showFilters, setShowFilters] = useState(false)
    const [config, setConfig] = useState<PlatformConfig | null>(null)

    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.REPORTS_VIEW)

    const fetchFinancialData = async () => {
        setIsLoading(true)
        try {
            const [wallets, requests, platformConfig, riders, roadies] = await Promise.all([
                getWallets(),
                getServiceRequests(),
                getPlatformConfig(),
                getRiders(),
                getRoadies()
            ])

            setConfig(platformConfig)

            // Filter requests by date range
            const filteredRequests = requests.filter(req => {
                if (!startDate || !endDate) return true
                const reqDate = new Date(req.created_at)
                return isWithinInterval(reqDate, {
                    start: startOfDay(startDate),
                    end: endOfDay(endDate)
                })
            })

            // Calculate metrics
            const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0)
            const positiveBalances = wallets.filter(w => parseFloat(w.balance) > 0).reduce((sum, w) => sum + parseFloat(w.balance), 0)
            const negativeBalances = Math.abs(wallets.filter(w => parseFloat(w.balance) < 0).reduce((sum, w) => sum + parseFloat(w.balance), 0))

            const completedRequests = filteredRequests.filter(r => r.status === 'COMPLETED')
            const serviceFee = parseFloat(platformConfig.service_fee || '0')
            const totalServiceFees = completedRequests.length * serviceFee
            const averageFee = completedRequests.length > 0 ? totalServiceFees / completedRequests.length : 0

            // Project monthly revenue based on current rate
            const daysInRange = endDate && startDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 30
            const dailyAverage = completedRequests.length / (daysInRange || 1)
            const projectedMonthly = dailyAverage * 30 * serviceFee

            // Wallet distribution
            const distribution = [
                { name: 'Positive (>0)', value: positiveBalances, count: wallets.filter(w => parseFloat(w.balance) > 0).length },
                { name: 'Zero (=0)', value: 0, count: wallets.filter(w => parseFloat(w.balance) === 0).length },
                { name: 'Negative (<0)', value: negativeBalances, count: wallets.filter(w => parseFloat(w.balance) < 0).length },
            ]

            // Daily revenue trend
            const dailyRevenue = startDate && endDate ? eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
                const dayRequests = filteredRequests.filter(r => {
                    const reqDate = new Date(r.created_at)
                    return reqDate.toDateString() === date.toDateString() && r.status === 'COMPLETED'
                })
                return {
                    date: format(date, 'MMM dd'),
                    revenue: dayRequests.length * serviceFee,
                    services: dayRequests.length
                }
            }) : []

            // Top earners (users with highest positive balances)
            // Top earners (users with highest positive balances)
            const topEarners = wallets
                .filter(w => parseFloat(w.balance) > 0)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
                .slice(0, 10)
                .map(w => {
                    const rider = riders.find(r => r.wallet?.id === w.id)
                    const roadie = roadies.find(r => r.wallet?.id === w.id)
                    const user = rider || roadie
                    return {
                        username: user?.username || `User #${w.user}`,
                        balance: parseFloat(w.balance),
                        role: rider ? 'Rider' : (roadie ? 'Roadie' : 'Unknown')
                    }
                })

            setMetrics({
                totalWalletBalance: totalBalance,
                positiveBalances,
                negativeBalances,
                totalServiceFees,
                completedServices: completedRequests.length,
                averageServiceFee: averageFee,
                projectedMonthlyRevenue: projectedMonthly,
                walletDistribution: distribution,
                dailyRevenue,
                topEarners
            })

        } catch (err: any) {
            console.error("Failed to fetch financial data:", err)
            toast({
                title: "Error",
                description: "Failed to load financial report data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchFinancialData()
    }, [startDate, endDate])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const clearFilters = () => {
        setStartDate(startOfMonth(new Date()))
        setEndDate(endOfMonth(new Date()))
    }

    const handleExport = () => {
        if (!metrics) return

        const csvData = [
            ['Financial Report'],
            ['Generated:', format(new Date(), 'PPP')],
            ['Period:', `${startDate ? format(startDate, 'PPP') : 'All'} - ${endDate ? format(endDate, 'PPP') : 'All'}`],
            [],
            ['Metric', 'Value'],
            ['Total Wallet Balance', formatCurrency(metrics.totalWalletBalance)],
            ['Positive Balances', formatCurrency(metrics.positiveBalances)],
            ['Negative Balances', formatCurrency(metrics.negativeBalances)],
            ['Total Service Fees', formatCurrency(metrics.totalServiceFees)],
            ['Completed Services', metrics.completedServices.toString()],
            ['Average Service Fee', formatCurrency(metrics.averageServiceFee)],
            ['Projected Monthly Revenue', formatCurrency(metrics.projectedMonthlyRevenue)],
        ]

        const csv = csvData.map(row => row.join(',')).join('\\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast({
            title: "Success",
            description: "Financial report exported successfully"
        })
    }

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.REPORTS_VIEW}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Financial Report</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                            Comprehensive financial metrics and revenue analysis
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
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="gap-2 h-10 font-mono"
                            disabled={!metrics}
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Date Filters */}
                {showFilters && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4 flex flex-wrap items-end gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">From</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[160px] justify-start text-left font-mono text-xs h-10",
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
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">To</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-[160px] justify-start text-left font-mono text-xs h-10",
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                ) : metrics ? (
                    <>
                        {/* Key Metrics */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="mantis-card-emerald p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Wallet Balance</p>
                                        <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.totalWalletBalance)}</div>
                                        <p className="text-sm text-muted-foreground mt-2">Net balance across all wallets</p>
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-3 rounded-xl">
                                        <WalletIcon className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="mantis-card-navy p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Service Fees Collected</p>
                                        <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.totalServiceFees)}</div>
                                        <p className="text-sm text-muted-foreground mt-2">From {metrics.completedServices} completed services</p>
                                    </div>
                                    <div className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 p-3 rounded-xl">
                                        <Receipt className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="mantis-card-orange p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Projected Monthly Revenue</p>
                                        <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.projectedMonthlyRevenue)}</div>
                                        <p className="text-sm text-muted-foreground mt-2">Based on current rate</p>
                                    </div>
                                    <div className="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 p-3 rounded-xl">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="mantis-card-amber p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Average Service Fee</p>
                                        <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.averageServiceFee)}</div>
                                        <p className="text-sm text-muted-foreground mt-2">Per completed service</p>
                                    </div>
                                    <div className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 p-3 rounded-xl">
                                        <Percent className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Balance Distribution */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="mantis-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 p-2.5 rounded-lg">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Positive Balances</h3>
                                </div>
                                <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.positiveBalances)}</div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {metrics.walletDistribution[0].count} wallets
                                </p>
                            </div>

                            <div className="mantis-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-muted/50 text-muted-foreground p-2.5 rounded-lg">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Zero Balances</h3>
                                </div>
                                <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(0)}</div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {metrics.walletDistribution[1].count} wallets
                                </p>
                            </div>

                            <div className="mantis-card p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 p-2.5 rounded-lg">
                                        <ArrowDownRight className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Negative Balances</h3>
                                </div>
                                <div className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(metrics.negativeBalances)}</div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {metrics.walletDistribution[2].count} wallets
                                </p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Daily Revenue Trend */}
                            <div className="mantis-card p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-foreground">Daily Revenue Trend</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Service fees collected per day</p>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={metrics.dailyRevenue}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F05A28" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#F05A28" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(Number(value))}
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                            }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#F05A28" strokeWidth={2} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Wallet Distribution */}
                            <div className="mantis-card p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-foreground">Wallet Balance Distribution</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Distribution by balance status</p>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={metrics.walletDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${entry.count}`}
                                            outerRadius={90}
                                            innerRadius={60}
                                            paddingAngle={2}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {metrics.walletDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Earners */}
                        <div className="mantis-card p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-foreground">Top 10 Earners</h3>
                                <p className="text-sm text-muted-foreground mt-1">Users with highest positive balances</p>
                            </div>
                            <div className="space-y-3">
                                {metrics.topEarners.map((earner, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground">{earner.username}</div>
                                                <div className="text-xs text-muted-foreground">{earner.role}</div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-foreground">
                                            {formatCurrency(earner.balance)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </ProtectedRoute>
    )
}
