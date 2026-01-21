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

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Load logs from service
        const loadedLogs = AuditService.getLogs()
        setLogs(loadedLogs)
        setIsLoading(false)
    }, [])

    const columns: Column<AuditLog>[] = [
        {
            header: "Time",
            accessor: "timestamp",
            cell: (value: string) => (
                <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>
                        {(() => {
                            try {
                                return format(new Date(value), "MMM d, yyyy HH:mm:ss")
                            } catch (e) {
                                return value
                            }
                        })()}
                    </span>
                </div>
            )
        },
        {
            header: "Action",
            accessor: "action",
            cell: (value: string) => (
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-primary" />
                    <span className="font-medium text-foreground">{value}</span>
                </div>
            )
        },
        {
            header: "Actor",
            accessor: "actor",
            cell: (value: string) => (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-blue-400" />
                    <span>{value}</span>
                </div>
            )
        },
        {
            header: "Target",
            accessor: "target",
            cell: (value: string) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span>{value}</span>
                </div>
            )
        },
        {
            header: "Details",
            accessor: "details",
            cell: (value: any) => (
                <code className="text-[10px] bg-muted/50 p-1 rounded border border-border">
                    {JSON.stringify(value)}
                </code>
            )
        }
    ]

    return (
        <ProtectedRoute requiredPermissions={PERMISSIONS.ADMIN_USERS_VIEW}>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h2>
                        <p className="text-sm text-muted-foreground mt-1">Track actions performed by administrators</p>
                    </div>
                </div>

                <Card className="border-border/40">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading logs...</div>
                        ) : logs.length === 0 ? (
                            <EmptyState
                                title="No audit logs found"
                                description="Actions will appear here once administrators start managing users."
                                icon={Activity}
                            />
                        ) : (
                            <DataTable
                                data={logs}
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
