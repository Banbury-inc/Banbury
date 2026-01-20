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
    
    
    if (fs.existsSync(agentPath)) {
      const stats = fs.statSync(agentPath)
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
    
    // Check if init function exists directly on the module
    if (isRecallAiSDK(sdkModule)) {
      RecallAiSdk = sdkModule
    } else if (sdkModule.default && isRecallAiSDK(sdkModule.default)) {
      // Try checking if SDK is the default export
      RecallAiSdk = sdkModule.default
    } else {
      console.error('[Desktop Recording] SDK does not have an init function. Available methods:', Object.keys(sdkModule))
      lastInitError = 'SDK does not have an init function'
      return false
    }
    
    const apiUrl = process.env.RECALL_API_URL || 'https://us-west-2.recall.ai'
    
    // The SDK init is async and can throw - wrap in try/catch
    try {
      if (!RecallAiSdk) {
        throw new Error('SDK not loaded')
      }
      await RecallAiSdk.init({
        apiUrl: apiUrl.replace('/api/v1', '') // SDK expects base URL without /api/v1
      })
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
      await requestPermissions()
    } else if (process.platform === 'win32') {
      // On Windows, permissions are typically granted automatically
      permissionStatus = {
        accessibility: true,
        microphone: true,
        screenCapture: true
      }
    }
    
    sdkInitialized = true
    
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
        })
      }
    } catch (e) {
      // Some events may not exist in older SDK versions
    }
  })
  
  // Permission granted events
  RecallAiSdk.addEventListener('permissions-granted', (evt: unknown) => {
    const event = evt as { permission: string }
    
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
    
    // Add to detected meetings if not already present
    const exists = detectedMeetings.some(m => m.id === event.window.id)
    if (!exists) {
      detectedMeetings.push(event.window)
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:meeting-detected', event.window)
  })
  
  // Meeting ended event
  RecallAiSdk.addEventListener('meeting-ended', (evt: unknown) => {
    const event = evt as { window: MeetingWindow }
    
    // Remove from detected meetings
    const beforeCount = detectedMeetings.length
    detectedMeetings = detectedMeetings.filter(m => m.id !== event.window.id)
    const afterCount = detectedMeetings.length
    
    // Stop recording if this meeting was being recorded
    if (recordingStatus.isRecording && recordingStatus.windowId === event.window.id) {
      recordingStatus = {
        isRecording: false,
        windowId: null,
        startTime: null,
        platform: null
      }
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:meeting-ended', event.window)
  })
  
  // Recording started event
  RecallAiSdk.addEventListener('recording-started', (evt: unknown) => {
    const event = evt as RecordingStartedEvent
    
    // Update recording status, but preserve windowId/platform if SDK event doesn't provide them
    // This handles cases where the SDK event might not include these fields
    recordingStatus = {
      isRecording: true,
      windowId: event.windowId || recordingStatus.windowId,
      startTime: recordingStatus.startTime || Date.now(),
      platform: event.platform || recordingStatus.platform
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:recording-started', recordingStatus)
  })
  
  // Recording stopped event
  RecallAiSdk.addEventListener('recording-stopped', (evt: unknown) => {
    const event = evt as RecordingStoppedEvent
    
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
    sendToRenderer('desktop-recording:upload-started', evt as any)
  })
  
  RecallAiSdk.addEventListener('upload-progress', (evt: unknown) => {
    const progress = evt as { progress?: number }
    sendToRenderer('desktop-recording:upload-progress', evt as any)
  })
  
  RecallAiSdk.addEventListener('upload-complete', (evt: unknown) => {
    sendToRenderer('desktop-recording:upload-complete', evt as any)
  })
  
  RecallAiSdk.addEventListener('upload-error', (evt: unknown) => {
    console.error('[Desktop Recording] *** UPLOAD ERROR ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:error', { error: `Upload failed: ${JSON.stringify(evt)}` })
  })
  
  // Also listen for uploading event (alternative name)
  RecallAiSdk.addEventListener('uploading', (evt: unknown) => {
  })
  
  // SDK error event
  RecallAiSdk.addEventListener('error', (evt: unknown) => {
    console.error('[Desktop Recording] *** SDK ERROR ***:', JSON.stringify(evt, null, 2))
    sendToRenderer('desktop-recording:error', { error: `SDK error: ${JSON.stringify(evt)}` })
  })
  
  // Real-time transcript events - these come from AssemblyAI during recording
  RecallAiSdk.addEventListener('transcript.data', (evt: unknown) => {
    sendToRenderer('desktop-recording:transcript-data', evt as any)
  })
  
  RecallAiSdk.addEventListener('transcript.partial_data', (evt: unknown) => {
    sendToRenderer('desktop-recording:transcript-partial', evt as any)
  })
  
  // Alternative event names (hyphenated versions)
  RecallAiSdk.addEventListener('transcript-data', (evt: unknown) => {
    sendToRenderer('desktop-recording:transcript-data', evt as any)
  })
  
  RecallAiSdk.addEventListener('transcript-partial-data', (evt: unknown) => {
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
    
    if (!uploadToken) {
      console.error('[Desktop Recording] ERROR: No upload token provided!')
      return { success: false, error: 'No upload token provided' }
    }
    
    // Find the platform for this window from detected meetings
    const meeting = detectedMeetings.find(m => m.id === windowId)
    const platform = meeting?.platform || 'unknown'
    
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
    // Step 1: Stop the recording
    const stopResult = RecallAiSdk.stopRecording({
      windowId: actualWindowId
    })
    
    // Step 2: Upload the recording - THIS IS THE KEY FIX!
    // The SDK has a separate uploadRecording method that must be called after stopRecording
    try {
      RecallAiSdk.uploadRecording({
        windowId: actualWindowId
      })
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
}
