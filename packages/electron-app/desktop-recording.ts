/**
 * Desktop Recording Module for Electron
 * 
 * Integrates Recall AI's Desktop Recording SDK to enable meeting recording
 * without requiring an AI bot to join the meeting.
 */

import { ipcMain, BrowserWindow } from 'electron'

// Types for the Desktop Recording SDK
interface RecallSDKConfig {
  apiUrl: string
}


interface MeetingWindow {
  id: string
  platform: string
  title: string
}

interface MeetingDetectedEvent {
  window: MeetingWindow
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

interface RecordingStartedEvent {
  windowId: string
  platform: string
}

interface RecordingStoppedEvent {
  windowId: string
  reason: string
}

// SDK state
let sdkInitialized = false
let permissionStatus: PermissionStatus = {
  accessibility: false,
  microphone: false,
  screenCapture: false
}
let recordingStatus: RecordingStatus = {
  isRecording: false,
  windowId: null,
  startTime: null,
  platform: null
}
let detectedMeetings: MeetingWindow[] = []
let mainWindow: BrowserWindow | null = null

// Recall AI SDK interface (dynamically imported)
interface RecallAiSDKInterface {
  init: (config: RecallSDKConfig) => Promise<void>
  addEventListener: (event: string, callback: (evt: unknown) => void) => void
  requestPermission: (permission: string) => void
  startRecording: (options: { windowId: string; uploadToken: string }) => void
  stopRecording: (options: { windowId: string }) => void
}

// Dynamic import for the SDK (only available in Electron main process)
let RecallAiSdk: RecallAiSDKInterface | null = null

/**
 * Initialize the Recall AI Desktop Recording SDK
 */
export async function initDesktopRecording(window: BrowserWindow): Promise<boolean> {
  mainWindow = window
  
  // Check if platform is supported (Desktop SDK only supports Windows and macOS)
  const supportedPlatforms = ['darwin', 'win32']
  if (!supportedPlatforms.includes(process.platform)) {
    console.warn(`[Desktop Recording] Platform '${process.platform}' is not supported by the Desktop SDK.`)
    console.warn('[Desktop Recording] Supported platforms: Windows (win32), macOS (darwin)')
    console.warn('[Desktop Recording] If running on Windows through WSL, please run the Electron app natively on Windows instead.')
    sdkInitialized = false
    
    // Notify renderer process that desktop recording is not available
    sendToRenderer('desktop-recording:unavailable', {
      reason: 'unsupported_platform',
      platform: process.platform,
      message: 'Desktop recording is only available on Windows and macOS. If you are using WSL on Windows, please run the app natively on Windows.'
    })
    
    return false
  }
  
  try {
    // Dynamically import the SDK
    RecallAiSdk = require('@recallai/desktop-sdk')
    
    const apiUrl = process.env.RECALL_API_URL || 'https://us-west-2.recall.ai'
    
    console.log('[Desktop Recording] Initializing SDK with API URL:', apiUrl)
    
    // The init() function returns a Promise - we must await it to catch agent startup failures
    try {
      if (!RecallAiSdk) {
        throw new Error('SDK not loaded')
      }
      await RecallAiSdk.init({
        apiUrl: apiUrl.replace('/api/v1', '') // SDK expects base URL without /api/v1
      })
    } catch (initError) {
      console.error('[Desktop Recording] SDK init() failed - agent could not start:', initError)
      sdkInitialized = false
      
      // Notify renderer process of the error
      sendToRenderer('desktop-recording:unavailable', {
        reason: 'agent_start_failed',
        error: String(initError),
        message: 'The Recall AI desktop agent failed to start. This may be a build/packaging issue.'
      })
      
      return false
    }
    
    // Set up event listeners
    setupEventListeners()
    
    // Request permissions on macOS
    if (process.platform === 'darwin') {
      await requestPermissions()
    } else {
      // On Windows, permissions are typically granted
      permissionStatus = {
        accessibility: true,
        microphone: true,
        screenCapture: true
      }
    }
    
    sdkInitialized = true
    console.log('[Desktop Recording] SDK initialized successfully')
    
    return true
  } catch (error) {
    console.error('[Desktop Recording] Failed to initialize SDK:', error)
    sdkInitialized = false
    
    // Notify renderer process of the error
    sendToRenderer('desktop-recording:unavailable', {
      reason: 'init_failed',
      error: String(error),
      message: 'Failed to initialize desktop recording SDK'
    })
    
    return false
  }
}

/**
 * Request required permissions on macOS
 */
async function requestPermissions(): Promise<void> {
  if (!RecallAiSdk) return
  
  console.log('[Desktop Recording] Requesting macOS permissions...')
  
  try {
    RecallAiSdk.requestPermission('accessibility')
    RecallAiSdk.requestPermission('microphone')
    RecallAiSdk.requestPermission('screen-capture')
  } catch (error) {
    console.error('[Desktop Recording] Error requesting permissions:', error)
  }
}

/**
 * Set up SDK event listeners
 */
function setupEventListeners(): void {
  if (!RecallAiSdk) {
    return
  }
  
  // Permission granted events
  RecallAiSdk.addEventListener('permissions-granted', (evt: unknown) => {
    const event = evt as { permission: string }
    console.log('[Desktop Recording] Permission granted:', event.permission)
    
    switch (event.permission) {
      case 'accessibility':
        permissionStatus.accessibility = true
        break
      case 'microphone':
        permissionStatus.microphone = true
        break
      case 'screen-capture':
        permissionStatus.screenCapture = true
        break
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:permission-update', permissionStatus)
  })
  
  // Meeting detected event
  RecallAiSdk.addEventListener('meeting-detected', (evt: unknown) => {
    const event = evt as MeetingDetectedEvent
    console.log('[Desktop Recording] Meeting detected event received from SDK:', event.window)
    console.log('[Desktop Recording] Current detected meetings before adding:', detectedMeetings)
    
    // Add to detected meetings if not already present
    const exists = detectedMeetings.some(m => m.id === event.window.id)
    if (!exists) {
      detectedMeetings.push(event.window)
      console.log('[Desktop Recording] Added new meeting. Total meetings:', detectedMeetings.length)
    } else {
      console.log('[Desktop Recording] Meeting already exists in list, skipping')
    }
    
    // Notify renderer process
    console.log('[Desktop Recording] Sending meeting-detected event to renderer:', event.window)
    sendToRenderer('desktop-recording:meeting-detected', event.window)
  })
  
  // Meeting ended event
  RecallAiSdk.addEventListener('meeting-ended', (evt: unknown) => {
    const event = evt as { window: MeetingWindow }
    console.log('[Desktop Recording] Meeting ended event received from SDK:', event.window)
    console.log('[Desktop Recording] Current detected meetings before removal:', detectedMeetings)
    
    // Remove from detected meetings
    const beforeCount = detectedMeetings.length
    detectedMeetings = detectedMeetings.filter(m => m.id !== event.window.id)
    const afterCount = detectedMeetings.length
    
    console.log(`[Desktop Recording] Meetings count changed from ${beforeCount} to ${afterCount}`)
    console.log('[Desktop Recording] Remaining meetings:', detectedMeetings)
    
    // Stop recording if this meeting was being recorded
    if (recordingStatus.isRecording && recordingStatus.windowId === event.window.id) {
      console.log('[Desktop Recording] Stopping recording for ended meeting:', event.window.id)
      recordingStatus = {
        isRecording: false,
        windowId: null,
        startTime: null,
        platform: null
      }
    }
    
    // Notify renderer process
    console.log('[Desktop Recording] Sending meeting-ended event to renderer:', event.window)
    sendToRenderer('desktop-recording:meeting-ended', event.window)
  })
  
  // Recording started event
  RecallAiSdk.addEventListener('recording-started', (evt: unknown) => {
    const event = evt as RecordingStartedEvent
    console.log('[Desktop Recording] Recording started event from SDK:', event)
    console.log('[Desktop Recording] Current recording status before SDK event:', recordingStatus)
    
    // Update recording status, but preserve windowId/platform if SDK event doesn't provide them
    // This handles cases where the SDK event might not include these fields
    recordingStatus = {
      isRecording: true,
      windowId: event.windowId || recordingStatus.windowId,
      startTime: recordingStatus.startTime || Date.now(),
      platform: event.platform || recordingStatus.platform
    }
    
    console.log('[Desktop Recording] Updated recording status after SDK event:', recordingStatus)
    
    // Notify renderer process
    sendToRenderer('desktop-recording:recording-started', recordingStatus)
  })
  
  // Recording stopped event
  RecallAiSdk.addEventListener('recording-stopped', (evt: unknown) => {
    const event = evt as RecordingStoppedEvent
    console.log('[Desktop Recording] Recording stopped:', event)
    
    recordingStatus = {
      isRecording: false,
      windowId: null,
      startTime: null,
      platform: null
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:recording-stopped', event)
  })
  
  // Recording error event
  RecallAiSdk.addEventListener('recording-error', (evt: unknown) => {
    const event = evt as { error: string; windowId?: string }
    console.error('[Desktop Recording] Recording error:', event)
    
    // Notify renderer process
    sendToRenderer('desktop-recording:error', event)
  })
}

// Types for data sent to renderer
type DesktopRecordingEventData = 
  | { reason: string; platform: string; message: string; error?: string }
  | PermissionStatus
  | MeetingWindow
  | RecordingStatus
  | RecordingStoppedEvent
  | { error: string; windowId?: string }

/**
 * Send message to renderer process
 */
function sendToRenderer(channel: string, data: DesktopRecordingEventData): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log(`[Desktop Recording] Sending IPC message on channel: ${channel}`)
    mainWindow.webContents.send(channel, data)
  } else {
    console.warn(`[Desktop Recording] Cannot send IPC message on channel ${channel} - mainWindow is ${mainWindow ? 'destroyed' : 'null'}`)
  }
}

/**
 * Start recording a meeting
 */
async function startRecording(windowId: string, uploadToken: string): Promise<{ success: boolean; error?: string }> {
  if (recordingStatus.isRecording) {
    return { success: false, error: 'Already recording' }
  }
  
  if (!RecallAiSdk || !sdkInitialized) {
    return { success: false, error: 'SDK not initialized' }
  }
  
  try {
    console.log('[Desktop Recording] Starting recording for window:', windowId)
    
    // Find the platform for this window from detected meetings
    const meeting = detectedMeetings.find(m => m.id === windowId)
    const platform = meeting?.platform || 'unknown'
    
    console.log('[Desktop Recording] Found meeting for window:', meeting)
    
    // Set recording status immediately with the windowId and platform we know
    // This ensures we have these values even if the SDK event doesn't provide them
    recordingStatus = {
      isRecording: true,
      windowId: windowId,
      startTime: Date.now(),
      platform: platform
    }
    
    // Notify renderer immediately with the status we set
    sendToRenderer('desktop-recording:recording-started', recordingStatus)
    
    RecallAiSdk.startRecording({
      windowId: windowId,
      uploadToken: uploadToken
    })
    
    console.log('[Desktop Recording] Recording started successfully with status:', recordingStatus)
    
    return { success: true }
  } catch (error) {
    console.error('[Desktop Recording] Failed to start recording:', error)
    // Reset recording status on error
    recordingStatus = {
      isRecording: false,
      windowId: null,
      startTime: null,
      platform: null
    }
    return { success: false, error: String(error) }
  }
}


/**
 * Stop recording
 */
async function stopRecording(windowId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[Desktop Recording] stopRecording called')
  console.log('[Desktop Recording] SDK initialized:', sdkInitialized)
  console.log('[Desktop Recording] Current recording status:', recordingStatus)
  console.log('[Desktop Recording] Requested windowId:', windowId)
  
  if (!RecallAiSdk || !sdkInitialized) {
    console.error('[Desktop Recording] SDK not initialized')
    return { success: false, error: 'SDK not initialized' }
  }
  
  if (!recordingStatus.isRecording) {
    console.error('[Desktop Recording] Not currently recording. Status:', recordingStatus)
    return { success: false, error: 'Not recording' }
  }
  
  // Use the windowId from the recording status if the provided one is invalid
  const actualWindowId = windowId || recordingStatus.windowId
  
  if (!actualWindowId) {
    console.error('[Desktop Recording] No valid windowId available. Provided:', windowId, 'Status:', recordingStatus.windowId)
    return { success: false, error: 'No valid window ID available' }
  }
  
  try {
    console.log('[Desktop Recording] Calling SDK stopRecording for window:', actualWindowId)
    
    RecallAiSdk.stopRecording({
      windowId: actualWindowId
    })
    
    console.log('[Desktop Recording] SDK stopRecording called successfully')
    
    // Update status immediately to prevent double-stop attempts
    recordingStatus = {
      isRecording: false,
      windowId: null,
      startTime: null,
      platform: null
    }
    
    // Notify renderer
    sendToRenderer('desktop-recording:recording-stopped', { windowId: actualWindowId, reason: 'manual' })
    
    return { success: true }
  } catch (error) {
    console.error('[Desktop Recording] Failed to stop recording:', error)
    return { success: false, error: String(error) }
  }
}


/**
 * Set up IPC handlers for communication with renderer process
 */
export function setupDesktopRecordingIPC(): void {
  // Get SDK status
  ipcMain.handle('desktop-recording:get-status', async () => {
    return {
      initialized: sdkInitialized,
      permissions: permissionStatus,
      recording: recordingStatus,
      detectedMeetings: detectedMeetings
    }
  })
  
  // Request permissions
  ipcMain.handle('desktop-recording:request-permissions', async () => {
    if (process.platform === 'darwin') {
      await requestPermissions()
    }
    return permissionStatus
  })
  
  // Start recording
  ipcMain.handle('desktop-recording:start', async (_event, { windowId, uploadToken }: { windowId: string; uploadToken: string }) => {
    return await startRecording(windowId, uploadToken)
  })
  
  // Stop recording
  ipcMain.handle('desktop-recording:stop', async (_event, { windowId }: { windowId: string }) => {
    return await stopRecording(windowId)
  })
  
  // Get detected meetings
  ipcMain.handle('desktop-recording:get-meetings', async () => {
    return detectedMeetings
  })
  
  // Get permission status
  ipcMain.handle('desktop-recording:get-permissions', async () => {
    return permissionStatus
  })
  
  // Get recording status
  ipcMain.handle('desktop-recording:get-recording-status', async () => {
    return recordingStatus
  })
  
  // Handle recording error from renderer
  ipcMain.on('desktop-recording:error', (_event, { error }: { error: string }) => {
    console.error('[Desktop Recording] Recording error:', error)
    
    recordingStatus = {
      isRecording: false,
      windowId: null,
      startTime: null,
      platform: null
    }
    
    sendToRenderer('desktop-recording:error', { error })
  })
  
  console.log('[Desktop Recording] IPC handlers registered')
}

/**
 * Cleanup when app is closing
 */
export function cleanupDesktopRecording(): void {
  if (recordingStatus.isRecording && recordingStatus.windowId) {
    stopRecording(recordingStatus.windowId)
  }
  
  mainWindow = null
  sdkInitialized = false
  detectedMeetings = []
  recordingStatus = {
    isRecording: false,
    windowId: null,
    startTime: null,
    platform: null
  }
  
  console.log('[Desktop Recording] Cleanup complete')
}
