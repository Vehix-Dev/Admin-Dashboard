"use client"

import Link from "next/link"
import { Wrench, Radio, UserCheck, Users, Briefcase, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  accent?: string
  href?: string
  sub?: string
}

function StatCard({ title, value, icon, accent = "text-primary", href, sub }: StatCardProps) {
  const inner = (
    <div className="glass-card p-4 hover:border-primary/30 transition-all h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={cn("text-2xl font-bold mt-1", accent)}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg bg-muted/50">{icon}</div>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

export function StatsOverview({ stats }: { stats: Record<string, unknown> }) {
  if (!stats) return null

  const s = stats as {
    totalRequests: number
    activeRequests: number
    onlineRoadies: number
    onJobRoadies: number
    activeRiders: number
    todayTotal: number
    todayCompleted: number
    todayCancelled: number
    todayExpired: number
    todayConversionRate: number
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Platform overview
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Total Requests"
            value={s.totalRequests}
            icon={<Wrench className="h-4 w-4 text-blue-500" />}
            accent="text-foreground"
            href="/sys-admin/requests"
          />
          <StatCard
            title="Active Requests"
            value={s.activeRequests}
            icon={<Radio className="h-4 w-4 text-amber-500" />}
            accent="text-amber-600"
            href="/sys-admin/requests"
            sub="Realtime ongoing"
          />
          <StatCard
            title="Online Roadies"
            value={s.onlineRoadies}
            icon={<UserCheck className="h-4 w-4 text-emerald-500" />}
            accent="text-emerald-600"
            href="/sys-admin/live-map"
          />
          <StatCard
            title="On-Job Roadies"
            value={s.onJobRoadies}
            icon={<Briefcase className="h-4 w-4 text-orange-500" />}
            accent="text-orange-600"
            href="/sys-admin/live-map"
          />
          <StatCard
            title="Active Riders"
            value={s.activeRiders}
            icon={<Users className="h-4 w-4 text-blue-500" />}
            accent="text-blue-600"
            href="/sys-admin/live-map"
            sub="In active request"
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Today&apos;s performance
        </h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          <StatCard
            title="Requests Today"
            value={s.todayTotal}
            icon={<Wrench className="h-4 w-4" />}
          />
          <StatCard
            title="Completed"
            value={s.todayCompleted}
            icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
            accent="text-emerald-600"
          />
          <StatCard
            title="Cancelled"
            value={s.todayCancelled}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            accent="text-red-600"
          />
          <StatCard
            title="Expired"
            value={s.todayExpired}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            title="Success Rate"
            value={`${s.todayConversionRate}%`}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            accent="text-primary"
            sub="Completed vs today total"
          />
        </div>
      </div>
    </div>
  )
}
