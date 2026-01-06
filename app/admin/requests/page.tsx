"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/management/data-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
  getServiceRequests,
  deleteServiceRequest,
  type ServiceRequest,
  getRiders,
  getRoadies,
  getServices,
  type Rider,
  type Roadie,
  type Service
} from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, FileDown, Plus } from "lucide-react"
import { RequestFormModal } from "@/components/forms/request-form-modal"

interface RequestRow extends ServiceRequest {
  id: string
  rider_lat: string | number | null
  rider_lng: string | number | null
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [roadies, setRoadies] = useState<Roadie[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [requestsData, ridersData, roadiesData, servicesData] = await Promise.all([
        getServiceRequests(),
        getRiders(),
        getRoadies(),
        getServices()
      ])

      const requestsWithStringId = requestsData.map((req) => ({
        ...req,
        id: String(req.id),
        rider_lat: req.rider_lat,
        rider_lng: req.rider_lng,
      }))
      setRequests(requestsWithStringId)
      setRiders(ridersData)
      setRoadies(roadiesData)
      setServices(servicesData)
    } catch (err) {
      console.error("[v0] Data fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleCreate = async (data: Partial<ServiceRequest>) => {
    try {
      // The createServiceRequest API expects service_type, rider_lat, and rider_lng
      const requestData = {
        service_type: Number(data.service_type) || 0,
        rider_lat: Number(data.rider_lat) || 0,
        rider_lng: Number(data.rider_lng) || 0,
        ...(data.rider && { rider: Number(data.rider) }),
        ...(data.rodie && { rodie: Number(data.rodie) }),
        ...(data.status && { status: data.status }),
      }

      await createServiceRequest(requestData)
      toast({ title: "Success", description: "Service request created successfully" })
      setIsFormOpen(false)
      fetchAllData()
    } catch (err) {
      toast({ title: "Error", description: "Failed to create service request", variant: "destructive" })
    }
  }

  const handleDelete = async (request: RequestRow) => {
    if (!confirm("Delete this request?")) return
    try {
      await deleteServiceRequest(Number(request.id))
      toast({ title: "Success", description: "Request deleted successfully" })
      fetchAllData()
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete request", variant: "destructive" })
    }
  }

  const handleEdit = (request: RequestRow) => {
    // Redirect to the detail page (which will have editing functionality)
    window.location.href = `/admin/requests/${request.id}`
  }

  const handleExport = () => {
    try {
      const headers = [
        'ID',
        'Rider ID',
        'Rider Username',
        'Roadie ID',
        'Roadie Username',
        'Service Type',
        'Status',
        'Latitude',
        'Longitude',
        'Created At',
        'Updated At'
      ]

      const csvData = requests.map(request => [
        request.id,
        request.rider,
        `"${request.rider_username || ''}"`,
        request.rodie || '',
        `"${request.rodie_username || ''}"`,
        request.service_type,
        `"${request.status}"`,
        request.rider_lat,
        request.rider_lng,
        `"${formatDateForExport(request.created_at)}"`,
        `"${formatDateForExport(request.updated_at)}"`
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `service_requests_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: "Success", description: "Service requests exported successfully" })
    } catch (err) {
      toast({ title: "Error", description: "Failed to export service requests", variant: "destructive" })
    }
  }

  const formatDateForExport = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "requested":
        return "secondary"
      case "accepted":
      case "assigned":
        return "default"
      case "completed":
      case "finished":
        return "secondary"
      case "cancelled":
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatLocation = (lat: string | number | null, lng: string | number | null): string => {
    if (lat == null || lng == null || lat === "" || lng === "") return "N/A"

    try {
      const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
      const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng

      if (isNaN(latNum) || isNaN(lngNum)) return "N/A"

      return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`
    } catch (error) {
      console.error("Error formatting location:", error)
      return "Invalid"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  const columns = [
    {
      header: "ID",
      accessor: "id" as const,
    },
    {
      header: "Rider",
      accessor: "rider_username" as const,
      cell: (value: string | null) => value || "-",
    },
    {
      header: "Roadie",
      accessor: "rodie_username" as const,
      cell: (value: string | null) => value || "-",
    },
    {
      header: "Service",
      accessor: "service_type" as const,
      cell: (value: string | number) => typeof value === 'number' ? `Service #${value}` : value,
    },
    {
      header: "Status",
      accessor: "status" as const,
      cell: (value: string) => (
        <Badge variant={getStatusColor(value) as any} className="capitalize">
          {value.toLowerCase()}
        </Badge>
      ),
    },
    {
      header: "Location",
      accessor: (request: RequestRow) => formatLocation(request.rider_lat, request.rider_lng),
    },
    {
      header: "Created",
      accessor: "created_at" as const,
      cell: (value: string) => formatDate(value),
    },
    {
      header: "Updated",
      accessor: "updated_at" as const,
      cell: (value: string) => formatDate(value),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Service Requests</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAllData} className="gap-2 border-gray-300 bg-transparent">
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
      ) : requests.length === 0 ? (
        <EmptyState
          title="No service requests"
          description="Service requests will appear here once riders request assistance."
        />
      ) : (
        <DataTable
          data={requests}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      )}

      {/* Create Modal */}
      <RequestFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        riders={riders}
        roadies={roadies}
        services={services}
      />
    </div>
  )
}