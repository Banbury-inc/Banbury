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

    console.log(`[downloadFromContainer] Fetching metadata for file ${fileId}`)

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
      console.log(`[downloadFromContainer] Trying endpoint: ${endpoint}`)
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
          console.log(`[downloadFromContainer] Success with endpoint: ${endpoint}`)
          break
        } else {
          const errorText = await response.text()
          lastError = `${response.status}: ${errorText}`
          console.log(`[downloadFromContainer] Endpoint ${endpoint} failed: ${lastError}`)
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        console.log(`[downloadFromContainer] Endpoint ${endpoint} threw error: ${lastError}`)
      }
    }

    if (!metadataResponse) {
      console.error(`[downloadFromContainer] All metadata endpoints failed. Last error: ${lastError}`)
      throw new Error(`Failed to fetch file metadata: ${lastError}`)
    }

    const metadata = await metadataResponse.json()
    console.log(`[downloadFromContainer] File metadata:`, metadata)

    // Download file content using direct API call - try multiple endpoints
    console.log(`[downloadFromContainer] Downloading file content for ${fileId}`)
    
    const downloadEndpoints = [
      `${baseUrl}/beta/files/${fileId}/download`,
      `${baseUrl}/files/${fileId}/download`,
      `${baseUrl}/beta/files/${fileId}/content`,
      `${baseUrl}/files/${fileId}/content`
    ]

    let downloadResponse: Response | null = null
    let downloadError: string = ''

    for (const endpoint of downloadEndpoints) {
      console.log(`[downloadFromContainer] Trying download endpoint: ${endpoint}`)
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
          console.log(`[downloadFromContainer] Download success with endpoint: ${endpoint}`)
          break
        } else {
          const errorText = await response.text()
          downloadError = `${response.status}: ${errorText}`
          console.log(`[downloadFromContainer] Download endpoint ${endpoint} failed: ${downloadError}`)
        }
      } catch (error) {
        downloadError = error instanceof Error ? error.message : String(error)
        console.log(`[downloadFromContainer] Download endpoint ${endpoint} threw error: ${downloadError}`)
      }
    }

    if (!downloadResponse) {
      console.error(`[downloadFromContainer] All download endpoints failed. Last error: ${downloadError}`)
      throw new Error(`Failed to download file: ${downloadError}`)
    }

    // Convert response to Blob
    const arrayBuffer = await downloadResponse.arrayBuffer()
    const blob = new Blob([arrayBuffer])
    console.log(`[downloadFromContainer] Downloaded ${blob.size} bytes`)

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
