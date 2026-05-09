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
import { Clock, Map, Navigation, AlertCircle, CheckCircle, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MapPin, User, Wrench, Edit, Save, X, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
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
  const [mapStyle, setMapStyle] = useState("dark")
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
        console.error(" Request detail fetch error:", err)
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

          {request.cancellation_reason && (
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
                  <p className="text-sm font-medium capitalize">{request.cancelled_by || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="text-sm font-medium">{request.cancellation_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {routeInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Request Timeline
                </CardTitle>
                <CardDescription>Status progression and timestamps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></div>
                      <div className="w-0.5 h-16 bg-border mt-2"></div>
                    </div>
                    <div className="pt-1">
                      <p className="font-medium text-sm text-blue-600">Created</p>
                      <p className="text-xs text-muted-foreground">{new Date(routeInfo.timestamps.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Accepted */}
                  {routeInfo.timestamps.accepted_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
                        <div className="w-0.5 h-16 bg-border mt-2"></div>
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-sm text-emerald-600">Accepted</p>
                        <p className="text-xs text-muted-foreground">{new Date(routeInfo.timestamps.accepted_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* En Route */}
                  {routeInfo.timestamps.en_route_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/20"></div>
                        <div className="w-0.5 h-16 bg-border mt-2"></div>
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-sm text-purple-600">En Route</p>
                        <p className="text-xs text-muted-foreground">{new Date(routeInfo.timestamps.en_route_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Started */}
                  {routeInfo.timestamps.started_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-500/20"></div>
                        <div className="w-0.5 h-16 bg-border mt-2"></div>
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-sm text-orange-600">Started</p>
                        <p className="text-xs text-muted-foreground">{new Date(routeInfo.timestamps.started_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {routeInfo.timestamps.completed_at && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-500/20"></div>
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-sm text-teal-600">Completed</p>
                        <p className="text-xs text-muted-foreground">{new Date(routeInfo.timestamps.completed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {request.rider_lat && request.rider_lng && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Request Location
                </CardTitle>
                <CardDescription>Service request location on map</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Map Style Toggle */}
                  <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                    {["light", "dark"].map((style) => (
                      <button
                        key={style}
                        onClick={() => setMapStyle(style)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          mapStyle === style
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Map Component */}
                  <div className="h-[400px] rounded-lg overflow-hidden border border-border">
                    <MapContainer
                      center={[getNumericValue(request.rider_lat), getNumericValue(request.rider_lng)]}
                      zoom={14}
                      className="h-full w-full"
                      zoomControl={false}
                    >
                      {mapStyle === "dark" ? (
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                      ) : (
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      )}

                      <ZoomControl position="bottomright" />

                      {/* Rider Location */}
                      <Marker
                        position={[getNumericValue(request.rider_lat), getNumericValue(request.rider_lng)]}
                        icon={riderIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{request.rider_username}</p>
                            <p className="text-xs text-muted-foreground">Rider Location</p>
                          </div>
                        </Popup>
                      </Marker>

                      {/* Roadie Location (if available from route info) */}
                      {routeInfo?.rodie && (
                        <Marker
                          position={[routeInfo.rodie.lat, routeInfo.rodie.lng]}
                          icon={roadieIcon}
                        >
                          <Popup>
                            <div className="text-sm">
                              <p className="font-semibold">{routeInfo.rodie.id}</p>
                              <p className="text-xs text-muted-foreground">Roadie Location</p>
                            </div>
                          </Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>

                  {/* Route Info */}
                  {routeInfo?.route && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="text-sm font-semibold">{(routeInfo.route.distance_meters / 1000).toFixed(2)} km</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="text-xs text-muted-foreground">ETA</p>
                        <p className="text-sm font-semibold">{Math.round(routeInfo.route.eta_seconds / 60)} min</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ratings and Comments */}
          {request.ratings && request.ratings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Ratings & Comments
                </CardTitle>
                <CardDescription>Feedback from service participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {request.ratings.map((rating) => (
                    <div key={rating.id} className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{rating.rater_name}</span>
                          <span className="text-sm text-muted-foreground">rated</span>
                          <span className="font-medium text-foreground">{rating.rated_user_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">
                            ({rating.rating}/5)
                          </span>
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-muted-foreground italic">
                          "{rating.comment}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(rating.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
    </div >
  )
}