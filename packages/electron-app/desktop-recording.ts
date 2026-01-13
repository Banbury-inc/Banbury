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

// Dynamic import for the SDK (only available in Electron main process)
let RecallAiSdk: any = null

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
    // Still set up IPC handlers so the renderer can get the error
    sdkInitialized = false
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
    RecallAiSdk = require('@recallai/desktop-sdk')
    
    if (!RecallAiSdk) {
      console.error('[Desktop Recording] SDK module loaded but is null/undefined')
      lastInitError = 'SDK module loaded but is null/undefined'
      return false
    }
    
    console.log('[Desktop Recording] SDK module loaded successfully')
    console.log('[Desktop Recording] SDK exports:', Object.keys(RecallAiSdk))
    
    // Check if init function exists
    if (typeof RecallAiSdk.init !== 'function') {
      console.error('[Desktop Recording] SDK does not have an init function. Available methods:', Object.keys(RecallAiSdk))
      // Try checking if SDK is the default export
      if (RecallAiSdk.default && typeof RecallAiSdk.default.init === 'function') {
        console.log('[Desktop Recording] Using default export')
        RecallAiSdk = RecallAiSdk.default
      } else {
        lastInitError = 'SDK does not have an init function'
        return false
      }
    }
    
    const apiUrl = process.env.RECALL_API_URL || 'https://us-west-2.recall.ai'
    
    console.log('[Desktop Recording] Platform:', process.platform)
    console.log('[Desktop Recording] Architecture:', process.arch)
    console.log('[Desktop Recording] Current working directory:', process.cwd())
    console.log('[Desktop Recording] Initializing SDK with API URL:', apiUrl)
    
    // The SDK init is async and can throw - wrap in try/catch
    try {
      await RecallAiSdk.init({
        apiUrl: apiUrl.replace('/api/v1', '') // SDK expects base URL without /api/v1
      })
      console.log('[Desktop Recording] SDK init() completed successfully')
    } catch (initError) {
      console.error('[Desktop Recording] SDK init() failed:', initError)
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
      }
      throw initError
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
                       'error', 'sdk-error', 'initialized']
  
  debugEvents.forEach(eventName => {
    try {
      RecallAiSdk.addEventListener(eventName, (evt: unknown) => {
        console.log(`[Desktop Recording] Event "${eventName}":`, JSON.stringify(evt, null, 2))
      })
    } catch (e) {
      // Some events may not exist in older SDK versions
    }
  })
  
  // Permission granted events
  RecallAiSdk.addEventListener('permissions-granted', (evt: { permission: string }) => {
    console.log('[Desktop Recording] Permission granted:', evt.permission)
    
    switch (evt.permission) {
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
  RecallAiSdk.addEventListener('meeting-detected', (evt: MeetingDetectedEvent) => {
    console.log('[Desktop Recording] Meeting detected:', evt.window)
    console.log('[Desktop Recording] Meeting platform:', evt.window.platform)
    console.log('[Desktop Recording] Meeting title:', evt.window.title)
    console.log('[Desktop Recording] Meeting id:', evt.window.id)
    
    // Add to detected meetings if not already present
    const exists = detectedMeetings.some(m => m.id === evt.window.id)
    if (!exists) {
      detectedMeetings.push(evt.window)
      console.log('[Desktop Recording] Total detected meetings:', detectedMeetings.length)
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:meeting-detected', evt.window)
  })
  
  // Meeting ended event
  RecallAiSdk.addEventListener('meeting-ended', (evt: { window: MeetingWindow }) => {
    console.log('[Desktop Recording] Meeting ended:', evt.window)
    
    // Remove from detected meetings
    detectedMeetings = detectedMeetings.filter(m => m.id !== evt.window.id)
    
    // Stop recording if this meeting was being recorded
    if (recordingStatus.isRecording && recordingStatus.windowId === evt.window.id) {
      recordingStatus = {
        isRecording: false,
        windowId: null,
        startTime: null,
        platform: null
      }
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:meeting-ended', evt.window)
  })
  
  // Recording started event
  RecallAiSdk.addEventListener('recording-started', (evt: RecordingStartedEvent) => {
    console.log('[Desktop Recording] Recording started:', evt)
    
    recordingStatus = {
      isRecording: true,
      windowId: evt.windowId,
      startTime: Date.now(),
      platform: evt.platform
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:recording-started', recordingStatus)
  })
  
  // Recording stopped event
  RecallAiSdk.addEventListener('recording-stopped', (evt: RecordingStoppedEvent) => {
    console.log('[Desktop Recording] Recording stopped:', evt)
    
    recordingStatus = {
      isRecording: false,
      windowId: null,
      startTime: null,
      platform: null
    }
    
    // Notify renderer process
    sendToRenderer('desktop-recording:recording-stopped', evt)
  })
  
  // Recording error event
  RecallAiSdk.addEventListener('recording-error', (evt: { error: string; windowId?: string }) => {
    console.error('[Desktop Recording] Recording error:', evt)
    
    // Notify renderer process
    sendToRenderer('desktop-recording:error', evt)
  })
}

/**
 * Send message to renderer process
 */
function sendToRenderer(channel: string, data: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

/**
 * Start recording a meeting
 */
async function startRecording(windowId: string, uploadToken: string): Promise<{ success: boolean; error?: string }> {
  if (!RecallAiSdk || !sdkInitialized) {
    return { success: false, error: 'SDK not initialized' }
  }
  
  if (recordingStatus.isRecording) {
    return { success: false, error: 'Already recording' }
  }
  
  try {
    console.log('[Desktop Recording] Starting recording for window:', windowId)
    
    RecallAiSdk.startRecording({
      windowId: windowId,
      uploadToken: uploadToken
    })
    
    return { success: true }
  } catch (error) {
    console.error('[Desktop Recording] Failed to start recording:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Stop recording
 */
async function stopRecording(windowId: string): Promise<{ success: boolean; error?: string }> {
  if (!RecallAiSdk || !sdkInitialized) {
    return { success: false, error: 'SDK not initialized' }
  }
  
  if (!recordingStatus.isRecording) {
    return { success: false, error: 'Not recording' }
  }
  
  try {
    console.log('[Desktop Recording] Stopping recording for window:', windowId)
    
    RecallAiSdk.stopRecording({
      windowId: windowId
    })
    
    return { success: true }
  } catch (error) {
    console.error('[Desktop Recording] Failed to stop recording:', error)
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
