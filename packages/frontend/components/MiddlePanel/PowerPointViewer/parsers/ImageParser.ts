import { BaseParser } from './BaseParser'
import { emuToPercent } from '../utils/emu-converter'
import type { SlideElement } from '../PowerPointViewer'
import type { Relationship } from '../types/pptx-types'

/**
 * ImageParser - Parses image elements from PPTX slides
 *
 * Handles:
 * - <p:pic> elements (pictures/images)
 * - Position and size transformations
 * - Relationship ID extraction
 * - Image cropping and effects
 */
export class ImageParser extends BaseParser {
  /**
   * Parse all image elements from a slide's shape tree
   */
  public parseImages(
    spTree: Element,
    elementIdPrefix: string = 'image'
  ): Array<{
    element: Omit<SlideElement, 'imageUrl'>
    relationshipId: string
  }> {
    const images: Array<{
      element: Omit<SlideElement, 'imageUrl'>
      relationshipId: string
    }> = []

    try {
      // Get all picture elements (<p:pic>)
      const pics = this.getElements(spTree, 'p:pic')

      for (let i = 0; i < pics.length; i++) {
        const pic = pics[i]
        const result = this.parseImage(pic, `${elementIdPrefix}-${i + 1}`)
        if (result) {
          images.push(result)
        }
      }

      this.debug(`Parsed ${images.length} images`)
    } catch (error) {
      this.error('Error parsing images:', error)
    }

    return images
  }

  /**
   * Parse a single image element (<p:pic>)
   */
  private parseImage(
    pic: Element,
    elementId: string
  ): {
    element: Omit<SlideElement, 'imageUrl'>
    relationshipId: string
  } | null {
    try {
      // Parse transform (position and size)
      const spPr = this.getFirstElement(pic, 'p:spPr')
      if (!spPr) {
        this.warn('No spPr found in picture element')
        return null
      }

      const xfrm = this.getFirstElement(spPr, 'a:xfrm')
      if (!xfrm) {
        this.warn('No transform found in picture element')
        return null
      }

      const off = this.getFirstElement(xfrm, 'a:off')
      const ext = this.getFirstElement(xfrm, 'a:ext')
      if (!off || !ext) {
        this.warn('No offset or extent found in transform')
        return null
      }

      // Get position and size in EMUs
      const xEmu = this.getAttributeNumber(off, 'x', 0)
      const yEmu = this.getAttributeNumber(off, 'y', 0)
      const cxEmu = this.getAttributeNumber(ext, 'cx', 0)
      const cyEmu = this.getAttributeNumber(ext, 'cy', 0)

      // Convert to percentages
      const x = emuToPercent(xEmu, true)
      const y = emuToPercent(yEmu, false)
      const width = emuToPercent(cxEmu, true)
      const height = emuToPercent(cyEmu, false)

      // Get rotation
      const rot = this.getAttributeNumber(xfrm, 'rot', 0)
      const rotation = rot / 60000 // Convert from 1/60000 degrees to degrees

      // Parse image reference (blipFill)
      const blipFill = this.getFirstElement(pic, 'p:blipFill')
      if (!blipFill) {
        this.warn('No blipFill found in picture element')
        return null
      }

      const blip = this.getFirstElement(blipFill, 'a:blip')
      if (!blip) {
        this.warn('No blip found in blipFill')
        return null
      }

      // Get relationship ID for the image
      const relationshipId = this.getAttribute(blip, 'r:embed')
      if (!relationshipId) {
        this.warn('No relationship ID found in blip')
        return null
      }

      // Parse image name (if available)
      const nvPicPr = this.getFirstElement(pic, 'p:nvPicPr')
      const cNvPr = nvPicPr ? this.getFirstElement(nvPicPr, 'p:cNvPr') : null
      const imageName = this.getAttribute(cNvPr, 'name', `Image ${elementId}`)

      this.debug(`Parsed image: ${imageName} at (${x.toFixed(1)}%, ${y.toFixed(1)}%) size ${width.toFixed(1)}% x ${height.toFixed(1)}%`)

      return {
        element: {
          id: elementId,
          type: 'image',
          x,
          y,
          width,
          height,
          rotation: rotation !== 0 ? rotation : undefined,
        },
        relationshipId,
      }
    } catch (error) {
      this.error('Error parsing image element:', error)
      return null
    }
  }

  /**
   * Parse image from blipFill element (used for backgrounds, shape fills, etc.)
   */
  public parseBlipFillImage(blipFill: Element): string | null {
    try {
      const blip = this.getFirstElement(blipFill, 'a:blip')
      if (!blip) return null

      const relationshipId = this.getAttribute(blip, 'r:embed')
      return relationshipId || null
    } catch (error) {
      this.error('Error parsing blipFill image:', error)
      return null
    }
  }

  /**
   * Check if element is a picture
   */
  public static isPicture(element: Element): boolean {
    return element.tagName === 'p:pic' || element.localName === 'pic'
  }
}
