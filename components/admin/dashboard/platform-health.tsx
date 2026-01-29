"use client"

import { CheckCircle, Clock, Users, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface HealthMetricProps {
    label: string
    value: number
    icon: React.ReactNode
    color: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}

const HealthMetric = ({ label, value, icon, color }: HealthMetricProps) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
    }

    const barColors = {
        blue: 'bg-blue-500',
        green: 'bg-emerald-500',
        amber: 'bg-amber-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500'
    }

    return (
        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40 hover:border-primary/20 transition-all group">
            <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg transition-transform group-hover:scale-110", colorClasses[color])}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-2xl font-black text-foreground tracking-tighter">{value}%</p>
                </div>
            </div>
            <div className="w-20">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-1000", barColors[color])}
                        style={{ width: `${value}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

export function PlatformHealthWidget({ health }: { health: any }) {
    if (!health) return null

    return (
        <div className="glass-card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Vital Metrics</h3>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
            </div>
            <div className="space-y-4">
                <HealthMetric
                    label="Load Efficiency"
                    value={health.activeUsers}
                    icon={<Users className="h-4 w-4" />}
                    color="blue"
                />
                <HealthMetric
                    label="Uptime"
                    value={health.serviceAvailability}
                    icon={<CheckCircle className="h-4 w-4" />}
                    color="green"
                />
                <HealthMetric
                    label="Latency"
                    value={health.responseRate}
                    icon={<Clock className="h-4 w-4" />}
                    color="amber"
                />
                <HealthMetric
                    label="Vibe Score"
                    value={health.satisfaction}
                    icon={<ThumbsUp className="h-4 w-4" />}
                    color="purple"
                />
            </div>
        </div>
    )
}
