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
  uploadRecording: (options: { windowId: string }) => void
  pauseRecording: (options: { windowId: string }) => void
  resumeRecording: (options: { windowId: string }) => void
}

// Type guard to check if a value is the SDK interface
function isRecallAiSDK(value: unknown): value is RecallAiSDKInterface {
  return (
    typeof value === 'object' &&
    value !== null &&
    'init' in value &&
    typeof (value as any).init === 'function'
  )
}

// Dynamic import for the SDK (only available in Electron main process)
let RecallAiSdk: RecallAiSDKInterface | null = null

/**
 * Check if the current platform supports the Recall AI Desktop SDK
 * The SDK only supports macOS 13.0+ (Apple Silicon) and Windows 10+ (64-bit)
 */
function isPlatformSupported(): { supported: boolean; reason?: string } {
  const platform = process.platform
  
  // Linux is not supported (including WSL)
  if (platform === 'linux') {
    // Check if running in WSL
    const isWSL = process.env.WSL_DISTRO_NAME || 
                  process.env.WSLENV || 
                  (process.env.PATH?.includes('/mnt/c/') ?? false)
    
    if (isWSL) {
      return { 
        supported: false, 
        reason: 'The Recall AI Desktop SDK does not support WSL (Windows Subsystem for Linux). Please run the Electron app natively on Windows to use desktop meeting detection.' 
      }
    }
    
    return { 
      supported: false, 
      reason: 'The Recall AI Desktop SDK only supports macOS and Windows. Linux is not supported.' 
    }
  }
  
  // macOS is supported (Apple Silicon only, but the SDK handles this check internally)
  if (platform === 'darwin') {
    return { supported: true }
  }
  
  // Windows is supported (64-bit only, but the SDK handles this check internally)
  if (platform === 'win32') {
    return { supported: true }
  }
  
  return { 
    supported: false, 
    reason: `Unsupported platform: ${platform}. The Recall AI Desktop SDK only supports macOS and Windows.` 
  }
}

/**
 * Initialize the Recall AI Desktop Recording SDK
 */
export async function initDesktopRecording(window: BrowserWindow): Promise<boolean> {
  mainWindow = window
  
  // Check platform support first
  const platformCheck = isPlatformSupported()
  if (!platformCheck.supported) {
    console.warn('[Desktop Recording]', platformCheck.reason)
    sdkInitialized = false
    
    // Notify renderer process that desktop recording is not available
    sendToRenderer('desktop-recording:unavailable', {
      reason: 'unsupported_platform',
      platform: process.platform,
      message: platformCheck.reason || 'Desktop recording is not supported on this platform.'
    })
    
    return false
  }
  
  try {
    console.log('[Desktop Recording] Loading @recallai/desktop-sdk...')
    
    // Check if the agent binary exists
    const path = require('path')
    const fs = require('fs')
    const agentPath = path.join(
      process.cwd(), 
      'node_modules', 
      '@recallai', 
      'desktop-sdk', 
      process.platform === 'win32' ? 'agent-windows.exe' : 'agent-macos'
    )
    
    console.log('[Desktop Recording] Looking for agent at:', agentPath)
    
    if (fs.existsSync(agentPath)) {
      console.log('[Desktop Recording] Agent binary found!')
      const stats = fs.statSync(agentPath)
      console.log('[Desktop Recording] Agent size:', stats.size, 'bytes')
    } else {
      console.error('[Desktop Recording] Agent binary NOT FOUND at:', agentPath)
      console.error('[Desktop Recording] This may require running: npm rebuild @recallai/desktop-sdk')
      lastInitError = `Agent binary not found at ${agentPath}. Try running: npm rebuild @recallai/desktop-sdk`
      return false
    }
    
    // Dynamically import the SDK
    const sdkModule = require('@recallai/desktop-sdk') as any
    
    if (!sdkModule) {
      console.error('[Desktop Recording] SDK module loaded but is null/undefined')
      lastInitError = 'SDK module loaded but is null/undefined'
      return false
    }
    
    console.log('[Desktop Recording] SDK module loaded successfully')
    console.log('[Desktop Recording] SDK exports:', Object.keys(sdkModule))
    
    // Check if init function exists directly on the module
    if (isRecallAiSDK(sdkModule)) {
      RecallAiSdk = sdkModule
    } else if (sdkModule.default && isRecallAiSDK(sdkModule.default)) {
      // Try checking if SDK is the default export
      console.log('[Desktop Recording] Using default export')
      RecallAiSdk = sdkModule.default
    } else {
      console.error('[Desktop Recording] SDK does not have an init function. Available methods:', Object.keys(sdkModule))
      lastInitError = 'SDK does not have an init function'
      return false
    }
    
    const apiUrl = process.env.RECALL_API_URL || 'https://us-west-2.recall.ai'
    
    console.log('[Desktop Recording] Platform:', process.platform)
    console.log('[Desktop Recording] Architecture:', process.arch)
    console.log('[Desktop Recording] Current working directory:', process.cwd())
    console.log('[Desktop Recording] Initializing SDK with API URL:', apiUrl)
    
    // The SDK init is async and can throw - wrap in try/catch
    try {
      if (!RecallAiSdk) {
        throw new Error('SDK not loaded')
      }
      await RecallAiSdk.init({
        apiUrl: apiUrl.replace('/api/v1', '') // SDK expects base URL without /api/v1
      })
      console.log('[Desktop Recording] SDK init() completed successfully')
    } catch (initError) {
      console.error('[Desktop Recording] SDK init() failed:', initError)
      sdkInitialized = false
      
      if (initError instanceof Error) {
        // Check for common issues
        if (initError.message.includes("Couldn't launch") || initError.message.includes('agent')) {
          lastInitError = `SDK agent failed to launch. This may be caused by:\n` +
            `1. Antivirus blocking agent-windows.exe - Add an exception\n` +
            `2. Run as Administrator\n` +
            `3. Try: npm rebuild @recallai/desktop-sdk`
        } else {
          lastInitError = initError.message
        }
      } else {
        lastInitError = String(initError)
      }
      
      // Notify renderer process of the error
      sendToRenderer('desktop-recording:unavailable', {
        reason: 'agent_start_failed',
        error: String(initError),
        message: lastInitError || 'The Recall AI desktop agent failed to start. This may be a build/packaging issue.'
      })
      
      return false
    }
    
    // Set up event listeners
    setupEventListeners()
    
    // Request permissions on macOS
    if (process.platform === 'darwin') {
      console.log('[Desktop Recording] Requesting macOS permissions...')
      await requestPermissions()
    } else if (process.platform === 'win32') {
      console.log('[Desktop Recording] Windows detected - permissions granted automatically')
      // On Windows, permissions are typically granted automatically
      permissionStatus = {
        accessibility: true,
        microphone: true,
        screenCapture: true
      }
    }
    
    sdkInitialized = true
    console.log('[Desktop Recording] SDK initialized successfully')
    console.log('[Desktop Recording] Ready to detect meetings from: Zoom, Microsoft Teams, Google Meet (Chrome)')
    
    return true
  } catch (error) {
    console.error('[Desktop Recording] Failed to initialize SDK:', error)
    if (error instanceof Error) {
      console.error('[Desktop Recording] Error message:', error.message)
      console.error('[Desktop Recording] Error stack:', error.stack)
      if (!lastInitError) {
        lastInitError = error.message
      }
    } else {
      lastInitError = String(error)
    }
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
    console.error('[Desktop Recording] Cannot set up event listeners - SDK not loaded')
    return
  }
  
  console.log('[Desktop Recording] Setting up event listeners...')
  
  // Log all events for debugging
  const debugEvents = ['permissions-granted', 'meeting-detected', 'meeting-ended', 
                       'recording-started', 'recording-stopped', 'recording-error',
                       'error', 'sdk-error', 'initialized',
                       'upload-started', 'upload-progress', 'upload-complete', 'upload-error',
                       'uploading', 'upload-failed',
                       'transcript.data', 'transcript.partial_data', 'transcript-data', 'transcript-partial-data']
  
  debugEvents.forEach(eventName => {
    try {
      if (RecallAiSdk) {
        RecallAiSdk.addEventListener(eventName, (evt: unknown) => {
          console.log(`[Desktop Recording] Event "${eventName}":`, JSON.stringify(evt, null, 2))
        })
      }
    } catch (e) {
      // Some events may not exist in older SDK versions
    }
  })
  
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
    console.log('[Desktop Recording] Meeting platform:', event.window.platform)
    console.log('[Desktop Recording] Meeting title:', event.window.title)
    console.log('[Desktop Recording] Meeting id:', event.window.id)
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
  
  // Upload events - these fire after recording stops
  RecallAiSdk.addEventListener('upload-started', (evt: unknown) => {
    console.log('[Desktop Recording] *** UPLOAD STARTED ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:upload-started', evt as any)
  })
  
  RecallAiSdk.addEventListener('upload-progress', (evt: unknown) => {
    const progress = evt as { progress?: number }
    console.log('[Desktop Recording] Upload progress:', progress.progress || JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:upload-progress', evt as any)
  })
  
  RecallAiSdk.addEventListener('upload-complete', (evt: unknown) => {
    console.log('[Desktop Recording] *** UPLOAD COMPLETE ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:upload-complete', evt as any)
  })
  
  RecallAiSdk.addEventListener('upload-error', (evt: unknown) => {
    console.error('[Desktop Recording] *** UPLOAD ERROR ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:error', { error: `Upload failed: ${JSON.stringify(evt)}` })
  })
  
  // Also listen for uploading event (alternative name)
  RecallAiSdk.addEventListener('uploading', (evt: unknown) => {
    console.log('[Desktop Recording] *** UPLOADING ***:', JSON.stringify(evt, null, 2))
  })
  
  // SDK error event
  RecallAiSdk.addEventListener('error', (evt: unknown) => {
    console.error('[Desktop Recording] *** SDK ERROR ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:error', { error: `SDK error: ${JSON.stringify(evt)}` })
  })
  
  // Real-time transcript events - these come from AssemblyAI during recording
  RecallAiSdk.addEventListener('transcript.data', (evt: unknown) => {
    console.log('[Desktop Recording] *** TRANSCRIPT DATA ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:transcript-data', evt as any)
  })
  
  RecallAiSdk.addEventListener('transcript.partial_data', (evt: unknown) => {
    console.log('[Desktop Recording] Transcript partial data:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:transcript-partial', evt as any)
  })
  
  // Alternative event names (hyphenated versions)
  RecallAiSdk.addEventListener('transcript-data', (evt: unknown) => {
    console.log('[Desktop Recording] *** TRANSCRIPT-DATA ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:transcript-data', evt as any)
  })
  
  RecallAiSdk.addEventListener('transcript-partial-data', (evt: unknown) => {
    console.log('[Desktop Recording] Transcript-partial-data:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:transcript-partial', evt as any)
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
    console.log('[Desktop Recording] Upload token received:', uploadToken ? `${uploadToken.substring(0, 20)}...` : 'MISSING!')
    console.log('[Desktop Recording] Upload token length:', uploadToken?.length || 0)
    
    if (!uploadToken) {
      console.error('[Desktop Recording] ERROR: No upload token provided!')
      return { success: false, error: 'No upload token provided' }
    }
    
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
    console.log('[Desktop Recording] About to call RecallAiSdk.stopRecording...')
    console.log('[Desktop Recording] Recording duration:', recordingStatus.startTime ? `${Math.round((Date.now() - recordingStatus.startTime) / 1000)}s` : 'unknown')
    
    // Step 1: Stop the recording
    const stopResult = RecallAiSdk.stopRecording({
      windowId: actualWindowId
    })
    
    console.log('[Desktop Recording] SDK stopRecording returned:', stopResult)
    console.log('[Desktop Recording] Recording stopped, now uploading...')
    
    // Step 2: Upload the recording - THIS IS THE KEY FIX!
    // The SDK has a separate uploadRecording method that must be called after stopRecording
    console.log('[Desktop Recording] Calling SDK uploadRecording for window:', actualWindowId)
    
    try {
      RecallAiSdk.uploadRecording({
        windowId: actualWindowId
      })
      console.log('[Desktop Recording] SDK uploadRecording called successfully - upload should start now')
    } catch (uploadError) {
      console.error('[Desktop Recording] Failed to call uploadRecording:', uploadError)
      // Continue anyway, maybe it auto-uploads in some cases
    }
    
    // Keep recording status for a moment to track upload state
    const previousWindowId = recordingStatus.windowId
    
    // Update status to indicate we're now uploading, not recording
    recordingStatus = {
      isRecording: false,
      windowId: previousWindowId, // Keep window ID for upload tracking
      startTime: null,
      platform: recordingStatus.platform
    }
    
    // Notify renderer that recording stopped - upload starting
    sendToRenderer('desktop-recording:recording-stopped', { 
      windowId: actualWindowId, 
      reason: 'manual',
      message: 'Recording stopped, upload started'
    })
    
    // Log a message after a short delay to help debug if upload events fire
    setTimeout(() => {
      console.log('[Desktop Recording] 3 seconds after uploadRecording - checking if upload started...')
    }, 3000)
    
    setTimeout(() => {
      console.log('[Desktop Recording] 10 seconds after uploadRecording - upload should be in progress')
    }, 10000)
    
    return { success: true }
  } catch (error) {
    console.error('[Desktop Recording] Failed to stop recording:', error)
    console.error('[Desktop Recording] Error details:', error instanceof Error ? error.stack : String(error))
    return { success: false, error: String(error) }
  }
}

// Store platform check result for IPC handlers
let platformCheckResult: { supported: boolean; reason?: string } | null = null
let lastInitError: string | null = null

/**
 * Set up IPC handlers for communication with renderer process
 */
export function setupDesktopRecordingIPC(): void {
  // Perform platform check on setup
  platformCheckResult = isPlatformSupported()
  console.log('[Desktop Recording] Platform check result:', platformCheckResult)
  
  // Get SDK status
  ipcMain.handle('desktop-recording:get-status', async () => {
    const status = {
      initialized: sdkInitialized,
      permissions: permissionStatus,
      recording: recordingStatus,
      detectedMeetings: detectedMeetings,
      platformSupported: platformCheckResult?.supported ?? false,
      platformError: platformCheckResult?.reason,
      lastError: lastInitError,
      debug: {
        platform: process.platform,
        arch: process.arch,
        sdkLoaded: !!RecallAiSdk,
        nodeVersion: process.version
      }
    }
    console.log('[Desktop Recording] Status requested:', JSON.stringify(status, null, 2))
    return status
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
