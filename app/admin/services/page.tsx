"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getServices, createService, updateService, deleteService, type Service } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, RefreshCw, Edit, FileDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceFormModal } from "@/components/forms/service-form-modal"
import { DataTable } from "@/components/management/data-table"
import { Switch } from "@/components/ui/switch"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const { toast } = useToast()

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const data = await getServices()
      setServices(data)
    } catch (err) {
      console.error("[v0] Services fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load services.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleCreate = async (data: Partial<Service>) => {
    try {
      const serviceData = {
        code: data.code || "",
        is_active: data.is_active !== undefined ? data.is_active : true,
        name: data.name || data.code || "",
      }

      await createService(serviceData)
      toast({ title: "Success", description: "Service created successfully" })
      setIsFormOpen(false)
      fetchServices()
    } catch (err) {
      toast({ title: "Error", description: "Failed to create service", variant: "destructive" })
    }
  }

  const handleEdit = async (data: Partial<Service>) => {
    if (!editingService) return

    try {
      const serviceData: Partial<Service> = {}

      if (data.code !== undefined) serviceData.code = data.code
      if (data.name !== undefined) serviceData.name = data.name
      if (data.is_active !== undefined) serviceData.is_active = data.is_active

      await updateService(editingService.id, serviceData)
      toast({ title: "Success", description: "Service updated successfully" })
      setEditingService(null)
      fetchServices()
    } catch (err) {
      toast({ title: "Error", description: "Failed to update service", variant: "destructive" })
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Delete service "${service.name || service.code}"?`)) return
    try {
      await deleteService(service.id)
      toast({ title: "Success", description: "Service deleted successfully" })
      fetchServices()
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete service", variant: "destructive" })
    }
  }

  const handleStatusToggle = async (service: Service) => {
    try {
      await updateService(service.id, { is_active: !service.is_active })
      toast({
        title: "Success",
        description: `Service ${!service.is_active ? "activated" : "deactivated"} successfully`
      })
      fetchServices()
    } catch (err) {
      toast({ title: "Error", description: "Failed to update service status", variant: "destructive" })
    }
  }

  const handleEditClick = (service: Service) => {
    setEditingService(service)
  }

  const handleExport = () => {
    try {
      // Convert services to CSV format
      const headers = ['ID', 'Name', 'Code', 'Status', 'Created At', 'Updated At']
      const csvData = services.map(service => [
        service.id,
        `"${service.name}"`,
        service.code,
        service.is_active ? 'Active' : 'Inactive',
        new Date(service.created_at).toLocaleDateString(),
        new Date(service.updated_at).toLocaleDateString()
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `services_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: "Success", description: "Services exported successfully" })
    } catch (err) {
      toast({ title: "Error", description: "Failed to export services", variant: "destructive" })
    }
  }

  const columns = [
    { header: "ID", accessor: "id" as const },
    {
      header: "Name",
      accessor: "name" as const,
      cell: (value: string, row: Service) => (
        <div>
          <div className="font-medium">{value || row.code}</div>
          <div className="text-xs text-gray-500">{row.code}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row: Service) => row.is_active,
      cell: (value: boolean, row: Service) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={value}
            onCheckedChange={() => handleStatusToggle(row)}
            className="data-[state=checked]:bg-green-600"
          />
          <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-600" : "bg-gray-400"}>
            {value ? "Active" : "Inactive"}
          </Badge>
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
          <h2 className="text-2xl font-bold text-gray-800">Manage Services</h2>
          <p className="text-sm text-gray-600 mt-1">List</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchServices} className="gap-2 border-gray-300 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 border-gray-300 bg-transparent">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded" />
      ) : services.length === 0 ? (
        <EmptyState title="No services found" description="Add your first service to get started." />
      ) : (
        <DataTable
          data={services}
          columns={columns}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      )}

      {/* Create Modal */}
      <ServiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Modal */}
      <ServiceFormModal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSubmit={handleEdit}
        initialData={editingService || undefined}
        isEditing={true}
      />
    </div>
  )
}