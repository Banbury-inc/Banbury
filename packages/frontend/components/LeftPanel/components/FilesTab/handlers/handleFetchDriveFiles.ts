import { DriveFile } from "../../../../../../backend/api/drive/drive"
import { ApiService } from "../../../../../../backend/api/apiService"

interface FetchDriveFilesParams {
  pageToken?: string
  setIsLoadingMoreDrive: (loading: boolean) => void
  setDriveLoading: (loading: boolean) => void
  setDriveError: (error: string | null) => void
  setDriveNextPageToken: (token: string | undefined) => void
  setDriveFiles: React.Dispatch<React.SetStateAction<DriveFile[]>>
  setDriveAvailable: (available: boolean) => void
  checkDriveAccess: () => void
}

export async function handleFetchDriveFiles({
  pageToken,
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
    
    // Fetch root-level files with pagination
    const response = await ApiService.Drive.listRootFiles(100, pageToken)
    
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

