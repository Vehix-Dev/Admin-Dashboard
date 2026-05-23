"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { Activity, AlertTriangle, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export function ServicesByTypeChart({ services }: { services: { name: string; count: number; color?: string }[] }) {
  if (!services?.length) {
    return (
      <div className="glass-card p-6 h-full min-h-[360px] flex flex-col items-center justify-center text-muted-foreground">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="font-semibold">No service data yet</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-6 h-full min-h-[360px]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Requests by Service Type</h3>
        <p className="text-xs text-muted-foreground">Distribution of assists across services</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={services} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            angle={-25}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" fill="#F05A28" radius={[6, 6, 0, 0]} name="Requests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

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
                <p className="font-semibold">No outcome data available</p>
            </div>
        )
    }

    return (
        <div className="glass-card p-6 h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Success vs Failure</h3>
                    <p className="text-xs text-muted-foreground">Completed vs cancelled + expired</p>
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
