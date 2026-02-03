import { useState, useEffect } from 'react'
import { Info, Download } from 'lucide-react'
import { Typography } from '../../common/ui/typography'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { checkForUpdates } from './handlers/aboutHandlers'

function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!window.desktopApp?.isDesktop
}

export function AboutTab() {
  const { toast } = useToast()
  const [version, setVersion] = useState<string>('')
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Get version from package.json
    // In Next.js, we can fetch it from the API or use an environment variable
    // For now, we'll try to get it from window or use a default
    if (typeof window !== 'undefined') {
      // Try to get version from electron if available
      if (window.desktopApp?.updater) {
        window.desktopApp.updater.getCurrentVersion().then((v) => {
          console.log('v', v)
          setVersion(v)
        }).catch(() => {
          // Fallback to default if unavailable
          setVersion('0.1.9')
        })
      } else {
        // For web version, use the package.json version
        // This could be injected via env variable or API
        setVersion('0.1.9')
      }
    }
  }, [])

  async function handleCheckForUpdates() {
    if (!isElectronApp()) {
      toast({
        title: "Not Available",
        description: "Update checking is only available in the desktop app.",
        variant: "destructive",
      })
      return
    }

    setIsChecking(true)
    try {
      const result = await checkForUpdates()
      console.log('result', result)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to check for updates",
          variant: "destructive",
        })
        return
      }

      if (result.available) {
        toast({
          title: "Update Available",
          description: `Version ${result.latestVersion} is available (current: ${result.currentVersion || version}). Check the notification to download.`,
        })
      } else {
        toast({
          title: "Up to Date",
          description: `You are running the latest version (${result.currentVersion || version}).`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while checking for updates",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Info className="h-5 w-5 mr-2 text-zinc-900 dark:text-white" />
        <Typography variant="h3" className="text-zinc-900 dark:text-white">
          About
        </Typography>
      </div>

      <div className="space-y-4">
        <div>
          <Typography variant="small" className="text-zinc-600 dark:text-gray-400 mb-2">
            Version
          </Typography>
          <Typography variant="p" className="text-zinc-900 dark:text-white">
            {version || 'Loading...'}
          </Typography>
        </div>

        {isElectronApp() && (
          <div className="pt-4">
            <Button
              onClick={handleCheckForUpdates}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isChecking ? 'Checking...' : 'Check for Updates'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}