"use client"

import { useEffect, useRef, useState } from "react"
import { MarkerClusterer } from "@googlemaps/markerclusterer"
import type { RoadieLocation } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Wrench, Clock } from "lucide-react"

interface GoogleMapProps {
  roadies: RoadieLocation[]
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function GoogleMap({ roadies }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [selectedRoadie, setSelectedRoadie] = useState<RoadieLocation | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    const loadScript = () => {
      if (window.google?.maps) {
        setIsLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    }

    loadScript()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: { lat: 0, lng: 0 },
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    })

    setMap(newMap)
  }, [isLoaded, map])

  // Update markers when roadies change
  useEffect(() => {
    if (!map || !window.google) return

    // Clear existing markers and clusterer
    clustererRef.current?.clearMarkers()
    markers.forEach((marker) => marker.setMap(null))

    if (roadies.length === 0) {
      setMarkers([])
      return
    }

    // Create new markers
    const newMarkers = roadies.map((roadie) => {
      const marker = new window.google.maps.Marker({
        position: { lat: roadie.latitude, lng: roadie.longitude },
        title: roadie.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: roadie.subscription_status === "active" ? "#ff6b2c" : "#888",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      })

      marker.addListener("click", () => {
        setSelectedRoadie(roadie)
      })

      return marker
    })

    setMarkers(newMarkers)

    // Initialize or update clusterer
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map, markers: newMarkers })
    } else {
      clustererRef.current.clearMarkers()
      clustererRef.current.addMarkers(newMarkers)
    }

    // Fit bounds to show all markers
    const bounds = new window.google.maps.LatLngBounds()
    roadies.forEach((roadie) => {
      bounds.extend({ lat: roadie.latitude, lng: roadie.longitude })
    })
    map.fitBounds(bounds)
  }, [map, roadies])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}

      {selectedRoadie && (
        <Card className="absolute bottom-4 left-4 right-4 p-4 shadow-lg md:left-auto md:w-80">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedRoadie.name}</h3>
                <Badge
                  variant={selectedRoadie.subscription_status === "active" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {selectedRoadie.subscription_status}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedRoadie(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{selectedRoadie.phone}</span>
              </div>

              <div className="flex items-start gap-2 text-muted-foreground">
                <Wrench className="h-4 w-4 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {selectedRoadie.services.map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last update: {new Date(selectedRoadie.last_update).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
