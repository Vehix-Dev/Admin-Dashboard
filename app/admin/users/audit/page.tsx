"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { AuditService, AuditLog } from "@/lib/audit"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, User, Activity, FileText } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/protected-route"
import { PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { DiffViewer } from "@/components/admin/audit/diff-viewer"
import { Input } from "@/components/ui/input"
import { Search, Filter, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    const loadLogs = () => {
        const loadedLogs = AuditService.getLogs()
        setLogs(loadedLogs)
        setIsLoading(false)
    }

    useEffect(() => {
        loadLogs()
    }, [])

    const handleClearLogs = () => {
        if (confirm("Are you sure you want to clear all audit logs? This cannot be undone.")) {
            localStorage.removeItem('vehix_audit_logs')
            loadLogs()
            toast({
                title: "Internal Logs Purged",
                description: "The local audit trail has been reset.",
            })
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

    const columns: Column<AuditLog>[] = [
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
            cell: (value: string, row: AuditLog) => (
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
            cell: (value: string, row: AuditLog) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-primary" />
                        <span className="font-medium">{safeString(value)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <ArrowLeft className="h-2.5 w-2.5 rotate-180" />
                        <span>{safeString(row.target)}</span>
                    </div>
                </div>
            )
        },
        {
            header: "Context",
            accessor: "userAgent",
            cell: (value: string) => (
                <div className="max-w-[150px] truncate text-[10px] text-muted-foreground font-mono" title={value}>
                    {value || "No browser info"}
                </div>
            )
        },
        {
            header: "Forensics",
            accessor: "details",
            cell: (value: any, row: AuditLog) => (
                <DiffViewer oldVal={row.oldValue} newVal={row.newValue} />
            )
        }
    ]

    const [search, setSearch] = useState("")

    const filteredLogs = logs.filter(log => {
        const sAction = safeString(log.action).toLowerCase()
        const sModule = safeString(log.module).toLowerCase()
        const sTarget = safeString(log.target).toLowerCase()
        const sActor = safeString(log.actor).toLowerCase()
        const sTerm = search.toLowerCase()

        return sAction.includes(sTerm) ||
            sModule.includes(sTerm) ||
            sTarget.includes(sTerm) ||
            sActor.includes(sTerm)
    })

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/users">
                            <Button variant="ghost" size="icon" className="glass-card hover:bg-muted font-bold h-10 w-10">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase">Audit Hub</h2>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Real-time administrator forensics</p>
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
                        onClick={handleClearLogs}
                        className="gap-2 h-11 px-4 glass-card border-none bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
                    >
                        <Trash2 className="h-4 w-4" />
                        Purge Logs
                    </Button>
                </div>

                <Card className="border-border/40 overflow-hidden rounded-2xl shadow-2xl glass-card">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs animate-pulse">Scanning Nodes...</div>
                        ) : filteredLogs.length === 0 ? (
                            <EmptyState
                                title="No matching logs"
                                description="Adjust your filters to scan broader data segments."
                                icon={Activity}
                            />
                        ) : (
                            <DataTable
                                data={filteredLogs}
                                columns={columns}
                                initialSortColumn={0}
                                initialSortDirection="desc"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    )
}
