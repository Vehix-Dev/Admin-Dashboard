"use client"

import { useEffect, useState } from "react"
import { APITelemetry } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Activity,
    Zap,
    Clock,
    CheckCircle,
    XCircle,
    BarChart3,
    RefreshCw,
    Server
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from "recharts"
import { Button } from "@/components/ui/button"

export default function APIHealthPage() {
    const [metrics, setMetrics] = useState<any[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)

    const refreshMetrics = () => {
        setIsRefreshing(true)
        setMetrics([...APITelemetry.metrics])
        setTimeout(() => setIsRefreshing(false), 500)
    }

    useEffect(() => {
        refreshMetrics()
        const interval = setInterval(refreshMetrics, 3000)
        return () => clearInterval(interval)
    }, [])

    const avgDuration = metrics.length > 0
        ? Math.round(metrics.reduce((acc, m) => acc + m.duration, 0) / metrics.length)
        : 0

    const successRate = metrics.length > 0
        ? Math.round((metrics.filter(m => m.status >= 200 && m.status < 300).length / metrics.length) * 100)
        : 100

    const chartData = [...metrics].reverse().map((m, i) => ({
        name: i,
        duration: Math.round(m.duration),
        status: m.status
    }))

    return (
        <div className="space-y-6 animate-in-fade">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">API Health & Telemetry</h1>
                    <p className="text-muted-foreground mt-1">Real-time monitoring of backend communications</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshMetrics}
                    disabled={isRefreshing}
                    className="glass-card"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card premium-shadow border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Latency</CardTitle>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgDuration}ms</div>
                        <p className="text-xs text-muted-foreground mt-1">Across last 50 requests</p>
                    </CardContent>
                </Card>

                <Card className="glass-card premium-shadow border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{successRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Percentage of 2xx responses</p>
                    </CardContent>
                </Card>

                <Card className="glass-card premium-shadow border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cached in current session</p>
                    </CardContent>
                </Card>

                <Card className="glass-card premium-shadow border-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <Server className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">Optimal</div>
                        <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card premium-shadow border-none overflow-hidden">
                <CardHeader>
                    <CardTitle>Response Time Trend</CardTitle>
                    <CardDescription>Latency measurements for recent API calls (ms)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F05A28" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F05A28" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}ms`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(31, 42, 68, 0.9)', border: 'none', borderRadius: '8px', color: 'white' }}
                                itemStyle={{ color: '#F05A28' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="duration"
                                stroke="#F05A28"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDuration)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="glass-card premium-shadow border-none">
                <CardHeader>
                    <CardTitle>Recent Request Log</CardTitle>
                    <CardDescription>Details of the most recent API interactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {metrics.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                No telemetry data captured yet
                            </div>
                        ) : (
                            metrics.map((metric, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${metric.status >= 400 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {metric.status >= 400 ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className="font-mono text-sm leading-none flex items-center gap-2">
                                                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{metric.method}</span>
                                                {metric.endpoint}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {new Date(metric.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold">{Math.round(metric.duration)}ms</div>
                                        <div className={`text-xs font-medium ${metric.status >= 400 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            HTTP {metric.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
