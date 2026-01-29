"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Activity, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function RequestTrends({ trends }: { trends: any[] }) {
    if (!trends || trends.length === 0) {
        return (
            <div className="glass-card p-6 h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No activity data available</p>
                <p className="text-sm mt-1">Request trends will appear here</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Weekly Trends</h3>
                    <p className="text-xs text-muted-foreground">Service activity over last 7 days</p>
                </div>
                <div className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                    Live Sync
                </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis
                        dataKey="day"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'currentColor' }}
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            backdropFilter: "blur(12px)"
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="requests"
                        stroke="#F05A28"
                        strokeWidth={4}
                        name="Total Requests"
                        dot={{ r: 4, fill: "#F05A28", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: "#F05A28", strokeWidth: 2, stroke: "#fff" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#10B981"
                        strokeWidth={4}
                        name="Completed"
                        dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export function StatusDistribution({ distribution }: { distribution: any[] }) {
    if (!distribution || distribution.length === 0) {
        return (
            <div className="glass-card p-6 h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="font-semibold">No status data available</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Status Mix</h3>
                    <p className="text-xs text-muted-foreground">Current system state</p>
                </div>
            </div>
            <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "12px",
                                backdropFilter: "blur(12px)"
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {distribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg border border-border/20">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
