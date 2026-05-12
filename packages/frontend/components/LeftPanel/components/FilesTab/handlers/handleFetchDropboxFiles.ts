import Dropbox, { DropboxFile, DropboxFileListResponse } from "../../../../../../backend/api/dropbox/dropbox"

export type DropboxViewMode = 'root' | 'recent' | 'favorites' | 'search' | 'trash'

interface FetchDropboxFilesParams {
  cursor?: string
  viewMode?: DropboxViewMode
  searchQuery?: string
  setIsLoadingMore: (_loading: boolean) => void
  setLoading: (_loading: boolean) => void
  setError: (_error: string | null) => void
  setNextCursor: (_cursor: string | undefined) => void
  setFiles: React.Dispatch<React.SetStateAction<DropboxFile[]>>
  setConnected: (_connected: boolean) => void
  checkConnection: () => void
}

export async function handleFetchDropboxFiles({
  cursor,
  viewMode = 'root',
  searchQuery,
  setIsLoadingMore,
  setLoading,
  setError,
  setNextCursor,
  setFiles,
  setConnected,
  checkConnection,
}: FetchDropboxFilesParams) {
  if (cursor) {
    setIsLoadingMore(true)
  } else {
    setLoading(true)
    setError(null)
    setNextCursor(undefined)
  }

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) throw new Error('No authentication token found')

    let response: DropboxFileListResponse
    switch (viewMode) {
      case 'recent':
        response = await Dropbox.listRecentFiles(100)
        break
      case 'favorites':
        response = await Dropbox.getFavorites()
        break
      case 'search':
        response = searchQuery ? await Dropbox.searchFiles(searchQuery, 50) : { value: [] }
        break
      case 'trash':
        response = await Dropbox.getTrash()
        break
      case 'root':
      default:
        response = await Dropbox.listRootFiles(100, cursor)
        break
    }

    if (response.value) {
      if (cursor) {
        setFiles(prev => [...prev, ...(response.value || [])])
      } else {
        setFiles(response.value || [])
      }

      if (response['@odata.nextLink']) {
        const url = new URL(response['@odata.nextLink'])
        setNextCursor(url.searchParams.get('cursor') || response['@odata.nextLink'])
      } else {
        setNextCursor(undefined)
      }
    }
  } catch (error: any) {
    console.error('Failed to load Dropbox files:', error)

    if (error.message === 'No authentication token found') {
      setError('Not logged in. Please log in to access Dropbox.')
    } else if (error.response?.status === 401) {
      setError('Authentication failed. Please log in again or connect Dropbox.')
      checkConnection()
    } else if (error.response?.status === 403) {
      setError('Access forbidden. Please connect your Dropbox account.')
      setConnected(false)
    } else {
      setError(`Failed to load Dropbox files: ${error.message || 'Unknown error'}`)
    }
  } finally {
    setLoading(false)
    setIsLoadingMore(false)
  }
}
