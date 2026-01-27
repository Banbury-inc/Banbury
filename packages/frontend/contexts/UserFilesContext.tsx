import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef, useMemo } from 'react'
import { ApiService } from '../../backend/api/apiService'

interface FileData {
  file_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  date_uploaded: string
  date_modified: string
  s3_url: string
  device_name: string
}

interface UserFilesContextType {
  files: FileData[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  initialized: boolean
}

const UserFilesContext = createContext<UserFilesContextType | undefined>(undefined)

interface UserFilesProviderProps {
  children: ReactNode
  username?: string
}

export function UserFilesProvider({ children, username: usernameProp }: UserFilesProviderProps) {
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const loadingRef = useRef(false)
  const lastFetchTimeRef = useRef<number>(0)
  const filesRef = useRef<FileData[]>([])
  const initializedRef = useRef(false)
  const previousUsernameRef = useRef<string | null>(null)
  
  // Cache duration in milliseconds (3 seconds)
  const CACHE_DURATION = 3000

  // Memoize username to avoid unnecessary re-renders and API calls
  const username = useMemo(() => {
    return usernameProp || (typeof window !== 'undefined' ? localStorage.getItem('username') : null)
  }, [usernameProp])

  // Keep refs in sync with state
  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(() => {
    initializedRef.current = initialized
  }, [initialized])

  const fetchFiles = useCallback(async (force = false) => {
    if (!username) {
      setInitialized(true)
      initializedRef.current = true
      return
    }

    // If we have cached data and it's recent, don't refetch unless forced
    const now = Date.now()
    if (!force && initializedRef.current && filesRef.current.length > 0 && (now - lastFetchTimeRef.current) < CACHE_DURATION) {
      return
    }

    // If already loading, don't start another request (use ref to avoid race conditions)
    if (loadingRef.current) return
    loadingRef.current = true

    setLoading(true)
    setError(null)

    try {
      const result = await ApiService.Files.getUserFiles(username)
      
      if (result.success) {
        setFiles(result.files)
        lastFetchTimeRef.current = Date.now()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
      loadingRef.current = false
      setInitialized(true)
      initializedRef.current = true
    }
  }, [username])

  // Fetch files only when username actually changes
  useEffect(() => {
    // Only fetch if username has changed
    if (username !== previousUsernameRef.current) {
      previousUsernameRef.current = username
      fetchFiles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]) // fetchFiles is stable and uses username from closure, so we can safely omit it

  const refetch = useCallback(async () => {
    await fetchFiles(true)
  }, [fetchFiles])

  return (
    <UserFilesContext.Provider value={{ files, loading, error, refetch, initialized }}>
      {children}
    </UserFilesContext.Provider>
  )
}

export function useUserFiles() {
  const context = useContext(UserFilesContext)
  if (context === undefined) {
    throw new Error('useUserFiles must be used within a UserFilesProvider')
  }
  return context
}
