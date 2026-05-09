"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface HeatmapPoint {
  lat: number
  lng: number
  intensity?: number
  timestamp?: string
}

interface ActivityHeatmapProps {
  points: HeatmapPoint[]
  center?: [number, number]
  zoom?: number
  mapStyle?: "light" | "dark"
  height?: string
  title?: string
}

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
  iconUrl: "/leaflet/images/marker-icon.png",
  shadowUrl: "/leaflet/images/marker-shadow.png",
})

const HeatmapLayer = ({ points }: { points: HeatmapPoint[] }) => {
  const map = useMap()
  const heatmapRef = useRef<any>(null)
  const [HeatmapOverlayClass, setHeatmapOverlayClass] = useState<any>(null)

  useEffect(() => {
    let active = true
    import("leaflet-heatmap")
      .then((module) => {
        const HeatmapOverlay = (module as any).default ?? (module as any).HeatmapOverlay ?? module
        if (active) {
          setHeatmapOverlayClass(HeatmapOverlay)
        }
      })
      .catch((error) => {
        console.error("Failed to load Leaflet heatmap plugin", error)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!map || points.length === 0 || !HeatmapOverlayClass) return

    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current)
      heatmapRef.current = null
    }

    const heatData = points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      value: p.intensity ?? 1,
      radius: 25,
    }))

    const heatmapLayer = new HeatmapOverlayClass({
      radius: 35,
      maxOpacity: 0.85,
      scaleRadius: true,
      useLocalExtrema: false,
      latField: "lat",
      lngField: "lng",
      valueField: "value",
      gradient: {
        0.0: "#003300",
        0.25: "#008000",
        0.5: "#FFFF00",
        0.75: "#FF8C00",
        1.0: "#FF0000",
      },
    })

    heatmapLayer.setData({ max: 1, data: heatData })
    heatmapLayer.addTo(map)
    heatmapRef.current = heatmapLayer

    return () => {
      if (heatmapRef.current && map) {
        try {
          map.removeLayer(heatmapRef.current)
        } catch (e) {
          // Layer already removed
        }
        heatmapRef.current = null
      }
    }
  }, [points, map, HeatmapOverlayClass])

  return null
}

export function ActivityHeatmap({
  points,
  center = [0.3476, 32.5825],
  zoom = 12,
  mapStyle = "light",
  height = "400px",
  title = "Activity Heatmap"
}: ActivityHeatmapProps) {
  const [displayPoints, setDisplayPoints] = useState<HeatmapPoint[]>([])

  // Calculate intensity based on recency when component mounts or points change
  useEffect(() => {
    if (points.length === 0) {
      setDisplayPoints([])
      return
    }

    const now = new Date().getTime()
    const maxAge = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds

    const withIntensity = points.map(p => {
      let intensity = 0.3 // Base intensity for older points
      
      if (p.timestamp) {
        const pointTime = new Date(p.timestamp).getTime()
        const ageMs = now - pointTime
        
        if (ageMs <= maxAge) {
          // More recent = higher intensity (0.3 to 1.0)
          intensity = 0.3 + (1 - ageMs / maxAge) * 0.7
        }
      } else {
        // No timestamp, use provided intensity or default
        intensity = p.intensity ?? 0.5
      }

      return { ...p, intensity }
    })

    setDisplayPoints(withIntensity)
  }, [points])

  // Calculate bounds from points
  const bounds = displayPoints.length > 0 ? {
    north: Math.max(...displayPoints.map(p => p.lat)),
    south: Math.min(...displayPoints.map(p => p.lat)),
    east: Math.max(...displayPoints.map(p => p.lng)),
    west: Math.min(...displayPoints.map(p => p.lng)),
  } : null

  return (
    <div className="space-y-3">
      {title && (
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {displayPoints.length} activity point{displayPoints.length !== 1 ? 's' : ''} • Intensity increases with recency
          </p>
        </div>
      )}
      
      <div
        className="rounded-lg border border-border overflow-hidden"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={false}
        >
          {mapStyle === "dark" ? (
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          ) : (
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          )}

          <ZoomControl position="bottomright" />
          <HeatmapLayer points={displayPoints} />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-2 text-xs px-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gradient-to-r from-[#003300] to-[#008000] rounded"></div>
          <span className="text-muted-foreground">Old</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gradient-to-r from-[#FFFF00] to-[#FF8C00] rounded"></div>
          <span className="text-muted-foreground">Recent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gradient-to-r from-[#FF8C00] to-[#FF0000] rounded"></div>
          <span className="text-muted-foreground">Latest</span>
        </div>
      </div>
    </div>
  )
}
