import { OneDriveFile, OneDriveFileListResponse } from "../../../../../../backend/api/onedrive/onedrive"
import OneDrive from "../../../../../../backend/api/onedrive/onedrive"

export type OneDriveViewMode = 'root' | 'recent' | 'favorites' | 'search' | 'trash'

interface FetchOneDriveFilesParams {
  skipToken?: string
  viewMode?: OneDriveViewMode
  searchQuery?: string
  setIsLoadingMore: (loading: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setNextLink: (link: string | undefined) => void
  setFiles: React.Dispatch<React.SetStateAction<OneDriveFile[]>>
  setConnected: (connected: boolean) => void
  checkConnection: () => void
}

export async function handleFetchOneDriveFiles({
  skipToken,
  viewMode = 'root',
  searchQuery,
  setIsLoadingMore,
  setLoading,
  setError,
  setNextLink,
  setFiles,
  setConnected,
  checkConnection,
}: FetchOneDriveFilesParams) {
  // If we're loading more, use different loading state
  if (skipToken) {
    setIsLoadingMore(true)
  } else {
    setLoading(true)
    setError(null)
    setNextLink(undefined)
  }

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

    if (!token) {
      throw new Error('No authentication token found')
    }

    let response: OneDriveFileListResponse

    switch (viewMode) {
      case 'recent':
        response = await OneDrive.listRecentFiles(100)
        break
      case 'favorites':
        response = await OneDrive.getFavorites()
        break
      case 'search':
        if (searchQuery) {
          response = await OneDrive.searchFiles(searchQuery, 50)
        } else {
          response = { value: [] }
        }
        break
      case 'trash':
        response = await OneDrive.getTrash()
        break
      case 'root':
      default:
        response = await OneDrive.listRootFiles(100, skipToken)
        break
    }

    if (response.value) {
      // If skipToken exists, append to existing files; otherwise replace
      if (skipToken) {
        setFiles(prev => [...prev, ...(response.value || [])])
      } else {
        setFiles(response.value || [])
      }

      // Extract skipToken from nextLink if present
      if (response['@odata.nextLink']) {
        const url = new URL(response['@odata.nextLink'])
        const nextSkipToken = url.searchParams.get('skipToken') || response['@odata.nextLink']
        setNextLink(nextSkipToken)
      } else {
        setNextLink(undefined)
      }
    }
  } catch (error: any) {
    console.error('Failed to load OneDrive files:', error)
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })

    if (error.message === 'No authentication token found') {
      setError('Not logged in. Please log in to access OneDrive.')
    } else if (error.response?.status === 401) {
      setError('Authentication failed. Please log in again or connect OneDrive.')
      checkConnection()
    } else if (error.response?.status === 403) {
      setError('Access forbidden. Please connect your OneDrive account.')
      setConnected(false)
    } else {
      setError(`Failed to load OneDrive files: ${error.message || 'Unknown error'}`)
    }
  } finally {
    setLoading(false)
    setIsLoadingMore(false)
  }
}

