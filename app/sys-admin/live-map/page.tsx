"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getCombinedRealtimeLocations,
  getServices,
  type ActiveRiderLocation,
  type RodieLocation,
  type Service,
} from "@/lib/api"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Target,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react"

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  ZoomControl,
  useMap,
} from "react-leaflet"
import { Icon, type LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"

delete (Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
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
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })

const riderIcon = createMarkerIcon("#2563EB")
const roadieIcon = createMarkerIcon("#16A34A")

const MAP_STYLES = {
  streets: "streets",
  satellite: "satellite",
  hybrid: "hybrid",
  dark: "dark",
} as const

type MapStyle = (typeof MAP_STYLES)[keyof typeof MAP_STYLES]

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || ""
const CARTO_TILE_QUERY = CARTO_API_KEY ? `?api_key=${CARTO_API_KEY}` : ""

type SelectedEntity =
  | { type: "rider"; data: ActiveRiderLocation }
  | { type: "roadie"; data: RodieLocation }

const FullscreenControl = () => {
  const map = useMap()
  const [fs, setFs] = useState(false)

  return (
    <button
      onClick={() => {
        const el = map.getContainer()
        if (!document.fullscreenElement) {
          el.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
        setFs(!fs)
      }}
      className="absolute bottom-4 right-4 z-[1000] bg-card p-2 rounded shadow border border-border text-foreground hover:bg-muted transition-colors"
    >
      {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  )
}

const RecenterControl = ({ center }: { center: LatLngExpression }) => {
  const map = useMap()
  return (
    <button
      onClick={() => map.flyTo(center, map.getZoom())}
      className="absolute bottom-16 right-4 z-[1000] bg-card p-2 rounded shadow border border-border text-foreground hover:bg-muted transition-colors"
    >
      <Target className="h-4 w-4" />
    </button>
  )
}

function InfoCard({
  selected,
  onClose,
}: {
  selected: SelectedEntity
  onClose: () => void
}) {
  if (selected.type === "rider") {
    const r = selected.data
    const roadie = r.roadie_assigned
    return (
      <Card className="absolute bottom-4 left-4 z-[1000] w-[320px] shadow-lg border-border bg-card/95 backdrop-blur">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-600" />
                <h3 className="font-semibold text-foreground">Rider</h3>
              </div>
              <p className="text-sm font-medium mt-1">
                {r.rider_first_name} {r.rider_last_name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">ID: {r.rider_external_id || r.rider_id}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm space-y-1.5 border-t pt-2">
            <p><span className="text-muted-foreground">Contact:</span> {r.rider_phone || "—"}</p>
            <p><span className="text-muted-foreground">Service:</span> {r.service_type}</p>
            <p>
              <span className="text-muted-foreground">Roadie:</span>{" "}
              {roadie
                ? `${roadie.rodie_first_name || ""} ${roadie.rodie_last_name || ""}`.trim() ||
                  roadie.rodie_username ||
                  "Assigned"
                : "Unassigned"}
            </p>
            <p><span className="text-muted-foreground">Time elapsed:</span> {r.time_elapsed || "—"}</p>
            <Badge variant="outline" className="text-[10px]">{r.current_service_status}</Badge>
          </div>
        </div>
      </Card>
    )
  }

  const r = selected.data
  const rider = r.assigned_rider
  const services =
    r.activity_status === "ON_JOB" && r.service_type
      ? [r.service_type]
      : r.service_types?.length
        ? r.service_types
        : []

  return (
    <Card className="absolute bottom-4 left-4 z-[1000] w-[320px] shadow-lg border-border bg-card/95 backdrop-blur">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-600" />
              <h3 className="font-semibold text-foreground">Roadie</h3>
            </div>
            <p className="text-sm font-medium mt-1">
              {r.rodie_first_name} {r.rodie_last_name}
            </p>
            <p className="text-xs text-muted-foreground font-mono">ID: {r.rodie_external_id || r.rodie_id}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm space-y-1.5 border-t pt-2">
          <p><span className="text-muted-foreground">Contact:</span> {r.rodie_phone || "—"}</p>
          <p>
            <span className="text-muted-foreground">Status:</span>{" "}
            <Badge className={r.activity_status === "ON_JOB" ? "bg-amber-500" : "bg-emerald-500"}>
              {r.activity_status === "ON_JOB" ? "On Job" : "Available"}
            </Badge>
          </p>
          <p>
            <span className="text-muted-foreground">Services:</span>{" "}
            {services.length ? services.join(", ") : "—"}
          </p>
          {r.activity_status === "ON_JOB" && rider && (
            <p>
              <span className="text-muted-foreground">Rider assigned:</span>{" "}
              {`${rider.rider_first_name || ""} ${rider.rider_last_name || ""}`.trim() ||
                rider.rider_username ||
                rider.rider_external_id}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Rating:</span> ⭐ {r.average_rating?.toFixed(1) || "N/A"}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default function LiveServiceMap() {
  const [riders, setRiders] = useState<ActiveRiderLocation[]>([])
  const [roadies, setRoadies] = useState<RodieLocation[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState<MapStyle>(MAP_STYLES.hybrid)
  const [center, setCenter] = useState<[number, number]>([0.3476, 32.5825])
  const [selected, setSelected] = useState<SelectedEntity | null>(null)

  const [serviceTypeFilters, setServiceTypeFilters] = useState<string[]>([])
  const [roadieStatusFilters, setRoadieStatusFilters] = useState<string[]>([])
  const [riderFilters, setRiderFilters] = useState<string[]>([])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const svc = await getServices()
        setServices(svc)
      } catch {
        /* optional metadata */
      }
    }
    loadMeta()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCombinedRealtimeLocations()
        setRiders(data.riders || [])
        setRoadies(data.rodies || [])

        const all = [...(data.riders || []), ...(data.rodies || [])]
        if (all.length > 0) {
          setCenter([
            all.reduce((s, l) => s + l.lat, 0) / all.length,
            all.reduce((s, l) => s + l.lng, 0) / all.length,
          ])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const toggleFilter = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      if (serviceTypeFilters.length && !serviceTypeFilters.includes(r.service_type)) return false
      if (riderFilters.length && !riderFilters.includes(String(r.rider_id))) return false
      return true
    })
  }, [riders, serviceTypeFilters, riderFilters])

  const filteredRoadies = useMemo(() => {
    return roadies.filter((r) => {
      if (roadieStatusFilters.length && !roadieStatusFilters.includes(r.activity_status || "AVAILABLE")) {
        return false
      }
      if (serviceTypeFilters.length) {
        const types =
          r.activity_status === "ON_JOB" && r.service_type
            ? [r.service_type]
            : r.service_types || []
        if (!types.some((t) => serviceTypeFilters.includes(t))) return false
      }
      return true
    })
  }, [roadies, roadieStatusFilters, serviceTypeFilters])

  const connectionLines = useMemo(() => {
    const lines: LatLngExpression[][] = []
    for (const rider of filteredRiders) {
      if (rider.rodie_lat != null && rider.rodie_lng != null) {
        lines.push([
          [rider.lat, rider.lng],
          [rider.rodie_lat, rider.rodie_lng],
        ])
      }
    }
    for (const roadie of filteredRoadies) {
      if (roadie.activity_status === "ON_JOB" && roadie.assigned_rider) {
        const match = filteredRiders.find((r) => r.request_id === roadie.active_request_id)
        if (match) {
          lines.push([
            [roadie.lat, roadie.lng],
            [match.lat, match.lng],
          ])
        }
      }
    }
    return lines
  }, [filteredRiders, filteredRoadies])

  if (loading) {
    return <Skeleton className="h-[80vh] rounded-lg" />
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Live Service Map</h1>
        <p className="text-sm text-muted-foreground">
          Blue markers: riders on active requests. Green markers: online roadies. Updates every 5 seconds.
        </p>
      </div>

      <Card className="p-4 border-border space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Map filters</p>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Service type</p>
            <div className="flex flex-wrap gap-1">
              {services.map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant={serviceTypeFilters.includes(s.name) ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => toggleFilter(s.name, serviceTypeFilters, setServiceTypeFilters)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Roadie status</p>
            <div className="flex flex-wrap gap-1">
              {["AVAILABLE", "ON_JOB"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={roadieStatusFilters.includes(status) ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => toggleFilter(status, roadieStatusFilters, setRoadieStatusFilters)}
                >
                  {status === "ON_JOB" ? "Busy" : "Available"}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1 min-w-[200px]">
            <p className="text-xs text-muted-foreground">Rider (active on map)</p>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {filteredRiders.length === 0 ? (
                <span className="text-xs text-muted-foreground">No active riders</span>
              ) : (
                filteredRiders.map((r) => (
                  <Button
                    key={r.rider_id}
                    size="sm"
                    variant={riderFilters.includes(String(r.rider_id)) ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => toggleFilter(String(r.rider_id), riderFilters, setRiderFilters)}
                  >
                    {r.rider_first_name} {r.rider_last_name?.charAt(0)}.
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
        {(serviceTypeFilters.length > 0 || roadieStatusFilters.length > 0 || riderFilters.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setServiceTypeFilters([])
              setRoadieStatusFilters([])
              setRiderFilters([])
            }}
          >
            Clear all filters
          </Button>
        )}
      </Card>

      <Card className="h-[75vh] relative overflow-hidden border-border">
        <div className="absolute top-4 left-4 z-[1000] bg-card rounded shadow p-2 flex gap-1 border border-border">
          {Object.entries({
            Streets: MAP_STYLES.streets,
            Satellite: MAP_STYLES.satellite,
            Hybrid: MAP_STYLES.hybrid,
            Dark: MAP_STYLES.dark,
          }).map(([label, value]) => (
            <button
              key={value}
              onClick={() => setMapStyle(value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                mapStyle === value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="absolute top-4 right-4 z-[1000] flex gap-2 text-xs">
          <Badge className="bg-blue-600">{filteredRiders.length} Riders</Badge>
          <Badge className="bg-green-600">{filteredRoadies.length} Roadies</Badge>
        </div>

        {selected && <InfoCard selected={selected} onClose={() => setSelected(null)} />}

        <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl={false}>
          {mapStyle === MAP_STYLES.streets && (
            <TileLayer url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_TILE_QUERY}`} />
          )}
          {(mapStyle === MAP_STYLES.satellite || mapStyle === MAP_STYLES.hybrid) && (
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          )}
          {mapStyle === MAP_STYLES.hybrid && (
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              pane="overlayPane"
            />
          )}
          {mapStyle === MAP_STYLES.dark && (
            <TileLayer url={`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${CARTO_TILE_QUERY}`} />
          )}

          <ZoomControl position="bottomright" />

          {connectionLines.map((positions, idx) => (
            <Polyline
              key={`line-${idx}`}
              positions={positions}
              pathOptions={{ color: "#6366f1", weight: 3, dashArray: "8 8", opacity: 0.8 }}
            />
          ))}

          {filteredRiders.map((r) => (
            <Marker
              key={`rider-${r.request_id}`}
              position={[r.lat, r.lng]}
              icon={riderIcon}
              eventHandlers={{
                click: () => setSelected({ type: "rider", data: r }),
              }}
            />
          ))}

          {filteredRoadies.map((r) => (
            <Marker
              key={`roadie-${r.rodie_id}`}
              position={[r.lat, r.lng]}
              icon={roadieIcon}
              eventHandlers={{
                click: () => setSelected({ type: "roadie", data: r }),
              }}
            />
          ))}

          <FullscreenControl />
          <RecenterControl center={center} />
        </MapContainer>
      </Card>
    </div>
  )
}
