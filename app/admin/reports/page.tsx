"use client"

import { useEffect, useState } from "react"
import {
    getWallets,
    getServiceRequests,
    getRiders,
    getRoadies,
    getServices,
    getPlatformConfig,
    type Wallet,
    type ServiceRequest,
    type Rider,
    type Roadie,
    type Service,
    type PlatformConfig
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Download, FileDown, TrendingUp, DollarSign, Users, BarChart2, Activity, Calendar } from "lucide-react"
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
    AreaChart,
    Area
} from "recharts"

interface ReportData {
    config: {
        serviceFee: number
        currency: string
    }
    revenue: {
        totalWalletBalance: number
        totalServiceFees: number
        potentialRevenue: number // fees from non-cancelled requests
    }
    users: {
        riders: number
        roadies: number
        total: number
        approvedRiders: number
        approvedRoadies: number
    }
    services: {
        totalRequests: number
        completedRequests: number
        cancelledRequests: number
        completionRate: string
        byType: Array<{ name: string; value: number }>
        byStatus: Array<{ name: string; value: number }>
        dailyTrend: Array<{ date: string; requests: number; completions: number }>
    }
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.REPORTS_VIEW)

    const fetchReportData = async () => {
        setIsLoading(true)
        try {
            const [wallets, requests, riders, roadies, services, config] = await Promise.all([
                getWallets(),
                getServiceRequests(),
                getRiders(),
                getRoadies(),
                getServices(),
                getPlatformConfig()
            ])

            // 1. Config & Revenue
            const serviceFee = parseFloat(config.service_fee || "0")
            const totalWalletBalance = wallets.reduce((acc, curr) => acc + parseFloat(curr.balance), 0)

            // Calculate Fees: Fee * Completed Requests
            const completedRequests = requests.filter(r => r.status === 'COMPLETED').length
            const totalServiceFees = completedRequests * serviceFee

            // Potential Revenue (Completed + Active)
            const activeRequests = requests.filter(r => ['ACCEPTED', 'EN_ROUTE', 'STARTED'].includes(r.status)).length
            const potentialRevenue = (completedRequests + activeRequests) * serviceFee

            // 2. Service Stats
            const totalRequests = requests.length
            const cancelledRequests = requests.filter(r => r.status === 'CANCELLED').length
            const completionRate = totalRequests > 0
                ? ((completedRequests / totalRequests) * 100).toFixed(1)
                : "0.0"

            // Breakdown by Type
            const serviceCounts: Record<string, number> = {}
            requests.forEach(r => {
                const name = r.service_type_name || `Service ${r.service_type}`
                serviceCounts[name] = (serviceCounts[name] || 0) + 1
            })
            const byType = Object.entries(serviceCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)

            // Breakdown by Status
            const statusCounts: Record<string, number> = {}
            requests.forEach(r => {
                statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
            })
            const byStatus = Object.entries(statusCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)

            // Daily Trend (Last 7 days)
            const dailyStats: Record<string, { requests: number, completions: number }> = {}
            // Initialize last 7 days with 0
            for (let i = 6; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
                dailyStats[dateStr] = { requests: 0, completions: 0 }
            }

            requests.forEach(r => {
                const dateStr = r.created_at.split('T')[0]
                if (dailyStats[dateStr]) {
                    dailyStats[dateStr].requests++
                    if (r.status === 'COMPLETED') {
                        dailyStats[dateStr].completions++
                    }
                }
            })

            const dailyTrend = Object.entries(dailyStats)
                .map(([date, stats]) => ({
                    date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }), // Mon, Tue
                    fullDate: date,
                    requests: stats.requests,
                    completions: stats.completions
                }))

            // 3. User Stats
            const approvedRiders = riders.filter(r => r.is_approved).length
            const approvedRoadies = roadies.filter(r => r.is_approved).length

            setData({
                config: {
                    serviceFee,
                    currency: 'UGX'
                },
                revenue: {
                    totalWalletBalance,
                    totalServiceFees,
                    potentialRevenue
                },
                users: {
                    riders: riders.length,
                    roadies: roadies.length,
                    total: riders.length + roadies.length,
                    approvedRiders,
                    approvedRoadies
                },
                services: {
                    totalRequests,
                    completedRequests,
                    cancelledRequests,
                    completionRate,
                    byType,
                    byStatus,
                    dailyTrend
                }
            })

        } catch (err) {
            console.error("[v0] Reports fetch error:", err)
            toast({
                title: "Error",
                description: "Failed to generate robust report data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReportData()
    }, [])

    const handleExport = (type: 'financial' | 'usage') => {
        if (!data) return

        const timestamp = new Date().toISOString().split('T')[0]
        let csvContent = ""
        let filename = ""

        if (type === 'financial') {
            filename = `financial_report_${timestamp}.csv`
            csvContent = "Metric,Value,Currency\n"
            csvContent += `Total Wallet Balance,${data.revenue.totalWalletBalance},${data.config.currency}\n`
            csvContent += `Service Fee Rate,${data.config.serviceFee},${data.config.currency}\n`
            csvContent += `Total Service Fees Generated,${data.revenue.totalServiceFees},${data.config.currency}\n`
            csvContent += `Potential Revenue (Active inc.),${data.revenue.potentialRevenue},${data.config.currency}\n`
        } else {
            filename = `usage_report_${timestamp}.csv`
            csvContent = "Metric,Value,Details\n"
            csvContent += `Total Users,${data.users.total}\n`
            csvContent += `Riders,${data.users.riders},${data.users.approvedRiders} Approved\n`
            csvContent += `Roadies,${data.users.roadies},${data.users.approvedRoadies} Approved\n`
            csvContent += `Total Requests,${data.services.totalRequests}\n`
            csvContent += `Completed,${data.services.completedRequests}\n`
            csvContent += `Cancelled,${data.services.cancelledRequests}\n`
            csvContent += `Completion Rate,${data.services.completionRate}%\n`

            csvContent += "\nRequests by Service Type\n"
            data.services.byType.forEach(item => {
                csvContent += `${item.name},${item.value}\n`
            })
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']
    const STATUS_COLORS: Record<string, string> = {
        'COMPLETED': '#10b981', // green
        'CANCELLED': '#ef4444', // red
        'REQUESTED': '#3b82f6', // blue
        'ACCEPTED': '#f59e0b', // orange
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-48 mb-6" />
                <div className="grid gap-6 md:grid-cols-4">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-80 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Reports Center</h1>
                    <p className="text-muted-foreground mt-1">Detailed system analytics, financials, and operational metrics</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => handleExport('usage')} variant="outline" size="sm" className="border-border bg-card hover:bg-muted">
                        <FileDown className="h-4 w-4 mr-2" /> Export Usage
                    </Button>
                    <Button onClick={() => handleExport('financial')} className="bg-primary hover:bg-primary/90" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export Financials
                    </Button>
                </div>
            </div>

            {/* Top Level Financials */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-t-4 border-t-emerald-500 shadow-sm relative overflow-hidden bg-card">
                    <div className="absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-emerald-500/10 opacity-50"></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumSignificantDigits: 3 }).format(data?.revenue.totalServiceFees || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data?.services.completedRequests} completed requests × {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumSignificantDigits: 1 }).format(data?.config.serviceFee || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-blue-500 shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">User Wallets</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumSignificantDigits: 3 }).format(data?.revenue.totalWalletBalance || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total held by all users</p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-purple-500 shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{data?.services.completionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data?.services.completedRequests} / {data?.services.totalRequests} requests
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-orange-500 shadow-sm bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{data?.users.total}</div>
                        <div className="flex text-xs text-muted-foreground mt-1 gap-2">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {data?.users.riders} Riders</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {data?.users.roadies} Roadies</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Main Trend Chart */}
                <Card className="lg:col-span-4 shadow-sm bg-card border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Request Trends (Last 7 Days)
                        </CardTitle>
                        <CardDescription>Daily volume and completion tracking</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.services.dailyTrend}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.6 }} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.6 }} fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        color: 'var(--foreground)'
                                    }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="requests" name="Total Requests" stroke="#8884d8" fillOpacity={1} fill="url(#colorRequests)" />
                                <Area type="monotone" dataKey="completions" name="Completed" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCompletions)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="lg:col-span-3 shadow-sm bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Request Status</CardTitle>
                        <CardDescription>Current state distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.services.byStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data?.services.byStatus.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Service Popularity Bar Chart */}
            <Card className="shadow-sm bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Service Popularity</CardTitle>
                    <CardDescription>Which services are most in demand?</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data?.services.byType}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.8 }} />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    color: 'var(--foreground)'
                                }}
                                itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} name="Requests" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
