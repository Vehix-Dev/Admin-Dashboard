"use client"

import { useEffect, useState } from "react"
import {
  getCombinedRealtimeLocations,
  type ActiveRiderLocation,
  type RodieLocation,
} from "@/lib/api"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  UserCheck,
  Target,
  Maximize2,
  Minimize2,
  Navigation,
} from "lucide-react"

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
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
const pendingIcon = createMarkerIcon("#F59E0B")
const roadieIcon = createMarkerIcon("#16A34A")

/* ================= MAP STYLES ================= */
const MAP_STYLES = {
  streets: "streets",
  satellite: "satellite",
  hybrid: "hybrid",
  dark: "dark",
}

/* ================= CONTROLS ================= */
const FullscreenControl = () => {
  const map = useMap()
  const [fs, setFs] = useState(false)

  return (
    <button
      onClick={() => {
        const el = map.getContainer()
        !document.fullscreenElement
          ? el.requestFullscreen()
          : document.exitFullscreen()
        setFs(!fs)
      }}
      className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded shadow"
    >
      {fs ? <Minimize2 /> : <Maximize2 />}
    </button>
  )
}

const RecenterControl = ({ center }: { center: [number, number] }) => {
  const map = useMap()
  return (
    <button
      onClick={() => map.flyTo(center, map.getZoom())}
      className="absolute bottom-16 right-4 z-[1000] bg-white p-2 rounded shadow"
    >
      <Target />
    </button>
  )
}

/* ================= MAIN COMPONENT ================= */
export default function LiveServiceMap() {
  const [riders, setRiders] = useState<ActiveRiderLocation[]>([])
  const [roadies, setRoadies] = useState<RodieLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.hybrid)
  const [center, setCenter] = useState<[number, number]>([0.3476, 32.5825])

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
    const i = setInterval(load, 10000)
    return () => clearInterval(i)
  }, [])

  if (loading) {
    return <Skeleton className="h-[80vh] rounded-lg" />
  }

  return (
    <Card className="h-[85vh] relative overflow-hidden">
      {/* MAP STYLE TOGGLE */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded shadow p-2 flex gap-1">
        {Object.entries({
          Streets: MAP_STYLES.streets,
          Satellite: MAP_STYLES.satellite,
          Hybrid: MAP_STYLES.hybrid,
          Dark: MAP_STYLES.dark,
        }).map(([label, value]) => (
          <button
            key={value}
            onClick={() => setMapStyle(value)}
            className={`px-2 py-1 text-xs rounded ${mapStyle === value ? "bg-black text-white" : "bg-gray-100"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        {/* BASE LAYERS */}
        {mapStyle === MAP_STYLES.streets && (
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        )}

        {(mapStyle === MAP_STYLES.satellite ||
          mapStyle === MAP_STYLES.hybrid) && (
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          )}

        {mapStyle === MAP_STYLES.hybrid && (
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            pane="overlayPane"
          />
        )}

        {mapStyle === MAP_STYLES.dark && (
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        )}

        <ZoomControl position="bottomright" />

        {/* RIDER MARKERS (WITH REQUEST DETAILS) */}
        {riders.map(r => (
          <Marker
            key={`rider-${r.request_id}`}
            position={[r.lat, r.lng]}
            icon={r.status?.toLowerCase() === "pending" ? pendingIcon : riderIcon}
          >
            <Popup>
              <div className="min-w-[220px] space-y-1">
                <h3 className="font-semibold text-gray-900">
                  {r.rider_first_name} {r.rider_last_name}
                </h3>
                <p className="text-xs text-gray-600">@{r.rider_username}</p>

                <hr />

                <div className="text-sm">
                  <b>Request ID:</b> {r.request_id}
                </div>
                <div className="text-sm">
                  <b>Service:</b> {r.service_type}
                </div>
                <div className="text-sm">
                  <b>Status:</b> {r.status}
                </div>
                <div className="text-xs text-gray-500">
                  Updated:{" "}
                  {new Date(r.updated_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ROADIE MARKERS */}
        {roadies.map(r => (
          <Marker
            key={`roadie-${r.rodie_id}`}
            position={[r.lat, r.lng]}
            icon={roadieIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold">{r.rodie_username}</h3>
                <p className="text-xs text-gray-500">
                  Provider • Updated{" "}
                  {new Date(r.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        <FullscreenControl />
        <RecenterControl center={center} />
      </MapContainer>
    </Card>
  )
}
