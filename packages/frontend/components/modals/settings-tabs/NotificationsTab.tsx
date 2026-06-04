import { useEffect, useState } from 'react'
import { Bell, Mail } from 'lucide-react'

import { Label } from '../../common/ui/label'
import { Separator } from '../../common/ui/separator'
import { Switch } from '../../common/ui/switch'
import { Typography } from '@/components/common/ui/typography'
import { useToast } from '../../common/ui/use-toast'
import {
  loadNotificationSettings,
  saveMarketingEmailsPreference,
} from './handlers/notificationSettingsHandlers'

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
    <div className="space-y-6">
      <Typography variant="h3" className="mb-4 flex items-center text-foreground">
        <Bell className="h-5 w-5 mr-2" />
        Notifications
      </Typography>
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="marketing-emails-switch">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col">
                <Typography variant="p" className="text-foreground">
                  Marketing emails
                </Typography>
                <Typography variant="small" className="mt-1 text-muted-foreground">
                  Receive product updates, feature announcements, and occasional offers.
                </Typography>
              </div>
            </div>
          </Label>
          <Switch
            id="marketing-emails-switch"
            checked={marketingEmailsEnabled}
            disabled={isLoading || isSavingMarketingEmails}
            onCheckedChange={handleMarketingEmailsToggle}
          />
        </div>
      </div>
    </div>
  )
}
