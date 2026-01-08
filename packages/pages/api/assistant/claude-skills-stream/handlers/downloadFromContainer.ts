import Anthropic from '@anthropic-ai/sdk'
import type { FileMetadata } from '../types'

/**
 * Download a file from the code execution container using direct API calls
 * Uses fetch instead of SDK methods since beta.files may not be available
 */
export async function downloadFromContainer(
  client: Anthropic,
  fileId: string
): Promise<{ blob: Blob; metadata: FileMetadata }> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    const baseUrl = 'https://api.anthropic.com/v1'
    const betaHeader = 'files-api-2025-04-14'

    // Try different endpoint structures for file metadata
    const possibleEndpoints = [
      `${baseUrl}/beta/files/${fileId}/metadata`,
      `${baseUrl}/files/${fileId}/metadata`,
      `${baseUrl}/beta/files/${fileId}`,
      `${baseUrl}/files/${fileId}`
    ]

    let metadataResponse: Response | null = null
    let lastError: string = ''

    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': betaHeader,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          metadataResponse = response
          break
        } else {
          const errorText = await response.text()
          lastError = `${response.status}: ${errorText}`
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
      }
    }

    if (!metadataResponse) {
      console.error(`[downloadFromContainer] All metadata endpoints failed. Last error: ${lastError}`)
      throw new Error(`Failed to fetch file metadata: ${lastError}`)
    }

    const metadata = await metadataResponse.json()

    // Download file content using direct API call - try multiple endpoints
    const downloadEndpoints = [
      `${baseUrl}/beta/files/${fileId}/download`,
      `${baseUrl}/files/${fileId}/download`,
      `${baseUrl}/beta/files/${fileId}/content`,
      `${baseUrl}/files/${fileId}/content`
    ]

    let downloadResponse: Response | null = null
    let downloadError: string = ''

    for (const endpoint of downloadEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': betaHeader
          }
        })

        if (response.ok) {
          downloadResponse = response
          break
        } else {
          const errorText = await response.text()
          downloadError = `${response.status}: ${errorText}`
        }
      } catch (error) {
        downloadError = error instanceof Error ? error.message : String(error)
      }
    }

    if (!downloadResponse) {
      console.error(`[downloadFromContainer] All download endpoints failed. Last error: ${downloadError}`)
      throw new Error(`Failed to download file: ${downloadError}`)
    }

    // Convert response to Blob
    const arrayBuffer = await downloadResponse.arrayBuffer()
    const blob = new Blob([arrayBuffer])

    return {
      blob,
      metadata: {
        id: fileId,
        filename: metadata.filename || metadata.name || `file_${fileId}`,
        size: metadata.size_bytes || metadata.size || blob.size,
        type: metadata.content_type || metadata.type || 'application/octet-stream'
      }
    }
  } catch (error) {
    console.error('[downloadFromContainer] Failed to download file from container:', error)
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
