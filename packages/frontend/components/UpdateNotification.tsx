import { useEffect, useState } from 'react'
import { Download, X, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Typography } from './ui/typography'
import { Progress } from './ui/progress'

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

interface UpdateNotificationProps {
  className?: string
}

export function UpdateNotification({ className }: UpdateNotificationProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run in Electron
    if (typeof window === 'undefined' || !window.desktopApp?.isDesktop) {
      return
    }

    const updater = window.desktopApp.updater
    if (!updater) {
      console.warn('[UpdateNotification] Updater API not available')
      return
    }

    // Get current version
    updater.getCurrentVersion().then((version) => {
      setCurrentVersion(version)
    })

    // Set up event listeners
    const unsubscribeChecking = updater.onCheckingForUpdate(() => {
      setError(null)
    })

    const unsubscribeAvailable = updater.onUpdateAvailable((info) => {
      setUpdateAvailable(true)
      setUpdateInfo(info)
      setError(null)
    })

    const unsubscribeNotAvailable = updater.onUpdateNotAvailable(() => {
      setUpdateAvailable(false)
    })

    const unsubscribeError = updater.onUpdateError((err) => {
      setError(err.message)
      setIsDownloading(false)
    })

    const unsubscribeProgress = updater.onDownloadProgress((progress) => {
      setDownloadProgress(progress.percent)
      setIsDownloading(true)
    })

    const unsubscribeDownloaded = updater.onUpdateDownloaded((info) => {
      setIsDownloaded(true)
      setIsDownloading(false)
      setDownloadProgress(100)
      setUpdateInfo(info)
    })

    // Cleanup
    return () => {
      unsubscribeChecking()
      unsubscribeAvailable()
      unsubscribeNotAvailable()
      unsubscribeError()
      unsubscribeProgress()
      unsubscribeDownloaded()
    }
  }, [])

  const handleDownloadUpdate = async () => {
    if (typeof window === 'undefined' || !window.desktopApp?.updater) {
      return
    }

    setIsDownloading(true)
    setError(null)
    setDownloadProgress(0)

    try {
      const result = await window.desktopApp.updater.downloadUpdate()
      if (!result.success) {
        setError(result.error || 'Failed to download update')
        setIsDownloading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download update')
      setIsDownloading(false)
    }
  }

  const handleInstallUpdate = async () => {
    if (typeof window === 'undefined' || !window.desktopApp?.updater) {
      return
    }

    try {
      await window.desktopApp.updater.installUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install update')
    }
  }

  const handleDismiss = () => {
    setUpdateAvailable(false)
    setIsDownloaded(false)
    setDownloadProgress(0)
    setError(null)
  }

  // Don't render if not in Electron or no update available
  if (typeof window === 'undefined' || !window.desktopApp?.isDesktop || !updateAvailable) {
    return null
  }

  return (
    <Card
      className={`fixed top-4 right-4 z-50 w-full max-w-md border-2 border-primary/20 bg-background/95 backdrop-blur-md shadow-lg ${className || ''}`}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <Typography variant="h6" className="font-semibold">
              Update Available
            </Typography>
            {updateInfo && (
              <Typography variant="small" className="text-muted-foreground">
                Version {updateInfo.version} is now available
                {currentVersion && ` (current: ${currentVersion})`}
              </Typography>
            )}
            {error && (
              <Typography variant="small" className="text-destructive">
                {error}
              </Typography>
            )}
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isDownloading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Downloading update...</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>
        )}

        {isDownloaded && (
          <div className="space-y-2">
            <Typography variant="small" className="text-success">
              Update downloaded successfully! The app will restart to install the update.
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleInstallUpdate}
                className="flex-1"
              >
                Install Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
              >
                Later
              </Button>
            </div>
          </div>
        )}

        {!isDownloading && !isDownloaded && (
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadUpdate}
            className="w-full"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Update Now
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
