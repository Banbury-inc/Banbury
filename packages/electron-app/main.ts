// @ts-nocheck
import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDesktopRecording, setupDesktopRecordingIPC, cleanupDesktopRecording } from './desktop-recording'

let autoUpdater: any = null
let isUpdaterAvailable = false

// Get the app version from package.json (works in both dev and prod)
function getAppVersion(): string {
  // In production, app.getVersion() returns the correct version from package.json
  if (app.isPackaged) {
    return app.getVersion()
  }
  
  // In development, read from package.json directly
  try {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return packageJson.version || '0.0.0'
    }
  } catch (error) {
    console.warn('[Electron] Could not read package.json version:', error)
  }
  
  return app.getVersion()
}

// Use a function to dynamically load electron-updater
// This prevents TypeScript from hoisting the require to a static import
function loadUpdater() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const moduleName = 'electron-updater'
    const updaterModule = require(moduleName)
    return updaterModule?.autoUpdater
  } catch (error) {
    console.warn('[Electron] electron-updater not available:', error)
    return null
  }
}

const loadedUpdater = loadUpdater()
console.log('loadedUpdater', loadedUpdater)
if (loadedUpdater) {
  autoUpdater = loadedUpdater
  isUpdaterAvailable = true
  
  // In development mode, use the dev-app-update.yml config file
  if (!app.isPackaged) {
    try {
      // __dirname is dist-electron/electron-app/, so go up 2 levels to packages/
      const devConfigPath = path.join(__dirname, '..', '..', 'electron-app', 'dev-app-update.yml')
      console.log('[Electron] Looking for dev update config at:', devConfigPath)
      if (fs.existsSync(devConfigPath)) {
        autoUpdater.updateConfigPath = devConfigPath
        autoUpdater.forceDevUpdateConfig = true
        console.log('[Electron] Using dev update config:', devConfigPath)
      } else {
        console.warn('[Electron] dev-app-update.yml not found at:', devConfigPath)
      }
    } catch (error) {
      console.warn('[Electron] Could not set dev update config:', error)
    }
  }
} else {
  // Create a no-op autoUpdater object to prevent errors
  autoUpdater = {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    checkForUpdates: async () => ({ versionInfo: null }),
    downloadUpdate: async () => {},
    quitAndInstall: () => {},
    on: () => {},
    removeAllListeners: () => {}
  }
  isUpdaterAvailable = false
}

// Environment variable names for URL configuration
const DEV_URL_ENV_KEY = 'DESKTOP_APP_DEV_URL'
const PROD_URL_ENV_KEY = 'DESKTOP_APP_PROD_URL'

// Default URLs
const DEFAULT_DEV_URL = 'http://localhost:3000'
const DEFAULT_PROD_URL = 'https://www.banbury.io'

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
    if (devUrl && isValidUrl(devUrl)) {
      console.log(`[Electron] Using dev URL from env: ${devUrl}`)
      return devUrl
    }
    
    console.log(`[Electron] Using default dev URL: ${DEFAULT_DEV_URL}`)
    return DEFAULT_DEV_URL
  }

  // In production mode, prefer DESKTOP_APP_PROD_URL
  const prodUrl = process.env[PROD_URL_ENV_KEY]
  if (prodUrl && isValidUrl(prodUrl)) {
    console.log(`[Electron] Using prod URL from env: ${prodUrl}`)
    return prodUrl
  }

  // For packaged apps, default to remote production URL
  // For non-packaged production builds, try localhost first (allows local testing)
  if (app.isPackaged) {
    console.log(`[Electron] Packaged app detected, using remote prod URL: ${DEFAULT_PROD_URL}`)
    return DEFAULT_PROD_URL
  }

  // Non-packaged production build - try localhost first for local testing
  console.log(`[Electron] Non-packaged production build, trying localhost first: ${DEFAULT_DEV_URL}`)
  return DEFAULT_DEV_URL
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

/**
 * Resolves the icon path for the application window.
 * Works in both development and production environments.
 */
function resolveIconPath(): string | undefined {
  const fs = require('fs')
  
  // Try multiple possible icon locations in order of preference
  const possiblePaths: string[] = []
  
  // In production (packaged app), try resources folder first
  if (!isDev) {
    // Platform-specific icons in resources
    if (process.platform === 'win32') {
      possiblePaths.push(path.join(__dirname, '..', 'electron-app', 'resources', 'icon.ico'))
    } else if (process.platform === 'darwin') {
      possiblePaths.push(path.join(__dirname, '..', 'electron-app', 'resources', 'icon.icns'))
    }
    // Universal PNG fallback
    possiblePaths.push(path.join(__dirname, '..', 'electron-app', 'resources', 'icon.png'))
  }
  
  // Try relative to dist-electron (when running compiled code)
  possiblePaths.push(path.join(__dirname, '..', '..', 'public', 'New_Logo.png'))
  possiblePaths.push(path.join(__dirname, '..', '..', 'frontend', 'assets', 'images', 'New_Logo.png'))
  possiblePaths.push(path.join(__dirname, '..', '..', 'frontend', 'assets', 'images', 'Logo.png'))
  
  // Try relative to project root (when running from source)
  const projectRoot = path.resolve(__dirname, '..', '..')
  possiblePaths.push(path.join(projectRoot, 'public', 'New_Logo.png'))
  possiblePaths.push(path.join(projectRoot, 'frontend', 'assets', 'images', 'New_Logo.png'))
  possiblePaths.push(path.join(projectRoot, 'frontend', 'assets', 'images', 'Logo.png'))
  
  // Try resources folder in various locations
  possiblePaths.push(path.join(__dirname, 'resources', 'icon.png'))
  possiblePaths.push(path.join(__dirname, '..', 'electron-app', 'resources', 'icon.png'))
  
  // Check each path and return the first one that exists
  for (const iconPath of possiblePaths) {
    try {
      if (fs.existsSync(iconPath)) {
        return iconPath
      }
    } catch {
      // Continue to next path
    }
  }
  
  // Return undefined if no icon found (Electron will use default)
  return undefined
}

// Store reference to main window for desktop recording
let mainWindow: BrowserWindow | null = null

// Track if we've tried the fallback URL to avoid infinite retry loops
let hasTriedFallbackUrl = false

// Configure auto-updater (only if available)
if (autoUpdater) {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Only check for updates in production
    // Configure update check interval (check every 4 hours)
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((error) => {
        console.error('[Electron] Error checking for updates:', error)
      })
    }, 4 * 60 * 60 * 1000) // 4 hours in milliseconds
}

/**
 * Creates the main application window with secure defaults.
 */
function createWindow(): void {
  const targetUrl = resolveTargetUrl()

  const iconPath = resolveIconPath()
  
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
    frame: false,
    icon: iconPath, // Set the window icon to Banbury logo
  })

  // Show window when content is ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready to show')
    mainWindow?.show()

    // Open DevTools in development mode, or in production with DEBUG_ELECTRON env var
    if (isDev || process.env.DEBUG_ELECTRON === '1') {
      mainWindow?.webContents.openDevTools({ mode: 'detach' })
    }
    
    // Initialize desktop recording after window is ready
    if (mainWindow) {
      initDesktopRecording(mainWindow).then((success) => {
      }).catch((error) => {
        console.error('[Electron] Desktop recording initialization skipped:', error.message)
      })
    }
  })

  // Fallback: Show window after a timeout even if ready-to-show never fires
  // This prevents the window from staying hidden if the page fails to load
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('[Electron] Window not visible after timeout, showing anyway')
      const currentUrl = mainWindow.webContents.getURL()
      console.log(`[Electron] Current URL: ${currentUrl}`)
      mainWindow.show()
      // In production, open DevTools if page failed to load (for debugging)
      if (!isDev && (!currentUrl || currentUrl === 'about:blank' || currentUrl === '')) {
        console.log('[Electron] Page appears to have failed to load, opening DevTools for debugging')
        console.log(`[Electron] Expected URL: ${targetUrl}/login-electron`)
        mainWindow.webContents.openDevTools({ mode: 'detach' })
      }
    }
  }, 5000) // 5 second timeout

  // Log successful page loads for debugging
  mainWindow.webContents.on('did-finish-load', () => {
    const currentUrl = mainWindow?.webContents.getURL()
    console.log(`[Electron] Page loaded successfully: ${currentUrl}`)
  })

  // Log console messages from the renderer process
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levelStr = ['', 'INFO', 'WARNING', 'ERROR'][level] || 'UNKNOWN'
    console.log(`[Renderer ${levelStr}] ${message} (${sourceId}:${line})`)
  })

  // Log JavaScript errors from the renderer process
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[Electron] Render process crashed:`, details)
  })

  mainWindow.webContents.on('unresponsive', () => {
    console.error(`[Electron] Page became unresponsive`)
  })

  mainWindow.webContents.on('responsive', () => {
    console.log(`[Electron] Page became responsive again`)
  })

  // Handle load failures gracefully
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, failedUrl) => {
    console.error(`[Electron] Failed to load: ${errorCode} - ${errorDescription}`)
    console.error(`[Electron] Failed URL was: ${failedUrl}`)
    console.error(`[Electron] Is packaged: ${app.isPackaged}, Is dev: ${isDev}`)
    
    // In dev mode, the server might not be ready yet - retry after a delay
    if (isDev && errorCode === -102) {
      console.log(`[Electron] Connection refused in dev mode, retrying in 3 seconds...`)
      setTimeout(() => {
        mainWindow?.loadURL(targetUrl)
      }, 3000)
      return
    }
    
    // For packaged apps, if remote URL fails, try localhost fallback for DNS errors
    if (app.isPackaged) {
      // ERR_NAME_NOT_RESOLVED (-105) means DNS lookup failed - try localhost as fallback
      if (errorCode === -105 && !hasTriedFallbackUrl) {
        hasTriedFallbackUrl = true
        console.error(`[Electron] Remote URL failed (DNS error: ${errorDescription}), trying localhost fallback...`)
        console.error(`[Electron] Original URL: ${failedUrl}`)
        console.error(`[Electron] Note: To use localhost, ensure Next.js server is running: npm run next:start`)
        const fallbackUrl = DEFAULT_DEV_URL
        const fallbackInitialUrl = new URL('/login-electron', fallbackUrl).toString()
        setTimeout(() => {
          mainWindow?.loadURL(fallbackInitialUrl)
        }, 1000)
        return
      }
      
      // Other errors or already tried fallback - show error page
      console.error(`[Electron] Packaged app failed to load from: ${failedUrl}`)
      console.error(`[Electron] Error code: ${errorCode}, Description: ${errorDescription}`)
      if (hasTriedFallbackUrl) {
        console.error(`[Electron] Both remote URL and localhost failed to load.`)
      }
      console.error(`[Electron] Please check your internet connection and ensure the URL is accessible.`)
      console.error(`[Electron] You can also set DESKTOP_APP_PROD_URL environment variable to use a different URL.`)
      // Show an error page so user knows what happened
      const errorHtml = `
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #0a0a0a;
                color: #fff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
                padding: 20px;
              }
              h1 { color: #ff6b6b; margin-bottom: 10px; }
              p { color: #888; margin: 5px 0; }
              .error-code { font-family: monospace; background: #1a1a1a; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }
              button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 20px;
              }
              button:hover { background: #2563eb; }
            </style>
          </head>
          <body>
            <h1>Unable to Connect</h1>
            <p>Failed to load the application.</p>
            <div class="error-code">
              <p>URL: ${failedUrl}</p>
              <p>Error: ${errorCode} - ${errorDescription}</p>
            </div>
            <p>Please check your internet connection and try again.</p>
            ${errorCode === -105 ? '<p style="color: #fbbf24; margin-top: 15px;">DNS Error: The domain could not be resolved. If you have a local server, ensure it\'s running on port 3000.</p>' : ''}
            <p style="font-size: 12px; color: #666; margin-top: 20px;">You can configure the URL by setting the DESKTOP_APP_PROD_URL environment variable.</p>
            <button onclick="location.reload()">Retry</button>
          </body>
        </html>
      `
      mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`)
      return
    }
    
    // For non-packaged production builds, if localhost fails and we haven't tried the fallback yet, try the remote URL
    if (!isDev && !app.isPackaged && !hasTriedFallbackUrl && targetUrl === DEFAULT_DEV_URL) {
      hasTriedFallbackUrl = true
      const fallbackUrl = DEFAULT_PROD_URL
      console.log(`[Electron] Localhost failed (is Next.js server running on port 3000?), trying fallback URL: ${fallbackUrl}`)
      console.log(`[Electron] To use localhost, ensure Next.js is running: npm run next:start`)
      const fallbackInitialUrl = new URL('/login-electron', fallbackUrl).toString()
      setTimeout(() => {
        mainWindow?.loadURL(fallbackInitialUrl)
      }, 1000)
    } else if (!isDev && !app.isPackaged && hasTriedFallbackUrl) {
      // Both localhost and remote failed - show error message
      console.error(`[Electron] Both localhost and remote URL failed to load.`)
      console.error(`[Electron] Please ensure either:`)
      console.error(`[Electron]   1. Next.js server is running: npm run next:start`)
      console.error(`[Electron]   2. Or the remote URL is accessible: ${DEFAULT_PROD_URL}`)
    }
  })
  
  // Track maximize state changes and notify renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-changed', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-changed', false)
  })

  // Clean up reference when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
    hasTriedFallbackUrl = false // Reset for next window creation
  })

  // Load the target URL - start with login page for Electron app
  const initialUrl = new URL('/login-electron', targetUrl).toString()
  mainWindow.loadURL(initialUrl)
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
  // Set app icon (especially important for macOS dock)
  const iconPath = resolveIconPath()
  if (iconPath && process.platform === 'darwin') {
    const { nativeImage } = require('electron')
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon)
    }
  }
  
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

  // Set up IPC handlers for window controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
      // Emit event to notify renderer of state change
      mainWindow.webContents.send('window:maximize-changed', mainWindow.isMaximized())
    }
  })

  ipcMain.handle('window:close', () => {
    if (mainWindow) {
      mainWindow.close()
    }
  })

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false
  })

  // Set up IPC handlers for auto-updater
  // Set ENABLE_DEV_UPDATER=1 to test the updater in development mode
  ipcMain.handle('updater:check-for-updates', async () => {
    const currentVersion = getAppVersion()
    const allowDevUpdater = true
    
    console.log(`[Electron] Checking for updates. Current version: ${currentVersion}, isDev: ${isDev}, allowDevUpdater: ${allowDevUpdater}`)
    
    if (!isUpdaterAvailable) {
      return { available: false, currentVersion, error: 'Auto-updater is not available' }
    }
    if (isDev && !allowDevUpdater) {
      return { available: false, currentVersion, error: 'Updates are disabled in development mode. Set ENABLE_DEV_UPDATER=1 to enable.' }
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      console.log('[Electron] checkForUpdates result:', JSON.stringify(result, null, 2))
      
      // electron-updater returns { updateInfo, downloadPromise, cancellationToken }
      // updateInfo contains the version info
      const latestVersion = result?.updateInfo?.version
      // An update is available if we got update info with a different version
      const available = !!(latestVersion && latestVersion !== currentVersion)
      console.log(`[Electron] Update check: current=${currentVersion}, latest=${latestVersion}, available=${available}`)
      return { 
        available, 
        currentVersion,
        latestVersion
      }
    } catch (error) {
      console.error('[Electron] Error checking for updates:', error)
      return { available: false, currentVersion, error: String(error) }
    }
  })

  ipcMain.handle('updater:download-update', async () => {
    const allowDevUpdater = process.env.ENABLE_DEV_UPDATER === '1'
    if (!isUpdaterAvailable) {
      return { success: false, error: 'Auto-updater is not available' }
    }
    if (isDev && !allowDevUpdater) {
      return { success: false, error: 'Updates are disabled in development mode' }
    }
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      console.error('[Electron] Error downloading update:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('updater:install-update', async () => {
    const allowDevUpdater = process.env.ENABLE_DEV_UPDATER === '1'
    if (!isUpdaterAvailable) {
      return { success: false, error: 'Auto-updater is not available' }
    }
    if (isDev && !allowDevUpdater) {
      return { success: false, error: 'Updates are disabled in development mode' }
    }
    try {
      autoUpdater.quitAndInstall(false, true)
      return { success: true }
    } catch (error) {
      console.error('[Electron] Error installing update:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('updater:get-current-version', () => {
    return getAppVersion()
  })
  
  configureMenu()
  createWindow()

  // Check for updates on app start (only in production and if updater is available)
  if (!isDev && isUpdaterAvailable) {
    // Wait a bit after app start before checking for updates
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((error) => {
        console.error('[Electron] Error checking for updates on startup:', error)
      })
    }, 5000) // Wait 5 seconds after app start
  }

  // macOS: Re-create window when dock icon is clicked and no windows exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Auto-updater event handlers (only if updater is available)
if (isUpdaterAvailable) {
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:checking-for-update')
    }
  })

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:update-not-available', {
        version: info.version
      })
    }
  })

  autoUpdater.on('error', (error) => {
    console.error('[Electron] Error in auto-updater:', error)
    if (mainWindow) {
      mainWindow.webContents.send('updater:error', {
        message: error.message
      })
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total
      })
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:update-downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      })
    }
  })
}

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
 * Creates a window if one doesn't exist to ensure the callback is processed
 */
function handleOAuthCallback(url: string): void {
  try {
    const parsedUrl = new URL(url)
    
    // Check if this is an auth callback
    if (parsedUrl.host === 'auth' && parsedUrl.pathname === '/callback') {
      const code = parsedUrl.searchParams.get('code')
      const token = parsedUrl.searchParams.get('token')
      const scope = parsedUrl.searchParams.get('scope')
      const error = parsedUrl.searchParams.get('error')
      const redirectUri = parsedUrl.searchParams.get('redirect_uri')
      
      // Build the callback URL for the frontend
      const targetUrl = resolveTargetUrl()
      const callbackParams = new URLSearchParams()
      if (code) callbackParams.set('code', code)
      if (token) callbackParams.set('token', token)
      if (scope) callbackParams.set('scope', scope)
      if (error) callbackParams.set('error', error)
      if (redirectUri) callbackParams.set('redirect_uri', redirectUri)
      
      const callbackUrl = `${targetUrl}/authentication/auth/callback?${callbackParams.toString()}`
      
      // Store redirect URI and is_desktop flag in sessionStorage so it can be used when processing the callback
      // This ensures we use the exact redirect URI and client type that was used for OAuth
      // We do this after building the URL but before navigating
      const storeOAuthInfo = (window: BrowserWindow) => {
        if (redirectUri && window && !window.isDestroyed()) {
          // Wait a bit for the page to load, then store the OAuth info
          window.webContents.once('did-finish-load', () => {
            window.webContents.executeJavaScript(`
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('oauth_redirect_uri', '${redirectUri.replace(/'/g, "\\'")}');
                sessionStorage.setItem('oauth_is_desktop', 'true');
              }
            `).catch(err => {
              console.warn('[Electron] Failed to store OAuth info:', err)
            })
          })
        }
      }
      
      // Ensure window exists - create if it was closed
      if (!mainWindow || mainWindow.isDestroyed()) {
        createWindow()
        // Wait for window to be ready before navigating
        if (mainWindow) {
          mainWindow.once('ready-to-show', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              storeOAuthInfo(mainWindow)
              mainWindow.loadURL(callbackUrl)
              mainWindow.focus()
            }
          })
        }
        return
      }
      
      // Focus the window and navigate to the callback
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      storeOAuthInfo(mainWindow)
      mainWindow.loadURL(callbackUrl)
    } else {
      console.warn('[Electron] Received protocol URL but not an auth callback:', url)
    }
  } catch (error) {
    console.error('[Electron] Error handling OAuth callback:', error)
  }
}

// macOS: Handle protocol URL when app is already running
app.on('open-url', (event, url) => {
  event.preventDefault()
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
      handleOAuthCallback(url)
    }
    
    // Focus the main window if it exists
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
