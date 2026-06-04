import type { ExpressionSpecification, RasterLayerSpecification } from 'mapbox-gl'

/**
 * Mapbox Raster MTS temperature walkthrough — see
 * https://docs.mapbox.com/mapbox-tiling-service/examples/raster-mts-basic-recipe/
 *
 * Tileset access depends on your Mapbox token; swap `temperatureRasterArrayTilesetUrl` if you use a custom MTS tileset.
 */
export const temperatureRasterArrayTilesetUrl = 'mapbox://mapbox.gfs-temperature'

/** CF-style name for 2 m temperature in the published GFS temperature recipe */
export const temperatureRasterSourceLayer = '2t'

/** Default forecast band (example recipe uses band id "3") */
export const defaultTemperatureRasterArrayBand = '3'

export const temperatureForecastBandIds = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
] as const

export type TemperatureForecastBandId = (typeof temperatureForecastBandIds)[number]

export const defaultTemperatureOverlayOpacity = 0.72

/** Raw value range for `raster-value` colorization (from Mapbox MTS temperature example) */
export const temperatureRasterColorRange: [number, number] = [204, 323]

/**
 * Color ramp for surface temperature (Mapbox doc example).
 * Mapbox GL paint expressions require literal colors here.
 */
const temperatureRasterColorExpression = [
  'interpolate',
  ['linear'],
  ['raster-value'],
  204,
  '#50509B',
  266,
  '#FAFAA0',
  323,
  '#96053C',
] as const satisfies ExpressionSpecification

export function buildTemperatureLayerPaint({
  opacity,
  rasterArrayBand,
  rasterEmissiveStrength,
}: Readonly<{
  opacity: number
  rasterArrayBand: string
  rasterEmissiveStrength: number
}>): NonNullable<RasterLayerSpecification['paint']> {
  return {
    'raster-color-range': temperatureRasterColorRange,
    'raster-array-band': rasterArrayBand,
    'raster-color': temperatureRasterColorExpression,
    'raster-resampling': 'nearest',
    'raster-opacity': opacity,
    'raster-fade-duration': 0,
    'raster-emissive-strength': rasterEmissiveStrength,
  }
}
