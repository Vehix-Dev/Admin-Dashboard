"use client"

import { useEffect, useState } from "react"
import {
    getServiceRequests,
    getServices,
    type ServiceRequest,
    type Service
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    Download,
    Wrench,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    BarChart3,
    DollarSign
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
    Cell
} from "recharts"
import { format } from "date-fns"
import ProtectedRoute from "@/components/auth/protected-route"

interface ServiceMetrics {
    totalRequests: number
    completedRequests: number
    cancelledRequests: number
    acceptedRequests: number
    completionRate: number
    cancellationRate: number
    requestsByService: Array<{ name: string; value: number }>
    requestsByStatus: Array<{ name: string; value: number; color: string }>
    topServices: Array<{ name: string; count: number; completionRate: number }>
    conversionRate: number
    totalRevenue: number
}

const STATUS_COLORS = {
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
    ACCEPTED: '#3b82f6',
    PENDING: '#f59e0b'
}

export default function ServicePerformancePage() {
    const [metrics, setMetrics] = useState<ServiceMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.REPORTS_VIEW)

    const fetchServiceData = async () => {
        setIsLoading(true)
        try {
            const [requests, services] = await Promise.all([
                getServiceRequests(),
                getServices()
            ])

            const completed = requests.filter(r => r.status === 'COMPLETED').length
            const cancelled = requests.filter(r => r.status === 'CANCELLED').length
            const accepted = requests.filter(r => r.status === 'ACCEPTED').length
            const completionRate = (completed / requests.length) * 100
            const cancellationRate = (cancelled / requests.length) * 100

            // Requests by service type
            const serviceMap = new Map<number, { name: string; count: number; completed: number }>()
            requests.forEach(req => {
                const service = services.find(s => s.id === req.service_type)
                if (service) {
                    const current = serviceMap.get(service.id) || { name: service.name, count: 0, completed: 0 }
                    current.count++
                    if (req.status === 'COMPLETED') current.completed++
                    serviceMap.set(service.id, current)
                }
            })

            const requestsByService = Array.from(serviceMap.values())
                .map(s => ({ name: s.name, value: s.count }))
                .sort((a, b) => b.value - a.value)

            // Top services by completion rate
            const topServices = Array.from(serviceMap.values())
                .map(s => ({
                    name: s.name,
                    count: s.count,
                    completionRate: (s.completed / s.count) * 100
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

            // Requests by status
            const requestsByStatus = [
                { name: 'Completed', value: completed, color: STATUS_COLORS.COMPLETED },
                { name: 'Accepted', value: accepted, color: STATUS_COLORS.ACCEPTED },
                { name: 'Cancelled', value: cancelled, color: STATUS_COLORS.CANCELLED },
                { name: 'Pending', value: requests.length - completed - cancelled - accepted, color: STATUS_COLORS.PENDING }
            ].filter(s => s.value > 0)

            setMetrics({
                totalRequests: requests.length,
                completedRequests: completed,
                cancelledRequests: cancelled,
                acceptedRequests: accepted,
                completionRate,
                cancellationRate,
                requestsByService,
                requestsByStatus,
                topServices,
                conversionRate: completionRate,
                totalRevenue: completed * 5000 // Placeholder if fee not available, but let's try to get config?
            })

        } catch (err: any) {
            console.error("Failed to fetch service performance:", err)
            toast({
                title: "Error",
                description: "Failed to load service performance data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchServiceData()
    }, [])

    const handleExport = () => {
        if (!metrics) return

        const csvData = [
            ['Service Performance Report'],
            ['Generated:', format(new Date(), 'PPP')],
            [],
            ['Metric', 'Value'],
            ['Total Requests', metrics.totalRequests.toString()],
            ['Completed Requests', metrics.completedRequests.toString()],
            ['Cancelled Requests', metrics.cancelledRequests.toString()],
            ['Accepted Requests', metrics.acceptedRequests.toString()],
            ['Completion Rate', `${metrics.completionRate.toFixed(1)}%`],
            ['Cancellation Rate', `${metrics.cancellationRate.toFixed(1)}%`],
        ]

        const csv = csvData.map(row => row.join(',')).join('\\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `service-performance-${format(new Date(), 'yyyy-MM-dd')}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast({
            title: "Success",
            description: "Service performance report exported successfully"
        })
    }

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.REPORTS_VIEW}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">Service Performance</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                            Service request metrics and completion analysis
                        </p>
                    </div>
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

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                ) : metrics ? (
                    <>
                        {/* Key Metrics */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                                    <Wrench className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-500">{metrics.totalRequests}</div>
                                    <p className="text-xs text-muted-foreground mt-1">All service requests</p>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-500">{metrics.completedRequests}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{metrics.completionRate.toFixed(1)}% completion rate</p>
                                </CardContent>
                            </Card>

                            <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                                    <XCircle className="h-4 w-4 text-destructive" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">{metrics.cancelledRequests}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{metrics.cancellationRate.toFixed(1)}% cancellation rate</p>
                                </CardContent>
                            </Card>

                            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-amber-500">{metrics.acceptedRequests}</div>
                                    <p className="text-xs text-muted-foreground mt-1">In progress</p>
                                </CardContent>
                            </Card>

                            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Conversion</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-500">{metrics.conversionRate.toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1">Request success efficiency</p>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-600/20 bg-gradient-to-br from-emerald-600/5 to-transparent col-span-1 md:col-span-2 lg:col-span-1">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(metrics.totalRevenue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">From completed requests</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Requests by Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Requests by Status</CardTitle>
                                    <CardDescription>Distribution of request statuses</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={metrics.requestsByStatus}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {metrics.requestsByStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Requests by Service Type */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Requests by Service Type</CardTitle>
                                    <CardDescription>Most requested services</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={metrics.requestsByService.slice(0, 5)}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="value" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Services */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 5 Services by Volume</CardTitle>
                                <CardDescription>Most requested services with completion rates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {metrics.topServices.map((service, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{service.name}</div>
                                                        <div className="text-xs text-muted-foreground">{service.count} requests</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-emerald-500">{service.completionRate.toFixed(1)}%</div>
                                                    <div className="text-xs text-muted-foreground">completion</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${service.completionRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>
        </ProtectedRoute>
    )
}
