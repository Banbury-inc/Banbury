import type { Dispatch, SetStateAction } from 'react'

const minOpacity = 0.25
const maxOpacity = 1

export function clampTemperatureOverlayOpacity(value: number) {
  return Math.min(maxOpacity, Math.max(minOpacity, value))
}

export function handleTemperatureOverlayOpacitySliderChange(
  value: number[],
  setTemperatureOverlayOpacity: Dispatch<SetStateAction<number>>,
) {
  const next = value[0]
  if (next === undefined) return
  setTemperatureOverlayOpacity(clampTemperatureOverlayOpacity(next))
}

export function handleTemperatureForecastBandChange(
  band: string,
  setTemperatureRasterArrayBand: Dispatch<SetStateAction<string>>,
) {
  setTemperatureRasterArrayBand(band)
}
