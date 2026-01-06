"use client"

import { useEffect, useState } from "react"
import { GoogleMap } from "@/components/live-map/google-map"
import { EmptyState } from "@/components/dashboard/empty-state"
import { getMapData, type ActiveRiderLocation } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Activity, Users } from "lucide-react"

export default function LiveMapPage() {
  const [riders, setRiders] = useState<ActiveRiderLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const data = await getMapData()
        // Convert GeoJSON features to ActiveRiderLocation format
        const riderLocations: ActiveRiderLocation[] = data.features.map((feature) => ({
          request_id: feature.properties.request_id,
          rider_id: feature.properties.rider_id,
          rider_username: feature.properties.rider_username,
          rider_first_name: feature.properties.rider_first_name,
          rider_last_name: feature.properties.rider_last_name,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          status: feature.properties.status,
          service_type: feature.properties.service_type,
          updated_at: feature.properties.updated_at,
        }))
        setRiders(riderLocations)
      } catch (err) {
        console.error("[v0] Map data fetch error:", err)
        toast({
          title: "Error",
          description: "Failed to load live map data. Ensure backend is running.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMapData()
    // Refresh every 10 seconds
    const interval = setInterval(fetchMapData, 10000)
    return () => clearInterval(interval)
  }, [toast])

  return (
    <div className="flex h-[calc(100vh-6rem-3rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Map</h1>
          <p className="text-muted-foreground">Real-time view of active service requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Activity className="h-3 w-3" />
            Live
          </Badge>
          <Card className="px-3 py-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{riders.length}</span>
              <span className="text-muted-foreground">Active</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        ) : riders.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              title="No active requests"
              description="Active service requests will appear on the map when riders request assistance."
            />
          </div>
        ) : (
          <GoogleMap
            roadies={riders.map((r) => ({
              ...r,
              id: String(r.rider_id),
              name: `${r.rider_first_name} ${r.rider_last_name}`,
              phone: r.rider_username,
              latitude: r.lat,
              longitude: r.lng,
              services: [],
              subscription_status: "active" as const,
              last_update: r.updated_at,
            }))}
          />
        )}
      </div>
    </div>
  )
}
