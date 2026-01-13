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
 * Initialize the Recall AI Desktop Recording SDK
 */
export async function initDesktopRecording(window: BrowserWindow): Promise<boolean> {
  mainWindow = window
  
  try {
    // Dynamically import the SDK
    RecallAiSdk = require('@recallai/desktop-sdk')
    
    const apiUrl = process.env.RECALL_API_URL || 'https://us-west-2.recall.ai'
    
    console.log('[Desktop Recording] Initializing SDK with API URL:', apiUrl)
    
    RecallAiSdk.init({
      apiUrl: apiUrl.replace('/api/v1', '') // SDK expects base URL without /api/v1
    })
    
    // Set up event listeners
    setupEventListeners()
    
    // Request permissions on macOS
    if (process.platform === 'darwin') {
      await requestPermissions()
    } else {
      // On Windows/Linux, permissions are typically granted
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
  if (!RecallAiSdk) return
  
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
    
    // Add to detected meetings if not already present
    const exists = detectedMeetings.some(m => m.id === evt.window.id)
    if (!exists) {
      detectedMeetings.push(evt.window)
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
