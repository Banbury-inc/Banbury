import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload script for Electron.
 * 
 * This script runs in an isolated context with access to both
 * the DOM and a subset of Node.js APIs. It safely exposes
 * desktop-specific functionality to the web app via contextBridge.
 */

// Types for desktop recording
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
}

// Event listener cleanup functions
type IPCListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => void
const eventListeners: Map<string, IPCListener[]> = new Map()

function addIPCListener<T extends unknown[]>(channel: string, callback: (...args: T) => void): () => void {
  const handler: IPCListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
    callback(...(args as T))
  }
  ipcRenderer.on(channel, handler)
  
  // Track listeners for cleanup
  if (!eventListeners.has(channel)) {
    eventListeners.set(channel, [])
  }
  eventListeners.get(channel)?.push(handler)
  
  // Return cleanup function
  return () => {
    ipcRenderer.removeListener(channel, handler)
    const listeners = eventListeners.get(channel)
    if (listeners) {
      const index = listeners.indexOf(handler)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
}


// Expose a minimal desktop API to the renderer process
contextBridge.exposeInMainWorld('desktopApp', {
  /**
   * Returns platform information for the web app
   */
  getPlatform: (): string => process.platform,

  /**
   * Indicates whether the app is running in the Electron desktop shell
   */
  isDesktop: true,

  /**
   * Returns the Electron version
   */
  getElectronVersion: (): string => process.versions.electron ?? 'unknown',

  /**
   * Opens a URL in the system's default browser.
   * Required for OAuth flows since Google blocks embedded browsers.
   */
  openExternal: (url: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('shell:open-external', url)
  },

  /**
   * Open native file dialog (desktop only)
   */
  openFileDialog: (options?: { multiple?: boolean }): Promise<{
    canceled: boolean
    files: Array<{ name: string; data: ArrayBuffer; mimeType: string }>
  }> => {
    return ipcRenderer.invoke('dialog:open-files', options ?? {}).then((result) => ({
      canceled: result.canceled,
      files: (result.files ?? []).map((file: { name: string; data: Uint8Array; mimeType: string }) => {
        const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data)
        return {
          name: file.name,
          mimeType: file.mimeType,
          data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        }
      }),
    }))
  },

  /**
   * Window Controls API
   */
  windowControls: {
    /**
     * Minimize the window
     */
    minimizeWindow: (): Promise<void> => {
      return ipcRenderer.invoke('window:minimize')
    },

    /**
     * Maximize or restore the window
     */
    maximizeWindow: (): Promise<void> => {
      return ipcRenderer.invoke('window:maximize')
    },

    /**
     * Close the window
     */
    closeWindow: (): Promise<void> => {
      return ipcRenderer.invoke('window:close')
    },

    /**
     * Check if the window is currently maximized
     */
    isMaximized: (): Promise<boolean> => {
      return ipcRenderer.invoke('window:is-maximized')
    },

    /**
     * Subscribe to maximize state changes
     */
    onMaximizeChanged: (callback: (isMaximized: boolean) => void): () => void => {
      return addIPCListener('window:maximize-changed', callback)
    }
  },
  
  /**
   * Desktop Recording API
   */
  desktopRecording: {
    /**
     * Get the current status of the desktop recording SDK
     */
    getStatus: (): Promise<DesktopRecordingStatus> => {
      return ipcRenderer.invoke('desktop-recording:get-status')
    },
    
    /**
     * Request permissions for desktop recording (macOS)
     */
    requestPermissions: (): Promise<PermissionStatus> => {
      return ipcRenderer.invoke('desktop-recording:request-permissions')
    },
    
    /**
     * Start recording a meeting
     */
    startRecording: (windowId: string, uploadToken: string): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('desktop-recording:start', { windowId, uploadToken })
    },
    
    /**
     * Stop recording a meeting
     */
    stopRecording: (windowId: string): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('desktop-recording:stop', { windowId })
    },
    
    /**
     * Get list of detected meetings
     */
    getDetectedMeetings: (): Promise<MeetingWindow[]> => {
      return ipcRenderer.invoke('desktop-recording:get-meetings')
    },
    
    /**
     * Get current permission status
     */
    getPermissions: (): Promise<PermissionStatus> => {
      return ipcRenderer.invoke('desktop-recording:get-permissions')
    },
    
    /**
     * Get current recording status
     */
    getRecordingStatus: (): Promise<RecordingStatus> => {
      return ipcRenderer.invoke('desktop-recording:get-recording-status')
    },
    
    /**
     * Subscribe to meeting detected events
     */
    onMeetingDetected: (callback: (meeting: MeetingWindow) => void): () => void => {
      return addIPCListener('desktop-recording:meeting-detected', callback)
    },
    
    /**
     * Subscribe to meeting ended events
     */
    onMeetingEnded: (callback: (meeting: MeetingWindow) => void): () => void => {
      return addIPCListener('desktop-recording:meeting-ended', callback)
    },
    
    /**
     * Subscribe to recording started events
     */
    onRecordingStarted: (callback: (status: RecordingStatus) => void): () => void => {
      return addIPCListener('desktop-recording:recording-started', callback)
    },
    
    /**
     * Subscribe to recording stopped events
     */
    onRecordingStopped: (callback: (event: { windowId: string; reason: string }) => void): () => void => {
      return addIPCListener('desktop-recording:recording-stopped', callback)
    },
    
    /**
     * Subscribe to permission update events
     */
    onPermissionUpdate: (callback: (permissions: PermissionStatus) => void): () => void => {
      return addIPCListener('desktop-recording:permission-update', callback)
    },
    
    /**
     * Subscribe to recording error events
     */
    onError: (callback: (error: { error: string; windowId?: string }) => void): () => void => {
      return addIPCListener('desktop-recording:error', callback)
    }
  },

  /**
   * Terminal / PTY API (desktop only)
   */
  terminal: {
    /**
     * Start a new PTY session. Returns { success, error? }.
     * Output is delivered via onData / onExit listeners.
     */
    start: (sessionId: string, cwd?: string): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('terminal:start', sessionId, cwd)
    },

    /**
     * Write data (user keystrokes) to the PTY session.
     */
    write: (sessionId: string, data: string): void => {
      ipcRenderer.send('terminal:input', sessionId, data)
    },

    /**
     * Resize the PTY session to new dimensions.
     */
    resize: (sessionId: string, cols: number, rows: number): void => {
      ipcRenderer.send('terminal:resize', sessionId, cols, rows)
    },

    /**
     * Close and destroy a PTY session.
     */
    close: (sessionId: string): void => {
      ipcRenderer.send('terminal:close', sessionId)
    },

    /**
     * Subscribe to data (output) from a PTY session.
     * Returns a cleanup function.
     */
    onData: (callback: (sessionId: string, data: string) => void): () => void => {
      return addIPCListener<[string, string]>('terminal:data', callback)
    },

    /**
     * Subscribe to session exit events.
     * Returns a cleanup function.
     */
    onExit: (callback: (sessionId: string, exitCode: number) => void): () => void => {
      return addIPCListener<[string, number]>('terminal:exit', callback)
    },
  },

  /**
   * Auto-updater API
   */
  updater: {
    /**
     * Check for available updates
     */
    checkForUpdates: (): Promise<{ available: boolean; error?: string; currentVersion?: string; latestVersion?: string }> => {
      return ipcRenderer.invoke('updater:check-for-updates')
    },

    /**
     * Download the available update
     */
    downloadUpdate: (): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('updater:download-update')
    },

    /**
     * Install the downloaded update (will restart the app)
     */
    installUpdate: (): Promise<{ success: boolean; error?: string }> => {
      return ipcRenderer.invoke('updater:install-update')
    },

    /**
     * Get the current app version
     */
    getCurrentVersion: (): Promise<string> => {
      return ipcRenderer.invoke('updater:get-current-version')
    },

    /**
     * Subscribe to update checking events
     */
    onCheckingForUpdate: (callback: () => void): () => void => {
      return addIPCListener('updater:checking-for-update', callback)
    },

    /**
     * Subscribe to update available events
     */
    onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void): () => void => {
      return addIPCListener('updater:update-available', callback)
    },

    /**
     * Subscribe to update not available events
     */
    onUpdateNotAvailable: (callback: (info: { version: string }) => void): () => void => {
      return addIPCListener('updater:update-not-available', callback)
    },

    /**
     * Subscribe to update error events
     */
    onUpdateError: (callback: (error: { message: string }) => void): () => void => {
      return addIPCListener('updater:error', callback)
    },

    /**
     * Subscribe to download progress events
     */
    onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void): () => void => {
      return addIPCListener('updater:download-progress', callback)
    },

    /**
     * Subscribe to update downloaded events
     */
    onUpdateDownloaded: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void): () => void => {
      return addIPCListener('updater:update-downloaded', callback)
    }
  }
})

// Type declaration for the exposed API
declare global {
  interface Window {
    desktopApp?: {
      getPlatform: () => string
      isDesktop: boolean
      getElectronVersion: () => string
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
      openFileDialog: (options?: { multiple?: boolean }) => Promise<{
        canceled: boolean
        files: Array<{ name: string; data: ArrayBuffer; mimeType: string }>
      }>
      windowControls: {
        minimizeWindow: () => Promise<void>
        maximizeWindow: () => Promise<void>
        closeWindow: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void
      }
      terminal: {
        start: (sessionId: string, cwd?: string) => Promise<{ success: boolean; error?: string }>
        write: (sessionId: string, data: string) => void
        resize: (sessionId: string, cols: number, rows: number) => void
        close: (sessionId: string) => void
        onData: (callback: (sessionId: string, data: string) => void) => () => void
        onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void
      }
      desktopRecording: {
        getStatus: () => Promise<DesktopRecordingStatus>
        requestPermissions: () => Promise<PermissionStatus>
        startRecording: (windowId: string, uploadToken: string) => Promise<{ success: boolean; error?: string }>
        stopRecording: (windowId: string) => Promise<{ success: boolean; error?: string }>
        getDetectedMeetings: () => Promise<MeetingWindow[]>
        getPermissions: () => Promise<PermissionStatus>
        getRecordingStatus: () => Promise<RecordingStatus>
        onMeetingDetected: (callback: (meeting: MeetingWindow) => void) => () => void
        onMeetingEnded: (callback: (meeting: MeetingWindow) => void) => () => void
        onRecordingStarted: (callback: (status: RecordingStatus) => void) => () => void
        onRecordingStopped: (callback: (event: { windowId: string; reason: string }) => void) => () => void
        onPermissionUpdate: (callback: (permissions: PermissionStatus) => void) => () => void
        onError: (callback: (error: { error: string; windowId?: string }) => void) => () => void
      }
      updater: {
        checkForUpdates: () => Promise<{ available: boolean; error?: string; currentVersion?: string; latestVersion?: string }>
        downloadUpdate: () => Promise<{ success: boolean; error?: string }>
        installUpdate: () => Promise<{ success: boolean; error?: string }>
        getCurrentVersion: () => Promise<string>
        onCheckingForUpdate: (callback: () => void) => () => void
        onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void
        onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
        onUpdateError: (callback: (error: { message: string }) => void) => () => void
        onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => () => void
        onUpdateDownloaded: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void
      }
    }
  }
}
