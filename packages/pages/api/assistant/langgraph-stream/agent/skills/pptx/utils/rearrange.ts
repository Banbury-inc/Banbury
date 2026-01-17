import JSZip from 'jszip'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'

/**
 * Rearrange PowerPoint slides based on a sequence of indices.
 * 
 * This module provides functionality to:
 * - Duplicate slides (for repeated slides in sequence)
 * - Delete unwanted slides
 * - Reorder slides to match the desired sequence
 * 
 * Usage:
 *   await rearrangePresentation(templateBuffer, outputBuffer, [0, 34, 34, 50, 52])
 * 
 * This will create a presentation using slides 0, 34 (twice), 50, and 52 from the template.
 */

interface SlideInfo {
  rId: string
  slideIndex: number
  slidePath: string
  relsPath: string
}

/**
 * Parse presentation.xml to extract slide information
 */
async function parsePresentationSlides(zip: JSZip): Promise<SlideInfo[]> {
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string')
  if (!presentationXml) {
    throw new Error('presentation.xml not found in PPTX')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(presentationXml, 'application/xml')
  
  // Use namespace-aware method to find sldIdLst
  const sldIdLst = doc.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/presentationml/2006/main',
    'sldIdLst'
  )[0] || doc.getElementsByTagName('sldIdLst')[0]
  
  if (!sldIdLst) {
    throw new Error('sldIdLst not found in presentation.xml')
  }

  // Find all sldId elements
  const sldIds = sldIdLst.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/presentationml/2006/main',
    'sldId'
  )
  
  // Fallback to non-namespace search if namespace search fails
  const sldIdsList = sldIds.length > 0 
    ? Array.from(sldIds)
    : Array.from(sldIdLst.getElementsByTagName('sldId'))
  
  const slides: SlideInfo[] = []

  // Get the slide path from relationships
  const relsPath = 'ppt/_rels/presentation.xml.rels'
  const relsXml = await zip.file(relsPath)?.async('string')
  if (!relsXml) {
    throw new Error('presentation.xml.rels not found')
  }

  const relsDoc = parser.parseFromString(relsXml, 'application/xml')
  const relationships = relsDoc.getElementsByTagName('Relationship')
  const relMap = new Map<string, string>()
  
  for (let j = 0; j < relationships.length; j++) {
    const rel = relationships[j]
    const id = rel.getAttribute('Id')
    const target = rel.getAttribute('Target')
    if (id && target) {
      relMap.set(id, target)
    }
  }

  for (let i = 0; i < sldIdsList.length; i++) {
    const sldId = sldIdsList[i]
    // Try namespace-aware attribute first, then fallback
    const rId = sldId.getAttributeNS(
      'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'id'
    ) || sldId.getAttribute('r:id') || sldId.getAttribute('id')
    
    if (!rId) continue

    const target = relMap.get(rId)
    if (!target) continue

    let slidePath = target
    // Convert relative path to absolute
    if (slidePath.startsWith('../')) {
      slidePath = slidePath.replace(/^\.\.\//, 'ppt/')
    } else if (!slidePath.startsWith('ppt/')) {
      slidePath = `ppt/${slidePath}`
    }

    const slideNum = slidePath.match(/slide(\d+)\.xml/)?.[1]
    const slideIndex = slideNum ? parseInt(slideNum) - 1 : i
    const slideRelsPath = `ppt/slides/_rels/slide${slideIndex + 1}.xml.rels`
    
    slides.push({
      rId,
      slideIndex,
      slidePath,
      relsPath: slideRelsPath
    })
  }

  return slides
}

/**
 * Get next available relationship ID
 */
function getNextRId(existingRIds: Set<string>): string {
  let rIdNum = 1
  while (existingRIds.has(`rId${rIdNum}`)) {
    rIdNum++
  }
  return `rId${rIdNum}`
}

/**
 * Duplicate a slide in the presentation
 */
async function duplicateSlide(
  zip: JSZip,
  sourceSlideInfo: SlideInfo,
  newSlideIndex: number
): Promise<SlideInfo> {
  const parser = new DOMParser()
  const serializer = new XMLSerializer()

  // Read source slide XML
  const sourceSlideXml = await zip.file(sourceSlideInfo.slidePath)?.async('string')
  if (!sourceSlideXml) {
    throw new Error(`Source slide not found: ${sourceSlideInfo.slidePath}`)
  }

  // Read source slide relationships
  let sourceRelsXml = ''
  const sourceRelsFile = zip.file(sourceSlideInfo.relsPath)
  if (sourceRelsFile) {
    sourceRelsXml = await sourceRelsFile.async('string')
  }

  // Create new slide paths
  const newSlidePath = `ppt/slides/slide${newSlideIndex + 1}.xml`
  const newRelsPath = `ppt/slides/_rels/slide${newSlideIndex + 1}.xml.rels`

  // Parse source slide XML
  const sourceSlideDoc = parser.parseFromString(sourceSlideXml, 'application/xml')
  
  // Copy slide XML (we'll update relationships in it)
  const newSlideDoc = parser.parseFromString(sourceSlideXml, 'application/xml')

  // Parse source relationships
  const sourceRelsDoc = sourceRelsXml 
    ? parser.parseFromString(sourceRelsXml, 'application/xml')
    : null

  // Collect image/media relationships
  const imageRels: Map<string, { type: string; target: string }> = new Map()
  if (sourceRelsDoc) {
    const relationships = sourceRelsDoc.getElementsByTagName('Relationship')
    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i]
      const relId = rel.getAttribute('Id') || ''
      const relType = rel.getAttribute('Type') || ''
      const target = rel.getAttribute('Target') || ''
      
      if (relType.includes('image') || relType.includes('media') || 
          target.match(/\.(png|jpg|jpeg|gif|bmp|svg|webp|tiff?|mp4|mp3|wav)$/i)) {
        imageRels.set(relId, { type: relType, target })
      }
    }
  }

  // Create new relationships document
  const newRelsDoc = parser.parseFromString(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
    'application/xml'
  )
  const newRelsRoot = newRelsDoc.documentElement

  // Get existing relationship IDs from presentation
  const presRelsPath = 'ppt/_rels/presentation.xml.rels'
  const presRelsXml = await zip.file(presRelsPath)?.async('string')
  const existingRIds = new Set<string>()
  if (presRelsXml) {
    const presRelsDoc = parser.parseFromString(presRelsXml, 'application/xml')
    const presRels = presRelsDoc.getElementsByTagName('Relationship')
    for (let i = 0; i < presRels.length; i++) {
      const id = presRels[i].getAttribute('Id')
      if (id) existingRIds.add(id)
    }
  }

  // Map old relationship IDs to new ones
  const relIdMap = new Map<string, string>()

  // Process image/media relationships
  for (const [oldRelId, relInfo] of imageRels.entries()) {
    const newRelId = getNextRId(existingRIds)
    existingRIds.add(newRelId)
    relIdMap.set(oldRelId, newRelId)

    // Add relationship to new slide's rels file
    const relElement = newRelsDoc.createElement('Relationship')
    relElement.setAttribute('Id', newRelId)
    relElement.setAttribute('Type', relInfo.type)
    relElement.setAttribute('Target', relInfo.target)
    newRelsRoot.appendChild(relElement)

    // Copy the media file if it doesn't exist
    let mediaPath = relInfo.target
    if (mediaPath.startsWith('../')) {
      mediaPath = mediaPath.replace(/^\.\.\//, 'ppt/')
    } else if (!mediaPath.startsWith('ppt/')) {
      mediaPath = `ppt/${mediaPath}`
    }

    const sourceMediaFile = zip.file(mediaPath)
    if (sourceMediaFile && !zip.file(mediaPath)) {
      const mediaData = await sourceMediaFile.async('uint8array')
      zip.file(mediaPath, mediaData)
    }
  }

  // Update blip references in slide XML
  // Search for blip elements with embed attributes
  const allElements = newSlideDoc.getElementsByTagName('*')
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i]
    if (el.localName === 'blip' || el.tagName === 'a:blip' || el.tagName === 'blip') {
      // Check for embed attribute in various forms
      const embedAttr = el.getAttributeNS(
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'embed'
      ) || el.getAttribute('r:embed') || el.getAttribute('embed')
      
      if (embedAttr && relIdMap.has(embedAttr)) {
        const newRId = relIdMap.get(embedAttr)!
        // Set attribute in namespace-aware way
        el.setAttributeNS(
          'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
          'r:embed',
          newRId
        )
        // Also update non-namespace version if it exists
        if (el.hasAttribute('r:embed')) {
          el.setAttribute('r:embed', newRId)
        }
        if (el.hasAttribute('embed')) {
          el.setAttribute('embed', newRId)
        }
      }
    }
  }

  // Save new slide XML
  const newSlideXml = serializer.serializeToString(newSlideDoc)
  zip.file(newSlidePath, newSlideXml)

  // Save new relationships XML
  const newRelsXml = serializer.serializeToString(newRelsDoc)
  zip.file(newRelsPath, newRelsXml)

  // Get new relationship ID for presentation
  const newPresRId = getNextRId(existingRIds)

  // Add slide reference to presentation.xml.rels
  if (presRelsXml) {
    const presRelsDoc = parser.parseFromString(presRelsXml, 'application/xml')
    const presRelsRoot = presRelsDoc.documentElement
    
    const newPresRel = presRelsDoc.createElement('Relationship')
    newPresRel.setAttribute('Id', newPresRId)
    newPresRel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide')
    newPresRel.setAttribute('Target', `slides/slide${newSlideIndex + 1}.xml`)
    presRelsRoot.appendChild(newPresRel)

    const updatedPresRelsXml = serializer.serializeToString(presRelsDoc)
    zip.file(presRelsPath, updatedPresRelsXml)
    
    // Update existingRIds for future operations
    existingRIds.add(newPresRId)
  }

  return {
    rId: newPresRId,
    slideIndex: newSlideIndex,
    slidePath: newSlidePath,
    relsPath: newRelsPath
  }
}

/**
 * Delete a slide from the presentation
 */
async function deleteSlide(
  zip: JSZip,
  slideInfo: SlideInfo
): Promise<void> {
  // Delete slide XML file
  zip.remove(slideInfo.slidePath)

  // Delete slide relationships file
  zip.remove(slideInfo.relsPath)

  // Remove from presentation.xml.rels
  const presRelsPath = 'ppt/_rels/presentation.xml.rels'
  const presRelsXml = await zip.file(presRelsPath)?.async('string')
  if (presRelsXml) {
    const parser = new DOMParser()
    const serializer = new XMLSerializer()
    const presRelsDoc = parser.parseFromString(presRelsXml, 'application/xml')
    const relationships = presRelsDoc.getElementsByTagName('Relationship')
    
    for (let i = relationships.length - 1; i >= 0; i--) {
      const rel = relationships[i]
      if (rel.getAttribute('Id') === slideInfo.rId) {
        rel.parentNode?.removeChild(rel)
        break
      }
    }

    const updatedPresRelsXml = serializer.serializeToString(presRelsDoc)
    zip.file(presRelsPath, updatedPresRelsXml)
  }
}

/**
 * Reorder slides in presentation.xml
 */
async function reorderSlides(
  zip: JSZip,
  slideInfos: SlideInfo[]
): Promise<void> {
  const parser = new DOMParser()
  const serializer = new XMLSerializer()

  // Read presentation.xml
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string')
  if (!presentationXml) {
    throw new Error('presentation.xml not found')
  }

  const doc = parser.parseFromString(presentationXml, 'application/xml')
  const pNamespace = 'http://schemas.openxmlformats.org/presentationml/2006/main'
  
  // Use namespace-aware method to find sldIdLst
  const sldIdLst = doc.getElementsByTagNameNS(pNamespace, 'sldIdLst')[0] 
    || doc.getElementsByTagName('sldIdLst')[0]
    || doc.getElementsByTagName('p:sldIdLst')[0]
  
  if (!sldIdLst) {
    throw new Error('sldIdLst not found in presentation.xml')
  }

  // Clear existing slide list
  while (sldIdLst.firstChild) {
    sldIdLst.removeChild(sldIdLst.firstChild)
  }

  // Add slides in new order
  const rNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
  
  for (const slideInfo of slideInfos) {
    // Create sldId element with proper namespace
    const sldId = doc.createElementNS(pNamespace, 'p:sldId')
    sldId.setAttributeNS(rNamespace, 'r:id', slideInfo.rId)
    // Also set as regular attribute for compatibility
    sldId.setAttribute('r:id', slideInfo.rId)
    sldIdLst.appendChild(sldId)
  }

  // Save updated presentation.xml
  const updatedPresentationXml = serializer.serializeToString(doc)
  zip.file('ppt/presentation.xml', updatedPresentationXml)
}

/**
 * Rearrange presentation slides based on a sequence of indices
 * 
 * @param templateBuffer - Buffer containing the template PPTX file
 * @param slideSequence - Array of 0-based slide indices to include (can repeat)
 * @returns Buffer containing the rearranged PPTX file
 */
export async function rearrangePresentation(
  templateBuffer: Buffer | Uint8Array,
  slideSequence: number[]
): Promise<Buffer> {
  // Load template as ZIP
  const zip = await JSZip.loadAsync(templateBuffer)

  // Parse existing slides
  const originalSlides = await parsePresentationSlides(zip)
  const totalSlides = originalSlides.length

  // Validate indices
  for (const idx of slideSequence) {
    if (idx < 0 || idx >= totalSlides) {
      throw new Error(`Slide index ${idx} out of range (0-${totalSlides - 1})`)
    }
  }

  // Track original slides and their duplicates
  const slideMap: number[] = [] // List of actual slide indices for final presentation
  const duplicated: Map<number, number[]> = new Map() // original_idx -> [duplicate_indices]

  // Step 1: DUPLICATE repeated slides
  let nextSlideIndex = totalSlides
  for (let i = 0; i < slideSequence.length; i++) {
    const templateIdx = slideSequence[i]
    const duplicates = duplicated.get(templateIdx)

    if (duplicates && duplicates.length > 0) {
      // Already duplicated this slide, use the duplicate
      const duplicateIdx = duplicates.shift()!
      slideMap.push(duplicateIdx)
    } else if (slideSequence.filter(idx => idx === templateIdx).length > 1) {
      // First occurrence of a repeated slide - create duplicates
      slideMap.push(templateIdx)
      const duplicateIndices: number[] = []
      const count = slideSequence.filter(idx => idx === templateIdx).length - 1

      for (let j = 0; j < count; j++) {
        const newSlideInfo = await duplicateSlide(
          zip,
          originalSlides[templateIdx],
          nextSlideIndex
        )
        duplicateIndices.push(nextSlideIndex)
        originalSlides.push(newSlideInfo)
        nextSlideIndex++
      }
      duplicated.set(templateIdx, duplicateIndices)
    } else {
      // Unique slide, use original
      slideMap.push(templateIdx)
    }
  }

  // Step 2: DELETE unwanted slides (work backwards to avoid index shifting issues)
  const slidesToKeep = new Set(slideMap)
  const slidesToDelete: number[] = []
  for (let i = originalSlides.length - 1; i >= 0; i--) {
    if (!slidesToKeep.has(i)) {
      slidesToDelete.push(i)
    }
  }

  // Sort in descending order to delete from end first
  slidesToDelete.sort((a, b) => b - a)

  // Build index mapping: oldIndex -> newIndex (after deletions)
  const indexMap = new Map<number, number>()
  let deletedCount = 0
  for (let i = 0; i < originalSlides.length; i++) {
    if (slidesToDelete.includes(i)) {
      deletedCount++
      // Don't map deleted indices
    } else {
      indexMap.set(i, i - deletedCount)
    }
  }

  // Delete slides and update slideMap
  for (const idx of slidesToDelete) {
    await deleteSlide(zip, originalSlides[idx])
  }

  // Remove deleted slides from array (in reverse order to maintain indices)
  for (const idx of slidesToDelete) {
    originalSlides.splice(idx, 1)
  }

  // Update slideMap to use new indices
  for (let i = 0; i < slideMap.length; i++) {
    const oldIdx = slideMap[i]
    const newIdx = indexMap.get(oldIdx)
    if (newIdx !== undefined) {
      slideMap[i] = newIdx
    } else {
      throw new Error(`Slide index ${oldIdx} was deleted but is in slideMap`)
    }
  }

  // Step 3: REORDER to final sequence
  const finalSlideInfos: SlideInfo[] = []
  for (const idx of slideMap) {
    finalSlideInfos.push(originalSlides[idx])
  }

  await reorderSlides(zip, finalSlideInfos)

  // Generate output buffer
  const outputBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  return outputBuffer
}

/**
 * Rearrange presentation from file paths (convenience function)
 */
export async function rearrangePresentationFromFiles(
  templatePath: string,
  outputPath: string,
  slideSequence: number[]
): Promise<void> {
  const fs = await import('fs/promises')
  const templateBuffer = await fs.readFile(templatePath)
  const outputBuffer = await rearrangePresentation(templateBuffer, slideSequence)
  await fs.writeFile(outputPath, outputBuffer)
}
