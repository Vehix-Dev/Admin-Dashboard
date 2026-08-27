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
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  MapPin,
  User,
  Wrench,
  Edit,
  Save,
  X,
  Trash2,
  CheckCircle,
  Clock,
  Map,
  Navigation,
  AlertCircle
} from "lucide-react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || ""
const CARTO_TILE_QUERY = CARTO_API_KEY ? `?api_key=${CARTO_API_KEY}` : ""
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet"
import { Icon } from "leaflet"
import "leaflet/dist/leaflet.css"

/* ================= ICON FIX ================= */
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  iconUrl: "/leaflet/images/marker-icon.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
})

const createMarkerIcon = (color: string) =>
  new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
    `)}`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })

const riderIcon = createMarkerIcon("#2563EB")
const roadieIcon = createMarkerIcon("#16A34A")

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
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
        console.error("Request detail fetch error:", err)
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
      const payload: any = { ...formData }
      delete payload.rodie_username
      delete payload.rider_username

      await updateServiceRequest(request.id, payload)
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

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!request) return

    try {
      await deleteServiceRequest(request.id)
      toast({
        title: "Success",
        description: "Service request deleted successfully",
      })
      setIsDeleteModalOpen(false)
      router.push("/sys-admin/requests")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete service request",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeStyles = (status: string) => {
    const s = status.toLowerCase()
    switch (s) {
      case "requested":
        return "border-blue-500/20 bg-blue-500/10 text-blue-500"
      case "accepted":
        return "border-orange-500/20 bg-orange-500/10 text-orange-500"
      case "en_route":
        return "border-purple-500/20 bg-purple-500/10 text-purple-500"
      case "started":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
      case "completed":
        return "border-teal-500/20 bg-teal-500/10 text-teal-500"
      case "cancelled":
        return "border-destructive/20 bg-destructive/10 text-destructive"
      default:
        return "border-border bg-muted/30 text-muted-foreground"
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

  const formatCoordinate = (coord: any): string => {
    if (coord == null) return "N/A"
    try {
      const num = typeof coord === 'string' ? parseFloat(coord) : Number(coord)
      if (isNaN(num)) return "Invalid"
      return num.toFixed(6)
    } catch (error) {
      console.error("Error formatting coordinate:", error)
      return "Error"
    }
  }

  const getNumericValue = (value: any): number => {
    if (value == null) return 0
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  const getTimelineStepClass = (status: string, currentStep: string) => {
    const statusLower = status.toLowerCase()
    const stepLower = currentStep.toLowerCase()

    if (statusLower === stepLower) return "bg-blue-500 ring-blue-500/20"
    if (
      (stepLower === "requested" && (statusLower === "accepted" || statusLower === "en_route" || statusLower === "started" || statusLower === "completed")) ||
      (stepLower === "accepted" && (statusLower === "en_route" || statusLower === "started" || statusLower === "completed")) ||
      (stepLower === "en_route" && (statusLower === "started" || statusLower === "completed")) ||
      (stepLower === "started" && statusLower === "completed")
    ) {
      return "bg-emerald-500 ring-emerald-500/20"
    }
    return "bg-muted-foreground/20 ring-muted-foreground/10"
  }

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "Not available"
    const diffMs = new Date(end).getTime() - new Date(start).getTime()
    if (!Number.isFinite(diffMs) || diffMs < 0) return "Not available"
    const totalMinutes = Math.round(diffMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const renderRating = (rating: any, fallbackLabel: string) => {
    if (!rating) return <p className="text-sm text-muted-foreground">No rating provided</p>
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">{fallbackLabel}: {rating.rating || rating.stars || "N/A"} / 5</p>
        <p className="text-sm text-muted-foreground">{rating.comment || rating.review || "No comment provided"}</p>
      </div>
    )
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
                    rider_lat: request.rider_lat || "0",
                    rider_lng: request.rider_lng || "0",
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
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
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

      {/* Service Details Section - 3 column layout */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
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
                      value={formData.status || "REQUESTED"}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REQUESTED">Requested</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="EN_ROUTE">En Route</SelectItem>
                        <SelectItem value="STARTED">Started</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={cn("capitalize font-medium", getStatusBadgeStyles(request.status))}>
                      {request.status}
                    </Badge>
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
                        onChange={(e) => setFormData({ ...formData, rider_lat: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, rider_lng: e.target.value })}
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(request.additional_notes || request.notes || request.rider_notes || "").trim() || "No additional notes provided"}
            </p>
          </CardContent>
        </Card>

        {(request.status || "").toUpperCase() === "COMPLETED" && (
          <Card>
            <CardHeader>
              <CardTitle>Service Duration</CardTitle>
              <CardDescription>Time from acceptance to completion</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDuration(
                  routeInfo?.timestamps?.accepted_at || request.accepted_at,
                  routeInfo?.timestamps?.completed_at || request.completed_at || request.updated_at
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {(request.status || "").toUpperCase() === "CANCELLED" && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Cancellation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled By</p>
                <p className="text-sm font-medium capitalize">{request.cancellation_detail?.cancelled_by_username || request.cancellation_detail?.cancelled_by_name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="text-sm font-medium">{request.cancellation_detail?.reason || request.display_reason || request.cancellation_reason || "No cancellation reason provided"}</p>
              </div>
              {request.cancellation_detail?.custom_reason_text && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Notes</p>
                  <p className="text-sm font-medium">{request.cancellation_detail.custom_reason_text}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(request.status || "").toUpperCase() === "COMPLETED" && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Rider to Roadie</p>
                {renderRating(request.rider_to_roadie_rating || request.roadie_rating || request.ratings?.find((rating: any) => rating.target_role === "ROADIE"), "Rating")}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Roadie to Rider</p>
                {renderRating(request.roadie_to_rider_rating || request.rider_rating || request.ratings?.find((rating: any) => rating.target_role === "RIDER"), "Rating")}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Horizontal Timeline Section */}
      {routeInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Request Timeline
            </CardTitle>
            <CardDescription>Status progression and timestamps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[768px]">
                <div className="relative flex justify-between items-start">
                  {/* Timeline Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/20"></div>

                  {/* Requested Step */}
                  <div className="relative flex flex-col items-center flex-1 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative z-10 transition-colors",
                      getTimelineStepClass(request.status, "REQUESTED")
                    )}>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm">Requested</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(routeInfo.timestamps.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(routeInfo.timestamps.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Accepted Step */}
                  <div className="relative flex flex-col items-center flex-1 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative z-10 transition-colors",
                      routeInfo.timestamps.accepted_at
                        ? getTimelineStepClass(request.status, "ACCEPTED")
                        : "bg-muted-foreground/10 ring-muted-foreground/5"
                    )}>
                      {routeInfo.timestamps.accepted_at ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm">Accepted</p>
                      {routeInfo.timestamps.accepted_at ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.accepted_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.accepted_at).toLocaleTimeString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pending</p>
                      )}
                    </div>
                  </div>

                  {/* En Route Step */}
                  <div className="relative flex flex-col items-center flex-1 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative z-10 transition-colors",
                      routeInfo.timestamps.en_route_at
                        ? getTimelineStepClass(request.status, "EN_ROUTE")
                        : "bg-muted-foreground/10 ring-muted-foreground/5"
                    )}>
                      {routeInfo.timestamps.en_route_at ? (
                        <Navigation className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm">En Route</p>
                      {routeInfo.timestamps.en_route_at ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.en_route_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.en_route_at).toLocaleTimeString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pending</p>
                      )}
                    </div>
                  </div>

                  {/* Started Step */}
                  <div className="relative flex flex-col items-center flex-1 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative z-10 transition-colors",
                      routeInfo.timestamps.started_at
                        ? getTimelineStepClass(request.status, "STARTED")
                        : "bg-muted-foreground/10 ring-muted-foreground/5"
                    )}>
                      {routeInfo.timestamps.started_at ? (
                        <div className="w-5 h-5 rounded-full bg-white"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm">Started</p>
                      {routeInfo.timestamps.started_at ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.started_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.started_at).toLocaleTimeString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pending</p>
                      )}
                    </div>
                  </div>

                  {/* Completed Step */}
                  <div className="relative flex flex-col items-center flex-1 text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 border-background flex items-center justify-center relative z-10 transition-colors",
                      routeInfo.timestamps.completed_at
                        ? getTimelineStepClass(request.status, "COMPLETED")
                        : "bg-muted-foreground/10 ring-muted-foreground/5"
                    )}>
                      {routeInfo.timestamps.completed_at ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="font-semibold text-sm">Completed</p>
                      {routeInfo.timestamps.completed_at ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.completed_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(routeInfo.timestamps.completed_at).toLocaleTimeString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Pending</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ratings and Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ratings & Comments</CardTitle>
          <CardDescription>
            Star ratings and optional experience comments from the rider and roadie after completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {request.ratings && request.ratings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {request.ratings.map((rating) => {
                const raterLabel =
                  rating.rater_name ||
                  (rating as { rater_username?: string }).rater_username ||
                  `User #${rating.rater}`
                const ratedLabel =
                  rating.rated_user_name ||
                  (rating as { rated_user_username?: string }).rated_user_username ||
                  `User #${rating.rated_user}`
                return (
                  <div key={rating.id} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{raterLabel}</span>
                        <span className="text-sm text-muted-foreground">rated</span>
                        <span className="font-medium text-foreground">{ratedLabel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${i < rating.rating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">({rating.rating}/5)</span>
                      </div>
                    </div>
                    {rating.comment ? (
                      <p className="text-sm text-foreground/90 border-l-2 border-primary/30 pl-3">
                        {rating.comment}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No written comment</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(rating.created_at).toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No ratings submitted for this assist yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Full Width Map Section - Dark Mode Default */}
      {request.rider_lat && request.rider_lng && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Location Map
            </CardTitle>
            <CardDescription>Service request location and route information</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full rounded-lg overflow-hidden">
              <MapContainer
                center={[getNumericValue(request.rider_lat), getNumericValue(request.rider_lng)]}
                zoom={14}
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer
                  url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_TILE_QUERY}`}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
                />

                <ZoomControl position="bottomright" />

                {/* Rider Location Marker */}
                <Marker
                  position={[getNumericValue(request.rider_lat), getNumericValue(request.rider_lng)]}
                  icon={riderIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{request.rider_username}</p>
                      <p className="text-xs text-muted-foreground">Rider Location</p>
                      <p className="text-xs font-mono mt-1">
                        {formatCoordinate(request.rider_lat)}, {formatCoordinate(request.rider_lng)}
                      </p>
                    </div>
                  </Popup>
                </Marker>

                {/* Roadie Location (if available) */}
                {routeInfo?.rodie && (
                  <Marker
                    position={[routeInfo.rodie.lat, routeInfo.rodie.lng]}
                    icon={roadieIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">Roadie #{routeInfo.rodie.id}</p>
                        <p className="text-xs text-muted-foreground">Roadie Location</p>
                        <p className="text-xs font-mono mt-1">
                          {formatCoordinate(routeInfo.rodie.lat)}, {formatCoordinate(routeInfo.rodie.lng)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            {/* Route Info Summary */}
            {routeInfo?.route && (
              <div className="flex gap-4 p-4 border-t border-border bg-muted/20">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="text-lg font-semibold">{(routeInfo.route.distance_meters / 1000).toFixed(2)} km</p>
                </div>
                <div className="w-px bg-border"></div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">Estimated Time</p>
                  <p className="text-lg font-semibold">{Math.round(routeInfo.route.eta_seconds / 60)} minutes</p>
                </div>
                <div className="w-px bg-border"></div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">Service Type</p>
                  <p className="text-lg font-semibold">{getServiceName(request.service_type)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Service Request"
        description="Are you sure you want to delete this service request? This action is permanent and will remove all associated logs and history."
      >
        {request && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Request ID:</span>
              <span className="font-medium text-white">#{request.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rider:</span>
              <span className="text-primary">{request.rider_username}</span>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}
