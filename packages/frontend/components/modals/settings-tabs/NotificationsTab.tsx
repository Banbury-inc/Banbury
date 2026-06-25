import { useEffect, useState } from 'react'
import { Switch } from '../../common/ui/switch'
import { useToast } from '../../common/ui/use-toast'
import {
  loadNotificationSettings,
  saveMarketingEmailsPreference,
} from './handlers/notificationSettingsHandlers'
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabRow,
} from './settings-tab-layout'

export function NotificationsTab() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingMarketingEmails, setIsSavingMarketingEmails] = useState(false)
  const [marketingEmailsEnabled, setMarketingEmailsEnabled] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true)

      try {
        const settings = await loadNotificationSettings()
        setMarketingEmailsEnabled(settings.marketingEmailsEnabled)
      } catch (error) {
        console.error('Error loading notification settings:', error)
        toast({
          title: 'Notification Settings Unavailable',
          description: 'Using the default marketing email preference for now.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  async function handleMarketingEmailsToggle(checked: boolean) {
    const previousMarketingEmailsEnabled = marketingEmailsEnabled
    setMarketingEmailsEnabled(checked)
    setIsSavingMarketingEmails(true)

    try {
      await saveMarketingEmailsPreference(checked)
    } catch (error) {
      console.error('Error updating marketing email preference:', error)
      setMarketingEmailsEnabled(previousMarketingEmailsEnabled)
      toast({
        title: 'Preference Not Saved',
        description: 'Your marketing email preference could not be updated. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingMarketingEmails(false)
    }
  }

  return (
    <SettingsTabLayout>
      <SettingsTabHeader title="Notifications" />

      <SettingsTabCard>
        <SettingsTabCardBody>
          <SettingsTabRow
            label="Marketing emails"
            description="Receive product updates, feature announcements, and occasional offers."
            htmlFor="marketing-emails-switch"
            align="start"
          >
            <Switch
              id="marketing-emails-switch"
              checked={marketingEmailsEnabled}
              disabled={isLoading || isSavingMarketingEmails}
              onCheckedChange={handleMarketingEmailsToggle}
            />
          </SettingsTabRow>
        </SettingsTabCardBody>
      </SettingsTabCard>
    </SettingsTabLayout>
  )
}
