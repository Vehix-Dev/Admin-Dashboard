"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import {
    getDeletedRoadies,
    restoreRoadie,
    permanentlyDeleteUser,
    type Roadie
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/ui/confirm-modal"

export default function DeletedRoadiesPage() {
    const [roadies, setRoadies] = useState<Roadie[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deleteTarget, setDeleteTarget] = useState<Roadie | null>(null)
    const { toast } = useToast()
    const { user } = useAuth()
    const canManage = useCan(PERMISSIONS.ROADIES_DELETE)
    const isSuperAdmin = !!user?.is_superuser

    const fetchDeletedRoadies = async () => {
        setIsLoading(true)
        try {
            const data = await getDeletedRoadies()
            setRoadies(data)
        } catch (err) {
            console.error("Deleted Roadies fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDeletedRoadies()
    }, [])

    const handleRestore = async (roadie: Roadie) => {
        try {
            await restoreRoadie(roadie.id)
            toast({
                title: "Success",
                description: "Roadie restored successfully"
            })
            fetchDeletedRoadies()
        } catch (err: unknown) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to restore roadie",
                variant: "destructive"
            })
        }
    }

    const handlePermanentDelete = async () => {
        if (!deleteTarget) return
        try {
            await permanentlyDeleteUser(deleteTarget.id, 'ROADIE')
            toast({
                title: "Success",
                description: "Roadie permanently deleted"
            })
            setDeleteTarget(null)
            fetchDeletedRoadies()
        } catch (err: unknown) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to permanently delete roadie",
                variant: "destructive"
            })
        }
    }

    const columns: Column<Roadie>[] = [
        {
            header: "Name",
            accessor: "first_name",
            cell: (_: unknown, row: Roadie) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.first_name} {row.last_name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{row.external_id}</span>
                </div>
            )
        },
        {
            header: "Contact",
            accessor: "email",
            cell: (_: unknown, row: Roadie) => (
                <div className="flex flex-col">
                    <span className="text-sm">{row.email}</span>
                    <span className="text-xs text-muted-foreground">{row.phone}</span>
                </div>
            )
        },
        {
            header: "Deleted At",
            accessor: "updated_at",
            cell: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            header: "Status",
            accessor: "is_approved",
            cell: () => (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Deleted</Badge>
            )
        },
        {
            header: "Actions",
            accessor: "id",
            cell: (_: unknown, row: Roadie) => (
                <div className="flex gap-1">
                    {canManage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(row)}
                            className="h-8 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Restore
                        </Button>
                    )}
                    {isSuperAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(row)}
                            className="h-8 gap-2 text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Forever
                        </Button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-muted-foreground font-normal">Roadies /</span> Deleted
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Restore deleted roadies or permanently remove test accounts. Accounts in pending deletion are auto-removed after 30 days.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Link href="/sys-admin/roadies">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Roadies
                    </Button>
                </Link>
            </div>

            <DataTable
                data={roadies}
                columns={columns}
                isLoading={isLoading}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Permanently delete roadie?"
                description={
                    deleteTarget
                        ? `This will permanently delete ${deleteTarget.first_name} ${deleteTarget.last_name} (${deleteTarget.external_id}) and all associated data. This cannot be undone.`
                        : ""
                }
                onConfirm={handlePermanentDelete}
                confirmText="Delete permanently"
                mode="delete"
            />
        </div>
    )
}
