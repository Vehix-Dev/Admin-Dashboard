declare module "leaflet-heatmap" {
  import type { Layer, Map } from "leaflet"

  interface HeatmapOverlayOptions {
    radius?: number
    maxOpacity?: number
    scaleRadius?: boolean
    useLocalExtrema?: boolean
    latField?: string
    lngField?: string
    valueField?: string
    gradient?: Record<number, string>
    [key: string]: any
  }

  interface HeatmapDataPoint {
    lat: number
    lng: number
    value: number
    radius?: number
  }

  interface HeatmapData {
    max: number
    min?: number
    data: HeatmapDataPoint[]
  }

  class HeatmapOverlay extends Layer {
    constructor(config?: HeatmapOverlayOptions)
    setData(data: HeatmapData): void
    addTo(map: Map): this
    remove(): this
  }

  const HeatmapOverlayExport: typeof HeatmapOverlay
  export default HeatmapOverlayExport
}
