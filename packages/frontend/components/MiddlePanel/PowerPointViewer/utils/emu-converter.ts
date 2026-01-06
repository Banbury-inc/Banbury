/**
 * EMU (English Metric Unit) Converter
 *
 * PPTX files use EMUs for positioning and sizing.
 * 1 inch = 914,400 EMUs
 * Standard PowerPoint slide dimensions: 10" × 7.5"
 */

export const EMUS_PER_INCH = 914400

// Standard PowerPoint slide dimensions in inches
export const SLIDE_WIDTH_INCHES = 10
export const SLIDE_HEIGHT_INCHES = 7.5

/**
 * Convert EMU units to percentage for responsive rendering
 * @param emu - The EMU value to convert
 * @param isWidth - Whether this is a width/x-coordinate (true) or height/y-coordinate (false)
 * @returns Percentage value (0-100)
 */
export function emuToPercent(emu: number, isWidth: boolean): number {
  const inches = emu / EMUS_PER_INCH
  const dimension = isWidth ? SLIDE_WIDTH_INCHES : SLIDE_HEIGHT_INCHES
  return (inches / dimension) * 100
}

/**
 * Convert percentage back to EMU units
 * @param percent - The percentage value (0-100)
 * @param isWidth - Whether this is a width/x-coordinate (true) or height/y-coordinate (false)
 * @returns EMU value
 */
export function percentToEmu(percent: number, isWidth: boolean): number {
  const dimension = isWidth ? SLIDE_WIDTH_INCHES : SLIDE_HEIGHT_INCHES
  const inches = (percent / 100) * dimension
  return Math.round(inches * EMUS_PER_INCH)
}

/**
 * Convert EMU to pixels (for debugging/display purposes)
 * Assumes 96 DPI (standard screen resolution)
 * @param emu - The EMU value to convert
 * @returns Pixel value
 */
export function emuToPixels(emu: number): number {
  const DPI = 96
  return (emu / EMUS_PER_INCH) * DPI
}

/**
 * Parse EMU value from XML attribute
 * @param value - The attribute value (string or number)
 * @returns Parsed EMU value, or 0 if invalid
 */
export function parseEmu(value: string | null | undefined): number {
  if (!value) return 0
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? 0 : parsed
}
