"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, CircleMarker, useMap, ZoomControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || ""
const CARTO_TILE_QUERY = CARTO_API_KEY ? `?api_key=${CARTO_API_KEY}` : ""

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

const FitBounds = ({ points }: { points: HeatmapPoint[] }) => {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [points, map])

  return null
}

export function ActivityHeatmap({
  points,
  center = [0.3476, 32.5825],
  zoom = 12,
  mapStyle = "light",
  height = "400px",
  title = "Activity Heatmap",
}: ActivityHeatmapProps) {
  const displayPoints = useMemo(() => {
    const valid = points.filter(
      (p) =>
        p != null &&
        Number.isFinite(Number(p.lat)) &&
        Number.isFinite(Number(p.lng)) &&
        Math.abs(Number(p.lat)) <= 90 &&
        Math.abs(Number(p.lng)) <= 180
    )
    if (valid.length === 0) return []

    const now = Date.now()
    const maxAge = 90 * 24 * 60 * 60 * 1000

    return valid.map((p) => {
      let intensity = p.intensity ?? 0.5
      if (p.timestamp) {
        const ageMs = now - new Date(p.timestamp).getTime()
        if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= maxAge) {
          intensity = 0.3 + (1 - ageMs / maxAge) * 0.7
        }
      }
      return {
        lat: Number(p.lat),
        lng: Number(p.lng),
        intensity: Math.min(1, Math.max(0.2, intensity)),
      }
    })
  }, [points])

  const tileUrl =
    mapStyle === "dark"
      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${CARTO_TILE_QUERY}`
      : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_TILE_QUERY}`

  return (
    <div className="space-y-3">
      {title && (
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {displayPoints.length} location{displayPoints.length !== 1 ? "s" : ""} — brighter = more recent
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden" style={{ height }}>
        {displayPoints.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-muted/30 text-sm text-muted-foreground">
            No location data to display on the heatmap
          </div>
        ) : (
          <MapContainer center={center} zoom={zoom} className="h-full w-full" zoomControl={false}>
            <TileLayer url={tileUrl} />
            <ZoomControl position="bottomright" />
            <FitBounds points={displayPoints} />
            {displayPoints.map((p, i) => (
              <CircleMarker
                key={`${p.lat}-${p.lng}-${i}`}
                center={[p.lat, p.lng]}
                radius={12 + p.intensity * 18}
                pathOptions={{
                  color: "#ea580c",
                  fillColor: p.intensity > 0.7 ? "#dc2626" : p.intensity > 0.4 ? "#f59e0b" : "#22c55e",
                  fillOpacity: 0.35 + p.intensity * 0.35,
                  weight: 1,
                }}
              />
            ))}
          </MapContainer>
        )}
      </div>

      <div className="flex gap-3 text-xs px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500/60" /> Older
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500/70" /> Recent
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500/80" /> Latest
        </span>
      </div>
    </div>
  )
}
