"use client"

import Link from "next/link"
import { Wrench, Activity, ThumbsUp, MapPin, Users, UserCheck, Target, Zap, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface StatCardProps {
    title: string
    value: number | string
    icon: React.ReactNode
    iconBg: string
    subtext: string
    trend: string
    isPercentage?: boolean
    className?: string
}

const StatCard = ({
    title,
    value,
    icon,
    iconBg,
    subtext,
    trend,
    isPercentage = false,
    className
}: StatCardProps) => {
    const getIconColor = () => {
        if (iconBg.includes('blue')) return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
        if (iconBg.includes('emerald') || iconBg.includes('green')) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        if (iconBg.includes('amber') || iconBg.includes('yellow')) return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        if (iconBg.includes('purple')) return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
        return 'bg-primary/10 text-primary'
    }

    return (
        <div className={cn("glass-card p-6 hover:border-primary/30 transition-all duration-300 group", className)}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
                    <p className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                        {isPercentage ? `${value}%` : typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    <div className="space-y-1.5">
                        <p className="text-sm text-muted-foreground">{subtext}</p>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-medium text-muted-foreground">{trend}</span>
                        </div>
                    </div>
                </div>
                <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-300", getIconColor())}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

export function StatsOverview({ stats }: { stats: any }) {
    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/requests" className="block">
                    <StatCard
                        title="Total Service Requests"
                        value={stats.totalRequests}
                        icon={<Wrench className="h-5 w-5" />}
                        iconBg="bg-blue-500"
                        subtext={`${stats.activeRequests} active • ${stats.completedRequests} completed`}
                        trend={`${stats.completionRate}% completion rate`}
                    />
                </Link>

                <Link href="/admin/reports/users" className="block">
                    <StatCard
                        title="Active Users"
                        value={stats.activeRiders + stats.activeRoadies}
                        icon={<Activity className="h-5 w-5" />}
                        iconBg="bg-emerald-500"
                        subtext={`${stats.activeRiders} riders • ${stats.activeRoadies} providers`}
                        trend={`${stats.acceptanceRate}% request acceptance`}
                    />
                </Link>

                <Link href="/admin/reports" className="block">
                    <StatCard
                        title="Platform Health"
                        value={stats.platformHealth.satisfaction}
                        icon={<ThumbsUp className="h-5 w-5" />}
                        iconBg="bg-amber-500"
                        subtext="Service satisfaction score"
                        trend={`${stats.averageResponseTime}min avg. response`}
                        isPercentage={true}
                    />
                </Link>

                <Link href="/admin/live-map" className="block">
                    <StatCard
                        title="Realtime Activity"
                        value={stats.activeLocations}
                        icon={<MapPin className="h-5 w-5" />}
                        iconBg="bg-purple-500"
                        subtext={`${stats.enRouteAssignments} en route assignments`}
                        trend="Live updates every 30s"
                    />
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/riders" className="block group">
                    <div className="glass-card p-6 shadow-sm hover:border-blue-500/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">Total Customers</h3>
                            <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-3xl font-bold text-foreground">{stats.totalRiders}</span>
                                <div className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase tracking-wider border border-blue-500/20">
                                    {stats.approvedRiders} approved
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-blue-500/70">
                                <span>Pending: {stats.pendingRiders}</span>
                                <span>{stats.activeRiders} active</span>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/roadies" className="block group">
                    <div className="glass-card p-6 shadow-sm hover:border-emerald-500/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">Total Providers</h3>
                            <UserCheck className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-3xl font-bold text-foreground">{stats.totalRoadies}</span>
                                <div className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider border border-emerald-500/20">
                                    {stats.approvedRoadies} approved
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-emerald-500/70">
                                <span>Pending: {stats.pendingRoadies}</span>
                                <span>{stats.activeRoadies} active</span>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/services" className="block group">
                    <div className="glass-card p-6 shadow-sm hover:border-purple-500/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">Service Status</h3>
                            <Target className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-3xl font-bold text-foreground">{stats.totalServices}</span>
                                <div className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 uppercase tracking-wider border border-purple-500/20">
                                    Catalog
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-purple-500/70">
                                <span>Active: {stats.activeRequests}</span>
                                <span className="font-semibold">View All</span>
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="glass-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Quick Launch</h3>
                        <Zap className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="space-y-2">
                        <Link href="/admin/requests/create" className="block">
                            <Button size="sm" className="w-full justify-start h-9 bg-primary/10 hover:bg-primary text-primary hover:text-white border-none transition-all duration-300">
                                <Wrench className="mr-2 h-4 w-4" />
                                New Request
                            </Button>
                        </Link>
                        <Link href="/admin/live-map" className="block">
                            <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-muted font-medium transition-all duration-300">
                                <MapPin className="mr-2 h-4 w-4" />
                                Live Map
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
