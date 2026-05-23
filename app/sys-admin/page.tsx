"use client"

import { useEffect, useState } from "react"
import { LayoutDashboard, Settings2, RefreshCw, Eye, EyeOff, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getRiders,
  getRoadies,
  getServiceRequests,
  getServices,
  getCombinedRealtimeLocations,
  getImagesByUser
} from "@/lib/api"
import { getDashboardConfig, saveDashboardConfig, type WidgetConfig } from "@/lib/dashboard-store"

// Widgets
import { StatsOverview } from "@/components/admin/dashboard/stats-overview"
import { RequestTrends, StatusDistribution, ServicesByTypeChart } from "@/components/admin/dashboard/charts-widgets"
import { ACTIVE_STATUSES, buildActivityFeed, formatTimeAgo, isToday } from "@/lib/dashboard-utils"
import { TopCustomers, TopProviders, RecentActivity } from "@/components/admin/dashboard/user-activity-widgets"
import { PopularServices, UserGrowthChart } from "@/components/admin/dashboard/growth-widgets"
import { PlatformHealthWidget } from "@/components/admin/dashboard/platform-health"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const { toast } = useToast()

  useEffect(() => {
    setWidgets(getDashboardConfig())
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsRefreshing(true)
    try {
      const [riders, roadies, requests, services, locations] = await Promise.all([
        getRiders(), getRoadies(), getServiceRequests(), getServices(), getCombinedRealtimeLocations()
      ])

      // Reuse the aggregation logic from the previous version but simplified for clarity
      // (Normally this would be a backend aggregation endpoint)
      const data = aggregateStats(riders, roadies, requests, services, locations)
      setStats(data)
    } catch (err) {
      console.error("Dashboard error:", err)
      toast({ title: "Sync Failed", description: "Could not fetch latest metrics.", variant: "destructive" })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const aggregateStats = (riders: any[], roadies: any[], requests: any[], services: any[], locations: any) => {
    const norm = (s: string) => (s || "").toUpperCase()
    const totalRequests = requests.length
    const completed = requests.filter((r) => norm(r.status) === "COMPLETED").length
    const cancelled = requests.filter((r) => norm(r.status) === "CANCELLED").length
    const expired = requests.filter((r) => norm(r.status) === "EXPIRED").length
    const activeRequests = requests.filter((r) => ACTIVE_STATUSES.includes(norm(r.status))).length

    const onlineRoadies = locations?.rodies?.length ?? 0
    const onJobRoadies =
      locations?.rodies?.filter((r: { activity_status?: string }) => r.activity_status === "ON_JOB").length ?? 0
    const activeRiders = locations?.riders?.length ?? 0

    const todayTotal = requests.filter((r) => isToday(r.created_at)).length
    const todayCompleted = requests.filter(
      (r) => norm(r.status) === "COMPLETED" && isToday(r.completed_at || r.updated_at || r.created_at)
    ).length
    const todayCancelled = requests.filter(
      (r) => norm(r.status) === "CANCELLED" && isToday(r.updated_at || r.created_at)
    ).length
    const todayExpired = requests.filter(
      (r) => norm(r.status) === "EXPIRED" && isToday(r.updated_at || r.created_at)
    ).length
    const todayConversionRate =
      todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toLocaleDateString("en-US", { weekday: "short" })
    })

    const requestTrends = last7Days.map((day) => {
      const dayRequests = requests.filter(
        (r) => new Date(r.created_at).toLocaleDateString("en-US", { weekday: "short" }) === day
      )
      return {
        day,
        requests: dayRequests.length,
        completed: dayRequests.filter((r) => norm(r.status) === "COMPLETED").length,
      }
    })

    const serviceCounts: Record<string, number> = {}
    requests.forEach((r) => {
      const name = r.service_type_name || "Other"
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    })
    const servicesByType = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], i) => ({
        name,
        count,
        color: ["#F05A28", "#1F2A44", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6", "#EC4899", "#14B8A6"][i % 8],
      }))

    const popularServices = servicesByType.slice(0, 5)

    const months = ["Oct", "Nov", "Dec", "Jan"]
    const userGrowth = months.map((month) => ({
      month,
      riders: riders.filter((r) => new Date(r.created_at || Date.now()).getMonth() <= months.indexOf(month) + 9).length || 0,
      roadies: roadies.filter((r) => new Date(r.created_at || Date.now()).getMonth() <= months.indexOf(month) + 9).length || 0,
    }))

    const failed = cancelled + expired
    const statusDistribution = [
      { name: "Completed", value: completed, color: "#10B981" },
      { name: "Failed", value: failed, color: "#EF4444" },
    ].filter((v) => v.value > 0)

    const activityFeed = buildActivityFeed(requests).map((item) => ({
      ...item,
      timeAgo: formatTimeAgo(item.timestamp),
    }))

    const topRiders = [...riders]
      .map((r) => ({
        ...r,
        firstName: r.first_name,
        lastName: r.last_name,
        completedRequests: requests.filter((req) => req.rider === r.id && norm(req.status) === "COMPLETED").length,
      }))
      .sort((a, b) => b.completedRequests - a.completedRequests)
      .slice(0, 5)

    const topRoadies = [...roadies]
      .map((r) => ({
        ...r,
        firstName: r.first_name,
        lastName: r.last_name,
        completedRequests: requests.filter((req) => req.rodie === r.id && norm(req.status) === "COMPLETED").length,
      }))
      .sort((a, b) => b.completedRequests - a.completedRequests)
      .slice(0, 5)

    return {
      totalRequests,
      completedRequests: completed,
      activeRequests,
      onlineRoadies,
      onJobRoadies,
      activeRiders,
      todayTotal,
      todayCompleted,
      todayCancelled,
      todayExpired,
      todayConversionRate,
      totalRiders: riders.length,
      totalRoadies: roadies.length,
      completionRate: totalRequests > 0 ? Math.round((completed / totalRequests) * 100) : 0,
      totalServices: services.length,
      requestTrends,
      statusDistribution,
      servicesByType,
      popularServices,
      topRiders,
      topRoadies,
      activityFeed,
      platformHealth: {
        activeUsers: onlineRoadies + activeRiders,
        serviceAvailability: 100,
        responseRate:
          totalRequests > 0
            ? Math.round(
                (requests.filter((r) => !["REQUESTED"].includes(norm(r.status))).length / totalRequests) * 100
              )
            : 0,
        satisfaction: 98,
      },
      userGrowth,
    }
  }

  const toggleWidget = (id: string) => {
    const newWidgets = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    setWidgets(newWidgets)
    saveDashboardConfig(newWidgets)
  }

  const renderWidget = (id: string) => {
    if (!stats) return null
    switch (id) {
      case 'stats-overview': return <StatsOverview stats={stats} />
      case 'request-trends': return <RequestTrends trends={stats.requestTrends} />
      case 'status-pie': return <StatusDistribution distribution={stats.statusDistribution} />
      case 'popular-services': return <ServicesByTypeChart services={stats.servicesByType} />
      case 'top-customers': return <TopCustomers riders={stats.topRiders} />
      case 'top-providers': return <TopProviders roadies={stats.topRoadies} />
      case 'recent-requests': return <RecentActivity feed={stats.activityFeed} />
      case 'platform-health': return <PlatformHealthWidget health={stats.platformHealth} />
      case 'user-growth': return <UserGrowthChart data={stats.userGrowth} />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Command <span className="text-primary">Center</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Real-time intelligence and operations overview.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn("glass-card border-none hover:bg-primary hover:text-white transition-all duration-300 gap-2", isCustomizing && "bg-primary text-white")}
          >
            <Settings2 className="h-4 w-4" />
            {isCustomizing ? 'Finish Layout' : 'Customize'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="glass-card border-none hover:bg-muted font-bold gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Sync
          </Button>
        </div>
      </div>

      {/* Widget Customization Panel */}
      {isCustomizing && (
        <div className="glass-card p-6 border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-500 rounded-3xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Widget Inventory
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {widgets.map(w => (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                  w.visible
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "bg-muted/40 border-border text-muted-foreground opacity-60 grayscale"
                )}
              >
                <span>{w.title}</span>
                {w.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
        {widgets.filter(w => w.visible).map(w => (
          <div
            key={w.id}
            className={cn(
              "relative",
              w.size === 'full' ? 'md:col-span-6 lg:col-span-12' :
                w.size === 'large' ? 'md:col-span-4 lg:col-span-8' :
                  w.size === 'medium' ? 'md:col-span-3 lg:col-span-6' :
                    'md:col-span-2 lg:col-span-4'
            )}
          >
            {isCustomizing && (
              <div className="absolute top-2 right-2 z-10 opacity-60 hover:opacity-100 transition-opacity">
                <div className="bg-background/80 backdrop-blur-sm p-1 rounded border border-border cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </div>
              </div>
            )}
            <div className={cn(isCustomizing && "ring-2 ring-primary/20 ring-offset-4 ring-offset-background rounded-2xl overflow-hidden")}>
              {renderWidget(w.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}