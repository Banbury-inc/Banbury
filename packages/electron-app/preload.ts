import { contextBridge } from 'electron'

/**
 * Preload script for Electron.
 * 
 * This script runs in an isolated context with access to both
 * the DOM and a subset of Node.js APIs. It safely exposes
 * desktop-specific functionality to the web app via contextBridge.
 * 
 * For the thin-shell phase, this is minimal. Add APIs here as needed
 * for desktop-specific features.
 */

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
})

// Type declaration for the exposed API
declare global {
  interface Window {
    desktopApp?: {
      getPlatform: () => string
      isDesktop: boolean
      getElectronVersion: () => string
    }
  }
}
