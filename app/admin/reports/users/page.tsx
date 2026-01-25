"use client"

import { useEffect, useState } from "react"
import {
    getRiders,
    getRoadies,
    getAdminUsers,
    getServiceRequests,
    type Rider,
    type Roadie,
    type AdminUser,
    type ServiceRequest
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    Download,
    Users,
    UserCheck,
    UserPlus,
    TrendingUp,
    Calendar as CalendarIcon,
    Filter,
    X,
    Shield,
    Activity,
    DollarSign
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    Line
} from "recharts"
import { format, subDays, parse, eachMonthOfInterval, startOfYear, endOfYear, startOfMonth } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import ProtectedRoute from "@/components/auth/protected-route"

interface UserMetrics {
    totalUsers: number
    totalRiders: number
    totalRoadies: number
    totalAdmins: number
    approvedRiders: number
    approvedRoadies: number
    approvalRate: number
    usersByRole: Array<{ name: string; value: number; color: string }>
    monthlyGrowth: Array<{ month: string; riders: number; roadies: number; total: number }>
    recentRegistrations: Array<{ username: string; role: string; date: string; approved: boolean }>
    activeUsers: number
    averageLTV: number
}

const COLORS = {
    riders: '#3b82f6',
    roadies: '#8b5cf6',
    admins: '#10b981',
    approved: '#10b981',
    pending: '#f59e0b'
}

export default function UserAnalyticsPage() {
    const [metrics, setMetrics] = useState<UserMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    const { toast } = useToast()
    const canView = useCan(PERMISSIONS.REPORTS_VIEW)

    const fetchUserData = async () => {
        setIsLoading(true)
        try {
            const [riders, roadies, admins, requests] = await Promise.all([
                getRiders(),
                getRoadies(),
                getAdminUsers(),
                getServiceRequests()
            ])

            const totalUsers = riders.length + roadies.length + admins.length
            const approvedRiders = riders.filter(r => r.is_approved).length
            const approvedRoadies = roadies.filter(r => r.is_approved).length
            const approvalRate = ((approvedRiders + approvedRoadies) / (riders.length + roadies.length)) * 100

            // User distribution by role
            const usersByRole = [
                { name: 'Riders', value: riders.length, color: COLORS.riders },
                { name: 'Roadies', value: roadies.length, color: COLORS.roadies },
                { name: 'Admins', value: admins.length, color: COLORS.admins }
            ]

            // Monthly growth trend (last 6 months)
            const monthlyGrowth = eachMonthOfInterval({
                start: subDays(new Date(), 180),
                end: new Date()
            }).map(month => {
                const monthStr = format(month, 'MMM yyyy')
                const ridersInMonth = riders.filter(r => {
                    const joinedDate = new Date(r.created_at)
                    return format(joinedDate, 'MMM yyyy') === monthStr
                }).length

                const roadiesInMonth = roadies.filter(r => {
                    const joinedDate = new Date(r.created_at)
                    return format(joinedDate, 'MMM yyyy') === monthStr
                }).length

                return {
                    month: format(month, 'MMM'),
                    riders: ridersInMonth,
                    roadies: roadiesInMonth,
                    total: ridersInMonth + roadiesInMonth
                }
            })

            // Recent registrations (last 10)
            const allUsers = [
                ...riders.map(r => ({ ...r, role: 'Rider', date: r.created_at })),
                ...roadies.map(r => ({ ...r, role: 'Roadie', date: r.created_at }))
            ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(u => ({
                    username: u.username,
                    role: u.role,
                    date: format(new Date(u.date), 'MMM dd, yyyy'),
                    approved: u.is_approved
                }))

            setMetrics({
                totalUsers,
                totalRiders: riders.length,
                totalRoadies: roadies.length,
                totalAdmins: admins.length,
                approvedRiders,
                approvedRoadies,
                approvalRate,
                usersByRole,
                monthlyGrowth,
                recentRegistrations: allUsers,
                activeUsers: new Set(requests.map(r => r.rider)).size + new Set(requests.filter(r => r.rodie).map(r => r.rodie)).size,
                averageLTV: requests.filter(r => r.status === 'COMPLETED').length * 5000 / totalUsers // Placeholder LTV
            })

        } catch (err: any) {
            console.error("Failed to fetch user analytics:", err)
            toast({
                title: "Error",
                description: "Failed to load user analytics data.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUserData()
    }, [])

    const handleExport = () => {
        if (!metrics) return

        const csvData = [
            ['User Analytics Report'],
            ['Generated:', format(new Date(), 'PPP')],
            [],
            ['Metric', 'Value'],
            ['Total Users', metrics.totalUsers.toString()],
            ['Total Riders', metrics.totalRiders.toString()],
            ['Total Roadies', metrics.totalRoadies.toString()],
            ['Total Admins', metrics.totalAdmins.toString()],
            ['Approved Riders', metrics.approvedRiders.toString()],
            ['Approved Roadies', metrics.approvedRoadies.toString()],
            ['Approval Rate', `${metrics.approvalRate.toFixed(1)}%`],
        ]

        const csv = csvData.map(row => row.join(',')).join('\\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `user-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast({
            title: "Success",
            description: "User analytics exported successfully"
        })
    }

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.REPORTS_VIEW}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">User Analytics</h2>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                            Comprehensive user metrics and growth analysis
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="gap-2 h-10 font-mono"
                        disabled={!metrics}
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-32" />
                        ))}
                    </div>
                ) : metrics ? (
                    <>
                        {/* Key Metrics */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-500">{metrics.totalUsers}</div>
                                    <p className="text-xs text-muted-foreground mt-1">All registered users</p>
                                </CardContent>
                            </Card>

                            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Riders</CardTitle>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-500">{metrics.totalRiders}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{metrics.approvedRiders} approved</p>
                                </CardContent>
                            </Card>

                            <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Roadies</CardTitle>
                                    <UserCheck className="h-4 w-4 text-indigo-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-indigo-500">{metrics.totalRoadies}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{metrics.approvedRoadies} approved</p>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-500">{metrics.approvalRate.toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1">Riders & Roadies approved</p>
                                </CardContent>
                            </Card>

                            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                    <Activity className="h-4 w-4 text-cyan-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-cyan-500">{metrics.activeUsers}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Users with at least one request</p>
                                </CardContent>
                            </Card>

                            <Card className="border-amber-600/20 bg-gradient-to-br from-amber-600/5 to-transparent">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg. LTV</CardTitle>
                                    <DollarSign className="h-4 w-4 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-amber-600">
                                        {new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(metrics.averageLTV)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Estimated Lifetime Value</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* User Distribution */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>User Distribution by Role</CardTitle>
                                    <CardDescription>Breakdown of users by type</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={metrics.usersByRole}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {metrics.usersByRole.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Monthly Growth */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Monthly User Growth</CardTitle>
                                    <CardDescription>New registrations per month (last 6 months)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={metrics.monthlyGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="riders" stroke={COLORS.riders} strokeWidth={2} name="Riders" />
                                            <Line type="monotone" dataKey="roadies" stroke={COLORS.roadies} strokeWidth={2} name="Roadies" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Approval Stats */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-emerald-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserCheck className="h-5 w-5 text-emerald-500" />
                                        Approved Users
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Riders</span>
                                                <span className="text-sm font-medium">{metrics.approvedRiders} / {metrics.totalRiders}</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${(metrics.approvedRiders / metrics.totalRiders) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Roadies</span>
                                                <span className="text-sm font-medium">{metrics.approvedRoadies} / {metrics.totalRoadies}</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${(metrics.approvedRoadies / metrics.totalRoadies) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-amber-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5 text-amber-500" />
                                        Pending Approvals
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Riders</span>
                                                <span className="text-sm font-medium">{metrics.totalRiders - metrics.approvedRiders}</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-amber-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${((metrics.totalRiders - metrics.approvedRiders) / metrics.totalRiders) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Roadies</span>
                                                <span className="text-sm font-medium">{metrics.totalRoadies - metrics.approvedRoadies}</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-amber-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${((metrics.totalRoadies - metrics.approvedRoadies) / metrics.totalRoadies) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Registrations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Registrations</CardTitle>
                                <CardDescription>Last 10 user registrations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {metrics.recentRegistrations.map((user, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                                                    user.role === 'Rider' ? 'bg-purple-500/10 text-purple-500' : 'bg-indigo-500/10 text-indigo-500'
                                                )}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.username}</div>
                                                    <div className="text-xs text-muted-foreground">{user.role} • {user.date}</div>
                                                </div>
                                            </div>
                                            <div>
                                                {user.approved ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                                                        <UserCheck className="h-3 w-3" />
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                                                        <UserPlus className="h-3 w-3" />
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : null}
            </div>
        </ProtectedRoute>
    )
}
