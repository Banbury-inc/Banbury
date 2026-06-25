import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { useToast } from '../../common/ui/use-toast'
import { checkForUpdates } from './handlers/aboutHandlers'
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabCardFooter,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabValueRow,
} from './settings-tab-layout'

function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!window.desktopApp?.isDesktop
}

export function AboutTab() {
  const { toast } = useToast()
  const [version, setVersion] = useState<string>('')
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.desktopApp?.updater) {
        window.desktopApp.updater.getCurrentVersion().then((v) => {
          setVersion(v)
        }).catch(() => {
          setVersion('0.1.9')
        })
      } else {
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
    } catch {
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
    <SettingsTabLayout>
      <SettingsTabHeader title="About" />

      <SettingsTabCard>
        <SettingsTabCardBody>
          <SettingsTabValueRow
            label="Version"
            value={version || 'Loading...'}
            readOnly
          />
        </SettingsTabCardBody>

        {isElectronApp() && (
          <SettingsTabCardFooter className="justify-end">
            <Button
              onClick={handleCheckForUpdates}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isChecking ? 'Checking...' : 'Check for Updates'}
            </Button>
          </SettingsTabCardFooter>
        )}
      </SettingsTabCard>
    </SettingsTabLayout>
  )
}
