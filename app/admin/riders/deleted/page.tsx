"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/management/data-table"
import {
    getDeletedRiders,
    restoreRider,
    type Rider
} from "@/lib/api"
import { useCan } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function DeletedRidersPage() {
    const [riders, setRiders] = useState<Rider[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const canManage = useCan(PERMISSIONS.RIDERS_DELETE)

    const fetchDeletedRiders = async () => {
        setIsLoading(true)
        try {
            const data = await getDeletedRiders()
            setRiders(data)
        } catch (err) {
            console.error("Deleted Riders fetch error:", err)
            // Silence error on 404/mock environment to avoid confusing user if endpoint doesn't exist yet
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDeletedRiders()
    }, [])

    const handleRestore = async (rider: Rider) => {
        try {
            await restoreRider(rider.id)
            toast({
                title: "Success",
                description: "Rider restored successfully"
            })
            fetchDeletedRiders()
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to restore rider",
                variant: "destructive"
            })
        }
    }

    const columns: Column<Rider>[] = [
        {
            header: "Name",
            accessor: "first_name",
            cell: (_: unknown, row: Rider) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.first_name} {row.last_name}</span>
                    <span className="text-xs text-muted-foreground">{row.username}</span>
                </div>
            )
        },
        {
            header: "Contact",
            accessor: "email",
            cell: (_: unknown, row: Rider) => (
                <div className="flex flex-col">
                    <span className="text-sm">{row.email}</span>
                    <span className="text-xs text-muted-foreground">{row.phone}</span>
                </div>
            )
        },
        {
            header: "Deleted At",
            accessor: "updated_at", // Assuming updated_at tracks deletion time or close to it
            cell: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            header: "Status",
            accessor: "is_approved",
            cell: (value: boolean) => (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Deleted</Badge>
            )
        },
        {
            header: "Actions",
            accessor: "id",
            cell: (_: any, row: Rider) => canManage ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(row)}
                    className="h-8 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Restore
                </Button>
            ) : null,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-muted-foreground font-normal">Riders /</span> Deleted
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage deleted rider accounts</p>
                </div>
                <div className="flex items-center gap-2" />
            </div>

            <div className="flex items-center gap-2">
                <Link href="/admin/riders">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Riders
                    </Button>
                </Link>
            </div>

            <DataTable
                data={riders}
                columns={columns}
            // Disable standard delete/edit
            />
        </div>
    )
}
