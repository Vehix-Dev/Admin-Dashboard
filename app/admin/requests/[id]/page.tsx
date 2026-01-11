"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  type ServiceRequest,
  getRiders,
  getRoadies,
  getServices,
  type Rider,
  type Roadie,
  type Service,
  getRequestRoute,
  type RequestRouteInfo,
} from "@/lib/api"
import { Clock, Map, Navigation } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MapPin, User, Wrench, Edit, Save, X, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [roadies, setRoadies] = useState<Roadie[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [routeInfo, setRouteInfo] = useState<RequestRouteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<ServiceRequest>>({})
  const { toast } = useToast()

  const id = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestData, ridersData, roadiesData, servicesData] = await Promise.all([
          getServiceRequestById(Number(id)),
          getRiders(),
          getRoadies(),
          getServices()
        ])

        setRequest(requestData)
        setRiders(ridersData)
        setRoadies(roadiesData)
        setServices(servicesData)

        try {
          const routeData = await getRequestRoute(Number(id))
          setRouteInfo(routeData)
        } catch (e) {
          console.log("No route info available or failed to fetch")
        }

        setFormData({
          status: requestData.status,
          rider_lat: requestData.rider_lat,
          rider_lng: requestData.rider_lng,
          rider: requestData.rider,
          rodie: requestData.rodie,
          service_type: requestData.service_type,
        })
      } catch (err) {
        console.error("[v0] Request detail fetch error:", err)
        toast({
          title: "Error",
          description: "Failed to load service request details.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, toast])

  const handleSave = async () => {
    if (!request) return

    setIsSaving(true)
    try {
      // Create a clean payload without read-only fields
      const payload: any = { ...formData }
      delete payload.rodie_username
      delete payload.rider_username

      await updateServiceRequest(request.id, payload)
      // Refresh the request data
      const updatedRequest = await getServiceRequestById(Number(id))
      setRequest(updatedRequest)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Service request updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update service request",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!request || !confirm("Are you sure you want to delete this request?")) return

    try {
      await deleteServiceRequest(request.id)
      toast({
        title: "Success",
        description: "Service request deleted successfully",
      })
      router.push("/admin/requests")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete service request",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "accepted":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId)
    return service ? `${service.name} (${service.code})` : `Service #${serviceId}`
  }

  const getRiderName = (riderId: number) => {
    const rider = riders.find(r => r.id === riderId)
    return rider ? `${rider.first_name} ${rider.last_name}` : `Rider #${riderId}`
  }

  const getRoadieName = (roadieId: number | null) => {
    if (!roadieId) return "None"
    const roadie = roadies.find(r => r.id === roadieId)
    return roadie ? `${roadie.first_name} ${roadie.last_name}` : `Roadie #${roadieId}`
  }

  // Helper function to safely format latitude/longitude
  const formatCoordinate = (coord: any): string => {
    if (coord == null) return "N/A"

    try {
      // Convert to number if it's a string
      const num = typeof coord === 'string' ? parseFloat(coord) : Number(coord)
      if (isNaN(num)) return "Invalid"
      return num.toFixed(6)
    } catch (error) {
      console.error("Error formatting coordinate:", error)
      return "Error"
    }
  }

  // Helper function to safely get numeric value
  const getNumericValue = (value: any): number => {
    if (value == null) return 0
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>
        <EmptyState title="Request not found" description="The service request could not be loaded." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Button>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    status: request.status,
                    rider_lat: getNumericValue(request.rider_lat),
                    rider_lng: getNumericValue(request.rider_lng),
                    rider: request.rider,
                    rodie: request.rodie,
                    service_type: request.service_type,
                  })
                }}
                className="gap-2"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gap-2 bg-green-600 hover:bg-green-700"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Service request information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Request ID</p>
                  <p className="text-lg font-semibold">{request.id}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status || "pending"}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getStatusColor(request.status) as any}>{request.status}</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type</Label>
                  {isEditing ? (
                    <Select
                      value={formData.service_type?.toString() || "0"}
                      onValueChange={(value) => setFormData({ ...formData, service_type: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name} ({service.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-lg font-semibold">{getServiceName(request.service_type)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg font-semibold">{new Date(request.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    {isEditing ? (
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={formData.rider_lat?.toString() || ""}
                        onChange={(e) => setFormData({ ...formData, rider_lat: getNumericValue(e.target.value) })}
                      />
                    ) : (
                      <p className="text-sm">{formatCoordinate(request.rider_lat)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    {isEditing ? (
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={formData.rider_lng?.toString() || ""}
                        onChange={(e) => setFormData({ ...formData, rider_lng: getNumericValue(e.target.value) })}
                      />
                    ) : (
                      <p className="text-sm">{formatCoordinate(request.rider_lng)}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Rider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rider">Rider</Label>
                {isEditing ? (
                  <Select
                    value={formData.rider?.toString() || "0"}
                    onValueChange={(value) => setFormData({ ...formData, rider: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {riders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id.toString()}>
                          {rider.first_name} {rider.last_name} ({rider.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <p className="font-semibold">{getRiderName(request.rider)}</p>
                    <p className="text-sm text-muted-foreground">{request.rider_username}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Roadie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rodie">Roadie</Label>
                {isEditing ? (
                  <Select
                    value={formData.rodie?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, rodie: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select roadie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {roadies.map((roadie) => (
                        <SelectItem key={roadie.id} value={roadie.id.toString()}>
                          {roadie.first_name} {roadie.last_name} ({roadie.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <p className="font-semibold">{getRoadieName(request.rodie)}</p>
                    {request.rodie_username && (
                      <p className="text-sm text-muted-foreground">{request.rodie_username}</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Additional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{new Date(request.updated_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}