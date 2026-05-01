"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Loader2, Filter, Calendar as CalendarIcon, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
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
import { Line, Doughnut, Pie, Bar } from "react-chartjs-2"

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

interface UserAnalyticsMetrics {
    total_registered_users: number
    total_riders: number
    total_roadies: number
    approved_roadies: number
    unapproved_roadies: number
    active_riders_7d: number
    active_roadies_7d: number
    rider_activity_rate: number
    roadie_activity_rate: number
    user_growth_trend: {
        date: string
        riders: number
        roadies: number
    }[]
    user_distribution: {
        riders: number
        roadies: number
    }
    activity_distribution: {
        active_riders: number
        inactive_riders: number
        active_roadies: number
        inactive_roadies: number
    }
}

export default function UserAnalyticsReportPage() {
    const [metrics, setMetrics] = useState<UserAnalyticsMetrics | null>(null)
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

            const response = await fetch(`/api/auth/admin/reports/user-analytics?${params}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
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
                description: "Failed to load user analytics",
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Analytics Report</h1>
                <p className="text-gray-500">User acquisition, distribution, and engagement insights</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>From Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <CalendarIcon className="h-4 w-4 mr-2" />
                                                {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                onSelect={setStartDate}
                                                disabled={(date) => endDate ? date > endDate : false}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label>To Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <CalendarIcon className="h-4 w-4 mr-2" />
                                                {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                onSelect={setEndDate}
                                                disabled={(date) => startDate ? date < startDate : false}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStartDate(undefined)
                                        setEndDate(undefined)
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.total_registered_users}</div>
                        <p className="text-xs text-gray-500 mt-1">Riders + Roadies</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Riders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics.total_riders}</div>
                        <p className="text-xs text-gray-500 mt-1">All registered riders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Roadies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{metrics.total_roadies}</div>
                        <p className="text-xs text-gray-500 mt-1">All service providers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Approved Roadies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{metrics.approved_roadies}</div>
                        <p className="text-xs text-gray-500 mt-1">Active service providers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Riders (7d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.active_riders_7d}</div>
                        <p className="text-xs text-gray-500">Made at least 1 request</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Roadies (7d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.active_roadies_7d}</div>
                        <p className="text-xs text-gray-500">Completed at least 1 job</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Unapproved Roadies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{metrics.unapproved_roadies}</div>
                        <p className="text-xs text-gray-500">Pending approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rider Activity Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics.rider_activity_rate.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500">Made at least 1 request</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Roadie Activity Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{metrics.roadie_activity_rate.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500">Out of approved roadies</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Growth Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Line
                            data={{
                                labels: metrics.user_growth_trend.map(d => format(new Date(d.date), "MMM d")),
                                datasets: [
                                    {
                                        label: "Riders",
                                        data: metrics.user_growth_trend.map(d => d.riders),
                                        borderColor: "#3b82f6",
                                        tension: 0.1,
                                    },
                                    {
                                        label: "Roadies",
                                        data: metrics.user_growth_trend.map(d => d.roadies),
                                        borderColor: "#10b981",
                                        tension: 0.1,
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
                        <CardTitle className="text-lg">User Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Doughnut
                            data={{
                                labels: ["Riders", "Roadies"],
                                datasets: [
                                    {
                                        data: [metrics.user_distribution.riders, metrics.user_distribution.roadies],
                                        backgroundColor: ["#3b82f6", "#10b981"],
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

            {/* Activity Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">User Activity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <Pie
                        data={{
                            labels: ["Active Riders", "Inactive Riders", "Active Roadies", "Inactive Roadies"],
                            datasets: [
                                {
                                    data: [
                                        metrics.activity_distribution.active_riders,
                                        metrics.activity_distribution.inactive_riders,
                                        metrics.activity_distribution.active_roadies,
                                        metrics.activity_distribution.inactive_roadies,
                                    ],
                                    backgroundColor: [
                                        "#3b82f6",
                                        "#e5e7eb",
                                        "#10b981",
                                        "#fca5a5",
                                    ],
                                }
                            ]
                        }}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: "right" as const },
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
