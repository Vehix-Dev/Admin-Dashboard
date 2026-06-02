"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import { Loader2, Filter, Calendar as CalendarIcon, TrendingUp, CheckCircle, AlertCircle, Clock, BarChart3, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js"
import { Line, Bar, Pie } from "react-chartjs-2"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

interface PerformanceMetrics {
    total_requests: number
    completed: number
    cancelled: number
    expired: number
    average_response_time: number
    success_conversion_rate: number
    failure_rate: number
    by_service_type: {
        service_type: string
        total: number
        completed: number
        cancelled: number
        expired: number
        success_rate: number
        failure_rate: number
    }[]
}

export default function JobsPerformanceReportPage() {
    const router = useRouter()
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [showFilters, setShowFilters] = useState(false)
    const { toast } = useToast()

    const fetchMetrics = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (startDate) params.append("start_date", format(startDate, "yyyy-MM-dd"))
            if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"))

            const response = await fetch(`/api/auth/admin/reports/jobs-performance?${params}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("admin_access_token")}`,
                }
            })
            if (response.ok) {
                const data = await response.json()
                setMetrics(data)
            }
        } catch (error) {
            console.error("Failed to fetch metrics", error)
            toast({
                title: "Error",
                description: "Failed to load performance metrics",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMetrics()
    }, [startDate, endDate])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!metrics) {
        return <div className="text-center py-12">Failed to load metrics</div>
    }

    const successRate = metrics.success_conversion_rate
    const failureRate = metrics.failure_rate

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">Jobs/Assists Performance report</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">Operational insights into platform request performance</p>
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

            {/* Date Filters */}
            {showFilters && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-wrap items-end gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">From</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={`w-[160px] justify-start text-left font-mono text-xs h-10 ${!startDate ? 'text-muted-foreground' : ''}`}>
                                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                        {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => endDate ? date > endDate : false} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 font-mono">To</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={`w-[160px] justify-start text-left font-mono text-xs h-10 ${!endDate ? 'text-muted-foreground' : ''}`}>
                                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                        {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => startDate ? date < startDate : false} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button variant="ghost" size="sm" onClick={() => { setStartDate(undefined); setEndDate(undefined) }} className="text-muted-foreground hover:text-foreground h-10 px-4 font-mono text-xs">
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card role="button" tabIndex={0} onClick={() => router.push("/sys-admin/requests")} className="cursor-pointer transition-colors hover:border-primary/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.total_requests}</div>
                        <p className="text-xs text-gray-500 mt-1">All requests made</p>
                    </CardContent>
                </Card>

                <Card role="button" tabIndex={0} onClick={() => router.push("/sys-admin/requests/completed")} className="cursor-pointer transition-colors hover:border-primary/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
                        <p className="text-xs text-gray-500 mt-1">Successfully completed</p>
                    </CardContent>
                </Card>

                <Card role="button" tabIndex={0} onClick={() => router.push("/sys-admin/requests/cancelled")} className="cursor-pointer transition-colors hover:border-primary/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{metrics.cancelled}</div>
                        <p className="text-xs text-gray-500 mt-1">User cancellations</p>
                    </CardContent>
                </Card>

                <Card role="button" tabIndex={0} onClick={() => router.push("/sys-admin/requests/cancelled")} className="cursor-pointer transition-colors hover:border-primary/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{metrics.expired}</div>
                        <p className="text-xs text-gray-500 mt-1">No Roadie accepted</p>
                    </CardContent>
                </Card>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(metrics.average_response_time)}s</div>
                        <p className="text-xs text-gray-500">By Roadies</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500">Completion rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{failureRate.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500">Cancelled + Expired</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Requests by Service Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Bar
                            data={{
                                labels: metrics.by_service_type.map(s => s.service_type),
                                datasets: [
                                    {
                                        label: "Total Requests",
                                        data: metrics.by_service_type.map(s => s.total),
                                        backgroundColor: "#3b82f6",
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: "top" as const },
                                }
                            }}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Success vs Failure Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Pie
                            data={{
                                labels: ["Completed", "Failed"],
                                datasets: [
                                    {
                                        data: [successRate, failureRate],
                                        backgroundColor: ["#10b981", "#ef4444"],
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: "bottom" as const },
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Service Type Performance Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Service Type Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2">Service Type</th>
                                    <th className="text-right py-2">Total</th>
                                    <th className="text-right py-2">Completed</th>
                                    <th className="text-right py-2">Cancelled</th>
                                    <th className="text-right py-2">Expired</th>
                                    <th className="text-right py-2">Success Rate</th>
                                    <th className="text-right py-2">Failure Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.by_service_type.map((service, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="py-3">{service.service_type}</td>
                                        <td className="text-right">{service.total}</td>
                                        <td className="text-right"><span className="text-green-600 font-medium">{service.completed}</span></td>
                                        <td className="text-right"><span className="text-red-600 font-medium">{service.cancelled}</span></td>
                                        <td className="text-right"><span className="text-yellow-600 font-medium">{service.expired}</span></td>
                                        <td className="text-right"><Badge className="bg-green-100 text-green-800">{service.success_rate.toFixed(1)}%</Badge></td>
                                        <td className="text-right"><Badge className="bg-red-100 text-red-800">{service.failure_rate.toFixed(1)}%</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
