"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Package, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function PopularServices({ services, totalRequests }: { services: any[], totalRequests: number }) {
    if (!services || services.length === 0) {
        return (
            <div className="glass-card p-6 min-h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p>No service data available</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Service Popularity</h3>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Market Share</span>
            </div>
            <div className="space-y-5">
                {services.map((service, index) => (
                    <Link key={service.name} href="/admin/services" className="block group">
                        <div className="space-y-2 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full group-hover:scale-125 transition-transform shadow-sm"
                                        style={{ backgroundColor: service.color }}
                                    />
                                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">{service.count} Hits</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-all" />
                                </div>
                            </div>
                            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                                    style={{
                                        width: `${(service.count / totalRequests) * 100}%`,
                                        backgroundColor: service.color
                                    }}
                                />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export function UserGrowthChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">User Acquisition</h3>
                    <p className="text-xs text-muted-foreground">Monthly growth trends</p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorRiders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F05A28" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F05A28" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorRoadies" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1F2A44" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1F2A44" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            backdropFilter: "blur(8px)"
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="riders"
                        stroke="#F05A28"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRiders)"
                        name="Customers"
                    />
                    <Area
                        type="monotone"
                        dataKey="roadies"
                        stroke="#1F2A44"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRoadies)"
                        name="Providers"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
