import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Video, Upload, X } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Input } from '../../common/ui/input'
import { Typography } from '../../common/ui/typography'
import { useToast } from '../../common/ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'
import {
  SettingsTabBlock,
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabCardFooter,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabRow,
} from './settings-tab-layout'

export function MeetingAgentTab() {
  const { toast } = useToast()
  const [botName, setBotName] = useState('Meeting Recorder')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadBotSettings()
  }, [])

  async function loadBotSettings() {
    try {
      setIsLoading(true)
      const settings = await ApiService.MeetingAgent.getBotSettings()
      setBotName(settings.botName || 'Meeting Recorder')
      setProfilePictureUrl(settings.profilePictureUrl || '')
    } catch (error) {
      console.error('Failed to load bot settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load meeting agent settings',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JPG, PNG, GIF, or WEBP image',
        variant: 'destructive'
      })
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      })
      return
    }

    const img = document.createElement('img')
    const reader = new FileReader()
    
    reader.onload = (e) => {
      img.src = e.target?.result as string
      
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          toast({
            title: 'Image Too Small',
            description: 'Please select an image at least 200x200 pixels',
            variant: 'destructive'
          })
          return
        }

        setSelectedFile(file)
        setPreviewUrl(e.target?.result as string)
      }
    }
    
    reader.readAsDataURL(file)
  }

  async function handleRemoveImage() {
    if (previewUrl && !profilePictureUrl) {
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      setIsUploading(true)

      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      await ApiService.MeetingAgent.updateBotSettings({
        botName,
        profilePictureUrl: ''
      })

      setProfilePictureUrl('')

      toast({
        title: 'Success',
        description: 'Profile picture removed successfully'
      })
    } catch (error) {
      console.error('Failed to remove profile picture:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove profile picture',
        variant: 'destructive'
      })
      try {
        await loadBotSettings()
      } catch (reloadError) {
        console.error('Failed to reload settings after error:', reloadError)
      }
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSave() {
    try {
      setIsUploading(true)

      let urlToSave = profilePictureUrl

      if (selectedFile) {
        const uploadResult = await ApiService.MeetingAgent.uploadProfilePicture(selectedFile)
        urlToSave = uploadResult.imageUrl
      }

      await ApiService.MeetingAgent.updateBotSettings({
        botName,
        profilePictureUrl: urlToSave
      })

      setSelectedFile(null)
      setPreviewUrl('')
      setProfilePictureUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      const updatedSettings = await ApiService.MeetingAgent.getBotSettings()
      setProfilePictureUrl(updatedSettings.profilePictureUrl || '')
      setBotName(updatedSettings.botName || 'Meeting Recorder')

      toast({
        title: 'Success',
        description: 'Meeting agent settings updated successfully'
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save meeting agent settings',
        variant: 'destructive'
      })
      try {
        await loadBotSettings()
      } catch (reloadError) {
        console.error('Failed to reload settings after error:', reloadError)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const displayImageUrl = previewUrl || profilePictureUrl

  if (isLoading) {
    return (
      <SettingsTabLayout>
        <SettingsTabHeader title="Meeting Agent" />
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
        </div>
      </SettingsTabLayout>
    )
  }

  return (
    <SettingsTabLayout>
      <SettingsTabHeader title="Meeting Agent" />

      <SettingsTabCard>
        <SettingsTabCardBody>
          <SettingsTabRow
            label="Bot Name"
            description="This name appears when the bot joins meetings."
            htmlFor="meeting-agent-bot-name"
            align="start"
          >
            <Input
              id="meeting-agent-bot-name"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Meeting Recorder"
              className="h-9 w-48 bg-background sm:w-56"
            />
          </SettingsTabRow>

          <SettingsTabBlock
            label="Profile Picture"
            description="Formats: JPG, PNG, GIF, WEBP. Max 5MB. Recommended square, minimum 200×200px."
          >
            {displayImageUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <Image
                    src={displayImageUrl}
                    alt="Bot profile"
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full border-2 border-border object-cover"
                    unoptimized={displayImageUrl.startsWith('data:')}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Typography variant="xs" className="text-muted-foreground">
                  {previewUrl ? 'New image selected. Save to upload it.' : 'Current profile picture'}
                </Typography>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <Typography variant="small" className="mb-1 text-muted-foreground">
                  No profile picture set
                </Typography>
                <Typography variant="xs" className="text-muted-foreground">
                  Select an image to upload
                </Typography>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose Image
            </Button>
          </SettingsTabBlock>
        </SettingsTabCardBody>

        <SettingsTabCardFooter className="justify-end">
          <Button
            onClick={handleSave}
            disabled={isUploading}
            className="min-w-24"
          >
            {isUploading ? 'Saving...' : 'Save'}
          </Button>
        </SettingsTabCardFooter>
      </SettingsTabCard>
    </SettingsTabLayout>
  )
}
