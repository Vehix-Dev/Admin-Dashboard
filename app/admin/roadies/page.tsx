"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRoadies, updateRoadie, deleteRoadie, type Roadie } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

export default function RoadiesPage() {
  const [roadies, setRoadies] = useState<Roadie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchRoadies = async () => {
    setIsLoading(true)
    try {
      const data = await getRoadies()
      setRoadies(data)
    } catch (err) {
      console.error("[v0] Roadies fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load roadies data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadies()
  }, [])

  const handleDelete = async (roadie: Roadie) => {
    if (!confirm(`Delete ${roadie.first_name} ${roadie.last_name}?`)) return
    try {
      await deleteRoadie(roadie.id)
      toast({ title: "Success", description: "Roadie deleted successfully" })
      fetchRoadies()
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete roadie", variant: "destructive" })
    }
  }

  const handleStatusToggle = async (roadie: Roadie) => {
    try {
      await updateRoadie(roadie.id, { is_approved: !roadie.is_approved })
      toast({
        title: "Success",
        description: `Roadie ${!roadie.is_approved ? "approved" : "unapproved"} successfully`
      })
      fetchRoadies()
    } catch (err) {
      toast({ title: "Error", description: "Failed to update roadie status", variant: "destructive" })
    }
  }

  const handleEdit = (roadie: Roadie) => {
    window.location.href = `/admin/roadies/${roadie.id}/edit`
  }

  const columns = [
    { header: "ID", accessor: "external_id" as const },
    { header: "First Name", accessor: "first_name" as const },
    { header: "Last Name", accessor: "last_name" as const },
    { header: "Email", accessor: "email" as const },
    { header: "Phone", accessor: "phone" as const },
    {
      header: "NIN",
      accessor: "nin" as const,
      cell: (value: string) => (
        <span className="font-mono text-xs">{value}</span>
      ),
    },
    {
      header: "Username",
      accessor: "username" as const,
    },
    {
      header: "Status",
      accessor: (row: Roadie) => row.is_approved,
      cell: (value: boolean, row: Roadie) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={value}
            onCheckedChange={() => handleStatusToggle(row)}
            className="data-[state=checked]:bg-green-600"
          />
          <span className={`text-xs font-medium ${value ? "text-green-700" : "text-yellow-700"}`}>
            {value ? "Active" : "Pending"}
          </span>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "created_at" as const,
      cell: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Roadies</h2>
          <p className="text-sm text-gray-600 mt-1">List</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoadies} className="gap-2 border-gray-300 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/admin/roadies/add">
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded" />
      ) : roadies.length === 0 ? (
        <EmptyState
          title="No providers found"
          description="Add your first provider to get started."
          action={
            <Link href="/admin/roadies/add">
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Add Provider
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          data={roadies}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={() => {
            // Export is handled by DataTable component
          }}
        />
      )}
    </div>
  )
}