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
  const { toast } = useToast()

  const mapAuditLogToComponentFormat = (log: AdminAuditLog): MappedAuditLog => {
    let severity: "info" | "warning" | "critical" = "info"
    const criticalActions = ["DELETE", "PERMANENT_DELETE", "ROLE_CHANGE", "PERMISSION_UPDATE"]
    const warningActions = ["UPDATE", "DISABLE", "SUSPEND", "LOCK"]

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
      target: log.target_username || (log.target_entity_id ? `Entity ${log.target_entity_id}` : "System"),
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
    }
    return moduleMap[entityType] || entityType
  }

  const fetchAuditLogs = async (page: number = 1, searchTerm: string = "") => {
    setIsLoading(true)
    try {
      const result = await getAuditLogs({ page, page_size: 50, search: searchTerm || undefined })
      const mappedLogs = result.results.map(mapAuditLogToComponentFormat)
      setLogs(mappedLogs)
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
      header: "Action",
      accessor: "action",
      cell: (value: string, row: MappedAuditLog) => (
        <div>
          <p className="text-sm font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{row.module}</p>
        </div>
      ),
    },
    {
      header: "Actor",
      accessor: "actor",
      cell: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      header: "Target",
      accessor: "target",
    },
    {
      header: "IP",
      accessor: "ipAddress",
      cell: (value: string) => <span className="text-xs font-mono">{value}</span>,
    },
  ]

  return (
    <ProtectedRoute permissions={PERMISSIONS.ADMIN_USERS_VIEW}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              System accountability trail — {totalCount.toLocaleString()} record{totalCount !== 1 ? "s" : ""}
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

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Deep search actions, modules, or actors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title={search ? "No matching logs" : "No audit records"}
            description={
              search
                ? "Try adjusting your search criteria"
                : "Admin actions will appear here as they occur"
            }
            icon={Activity}
          />
        ) : (
          <>
            <DataTable data={logs} columns={columns} />
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
                This action will permanently delete ALL audit logs from the system.
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
