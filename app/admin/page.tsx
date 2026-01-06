"use client"

import { useEffect, useState } from "react"
import { Users, UserCheck, Wrench, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import {
  getRiders,
  getRoadies,
  getServiceRequests,
  getActiveRiderLocations,
  type ServiceRequest,
  type Rider,
  type Roadie
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DashboardStats {
  totalRiders: number
  totalRoadies: number
  totalRequests: number
  activeRiders: number
  activeRoadies: number
  pendingRequests: number
  acceptedRequests: number
  completedRequests: number
  cancelledRequests: number
  monthlyRiders: { month: string; count: number }[]
  monthlyRoadies: { month: string; count: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
  serviceTypeDistribution: { name: string; value: number; color: string }[]
  recentRequests: ServiceRequest[]
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDashboardData = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      const [ridersData, roadiesData, requestsData] = await Promise.all([
        getRiders(),
        getRoadies(),
        getServiceRequests(),
      ])

      // Calculate real statistics from API data
      const totalRiders = ridersData.length
      const totalRoadies = roadiesData.length
      const totalRequests = requestsData.length

      // Active users (approved)
      const activeRiders = ridersData.filter(rider => rider.is_approved).length
      const activeRoadies = roadiesData.filter(roadie => roadie.is_approved).length

      // Request status counts - using actual statuses from API
      const pendingRequests = requestsData.filter(req => req.status.toLowerCase() === 'pending').length
      const acceptedRequests = requestsData.filter(req => req.status.toLowerCase() === 'accepted').length
      const completedRequests = requestsData.filter(req => req.status.toLowerCase() === 'completed').length
      const cancelledRequests = requestsData.filter(req => req.status.toLowerCase() === 'cancelled').length

      // Generate monthly data from creation dates
      const monthlyRiders = calculateMonthlyData(ridersData)
      const monthlyRoadies = calculateMonthlyData(roadiesData)

      // Status distribution from real data
      const statusDistribution = [
        { name: "Pending", value: pendingRequests, color: "#FBBF24" },
        { name: "Accepted", value: acceptedRequests, color: "#60A5FA" },
        { name: "Completed", value: completedRequests, color: "#34D399" },
        { name: "Cancelled", value: cancelledRequests, color: "#F87171" },
      ].filter(item => item.value > 0)

      // Service type distribution from real data
      const serviceTypeDistribution = calculateServiceTypeDistribution(requestsData)

      // Recent requests sorted by creation date
      const recentRequests = [...requestsData]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      setStats({
        totalRiders,
        totalRoadies,
        totalRequests,
        activeRiders,
        activeRoadies,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        cancelledRequests,
        monthlyRiders,
        monthlyRoadies,
        statusDistribution,
        serviceTypeDistribution,
        recentRequests,
      })

      setError(null)
    } catch (err) {
      console.error("[v0] Dashboard fetch error:", err)
      setError("Failed to load dashboard data")
      toast({
        title: "Error",
        description: "Failed to connect to backend API",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculate monthly data from creation dates
  const calculateMonthlyData = (data: (Rider | Roadie)[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyCounts: Record<string, number> = {}

    data.forEach(item => {
      try {
        const date = new Date(item.created_at)
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        const monthName = monthNames[date.getMonth()]

        if (!monthlyCounts[monthKey]) {
          monthlyCounts[monthKey] = 0
        }
        monthlyCounts[monthKey]++
      } catch {
        // Skip invalid dates
      }
    })

    // Convert to array format for charts
    return Object.entries(monthlyCounts)
      .map(([key, count]) => {
        const [year, month] = key.split('-')
        return {
          month: monthNames[parseInt(month)],
          count
        }
      })
      .slice(0, 6) // Last 6 months
      .reverse()
  }

  // Calculate service type distribution from real data
  const calculateServiceTypeDistribution = (requests: ServiceRequest[]) => {
    const serviceCounts: Record<string, number> = {}

    requests.forEach(request => {
      const serviceType = `Service ${request.service_type}`
      serviceCounts[serviceType] = (serviceCounts[serviceType] || 0) + 1
    })

    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]
    return Object.entries(serviceCounts).map(([type, count], index) => ({
      name: type,
      value: count,
      color: colors[index % colors.length],
    })).filter(item => item.value > 0)
  }

  // Calculate success rate from real data
  const calculateSuccessRate = () => {
    if (!stats) return 0
    const { completedRequests, acceptedRequests } = stats
    const totalActive = completedRequests + acceptedRequests

    return totalActive > 0 ? Math.round((completedRequests / totalActive) * 100) : 0
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded" />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded" />
          <Skeleton className="h-80 rounded" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2 rounded" />
          <Skeleton className="h-64 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time platform analytics</p>
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
          <p className="font-medium">Connection Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards - Only show if we have data */}
      {stats && (
        <>
          {/* Top Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Customers Card */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.totalRiders.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-500">
                        {stats.activeRiders} active
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {stats.totalRiders > 0
                        ? Math.round((stats.activeRiders / stats.totalRiders) * 100)
                        : 0}% active
                    </span>
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Providers Card */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Providers</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.totalRoadies.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-500">
                        {stats.activeRoadies} active
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {stats.totalRoadies > 0
                        ? Math.round((stats.activeRoadies / stats.totalRoadies) * 100)
                        : 0}% active
                    </span>
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Requests Card */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.totalRequests.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-500">
                        {stats.pendingRequests} pending
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {calculateSuccessRate()}% success rate
                    </span>
                  </div>
                </div>
                <div className="bg-orange-100 p-3 rounded">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Completed Requests Card */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {stats.completedRequests.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-gray-500">
                        {stats.totalRequests > 0
                          ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
                          : 0}% completion
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {stats.acceptedRequests} accepted
                    </span>
                  </div>
                </div>
                <div className="bg-purple-100 p-3 rounded">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* User Registration Chart */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">User Registrations</h3>
              {stats.monthlyRiders.length > 0 || stats.monthlyRoadies.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    ...stats.monthlyRiders.map(item => ({ ...item, type: 'Customers' })),
                    ...stats.monthlyRoadies.map(item => ({ ...item, type: 'Providers' }))
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{
                      backgroundColor: "#F3F4F6",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px"
                    }} />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Customers"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="count"
                      name="Providers"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No registration data available
                </div>
              )}
            </div>

            {/* Request Status Distribution */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Request Status Distribution</h3>
              {stats.statusDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} requests`, 'Count']}
                        contentStyle={{
                          backgroundColor: "#F3F4F6",
                          border: "1px solid #E5E7EB",
                          borderRadius: "6px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {stats.statusDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-600">{item.name}</span>
                        <span className="text-sm font-medium text-gray-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No request data available
                </div>
              )}
            </div>
          </div>

          {/* Service Type Distribution */}
          {stats.serviceTypeDistribution.length > 0 && (
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Service Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.serviceTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    formatter={(value) => [`${value} requests`, 'Count']}
                    contentStyle={{
                      backgroundColor: "#F3F4F6",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Requests"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Activity & Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Requests */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Recent Service Requests</h3>
                {stats.recentRequests.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {stats.totalRequests} total requests
                  </span>
                )}
              </div>

              {stats.recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 px-3 py-1 rounded text-sm font-medium">
                            #{request.id}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>Rider: {request.rider_username || `ID: ${request.rider}`}</p>
                          {request.rodie_username && (
                            <p>Provider: {request.rodie_username}</p>
                          )}
                          <p>Service Type: {request.service_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(request.created_at)}
                        </div>
                        {request.updated_at !== request.created_at && (
                          <div className="text-xs text-gray-400 mt-1">
                            Updated: {formatDate(request.updated_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No service requests yet</p>
                  <p className="text-sm mt-1">Service requests will appear here</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/admin/riders">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
                  >
                    <span>Manage Customers</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/roadies">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
                  >
                    <span>Manage Providers</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/requests">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
                  >
                    <span>View All Requests</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/services">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
                  >
                    <span>Manage Services</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin/live-map">
                  <Button
                    variant="outline"
                    className="w-full justify-between text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
                  >
                    <span>View Live Map</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// StatCard Component for better organization
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  iconBg: string
  subtext: string
}

const StatCard = ({ title, value, icon, iconBg, subtext }: StatCardProps) => (
  <div className="bg-white border border-gray-200 rounded p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-2">{subtext}</p>
      </div>
      <div className={`p-3 rounded ${iconBg}`}>
        {icon}
      </div>
    </div>
  </div>
)