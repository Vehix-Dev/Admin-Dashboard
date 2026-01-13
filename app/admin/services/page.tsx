"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type Service,
  getServiceById
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, FileDown, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceFormModal } from "@/components/forms/service-form-modal"
import { DataTable } from "@/components/management/data-table"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan, PermissionButton } from "@/components/auth/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const { toast } = useToast()

  // Permission checks
  const canAdd = useCan(PERMISSIONS.SERVICES_ADD)
  const canChange = useCan(PERMISSIONS.SERVICES_CHANGE)
  const canDelete = useCan(PERMISSIONS.SERVICES_DELETE)

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
        name: data.name || "",
        code: data.code || "",
        is_active: data.is_active !== undefined ? data.is_active : true,
      }

      await createService(serviceData)
      toast({
        title: "Success",
        description: "Service created successfully"
      })
      setIsFormOpen(false)
      fetchServices()
    } catch (err: any) {
      console.error("Create service error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create service",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (data: Partial<Service>) => {
    if (!editingService) return

    try {
      const serviceData: Partial<Service> = {}

      if (data.name !== undefined) serviceData.name = data.name
      if (data.code !== undefined) serviceData.code = data.code
      if (data.is_active !== undefined) serviceData.is_active = data.is_active

      await updateService(editingService.id, serviceData)
      toast({
        title: "Success",
        description: "Service updated successfully"
      })
      setEditingService(null)
      fetchServices()
    } catch (err: any) {
      console.error("Update service error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update service",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete the service "${service.name || service.code}"? This action cannot be undone.`)) return
    try {
      await deleteService(service.id)
      toast({
        title: "Success",
        description: "Service deleted successfully"
      })
      fetchServices()
    } catch (err: any) {
      console.error("Delete service error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete service",
        variant: "destructive"
      })
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
    } catch (err: any) {
      console.error("Toggle status error:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update service status",
        variant: "destructive"
      })
    }
  }

  const handleEditClick = async (service: Service) => {
    try {
      // Fetch the complete service data to ensure we have all fields
      const fullService = await getServiceById(service.id)
      setEditingService(fullService)
    } catch (err: any) {
      console.error("Fetch service details error:", err)
      // If fetching fails, use the data we have
      setEditingService(service)
      toast({
        title: "Warning",
        description: "Could not fetch complete service details. Editing with available data.",
        variant: "default"
      })
    }
  }

  const handleExport = () => {
    try {
      // Convert services to CSV format
      const headers = ['ID', 'Name', 'Code', 'Status', 'Roadies Offering', 'Created At', 'Updated At']
      const csvData = services.map(service => [
        service.id,
        `"${service.name}"`,
        service.code,
        service.is_active ? 'Active' : 'Inactive',
        service.rodie_count || 0,
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

      toast({
        title: "Success",
        description: "Services exported successfully"
      })
    } catch (err: any) {
      console.error("Export error:", err)
      toast({
        title: "Error",
        description: "Failed to export services",
        variant: "destructive"
      })
    }
  }

  const columns = [
    {
      header: "ID",
      accessor: "id" as const,
      cell: (value: number) => (
        <span className="font-mono text-sm text-gray-500">#{value.toString().padStart(3, '0')}</span>
      )
    },
    {
      header: "Service Details",
      accessor: "name" as const,
      cell: (value: string, row: Service) => (
        <div className="space-y-1">
          <div className="font-semibold text-gray-900">{value || "Unnamed Service"}</div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">
              {row.code}
            </code>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-gray-500 cursor-help">
                    <Users className="h-3 w-3" />
                    <span>{row.rodie_count || 0} roadies</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of roadies offering this service</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
            disabled={!canChange}
            className={`data-[state=checked]:bg-green-600 ${!value ? 'bg-gray-300' : ''}`}
            aria-label={`Toggle service ${row.name || row.code} ${value ? 'off' : 'on'}`}
          />
          <Badge
            variant={value ? "default" : "secondary"}
            className={`${value ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}`}
          >
            {value ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      header: "Created",
      accessor: "created_at" as const,
      cell: (value: string) => (
        <div className="space-y-0.5">
          <div className="text-sm text-gray-900">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: "Updated",
      accessor: "updated_at" as const,
      cell: (value: string) => (
        <div className="space-y-0.5">
          <div className="text-sm text-gray-900">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
  ]

  // Calculate statistics
  const stats = {
    total: services.length,
    active: services.filter(s => s.is_active).length,
    inactive: services.filter(s => !s.is_active).length,
    totalRoadies: services.reduce((sum, service) => sum + (service.rodie_count || 0), 0),
    avgRoadiesPerService: services.length > 0
      ? (services.reduce((sum, service) => sum + (service.rodie_count || 0), 0) / services.length).toFixed(1)
      : '0'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Services Management</h1>
          <p className="text-gray-600 mt-2">
            Manage service types that roadies can offer and riders can request
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 border-gray-300 hover:bg-gray-50"
            disabled={services.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <PermissionButton
            permissions={PERMISSIONS.SERVICES_ADD}
            onClick={() => setIsFormOpen(true)}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </PermissionButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              All service types
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{stats.active}</div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Available for requests
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Roadies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalRoadies}</div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Across all services
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Roadies/Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{stats.avgRoadiesPerService}</div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Average per service type
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">Service Types</CardTitle>
          <CardDescription className="text-muted-foreground">
            List of all service types in the system. Toggle status to activate/deactivate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : services.length === 0 ? (
            <EmptyState
              title="No services found"
              description="Add your first service type to get started."
              action={
                canAdd ? (
                  <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                    <Plus className="h-4 w-4" />
                    Create Service
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <DataTable
              data={services}
              columns={columns}
              onEdit={canChange ? handleEditClick : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          )}
        </CardContent>
      </Card>

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
      />
    </div>
  )
}