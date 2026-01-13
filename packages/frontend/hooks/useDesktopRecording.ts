import { useState, useEffect, useCallback, useRef } from 'react'

// Types matching the preload script
interface MeetingWindow {
  id: string
  platform: string
  title: string
}

interface PermissionStatus {
  accessibility: boolean
  microphone: boolean
  screenCapture: boolean
}

interface RecordingStatus {
  isRecording: boolean
  windowId: string | null
  startTime: number | null
  platform: string | null
}

interface DesktopRecordingStatus {
  initialized: boolean
  permissions: PermissionStatus
  recording: RecordingStatus
  detectedMeetings: MeetingWindow[]
  platformSupported?: boolean
  platformError?: string
  lastError?: string
  debug?: {
    platform: string
    arch: string
    sdkLoaded: boolean
    nodeVersion: string
  }
}

interface UseDesktopRecordingReturn {
  // State
  isDesktop: boolean
  isInitialized: boolean
  isPlatformSupported: boolean
  permissions: PermissionStatus
  recordingStatus: RecordingStatus
  detectedMeetings: MeetingWindow[]
  error: string | null
  
  // Actions
  requestPermissions: () => Promise<void>
  startRecording: (windowId: string, uploadToken: string) => Promise<{ success: boolean; error?: string }>
  stopRecording: (windowId: string) => Promise<{ success: boolean; error?: string }>
  refreshStatus: () => Promise<void>
}

const defaultPermissions: PermissionStatus = {
  accessibility: false,
  microphone: false,
  screenCapture: false
}

const defaultRecordingStatus: RecordingStatus = {
  isRecording: false,
  windowId: null,
  startTime: null,
  platform: null
}

export function useDesktopRecording(): UseDesktopRecordingReturn {
  const [isDesktop, setIsDesktop] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPlatformSupported, setIsPlatformSupported] = useState(true)
  const [permissions, setPermissions] = useState<PermissionStatus>(defaultPermissions)
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(defaultRecordingStatus)
  const [detectedMeetings, setDetectedMeetings] = useState<MeetingWindow[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Keep track of cleanup functions
  const cleanupFnsRef = useRef<(() => void)[]>([])
  
  // Check if we're in Electron desktop environment
  useEffect(() => {
    const checkDesktop = typeof window !== 'undefined' && window.desktopApp?.isDesktop === true
    setIsDesktop(checkDesktop)
    
    if (!checkDesktop) return
    
    // Initialize and set up event listeners
    const initialize = async () => {
      try {
        const desktopRecording = window.desktopApp?.desktopRecording
        if (!desktopRecording) {
          setError('Desktop recording API not available')
          return
        }
        
        // Get initial status
        const status = await desktopRecording.getStatus()
        console.log('[useDesktopRecording] Initial status:', status)
        
        setIsInitialized(status.initialized)
        setPermissions(status.permissions)
        setRecordingStatus(status.recording)
        setDetectedMeetings(status.detectedMeetings)
        
        // Check platform support
        if (status.platformSupported === false) {
          setIsPlatformSupported(false)
          setError(status.platformError || 'Desktop recording is not supported on this platform')
          return // Don't set up event listeners if platform isn't supported
        }
        setIsPlatformSupported(true)
        
        // Check for SDK initialization errors
        if (status.lastError) {
          setError(`SDK initialization error: ${status.lastError}`)
        }
        
        // Log debug info
        if (status.debug) {
          console.log('[useDesktopRecording] Debug info:', status.debug)
        }
        
        // Set up event listeners
        const cleanupMeetingDetected = desktopRecording.onMeetingDetected((meeting) => {
          setDetectedMeetings(prev => {
            const exists = prev.some(m => m.id === meeting.id)
            if (exists) return prev
            return [...prev, meeting]
          })
        })
        cleanupFnsRef.current.push(cleanupMeetingDetected)
        
        const cleanupMeetingEnded = desktopRecording.onMeetingEnded((meeting) => {
          setDetectedMeetings(prev => prev.filter(m => m.id !== meeting.id))
        })
        cleanupFnsRef.current.push(cleanupMeetingEnded)
        
        const cleanupRecordingStarted = desktopRecording.onRecordingStarted((status) => {
          setRecordingStatus(status)
        })
        cleanupFnsRef.current.push(cleanupRecordingStarted)
        
        const cleanupRecordingStopped = desktopRecording.onRecordingStopped(() => {
          setRecordingStatus(defaultRecordingStatus)
        })
        cleanupFnsRef.current.push(cleanupRecordingStopped)
        
        const cleanupPermissionUpdate = desktopRecording.onPermissionUpdate((perms) => {
          setPermissions(perms)
        })
        cleanupFnsRef.current.push(cleanupPermissionUpdate)
        
        const cleanupError = desktopRecording.onError((err) => {
          setError(err.error)
        })
        cleanupFnsRef.current.push(cleanupError)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize desktop recording')
      }
    }
    
    initialize()
    
    // Cleanup on unmount
    return () => {
      cleanupFnsRef.current.forEach(fn => fn())
      cleanupFnsRef.current = []
    }
  }, [])
  
  const requestPermissions = useCallback(async () => {
    if (!isDesktop) return
    
    try {
      const desktopRecording = window.desktopApp?.desktopRecording
      if (!desktopRecording) return
      
      const perms = await desktopRecording.requestPermissions()
      setPermissions(perms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permissions')
    }
  }, [isDesktop])
  
  const startRecording = useCallback(async (windowId: string, uploadToken: string): Promise<{ success: boolean; error?: string }> => {
    if (!isDesktop) return { success: false, error: 'Not in desktop environment' }
    
    try {
      const desktopRecording = window.desktopApp?.desktopRecording
      if (!desktopRecording) return { success: false, error: 'Desktop recording API not available' }
      
      const result = await desktopRecording.startRecording(windowId, uploadToken)
      if (!result.success) {
        setError(result.error || 'Failed to start recording')
      } else {
        setError(null)
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [isDesktop])
  
  const stopRecording = useCallback(async (windowId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isDesktop) return { success: false, error: 'Not in desktop environment' }
    
    try {
      const desktopRecording = window.desktopApp?.desktopRecording
      if (!desktopRecording) return { success: false, error: 'Desktop recording API not available' }
      
      const result = await desktopRecording.stopRecording(windowId)
      if (!result.success) {
        setError(result.error || 'Failed to stop recording')
      } else {
        setError(null)
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop recording'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [isDesktop])
  
  const refreshStatus = useCallback(async () => {
    if (!isDesktop) return
    
    try {
      const desktopRecording = window.desktopApp?.desktopRecording
      if (!desktopRecording) return
      
      const status = await desktopRecording.getStatus()
      setIsInitialized(status.initialized)
      setPermissions(status.permissions)
      setRecordingStatus(status.recording)
      setDetectedMeetings(status.detectedMeetings)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh status')
    }
  }, [isDesktop])
  
  return {
    isDesktop,
    isInitialized,
    isPlatformSupported,
    permissions,
    recordingStatus,
    detectedMeetings,
    error,
    requestPermissions,
    startRecording,
    stopRecording,
    refreshStatus
  }
}
