"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, Activity, FileText, Search, Filter, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { DiffViewer } from "@/components/admin/audit/diff-viewer"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
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

// API response interface based on the OpenAPI spec
interface AdminAuditLog {
  id: number
  admin_user?: number | null
  admin_username: string
  action_type: string
  action_description: string
  target_user?: number | null
  target_username?: string | null
  target_entity_type?: string | null
  target_entity_id?: string | null
  changes?: Record<string, any> | null
  created_at: string
  ip_address?: string | null
}

// Pagination metadata
interface PaginationMeta {
  current_page: number
  total_pages: number
  total_count: number
  per_page: number
}

// API response wrapper
interface AuditLogsResponse {
  data: AdminAuditLog[]
  meta: PaginationMeta
}

// Map API response to the format expected by existing components
interface MappedAuditLog {
  id: number
  timestamp: string
  action: string
  module: string
  actor: string
  target: string
  severity: "info" | "warning" | "critical"
  details: any
  oldValue: any
  newValue: any
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
  const { toast } = useToast()

  // Fetch audit logs from API
  const fetchAuditLogs = async (page: number = 1, searchTerm: string = "") => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "50",
      })
      
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/auth/admin/audit-logs/?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized - Please login again")
        }
        if (response.status === 403) {
          throw new Error("Forbidden - Insufficient permissions")
        }
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`)
      }

      const result: AuditLogsResponse = await response.json()
      
      // Map API response to component format
      const mappedLogs = result.data.map(mapAuditLogToComponentFormat)
      
      setLogs(mappedLogs)
      setTotalPages(result.meta.total_pages)
      setTotalCount(result.meta.total_count)
      setCurrentPage(result.meta.current_page)
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

  // Map API audit log to component's expected format
  const mapAuditLogToComponentFormat = (log: AdminAuditLog): MappedAuditLog => {
    // Determine severity based on action type
    let severity: "info" | "warning" | "critical" = "info"
    const criticalActions = ["DELETE", "PERMANENT_DELETE", "ROLE_CHANGE", "PERMISSION_UPDATE"]
    const warningActions = ["UPDATE", "DISABLE", "SUSPEND", "LOCK"]
    
    if (criticalActions.some(action => log.action_type.toUpperCase().includes(action))) {
      severity = "critical"
    } else if (warningActions.some(action => log.action_type.toUpperCase().includes(action))) {
      severity = "warning"
    }

    // Extract old and new values from changes
    let oldValue = null
    let newValue = null
    if (log.changes) {
      oldValue = log.changes.old || log.changes.before || null
      newValue = log.changes.new || log.changes.after || null
    }

    return {
      id: log.id,
      timestamp: log.created_at,
      action: log.action_description || log.action_type,
      module: getModuleFromEntityType(log.target_entity_type),
      actor: log.admin_username,
      target: log.target_username || `Entity ${log.target_entity_id}` || "System",
      severity,
      details: log.changes,
      oldValue,
      newValue,
      userAgent: "Server-side audit", // API may not provide user agent
      ipAddress: log.ip_address || "Unknown",
    }
  }

  // Derive module name from entity type
  const getModuleFromEntityType = (entityType?: string | null): string => {
    if (!entityType) return "System"
    
    const moduleMap: Record<string, string> = {
      "User": "User Management",
      "Service": "Services",
      "Request": "Requests",
      "Document": "Documents",
      "Role": "Roles & Permissions",
      "Settings": "System Settings",
    }
    
    return moduleMap[entityType] || entityType
  }

  // Clear all audit logs (requires admin privileges)
  const handleClearAllLogs = async () => {
    setIsClearing(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("/auth/admin/audit-logs/clear", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to clear audit logs")
      }

      toast({
        title: "Audit Logs Purged",
        description: "All audit logs have been permanently deleted.",
      })
      
      // Refresh the first page
      await fetchAuditLogs(1, search)
      setIsClearDialogOpen(false)
    } catch (error) {
      console.error("Error clearing audit logs:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear audit logs",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAuditLogs(1, search)
    }, 500)
    
    return () => clearTimeout(debounceTimer)
  }, [search])

  // Initial load
  useEffect(() => {
    fetchAuditLogs(currentPage, search)
  }, [currentPage])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const safeString = (val: any) => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return "";
    try {
      return JSON.stringify(val);
    } catch (e) {
      return String(val);
    }
  }

  const columns: Column<MappedAuditLog>[] = [
    {
      header: "Time",
      accessor: "timestamp",
      cell: (value: string) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {(() => {
              try {
                return format(new Date(value), "HH:mm:ss")
              } catch (e) {
                return value
              }
            })()}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {(() => {
              try {
                return format(new Date(value), "MMM d, yyyy")
              } catch (e) {
                return ""
              }
            })()}
          </span>
        </div>
      )
    },
    {
      header: "Action",
      accessor: "action",
      cell: (value: string, row: MappedAuditLog) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {row.severity === 'critical' ? (
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            ) : row.severity === 'warning' ? (
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            )}
            <span className="font-bold text-foreground text-sm tracking-tight">{safeString(value)}</span>
          </div>
          <div className="text-[11px] font-medium text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded w-fit uppercase">
            {safeString(row.module) || "System"}
          </div>
        </div>
      )
    },
    {
      header: "Actor & Target",
      accessor: "actor",
      cell: (value: string, row: MappedAuditLog) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-primary" />
            <span className="font-medium">{safeString(value)}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ArrowLeft className="h-2.5 w-2.5 rotate-180" />
            <span>{safeString(row.target)}</span>
          </div>
          {row.ipAddress && row.ipAddress !== "Unknown" && (
            <div className="text-[9px] text-muted-foreground font-mono">
              IP: {row.ipAddress}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Context",
      accessor: "userAgent",
      cell: (value: string) => (
        <div className="max-w-[150px] truncate text-[10px] text-muted-foreground font-mono" title={value}>
          {value || "API call"}
        </div>
      )
    },
    {
      header: "Forensics",
      accessor: "details",
      cell: (value: any, row: MappedAuditLog) => (
        <DiffViewer oldVal={row.oldValue} newVal={row.newValue} />
      )
    }
  ]

  return (
    <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/sys-admin/users">
              <Button variant="ghost" size="icon" className="glass-card hover:bg-muted font-bold h-10 w-10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase">Audit Hub</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                {totalCount > 0 ? `${totalCount.toLocaleString()} records` : "Real-time administrator forensics"}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Deep search actions, modules, or actors..."
              className="glass-card border-none pl-10 h-11 text-xs font-bold uppercase tracking-wider"
            />
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsClearDialogOpen(true)}
            className="gap-2 h-11 px-4 glass-card border-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            <Trash2 className="h-4 w-4" />
            Purge All Logs
          </Button>
        </div>

        <Card className="border-border/40 overflow-hidden rounded-2xl shadow-2xl glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                Loading audit trail...
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                title={search ? "No matching logs" : "No audit records"}
                description={search ? "Adjust your filters to scan broader data segments." : "No administrative actions have been logged yet."}
                icon={Activity}
              />
            ) : (
              <>
                <DataTable
                  data={logs}
                  columns={columns}
                  initialSortColumn={0}
                  initialSortDirection="desc"
                />
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                    <div className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clear Logs Confirmation Dialog */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete ALL audit logs from the system.
              This cannot be undone and may affect compliance requirements.
              <br /><br />
              Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllLogs}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Purging...
                </>
              ) : (
                "Yes, Delete All Logs"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}