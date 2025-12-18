import { DriveFile } from "../../../../../../backend/api/drive/drive"
import { ApiService } from "../../../../../../backend/api/apiService"

export type DriveViewMode = 'my-drive' | 'recent' | 'starred' | 'trash'

interface FetchDriveFilesParams {
  pageToken?: string
  viewMode?: DriveViewMode
  setIsLoadingMoreDrive: (loading: boolean) => void
  setDriveLoading: (loading: boolean) => void
  setDriveError: (error: string | null) => void
  setDriveNextPageToken: (token: string | undefined) => void
  setDriveFiles: React.Dispatch<React.SetStateAction<DriveFile[]>>
  setDriveAvailable: (available: boolean) => void
  checkDriveAccess: () => void
}

function getQueryParamsForMode(viewMode: DriveViewMode): { q: string; orderBy: string } {
  switch (viewMode) {
    case 'recent':
      return { q: 'trashed = false', orderBy: 'modifiedTime desc' }
    case 'starred':
      return { q: 'starred = true and trashed = false', orderBy: 'modifiedTime desc' }
    case 'trash':
      return { q: 'trashed = true', orderBy: 'modifiedTime desc' }
    case 'my-drive':
    default:
      return { q: "'root' in parents and trashed = false", orderBy: 'folder,name' }
  }
}

export async function handleFetchDriveFiles({
  pageToken,
  viewMode = 'my-drive',
  setIsLoadingMoreDrive,
  setDriveLoading,
  setDriveError,
  setDriveNextPageToken,
  setDriveFiles,
  setDriveAvailable,
  checkDriveAccess,
}: FetchDriveFilesParams) {
  // If we're loading more, use different loading state
  if (pageToken) {
    setIsLoadingMoreDrive(true)
  } else {
    setDriveLoading(true)
    setDriveError(null)
    // Reset pagination state when starting fresh
    setDriveNextPageToken(undefined)
  }
  
  try {
    // Debug: Check auth token before making request
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    // Get query params based on the view mode
    const { q, orderBy } = getQueryParamsForMode(viewMode)
    
    // Fetch files with mode-specific query
    const response = await ApiService.Drive.listFiles({
      pageSize: 100,
      pageToken,
      q,
      orderBy,
    })
    
    if (response.files) {
      // If pageToken exists, append to existing files; otherwise replace
      if (pageToken) {
        setDriveFiles(prev => [...prev, ...(response.files || [])])
      } else {
        setDriveFiles(response.files || [])
      }
      
      // Store the next page token for pagination
      setDriveNextPageToken(response.nextPageToken)
    }
  } catch (error: any) {
    console.error('Failed to load Drive files:', error)
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })
    
    // Provide specific error messages
    if (error.message === 'No authentication token found') {
      setDriveError('Not logged in. Please log in to access Google Drive.')
    } else if (error.response?.status === 401) {
      setDriveError('Authentication failed. Please log in again or grant Drive access.')
      // Trigger a re-check of Drive access
      checkDriveAccess()
    } else if (error.response?.status === 403) {
      setDriveError('Access forbidden. Please activate Google Drive permissions.')
      setDriveAvailable(false)
    } else {
      setDriveError(`Failed to load Google Drive files: ${error.message || 'Unknown error'}`)
    }
  } finally {
    setDriveLoading(false)
    setIsLoadingMoreDrive(false)
  }
}

