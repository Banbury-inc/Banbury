export interface CheckForUpdatesResult {
  success: boolean
  available?: boolean
  currentVersion?: string
  latestVersion?: string
  error?: string
}

export async function checkForUpdates(): Promise<CheckForUpdatesResult> {
  if (typeof window === 'undefined' || !window.desktopApp?.updater) {
    return {
      success: false,
      error: 'Update check is only available in the desktop app',
    }
  }

  try {
    const result = await window.desktopApp.updater.checkForUpdates()
    
    return {
      success: true,
      available: result.available,
      currentVersion: result.currentVersion,
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}