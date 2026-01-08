import JSZip from 'jszip'
import type { Relationship } from '../types/pptx-types'

/**
 * Relationship Resolver - Resolves relationship IDs to target paths
 *
 * PPTX uses relationships to link slides to images, themes, layouts, etc.
 * Relationship files are in _rels folders (e.g., ppt/slides/_rels/slide1.xml.rels)
 *
 * Example relationship:
 * <Relationship Id="rId1" Type="..." Target="../media/image1.png"/>
 */

/**
 * Parse relationships file and return map of ID -> target path
 */
export async function parseRelationships(
  zip: JSZip,
  relsPath: string
): Promise<Map<string, Relationship>> {
  const relationshipsMap = new Map<string, Relationship>()

  try {
    const relsFile = zip.file(relsPath)
    if (!relsFile) {
      console.warn(`[RelationshipResolver] Relationships file not found: ${relsPath}`)
      return relationshipsMap
    }

    const relsXml = await relsFile.async('string')
    const parser = new DOMParser()
    const doc = parser.parseFromString(relsXml, 'application/xml')

    const relationships = doc.getElementsByTagName('Relationship')

    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i]
      const id = rel.getAttribute('Id')
      const type = rel.getAttribute('Type')
      const target = rel.getAttribute('Target')

      if (id && type && target) {
        relationshipsMap.set(id, { id, type, target })
      }
    }
  } catch (error) {
    console.error(`[RelationshipResolver] Error parsing relationships from ${relsPath}:`, error)
  }

  return relationshipsMap
}

/**
 * Resolve a relationship ID to its target path
 * Handles relative paths (../media/image1.png) and converts to absolute
 */
export function resolveRelationshipPath(
  relationshipId: string,
  relationships: Map<string, Relationship>,
  baseDir: string
): string | null {
  const rel = relationships.get(relationshipId)
  if (!rel) {
    console.warn(`[RelationshipResolver] Relationship not found: ${relationshipId}`)
    return null
  }

  // Get target path
  let targetPath = rel.target

  // Handle relative paths
  if (targetPath.startsWith('../')) {
    // Remove ../ and resolve relative to base directory
    targetPath = targetPath.replace(/^\.\.\//, '')

    // Base dir is something like "ppt/slides"
    // Remove last segment to go up one level
    const baseParts = baseDir.split('/')
    baseParts.pop() // Remove last part (e.g., "slides")

    // Add target path
    const absolutePath = [...baseParts, targetPath].join('/')
    return absolutePath
  } else if (targetPath.startsWith('./')) {
    // Current directory reference
    return `${baseDir}/${targetPath.replace(/^\.\//, '')}`
  } else {
    // Absolute path within PPTX
    return `${baseDir}/${targetPath}`
  }
}

/**
 * Extract image from PPTX and convert to base64 data URL
 */
export async function extractImageAsBase64(
  zip: JSZip,
  imagePath: string
): Promise<string | null> {
  try {
    const imageFile = zip.file(imagePath)
    if (!imageFile) {
      console.warn(`[RelationshipResolver] Image file not found: ${imagePath}`)
      return null
    }

    // Read as ArrayBuffer
    const arrayBuffer = await imageFile.async('arraybuffer')

    // Convert to base64
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    // Determine MIME type from file extension
    const extension = imagePath.split('.').pop()?.toLowerCase()
    const mimeType = getMimeType(extension || '')

    // Return data URL
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error(`[RelationshipResolver] Error extracting image from ${imagePath}:`, error)
    return null
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'ico': 'image/x-icon',
  }

  return mimeTypes[extension] || 'image/png'
}

/**
 * Get relationships path for a slide
 * e.g., for slide1.xml -> ppt/slides/_rels/slide1.xml.rels
 */
export function getSlideRelationshipsPath(slideIndex: number): string {
  return `ppt/slides/_rels/slide${slideIndex + 1}.xml.rels`
}

/**
 * Check if relationship is an image
 */
export function isImageRelationship(rel: Relationship): boolean {
  return rel.type.includes('image') ||
         rel.target.match(/\.(png|jpg|jpeg|gif|bmp|svg|webp|tiff?)$/i) !== null
}

/**
 * Get all image relationships from a relationships map
 */
export function getImageRelationships(relationships: Map<string, Relationship>): Relationship[] {
  const imageRels: Relationship[] = []

  for (const rel of relationships.values()) {
    if (isImageRelationship(rel)) {
      imageRels.push(rel)
    }
  }

  return imageRels
}
