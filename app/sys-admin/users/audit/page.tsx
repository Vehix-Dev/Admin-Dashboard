"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, Activity, FileText, Search, Filter, Trash2, Loader2, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DiffViewer } from "@/components/admin/audit/diff-viewer"
import { getAuditLogs, clearAuditLogs, type AdminAuditLog } from "@/lib/api"

interface MappedAuditLog {
  id: number
  timestamp: string
  action: string
  module: string
  actor: string
  target: string
  severity: "info" | "warning" | "critical"
  details: unknown
  oldValue: unknown
  newValue: unknown
  userAgent: string
  ipAddress: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<MappedAuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [uniqueModules, setUniqueModules] = useState<string[]>([])
  const { toast } = useToast()

  const mapAuditLogToComponentFormat = (log: AdminAuditLog): MappedAuditLog => {
    let severity: "info" | "warning" | "critical" = "info"
    const criticalActions = ["DELETE", "PERMANENT_DELETE", "ROLE_CHANGE", "PERMISSION_UPDATE", "SUSPEND", "BAN", "DISABLE", "DEACTIVATE"]
    const warningActions = ["UPDATE", "DISABLE", "SUSPEND", "LOCK", "MODIFY", "CHANGE", "OVERRIDE"]

    if (criticalActions.some((action) => log.action_type.toUpperCase().includes(action))) {
      severity = "critical"
    } else if (warningActions.some((action) => log.action_type.toUpperCase().includes(action))) {
      severity = "warning"
    }

    let oldValue = null
    let newValue = null
    if (log.changes && typeof log.changes === "object") {
      const c = log.changes as Record<string, unknown>
      oldValue = c.old ?? c.before ?? null
      newValue = c.new ?? c.after ?? null
    }

    return {
      id: log.id,
      timestamp: log.created_at,
      action: log.action_description || log.action_type,
      module: getModuleFromEntityType(log.target_entity_type),
      actor: log.admin_username || "System",
      target: log.target_username || (log.target_entity_id ? `${log.target_entity_type || 'Entity'} ${log.target_entity_id}` : "System"),
      severity,
      details: log.changes,
      oldValue,
      newValue,
      userAgent: "Server-side audit",
      ipAddress: log.ip_address || "Unknown",
    }
  }

  const getModuleFromEntityType = (entityType?: string | null): string => {
    if (!entityType) return "System"
    const moduleMap: Record<string, string> = {
      User: "User Management",
      Service: "Services",
      Request: "Requests",
      Document: "Documents",
      Role: "Roles & Permissions",
      Settings: "System Settings",
      Roadie: "Roadies",
      Rider: "Riders",
      Media: "Moderation",
    }
    return moduleMap[entityType] || entityType
  }

  const fetchAuditLogs = async (page: number = 1, searchTerm: string = "") => {
    setIsLoading(true)
    try {
      const result = await getAuditLogs({ page, page_size: 50, search: searchTerm || undefined })
      const mappedLogs = result.results.map(mapAuditLogToComponentFormat)
      setLogs(mappedLogs)
      
      // Extract unique modules for filter
      const modules = Array.from(new Set(mappedLogs.map(log => log.module)))
      setUniqueModules(modules.sort())
      
      setTotalCount(result.count)
      setTotalPages(Math.max(1, Math.ceil(result.count / 50)))
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching audit logs:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load audit logs",
        variant: "destructive",
      })
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAllLogs = async () => {
    setIsClearing(true)
    try {
      const result = await clearAuditLogs()
      toast({
        title: "Audit Logs Purged",
        description: result.detail || "All audit logs have been permanently deleted.",
      })
      await fetchAuditLogs(1, search)
      setIsClearDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear audit logs",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs(1, "")
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs(1, search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Filter logs based on selected filters
  const filteredLogs = logs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false
    return true
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20'
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20'
      default:
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20'
    }
  }

  const columns: Column<MappedAuditLog>[] = [
    {
      header: "Timestamp",
      accessor: "timestamp",
      cell: (value: string) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{format(new Date(value), "MMM d, yyyy")}</span>
          <span className="text-xs text-muted-foreground">{format(new Date(value), "HH:mm:ss")}</span>
        </div>
      ),
    },
    {
      header: "Severity",
      accessor: "severity",
      cell: (value: string) => (
        <div className="flex items-center gap-2">
          {getSeverityIcon(value)}
          <Badge className={`capitalize ${getSeverityBadgeColor(value)}`}>
            {value}
          </Badge>
        </div>
      ),
    },
    {
      header: "Action",
      accessor: "action",
      cell: (value: string, row: MappedAuditLog) => (
        <div>
          <p className="text-sm font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.module}</p>
        </div>
      ),
    },
    {
      header: "Admin (Actor)",
      accessor: "actor",
      cell: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      ),
    },
    {
      header: "Target",
      accessor: "target",
      cell: (value: string) => (
        <div className="text-sm max-w-[200px] truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      header: "Details",
      accessor: "id",
      cell: (_, row: MappedAuditLog) => (
        row.oldValue || row.newValue ? (
          <DiffViewer oldVal={row.oldValue} newVal={row.newValue} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
  ]

  return (
    <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-2">
              Complete system accountability trail — {totalCount.toLocaleString()} record{totalCount !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/sys-admin/users">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => setIsClearDialogOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Search and Filter Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">SEARCH</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by action, admin, target..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">SEVERITY</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">ℹ️ Info</option>
                <option value="warning">⚠️ Warning</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">MODULE</label>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Modules</option>
                {uniqueModules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        {logs.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Critical Actions</p>
                    <p className="text-2xl font-bold">{logs.filter(l => l.severity === 'critical').length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                    <p className="text-2xl font-bold">{logs.filter(l => l.severity === 'warning').length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Unique Admins</p>
                    <p className="text-2xl font-bold">{new Set(logs.map(l => l.actor)).size}</p>
                  </div>
                  <User className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Logs Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title={search || severityFilter !== 'all' || moduleFilter !== 'all' ? "No matching logs" : "No audit records"}
            description={
              search || severityFilter !== 'all' || moduleFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "Admin actions will appear here as they occur"
            }
            icon={Activity}
          />
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <DataTable data={filteredLogs} columns={columns} />
              </CardContent>
            </Card>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => fetchAuditLogs(currentPage - 1, search)}
                >
                  Previous
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchAuditLogs(currentPage + 1, search)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all audit logs?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete ALL audit logs from the system. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAllLogs} disabled={isClearing}>
                {isClearing ? "Clearing..." : "Delete all"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}
