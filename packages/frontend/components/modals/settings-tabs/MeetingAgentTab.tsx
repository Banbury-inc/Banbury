import { useState, useEffect, useRef } from 'react'
import { Video, Upload, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Typography } from '../../ui/typography'
import { Separator } from '../../ui/separator'
import { useToast } from '../../ui/use-toast'
import { ApiService } from '../../../../backend/api/apiService'

interface MeetingAgentTabProps {}

export function MeetingAgentTab({}: MeetingAgentTabProps) {
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
        <h3 className="font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
          <Video className="h-5 w-5 mr-2" />
          <Typography variant="h3">Meeting Agent</Typography>
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
        <Video className="h-5 w-5 mr-2" />
        <Typography variant="h3">Meeting Agent</Typography>
      </h3>

      <div className="space-y-4">
        {/* Bot Name */}
        <div>
          <label className="text-sm font-medium text-zinc-600 dark:text-gray-400 mb-2 block">
            Bot Name
          </label>
          <Input
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Meeting Recorder"
            className="bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            This name will be displayed when the bot joins meetings
          </p>
        </div>

        <Separator />

        {/* Profile Picture */}
        <div>
          <label className="text-sm font-medium text-zinc-600 dark:text-gray-400 mb-2 block">
            Profile Picture
          </label>
          
          {displayImageUrl ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={displayImageUrl}
                  alt="Bot profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-600"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {previewUrl ? 'New image selected (click Save to upload)' : 'Current profile picture'}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                No profile picture set
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Select an image to upload
              </p>
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              • Formats: JPG, PNG, GIF, WEBP
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              • Max size: 5MB
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              • Recommended: Square aspect ratio (1:1), minimum 200x200px
            </p>
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

