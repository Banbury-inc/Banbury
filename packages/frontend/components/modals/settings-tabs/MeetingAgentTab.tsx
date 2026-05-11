import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Video, Upload, X } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Input } from '../../common/ui/input'
import { Typography } from '../../common/ui/typography'
import { Separator } from '../../common/ui/separator'
import { Label } from '../../common/ui/label'
import { useToast } from '../../common/ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'

export function MeetingAgentTab() {
  const { toast } = useToast()
  const [botName, setBotName] = useState('Meeting Recorder')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load bot settings on mount
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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a JPG, PNG, GIF, or WEBP image',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive'
      })
      return
    }

    // Validate dimensions (minimum 200x200)
    const img = new Image()
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

        // All validations passed
        setSelectedFile(file)
        setPreviewUrl(e.target?.result as string)
      }
    }
    
    reader.readAsDataURL(file)
  }

  async function handleRemoveImage() {
    // If we're just clearing a preview (new file selected but not saved yet)
    if (previewUrl && !profilePictureUrl) {
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // If we're removing an existing profile picture
    try {
      setIsUploading(true)

      // Clear the preview state immediately
      setSelectedFile(null)
      setPreviewUrl('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Update backend to remove profile picture
      await ApiService.MeetingAgent.updateBotSettings({
        botName,
        profilePictureUrl: ''
      })

      // Clear the profile picture URL
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
      // Reload settings on error to ensure valid state
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

      // Determine which URL to save (use existing if no new file)
      let urlToSave = profilePictureUrl

      // Upload new image if selected (but don't set it in state)
      if (selectedFile) {
        const uploadResult = await ApiService.MeetingAgent.uploadProfilePicture(selectedFile)
        urlToSave = uploadResult.imageUrl
      }

      // Update bot settings with the raw S3 URL (only sent to backend, never displayed)
      await ApiService.MeetingAgent.updateBotSettings({
        botName,
        profilePictureUrl: urlToSave
      })

      // Clear ALL state including the profile picture URL to prevent showing raw S3 URL
      setSelectedFile(null)
      setPreviewUrl('')
      setProfilePictureUrl('') // Clear immediately to prevent any flash of raw URL
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Reload settings from backend to get the pre-signed URL
      // This is the ONLY place we set profilePictureUrl after upload
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
      // Reload settings even on error to ensure we have valid state
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
      <div className="space-y-6">
        <h3 className="mb-4 flex items-center font-semibold text-foreground">
          <Video className="h-5 w-5 mr-2" />
          <Typography variant="h3">Meeting Agent</Typography>
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded bg-muted"></div>
          <div className="h-10 rounded bg-muted"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="mb-4 flex items-center font-semibold text-foreground">
        <Video className="h-5 w-5 mr-2" />
        <Typography variant="h3">Meeting Agent</Typography>
      </h3>

      <div className="space-y-4">
        {/* Bot Name */}
        <div>
          <Label htmlFor="meeting-agent-bot-name" className="mb-2 block">
            <Typography variant="small" className="font-medium text-muted-foreground">
            Bot Name
            </Typography>
          </Label>
          <Input
            id="meeting-agent-bot-name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Meeting Recorder"
          />
          <Typography variant="xs" className="mt-1 text-muted-foreground">
            This name appears when the bot joins meetings.
          </Typography>
        </div>

        <Separator />

        {/* Profile Picture */}
        <div>
          <Typography variant="small" className="mb-2 block font-medium text-muted-foreground">
            Profile Picture
          </Typography>
          
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
            className="mt-3"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Image
          </Button>

          <div className="mt-3 space-y-1">
            <Typography variant="xs" className="text-muted-foreground">
              Formats: JPG, PNG, GIF, WEBP
            </Typography>
            <Typography variant="xs" className="text-muted-foreground">
              Max size: 5MB
            </Typography>
            <Typography variant="xs" className="text-muted-foreground">
              Recommended: square aspect ratio (1:1), minimum 200x200px
            </Typography>
          </div>
        </div>

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isUploading}
            className="min-w-24"
          >
            {isUploading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

