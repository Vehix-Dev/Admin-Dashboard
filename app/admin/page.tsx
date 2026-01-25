"use client"

import { useEffect, useState } from "react"
import {
  Users, UserCheck, Wrench, TrendingUp, Clock, CheckCircle,
  Star, Award, MapPin, Target, Zap, Package,
  Shield, Activity, DollarSign, Calendar,
  AlertCircle, ThumbsUp, AlertTriangle, Battery, Car,
  Navigation, Phone, Mail, User, Map, Image
} from "lucide-react"
import {
  getRiders,
  getRoadies,
  getServiceRequests,
  getActiveRiderLocations,
  getServices,
  getCombinedRealtimeLocations,
  type ServiceRequest,
  type Rider,
  type Roadie,
  type Service,
  type ActiveRiderLocation,
  type CombinedRealtimeResponse,
  getImagesByUser,
  type UserImagesResponse
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
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface DashboardStats {
  // Basic Stats
  totalRiders: number
  totalRoadies: number
  totalRequests: number
  activeRiders: number
  activeRoadies: number
  activeRequests: number

  // Request Status
  pendingRequests: number
  acceptedRequests: number
  completedRequests: number
  cancelledRequests: number

  // User Status
  approvedRiders: number
  pendingRiders: number
  approvedRoadies: number
  pendingRoadies: number

  // Service Data
  totalServices: number
  serviceRequests: number
  popularServices: Array<{ name: string; count: number; color: string }>

  // Realtime Data
  activeLocations: number
  enRouteAssignments: number

  // Performance Metrics
  completionRate: number
  acceptanceRate: number
  averageResponseTime: number

  // Top Performers
  topRiders: Array<{
    id: number
    username: string
    firstName: string
    lastName: string
    totalRequests: number
    completedRequests: number
    phone: string
    email: string
    profileImage?: string
  }>

  topRoadies: Array<{
    id: number
    external_id: string
    username: string
    firstName: string
    lastName: string
    completedRequests: number
    phone: string
    email: string
    is_approved: boolean
    profileImage?: string
  }>

  // Charts Data
  requestTrends: { day: string; requests: number; completed: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
  userGrowth: { month: string; riders: number; roadies: number }[]

  // Recent Activity
  recentRequests: ServiceRequest[]
  recentServiceRequests: Array<{
    id: number
    rider: string
    service: string
    status: string
    created_at: string
  }>

  // Platform Health
  platformHealth: {
    activeUsers: number
    serviceAvailability: number
    responseRate: number
    satisfaction: number
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Function to fetch profile images for users
  const fetchUserProfileImages = async (users: any[], userType: 'rider' | 'roadie') => {
    const usersWithImages = await Promise.all(
      users.map(async (user) => {
        try {
          // Fetch images for this user using their external_id
          const response: UserImagesResponse = await getImagesByUser(user.external_id, {
            image_type: 'PROFILE',
            status: 'APPROVED'
          })

          // Find the approved profile image
          const profileImage = response.images?.find(
            img => img.image_type === 'PROFILE' && img.status === 'APPROVED'
          )

          return {
            ...user,
            profileImage: profileImage?.thumbnail_url || undefined
          }
        } catch (error) {
          console.error(`Error fetching profile image for ${userType} ${user.external_id}:`, error)
          return { ...user, profileImage: undefined }
        }
      })
    )

    return usersWithImages
  }

  const fetchDashboardData = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      const [ridersData, roadiesData, requestsData, servicesData, locationsData] = await Promise.all([
        getRiders(),
        getRoadies(),
        getServiceRequests(),
        getServices(),
        getCombinedRealtimeLocations()
      ])

      // Ensure we have arrays
      const safeRidersData = Array.isArray(ridersData) ? ridersData : []
      const safeRoadiesData = Array.isArray(roadiesData) ? roadiesData : []
      const safeRequestsData = Array.isArray(requestsData) ? requestsData : []
      const safeServicesData = Array.isArray(servicesData) ? servicesData : []
      const safeLocationsData = locationsData || { riders: [], rodies: [] }

      // Calculate basic statistics
      const totalRiders = safeRidersData.length
      const totalRoadies = safeRoadiesData.length
      const totalRequests = safeRequestsData.length
      const totalServices = safeServicesData.length

      // User status counts
      const approvedRiders = safeRidersData.filter(rider => rider?.is_approved).length
      const pendingRiders = totalRiders - approvedRiders
      const approvedRoadies = safeRoadiesData.filter(roadie => roadie?.is_approved).length
      const pendingRoadies = totalRoadies - approvedRoadies

      // Active users (users who have made requests in last 7 days)
      const activeRiders = safeRidersData.filter(rider => {
        const hasRecentRequest = safeRequestsData.some(request =>
          request?.rider === rider?.id &&
          new Date(request.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        return rider?.is_approved && hasRecentRequest
      }).length

      const activeRoadies = safeRoadiesData.filter(roadie => {
        const hasRecentAssignment = safeRequestsData.some(request =>
          request?.rodie === roadie?.id &&
          new Date(request.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        return roadie?.is_approved && hasRecentAssignment
      }).length

      // Request status counts
      const pendingRequests = safeRequestsData.filter(req => req?.status?.toLowerCase() === 'pending').length
      const acceptedRequests = safeRequestsData.filter(req => req?.status?.toLowerCase() === 'accepted').length
      const completedRequests = safeRequestsData.filter(req => req?.status?.toLowerCase() === 'completed').length
      const cancelledRequests = safeRequestsData.filter(req => req?.status?.toLowerCase() === 'cancelled').length
      const activeRequests = pendingRequests + acceptedRequests

      // Service data
      const serviceCounts: Record<string, number> = {}
      safeRequestsData.forEach(request => {
        const serviceName = request?.service_type_name || `Service ${request?.service_type}`
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1
      })

      const popularServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], index) => ({
          name,
          count,
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]
        }))

      // Realtime data
      const activeLocations = (safeLocationsData.riders?.length || 0) + (safeLocationsData.rodies?.length || 0)
      const enRouteAssignments = safeRequestsData.filter(req =>
        req?.status?.toLowerCase() === 'accepted' || req?.status?.toLowerCase() === 'en_route'
      ).length

      // Performance metrics
      const completionRate = totalRequests > 0
        ? Math.round((completedRequests / totalRequests) * 100)
        : 0

      const acceptanceRate = totalRequests > 0
        ? Math.round(((acceptedRequests + completedRequests) / totalRequests) * 100)
        : 0

      // Calculate top 10 riders (based on number of requests)
      const riderRequestCounts: Record<number, {
        rider: Rider;
        total: number;
        completed: number;
      }> = {}

      safeRequestsData.forEach(request => {
        if (request?.rider) {
          const riderId = request.rider
          const rider = safeRidersData.find(r => r?.id === riderId)
          if (rider) {
            if (!riderRequestCounts[riderId]) {
              riderRequestCounts[riderId] = {
                rider: rider,
                total: 0,
                completed: 0,
              }
            }
            riderRequestCounts[riderId].total++
            if (request?.status?.toLowerCase() === 'completed') {
              riderRequestCounts[riderId].completed++
            }
          }
        }
      })

      const topRidersData = Object.values(riderRequestCounts)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map(item => ({
          id: item.rider?.id || 0,
          external_id: item.rider?.external_id || '',
          username: item.rider?.username || 'Unknown',
          firstName: item.rider?.first_name || '',
          lastName: item.rider?.last_name || '',
          totalRequests: item.total,
          completedRequests: item.completed,
          phone: item.rider?.phone || 'N/A',
          email: item.rider?.email || 'N/A'
        }))

      // Calculate top 10 roadies (based on completed requests)
      const roadieRequestCounts: Record<number, {
        roadie: Roadie;
        completed: number;
      }> = {}

      safeRequestsData.forEach(request => {
        if (request?.rodie) {
          const roadieId = request.rodie
          const roadie = safeRoadiesData.find(r => r?.id === roadieId)
          if (roadie) {
            if (!roadieRequestCounts[roadieId]) {
              roadieRequestCounts[roadieId] = {
                roadie: roadie,
                completed: 0,
              }
            }
            if (request?.status?.toLowerCase() === 'completed') {
              roadieRequestCounts[roadieId].completed++
            }
          }
        }
      })

      const topRoadiesData = Object.values(roadieRequestCounts)
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 10)
        .map(item => ({
          id: item.roadie?.id || 0,
          external_id: item.roadie?.external_id || '',
          username: item.roadie?.username || 'Unknown',
          firstName: item.roadie?.first_name || '',
          lastName: item.roadie?.last_name || '',
          completedRequests: item.completed,
          phone: item.roadie?.phone || 'N/A',
          email: item.roadie?.email || 'N/A',
          is_approved: item.roadie?.is_approved || false
        }))

      // Fetch profile images for top riders and roadies
      const [topRidersWithImages, topRoadiesWithImages] = await Promise.all([
        fetchUserProfileImages(topRidersData, 'rider'),
        fetchUserProfileImages(topRoadiesData, 'roadie')
      ])

      // Generate charts data
      const requestTrends = calculateRequestTrends(safeRequestsData)
      const statusDistribution = [
        { name: "Pending", value: pendingRequests, color: "#F59E0B" },
        { name: "Accepted", value: acceptedRequests, color: "#3B82F6" },
        { name: "Completed", value: completedRequests, color: "#10B981" },
        { name: "Cancelled", value: cancelledRequests, color: "#EF4444" },
      ].filter(item => item.value > 0)

      const userGrowth = calculateUserGrowth(safeRidersData, safeRoadiesData)

      // Recent activity
      const recentRequests = [...safeRequestsData]
        .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
        .slice(0, 8)

      const recentServiceRequests = safeRequestsData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(req => ({
          id: req.id,
          rider: req.rider_username || `Rider #${req.rider}`,
          service: req.service_type_name || `Service ${req.service_type}`,
          status: req.status,
          created_at: req.created_at
        }))

      // Platform health (simulated metrics based on real data)
      const platformHealth = {
        activeUsers: Math.round((activeRiders + activeRoadies) / (totalRiders + totalRoadies) * 100) || 0,
        serviceAvailability: Math.round((completedRequests / totalRequests) * 100) || 0,
        responseRate: acceptanceRate,
        satisfaction: Math.min(95, Math.round((completedRequests / (acceptedRequests + completedRequests)) * 100)) || 0
      }

      // Average response time calculation (simplified)
      const responseTimes: number[] = []
      safeRequestsData.forEach(request => {
        if (request?.status?.toLowerCase() === 'accepted' || request?.status?.toLowerCase() === 'completed') {
          try {
            const created = new Date(request.created_at)
            const updated = new Date(request.updated_at)
            const timeDiff = Math.max(1, (updated.getTime() - created.getTime()) / (1000 * 60)) // minutes, min 1
            responseTimes.push(timeDiff)
          } catch {
            // Skip invalid dates
          }
        }
      })

      const averageResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 15 // Default fallback

      setStats({
        totalRiders,
        totalRoadies,
        totalRequests,
        activeRiders,
        activeRoadies,
        activeRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        cancelledRequests,
        approvedRiders,
        pendingRiders,
        approvedRoadies,
        pendingRoadies,
        totalServices,
        serviceRequests: totalRequests,
        popularServices,
        activeLocations,
        enRouteAssignments,
        completionRate,
        acceptanceRate,
        averageResponseTime,
        topRiders: topRidersWithImages || [],
        topRoadies: topRoadiesWithImages || [],
        requestTrends: requestTrends || [],
        statusDistribution: statusDistribution || [],
        userGrowth: userGrowth || [],
        recentRequests: recentRequests || [],
        recentServiceRequests: recentServiceRequests || [],
        platformHealth
      })

      setError(null)
    } catch (err) {
      console.error(" Dashboard fetch error:", err)
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

  // Helper functions
  const calculateRequestTrends = (requests: ServiceRequest[]) => {
    // Get last 7 days dates
    const dates = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      dates.push(d)
    }

    // Initialize trends with full date keys to avoid collisions
    // We'll use the ISO date string (YYYY-MM-DD) as key for uniqueness
    const trends: Record<string, { day: string; requests: number; completed: number }> = {}

    dates.forEach(date => {
      const key = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      trends[key] = { day: dayName, requests: 0, completed: 0 }
    })

    const safeRequests = Array.isArray(requests) ? requests : []

    safeRequests.forEach(request => {
      try {
        if (request?.created_at) {
          const requestDate = new Date(request.created_at)
          // Reset time part for comparison
          requestDate.setHours(0, 0, 0, 0)

          const key = requestDate.toISOString().split('T')[0]

          // Only count if this date exists in our last 7 days window
          if (trends[key]) {
            trends[key].requests++

            // For completed requests, we generally want to see them on the day they were created
            // to see cohort completion, OR on the day they were completed to see throughput.
            // The user requested "use created date", so we stick to grouping by created_at.
            if (request?.status?.toLowerCase() === 'completed') {
              trends[key].completed++
            }
          }
        }
      } catch {
        // Skip invalid dates
      }
    })

    return Object.values(trends)
  }

  const calculateUserGrowth = (riders: Rider[], roadies: Roadie[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData: Record<string, { riders: number; roadies: number }> = {}
    const now = new Date()

    // Get last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`

      // Count riders and roadies created in this month
      const monthRiders = riders.filter(rider => {
        try {
          if (!rider?.created_at) return false
          const riderDate = new Date(rider.created_at)
          return riderDate.getMonth() === date.getMonth() &&
            riderDate.getFullYear() === date.getFullYear()
        } catch {
          return false
        }
      }).length

      const monthRoadies = roadies.filter(roadie => {
        try {
          if (!roadie?.created_at) return false
          const roadieDate = new Date(roadie.created_at)
          return roadieDate.getMonth() === date.getMonth() &&
            roadieDate.getFullYear() === date.getFullYear()
        } catch {
          return false
        }
      }).length

      months.push({
        month: monthKey,
        riders: monthRiders,
        roadies: monthRoadies
      })
    }

    return months
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'No date'
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

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border border-gray-200'

    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200'
      case 'accepted': return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200'
      case 'en_route': return 'bg-purple-100 text-purple-800 border border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes('battery')) return <Battery className="h-4 w-4" />
    if (name.includes('tire') || name.includes('tyre')) return <Car className="h-4 w-4" />
    if (name.includes('tow') || name.includes('haul')) return <Navigation className="h-4 w-4" />
    if (name.includes('jump') || name.includes('start')) return <Zap className="h-4 w-4" />
    return <Wrench className="h-4 w-4" />
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time insights and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-lg border border-border">
            Live Updates
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Only show if we have data */}
      {stats && (
        <>
          {/* Key Performance Indicators */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/requests" className="block">
              <StatCard
                title="Total Service Requests"
                value={stats.totalRequests}
                icon={<Wrench className="h-5 w-5" />}
                iconBg="bg-blue-500"
                subtext={`${stats.activeRequests} active • ${stats.completedRequests} completed`}
                trend={`${stats.completionRate}% completion rate`}
                className="hover:border-blue-500/50 transition-all cursor-pointer"
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
                className="hover:border-emerald-500/50 transition-all cursor-pointer"
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
                className="hover:border-amber-500/50 transition-all cursor-pointer"
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
                className="hover:border-purple-500/50 transition-all cursor-pointer"
              />
            </Link>
          </div>

          {/* User Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/riders" className="block group">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm group-hover:border-blue-500/30 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Total Customers</h3>
                  <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-foreground">{stats.totalRiders}</span>
                    <div className="text-sm px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                      {stats.approvedRiders} approved
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground transition-colors group-hover:text-blue-500/70">
                    <span>Pending: {stats.pendingRiders}</span>
                    <span>{stats.activeRiders} active</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/roadies" className="block group">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm group-hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Total Providers</h3>
                  <UserCheck className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-foreground">{stats.totalRoadies}</span>
                    <div className="text-sm px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      {stats.approvedRoadies} approved
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground transition-colors group-hover:text-emerald-500/70">
                    <span>Pending: {stats.pendingRoadies}</span>
                    <span>{stats.activeRoadies} active</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/services" className="block group">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm group-hover:border-purple-500/30 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Service Status</h3>
                  <Target className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold text-foreground">{stats.totalServices}</span>
                    <div className="text-sm px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300">
                      Services
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Requests:</span>
                      <span className="font-medium text-foreground transition-colors group-hover:text-purple-500">{stats.activeRequests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium group-hover:text-purple-400">View Catalog</span>
                      <ArrowUpRight className="h-3 w-3 text-purple-500 opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Quick Actions</h3>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-3">
                <Link href="/admin/requests/create">
                  <Button size="sm" className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Wrench className="mr-2 h-3 w-3" />
                    Create Service Request
                  </Button>
                </Link>
                <Link href="/admin/live-map">
                  <Button variant="outline" size="sm" className="w-full justify-start border-border text-foreground hover:bg-muted">
                    <Map className="mr-2 h-3 w-3" />
                    View Live Map
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Request Trends */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Weekly Request Trends</h3>
                <span className="text-sm text-muted-foreground">Last 7 days</span>
              </div>
              {stats.requestTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.requestTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        color: "var(--foreground)"
                      }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Total Requests"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Completed"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p>No activity data available</p>
                  <p className="text-sm mt-1">Request trends will appear here</p>
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Request Status Distribution</h3>
                <span className="text-sm text-muted-foreground">Current status breakdown</span>
              </div>
              {stats.statusDistribution.length > 0 ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {stats.statusDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#FFFFFF"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value} requests`, 'Count']}
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            color: "var(--foreground)"
                          }}
                          itemStyle={{ color: "var(--foreground)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {stats.statusDistribution.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p>No status data available</p>
                  <p className="text-sm mt-1">Status distribution will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Performers & Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Customers */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Top Customers</h3>
                <span className="text-sm text-muted-foreground">By service requests</span>
              </div>
              {stats.topRiders.length > 0 ? (
                <div className="space-y-3">
                  {stats.topRiders.map((rider, index) => (
                    <Link key={rider.id} href={`/admin/riders/${rider.id}`} className="block">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8 border-2 border-border group-hover:border-primary/50 transition-colors">
                              {rider.profileImage ? (
                                <AvatarImage
                                  src={rider.profileImage}
                                  alt={`${rider.firstName} ${rider.lastName}`}
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                {getInitials(rider.firstName, rider.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-foreground text-background text-[10px] font-bold rounded-full border border-background">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {rider.firstName} {rider.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">@{rider.username}</span>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>{rider.completedRequests} completed</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p>No customer data available</p>
                  <p className="text-sm mt-1">Top customers will appear here</p>
                </div>
              )}
              <Link href="/admin/riders">
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  View All Customers
                  <ArrowUpRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Top Providers */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Top Providers</h3>
                <span className="text-sm text-muted-foreground">By completed assignments</span>
              </div>
              {stats.topRoadies.length > 0 ? (
                <div className="space-y-3">
                  {stats.topRoadies.map((roadie, index) => (
                    <Link key={roadie.id} href={`/admin/roadies/${roadie.id}`} className="block">
                      <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className={`h-9 w-9 border-2 ${index === 0 ? 'border-amber-300' :
                              index === 1 ? 'border-gray-300' :
                                index === 2 ? 'border-orange-300' : 'border-blue-300'
                              } group-hover:scale-105 transition-transform`}>
                              {roadie.profileImage ? (
                                <AvatarImage
                                  src={roadie.profileImage}
                                  alt={`${roadie.firstName} ${roadie.lastName}`}
                                  className="object-cover"
                                />
                              ) : null}
                              <AvatarFallback className={`
                                ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                  index === 1 ? 'bg-gray-100 text-gray-700' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                      'bg-blue-100 text-blue-700'
                                } font-bold text-sm
                              `}>
                                {getInitials(roadie.firstName, roadie.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            {index < 3 && (
                              <div className={`
                                absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full
                                ${index === 0 ? 'bg-amber-500' :
                                  index === 1 ? 'bg-gray-500' :
                                    'bg-orange-500'
                                } text-white
                              `}>
                                <Award className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {roadie.firstName} {roadie.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="truncate">@{roadie.username}</span>
                              <div className={`px-1.5 py-0.5 rounded text-xs ${roadie.is_approved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {roadie.is_approved ? 'Approved' : 'Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-sm font-semibold text-foreground group-hover:text-primary">
                              {roadie.completedRequests}
                            </div>
                            <div className="text-xs text-muted-foreground">completed</div>
                          </div>
                          <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p>No provider data available</p>
                  <p className="text-sm mt-1">Top providers will appear here</p>
                </div>
              )}
              <Link href="/admin/roadies">
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  View All Providers
                  <ArrowUpRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Recent Service Requests */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Recent Requests</h3>
                <span className="text-sm text-muted-foreground">Latest activities</span>
              </div>
              {stats.recentServiceRequests.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentServiceRequests.map((request) => (
                    <Link key={request.id} href={`/admin/requests/${request.id}`} className="block">
                      <div className="p-3 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                #{request.id}
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {request.rider}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getServiceIcon(request.service)}
                              <span className="text-xs text-muted-foreground truncate">
                                {request.service}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-2 flex flex-col items-end gap-1">
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(request.created_at)}
                            </div>
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p>No recent requests</p>
                  <p className="text-sm mt-1">Service requests will appear here</p>
                </div>
              )}
              <Link href="/admin/requests">
                <Button variant="ghost" size="sm" className="w-full mt-4">
                  View All Requests
                  <ArrowUpRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Service Analytics & Platform Health */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Popular Services */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Popular Services</h3>
                <span className="text-sm text-muted-foreground">Most requested services</span>
              </div>
              {stats.popularServices.length > 0 ? (
                <div className="space-y-4">
                  {stats.popularServices.map((service, index) => (
                    <Link key={service.name} href="/admin/services" className="block group/item">
                      <div className="space-y-2 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full group-hover/item:scale-125 transition-transform"
                              style={{ backgroundColor: service.color }}
                            />
                            <span className="font-medium text-foreground group-hover/item:text-primary transition-colors">{service.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{service.count} requests</span>
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all" />
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 group-hover/item:opacity-80"
                            style={{
                              width: `${(service.count / stats.totalRequests) * 100}%`,
                              backgroundColor: service.color
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p>No service data available</p>
                  <p className="text-sm mt-1">Service analytics will appear here</p>
                </div>
              )}
            </div>

            {/* Platform Health */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Platform Health</h3>
                <span className="text-sm text-muted-foreground">Performance metrics</span>
              </div>
              <div className="space-y-4">
                <HealthMetric
                  label="Active Users"
                  value={stats.platformHealth.activeUsers}
                  icon={<Users className="h-4 w-4" />}
                  color="blue"
                />
                <HealthMetric
                  label="Service Availability"
                  value={stats.platformHealth.serviceAvailability}
                  icon={<CheckCircle className="h-4 w-4" />}
                  color="green"
                />
                <HealthMetric
                  label="Response Rate"
                  value={stats.platformHealth.responseRate}
                  icon={<Clock className="h-4 w-4" />}
                  color="amber"
                />
                <HealthMetric
                  label="User Satisfaction"
                  value={stats.platformHealth.satisfaction}
                  icon={<ThumbsUp className="h-4 w-4" />}
                  color="purple"
                />
              </div>
            </div>
          </div>

          {/* User Growth Chart */}
          {stats.userGrowth.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">User Growth</h3>
                <span className="text-sm text-muted-foreground">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.userGrowth}>
                  <defs>
                    <linearGradient id="colorRiders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRoadies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      color: "var(--foreground)"
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="riders"
                    stroke="#3B82F6"
                    fill="url(#colorRiders)"
                    name="Customers"
                  />
                  <Area
                    type="monotone"
                    dataKey="roadies"
                    stroke="#10B981"
                    fill="url(#colorRoadies)"
                    name="Providers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// StatCard Component
interface StatCardProps {
  title: string
  value: number
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
  const formatValue = () => {
    if (isPercentage) return `${value}%`
    return value.toLocaleString()
  }

  return (
    <div className={cn("bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-2">
            {formatValue()}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{subtext}</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/80">{trend}</span>
            </div>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// HealthMetric Component
interface HealthMetricProps {
  label: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}

const HealthMetric = ({ label, value, icon, color }: HealthMetricProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700'
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}%</p>
        </div>
      </div>
      <div className="w-24">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-500' :
              color === 'green' ? 'bg-green-500' :
                color === 'amber' ? 'bg-amber-500' :
                  color === 'purple' ? 'bg-purple-500' : 'bg-red-500'
              }`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  )
}