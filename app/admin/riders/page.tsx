"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getRiders, updateRider, deleteRider, type Rider } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchRiders = async () => {
    setIsLoading(true)
    try {
      const data = await getRiders()
      setRiders(data)
    } catch (err) {
      console.error("[v0] Riders fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load riders data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRiders()
  }, [])

  const handleDelete = async (rider: Rider) => {
    if (!confirm(`Delete ${rider.first_name} ${rider.last_name}?`)) return
    try {
      await deleteRider(rider.id)
      toast({ title: "Success", description: "Rider deleted successfully" })
      fetchRiders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete rider", variant: "destructive" })
    }
  }

  const handleStatusToggle = async (rider: Rider) => {
    try {
      await updateRider(rider.id, { is_approved: !rider.is_approved })
      toast({
        title: "Success",
        description: `Rider ${!rider.is_approved ? "approved" : "unapproved"} successfully`
      })
      fetchRiders()
    } catch (err) {
      toast({ title: "Error", description: "Failed to update rider status", variant: "destructive" })
    }
  }

  const handleEdit = (rider: Rider) => {
    window.location.href = `/admin/riders/${rider.id}/edit`
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
      accessor: (row: Rider) => row.is_approved,
      cell: (value: boolean, row: Rider) => (
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
          <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
          <p className="text-sm text-gray-600 mt-1">List</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRiders} className="gap-2 border-gray-300 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/admin/riders/add">
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded" />
      ) : riders.length === 0 ? (
        <EmptyState
          title="No riders found"
          description="Add your first rider to get started."
          action={
            <Link href="/admin/riders/add">
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Add Rider
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable
          data={riders}
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