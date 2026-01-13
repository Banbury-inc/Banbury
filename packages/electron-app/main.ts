// @ts-nocheck

import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron'
import path from 'path'
import { initDesktopRecording, setupDesktopRecordingIPC, cleanupDesktopRecording } from './desktop-recording'

// Environment variable names for URL configuration
const DEV_URL_ENV_KEY = 'DESKTOP_APP_DEV_URL'
const PROD_URL_ENV_KEY = 'DESKTOP_APP_PROD_URL'

// Default URLs
const DEFAULT_DEV_URL = 'http://localhost:3000'
const DEFAULT_PROD_URL = 'https://app.banbury.io'

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Custom protocol for OAuth callbacks
const PROTOCOL_NAME = 'banbury'

// Register as default handler for banbury:// URLs
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_NAME)
}

/**
 * Resolves the target URL based on environment configuration.
 * Uses guard clauses and safe defaults for robust URL handling.
 */
function resolveTargetUrl(): string {
  // In development mode, prefer DESKTOP_APP_DEV_URL
  if (isDev) {
    const devUrl = process.env[DEV_URL_ENV_KEY]
    if (devUrl && isValidUrl(devUrl)) return devUrl
    
    console.log(`[Electron] No valid ${DEV_URL_ENV_KEY} found, using default: ${DEFAULT_DEV_URL}`)
    return DEFAULT_DEV_URL
  }

  // In production mode, prefer DESKTOP_APP_PROD_URL
  const prodUrl = process.env[PROD_URL_ENV_KEY]
  if (prodUrl && isValidUrl(prodUrl)) return prodUrl

  console.log(`[Electron] No valid ${PROD_URL_ENV_KEY} found, using default: ${DEFAULT_PROD_URL}`)
  return DEFAULT_PROD_URL
}

/**
 * Validates that a string is a properly formatted URL.
 */
function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false

  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    console.warn(`[Electron] Invalid URL format: ${urlString}`)
    return false
  }
}

// Store reference to main window for desktop recording
let mainWindow: BrowserWindow | null = null

/**
 * Creates the main application window with secure defaults.
 */
function createWindow(): void {
  const targetUrl = resolveTargetUrl()
  
  console.log(`[Electron] Starting in ${isDev ? 'development' : 'production'} mode`)
  console.log(`[Electron] Loading URL: ${targetUrl}`)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for desktop recording SDK
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'default',
  })

  // Show window when content is ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    
    // Open DevTools only in development mode
    if (isDev) {
      mainWindow?.webContents.openDevTools({ mode: 'detach' })
    }
    
    // Initialize desktop recording after window is ready
    if (mainWindow) {
      initDesktopRecording(mainWindow).then((success) => {
        if (success) {
          console.log('[Electron] Desktop recording initialized')
        } else {
          console.log('[Electron] Desktop recording not available (SDK may not be installed)')
        }
      }).catch((error) => {
        console.log('[Electron] Desktop recording initialization skipped:', error.message)
      })
    }
  })

  // Handle load failures gracefully
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Electron] Failed to load: ${errorCode} - ${errorDescription}`)
    console.error(`[Electron] Target URL was: ${targetUrl}`)
    
    // In dev mode, the server might not be ready yet - retry after a delay
    if (isDev && errorCode === -102) {
      console.log('[Electron] Server may not be ready. Retrying in 3 seconds...')
      setTimeout(() => {
        mainWindow?.loadURL(targetUrl)
      }, 3000)
    }
  })
  
  // Clean up reference when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Load the target URL
  mainWindow.loadURL(targetUrl)
}

/**
 * Configure application menu.
 * In production, use a minimal menu. In development, keep the default for debugging.
 */
function configureMenu(): void {
  if (isDev) return // Keep default menu in development for debugging

  // Set minimal menu for production
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// App lifecycle event handlers
app.whenReady().then(() => {
  // Set up desktop recording IPC handlers before creating window
  setupDesktopRecordingIPC()
  
  // Set up IPC handler for opening URLs in system browser (required for OAuth)
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    // Validate URL before opening to prevent security issues
    if (!url || typeof url !== 'string') return { success: false, error: 'Invalid URL' }
    
    try {
      const parsedUrl = new URL(url)
      // Only allow http/https URLs for security
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return { success: false, error: 'Only HTTP/HTTPS URLs are allowed' }
      }
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('[Electron] Failed to open external URL:', error)
      return { success: false, error: String(error) }
    }
  })
  
  configureMenu()
  createWindow()

  // macOS: Re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Windows/Linux: Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up desktop recording when app is quitting
app.on('before-quit', () => {
  cleanupDesktopRecording()
})

// Security: Prevent new window creation from web content
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
})

/**
 * Handle OAuth callback from custom protocol (banbury://)
 * Extracts the OAuth code and navigates to the auth callback page
 */
function handleOAuthCallback(url: string): void {
  if (!mainWindow) return
  
  try {
    const parsedUrl = new URL(url)
    
    // Check if this is an auth callback
    if (parsedUrl.host === 'auth' && parsedUrl.pathname === '/callback') {
      const code = parsedUrl.searchParams.get('code')
      const scope = parsedUrl.searchParams.get('scope')
      const error = parsedUrl.searchParams.get('error')
      
      // Build the callback URL for the frontend
      const targetUrl = resolveTargetUrl()
      const callbackParams = new URLSearchParams()
      if (code) callbackParams.set('code', code)
      if (scope) callbackParams.set('scope', scope)
      if (error) callbackParams.set('error', error)
      
      const callbackUrl = `${targetUrl}/authentication/auth/callback?${callbackParams.toString()}`
      console.log('[Electron] Navigating to OAuth callback:', callbackUrl)
      
      // Focus the window and navigate to the callback
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.loadURL(callbackUrl)
    }
  } catch (error) {
    console.error('[Electron] Error handling OAuth callback:', error)
  }
}

// macOS: Handle protocol URL when app is already running
app.on('open-url', (event, url) => {
  event.preventDefault()
  console.log('[Electron] Received open-url:', url)
  handleOAuthCallback(url)
})

// Windows/Linux: Handle protocol URL via second-instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Windows/Linux: Protocol URL is in the command line arguments
    const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`))
    if (url) {
      console.log('[Electron] Received protocol URL from second instance:', url)
      handleOAuthCallback(url)
    }
    
    // Focus the main window if it exists
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
