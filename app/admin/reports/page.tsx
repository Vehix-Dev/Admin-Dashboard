"use client"

import { useEffect, useState } from "react"
import {
    getWallets,
    getServiceRequests,
    getRiders,
    getRoadies,
    getPlatformConfig,
    type Wallet,
    type ServiceRequest,
    type Rider,
    type Roadie,
    type PlatformConfig
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Wrench,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    BarChart3
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
    AreaChart,
    Area
} from "recharts"
import { format, subDays, startOfMonth, subMonths, isSameMonth } from "date-fns"
import ProtectedRoute from "@/components/auth/protected-route"
import Link from "next/link"

interface DashboardMetrics {
    revenue: {
        total: number
        growth: number
        trend: 'up' | 'down' | 'neutral'
    },
    users: {
        total: number
        newThisMonth: number
        growth: number
        trend: 'up' | 'down' | 'neutral'
    },
    services: {
        total: number
        completed: number
        completionRate: number
        growth: number
        trend: 'up' | 'down' | 'neutral'
    },
    dailyActivity: Array<{ date: string; requests: number; revenue: number }>
}

export default function ReportsOverviewPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [config, setConfig] = useState<PlatformConfig | null>(null)

    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.REPORTS_VIEW)

    const fetchDashboardData = async () => {
        setIsLoading(true)
        try {
            const [wallets, requests, riders, roadies, platformConfig] = await Promise.all([
                getWallets(),
                getServiceRequests(),
                getRiders(),
                getRoadies(),
                getPlatformConfig()
            ])

            setConfig(platformConfig)
            const serviceFee = parseFloat(platformConfig.service_fee || '0')

            // --- Revenue Metrics ---
            const currentMonth = new Date()
            const lastMonth = subMonths(new Date(), 1)

            const completedRequests = requests.filter(r => r.status === 'COMPLETED')
            const totalRevenue = completedRequests.length * serviceFee

            const revenueThisMonth = completedRequests
                .filter(r => isSameMonth(new Date(r.created_at), currentMonth))
                .length * serviceFee

            const revenueLastMonth = completedRequests
                .filter(r => isSameMonth(new Date(r.created_at), lastMonth))
                .length * serviceFee

            const revenueGrowth = revenueLastMonth > 0
                ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
                : revenueThisMonth > 0 ? 100 : 0

            // --- User Metrics ---
            const allUsers = [...riders.map(r => ({ ...r, type: 'rider' })), ...roadies.map(r => ({ ...r, type: 'roadie' }))]
            const totalUsers = allUsers.length

            const newUsersThisMonth = allUsers.filter(u =>
                isSameMonth(new Date(u.created_at), currentMonth)
            ).length

            const newUsersLastMonth = allUsers.filter(u =>
                isSameMonth(new Date(u.created_at), lastMonth)
            ).length

            const userGrowth = newUsersLastMonth > 0
                ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
                : newUsersThisMonth > 0 ? 100 : 0

            // --- Service Metrics ---
            const requestsThisMonth = requests.filter(r =>
                isSameMonth(new Date(r.created_at), currentMonth)
            ).length

            const requestsLastMonth = requests.filter(r =>
                isSameMonth(new Date(r.created_at), lastMonth)
            ).length

            const serviceGrowth = requestsLastMonth > 0
                ? ((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100
                : requestsThisMonth > 0 ? 100 : 0

            const completionRate = requests.length > 0
                ? (completedRequests.length / requests.length) * 100
                : 0

            // --- Daily Activity (Last 14 days) ---
            const last14Days = Array.from({ length: 14 }, (_, i) => {
                const d = subDays(new Date(), 13 - i)
                return format(d, 'MMM dd')
            })

            const dailyActivity = last14Days.map(dateStr => {
                const dayRequests = requests.filter(r =>
                    format(new Date(r.created_at), 'MMM dd') === dateStr
                )
                return {
                    date: dateStr,
                    requests: dayRequests.length,
                    revenue: dayRequests.filter(r => r.status === 'COMPLETED').length * serviceFee
                }
            })

            setMetrics({
                revenue: {
                    total: totalRevenue,
                    growth: revenueGrowth,
                    trend: revenueGrowth >= 0 ? 'up' : 'down'
                },
                users: {
                    total: totalUsers,
                    newThisMonth: newUsersThisMonth,
                    growth: userGrowth,
                    trend: userGrowth >= 0 ? 'up' : 'down'
                },
                services: {
                    total: requests.length,
                    completed: completedRequests.length,
                    completionRate,
                    growth: serviceGrowth,
                    trend: serviceGrowth >= 0 ? 'up' : 'down'
                },
                dailyActivity
            })

        } catch (err: any) {
            console.error("Failed to fetch dashboard data:", err)
            toast({
                title: "Error",
                description: "Failed to load dashboard data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.REPORTS_VIEW}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Executive Overview</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                            High-level performance metrics and system health
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md border border-border/50">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(), 'MMMM d, yyyy')}</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-40" />
                        ))}
                    </div>
                ) : metrics ? (
                    <>
                        {/* KPI Cards */}
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Revenue Card */}
                            <Link href="/admin/reports/financial">
                                <Card className="hover:border-emerald-500/50 transition-all cursor-pointer border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-500">{formatCurrency(metrics.revenue.total)}</div>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            {metrics.revenue.trend === 'up' ? (
                                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 text-destructive" />
                                            )}
                                            <span className={metrics.revenue.trend === 'up' ? "text-emerald-500" : "text-destructive"}>
                                                {Math.abs(metrics.revenue.growth).toFixed(1)}%
                                            </span>
                                            vs last month
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            {/* Users Card */}
                            <Link href="/admin/reports/users">
                                <Card className="hover:border-blue-500/50 transition-all cursor-pointer border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-transparent">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                        <Users className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-500">{metrics.users.total}</div>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            {metrics.users.trend === 'up' ? (
                                                <ArrowUpRight className="h-3 w-3 text-blue-500" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 text-destructive" />
                                            )}
                                            <span className={metrics.users.trend === 'up' ? "text-blue-500" : "text-destructive"}>
                                                {Math.abs(metrics.users.growth).toFixed(1)}%
                                            </span>
                                            vs last month
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            {/* Services Card */}
                            <Link href="/admin/reports/services">
                                <Card className="hover:border-purple-500/50 transition-all cursor-pointer border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-transparent">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                                        <Wrench className="h-4 w-4 text-purple-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-purple-500">{metrics.services.total}</div>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            {metrics.services.trend === 'up' ? (
                                                <ArrowUpRight className="h-3 w-3 text-purple-500" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 text-destructive" />
                                            )}
                                            <span className={metrics.services.trend === 'up' ? "text-purple-500" : "text-destructive"}>
                                                {Math.abs(metrics.services.growth).toFixed(1)}%
                                            </span>
                                            vs last month
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>

                        {/* Activity Charts */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="col-span-2 md:col-span-1">
                                <CardHeader>
                                    <CardTitle>Activity Trend (14 Days)</CardTitle>
                                    <CardDescription>Daily service requests and platform activity</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={metrics.dailyActivity}>
                                            <defs>
                                                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="requests"
                                                stroke="#3b82f6"
                                                fillOpacity={1}
                                                fill="url(#colorRequests)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="col-span-2 md:col-span-1">
                                <CardHeader>
                                    <CardTitle>Revenue Trend (14 Days)</CardTitle>
                                    <CardDescription>Daily financial performance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={metrics.dailyActivity}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}`}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Bar
                                                dataKey="revenue"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : null}
            </div>
        </ProtectedRoute>
    )
}
