import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/old-input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/old-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Separator } from '../../../components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/old-tabs'
import { 
  Video, 
  Mic, 
  FileText, 
  Clock, 
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import { MeetingAgentService } from '../../../services/meetingAgentService'
import { MeetingMetadata } from '../../../types/meeting-types'

interface MeetingJoinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoin: (meetingUrl: string, settings: Partial<MeetingMetadata>) => void
}

export function MeetingJoinDialog({ open, onOpenChange, onJoin }: MeetingJoinDialogProps) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [title, setTitle] = useState('')
  const [settings, setSettings] = useState<Partial<MeetingMetadata>>({
    recordingEnabled: true,
    transcriptionEnabled: true,
    summaryEnabled: true,
    actionItemsEnabled: true,
    language: 'en',
    quality: 'high',
    autoJoin: false,
    autoLeave: true,
    maxDuration: 120 // 2 hours
  })
  const [isValidating, setIsValidating] = useState(false)
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean
    platform: string | null
    meetingId: string | null
  } | null>(null)

  // Validate meeting URL
  const validateUrl = (url: string) => {
    const validation = MeetingAgentService.parseMeetingUrl(url)
    setUrlValidation(validation)
    return validation
  }

  // Handle URL change
  const handleUrlChange = (url: string) => {
    setMeetingUrl(url)
    if (url) {
      validateUrl(url)
    } else {
      setUrlValidation(null)
    }
  }

  // Handle join meeting
  const handleJoin = () => {
    if (!meetingUrl || !urlValidation?.isValid) return
    
    onJoin(meetingUrl, {
      ...settings,
      // Add title if provided
      ...(title && { title })
    })
    
    // Reset form
    setMeetingUrl('')
    setTitle('')
    setUrlValidation(null)
  }

  // Get platform icon
  const getPlatformIcon = (platform: string | null) => {
    switch (platform) {
      case 'zoom':
        return '📹'
      case 'teams':
        return '🎥'
      case 'meet':
        return '📞'
      case 'webex':
        return '🎦'
      default:
        return '🎯'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Join Meeting</DialogTitle>
          <DialogDescription>
            Enter a meeting URL to have the AI agent join and record the session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting URL */}
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting URL</Label>
            <Input
              id="meetingUrl"
              placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
              value={meetingUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            
            {/* URL Validation */}
            {urlValidation && (
              <div className="flex items-center gap-2 text-sm">
                {urlValidation.isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">
                      Valid {urlValidation.platform} meeting URL
                    </span>
                    <Badge variant="outline">
                      {getPlatformIcon(urlValidation.platform)} {urlValidation.platform}
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">
                      Invalid meeting URL or unsupported platform
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Optional Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Team Standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Separator />

          {/* Settings Tabs */}
          <Tabs defaultValue="recording" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recording" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Recording
              </TabsTrigger>
              <TabsTrigger value="transcription" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                AI Features
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Automation
              </TabsTrigger>
            </TabsList>

            {/* Recording Tab */}
            <TabsContent value="recording" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5" />
                    Recording Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how the meeting will be recorded and processed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recording Quality */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Recording Quality</Label>
                      <p className="text-sm text-muted-foreground">
                        Higher quality uses more storage
                      </p>
                    </div>
                    <Select
                      value={settings.quality}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setSettings(prev => ({ ...prev, quality: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recording Mode (Recall AI specific) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Recording Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        How the meeting should be recorded
                      </p>
                    </div>
                    <Select
                      value={settings.recordingMode || 'speaker_view'}
                      onValueChange={(value: 'speaker_view' | 'gallery_view' | 'shared_screen') =>
                        setSettings(prev => ({ ...prev, recordingMode: value }))
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="speaker_view">Speaker View</SelectItem>
                        <SelectItem value="gallery_view">Gallery View</SelectItem>
                        <SelectItem value="shared_screen">Shared Screen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recording Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Recording</Label>
                      <p className="text-sm text-muted-foreground">
                        Record audio and video of the meeting
                      </p>
                    </div>
                    <Switch
                      checked={settings.recordingEnabled}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, recordingEnabled: checked }))
                      }
                    />
                  </div>

                  {/* Max Duration */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Max Duration (minutes)</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically leave after this time
                      </p>
                    </div>
                    <Select
                      value={settings.maxDuration?.toString()}
                      onValueChange={(value) =>
                        setSettings(prev => ({ ...prev, maxDuration: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                        <SelectItem value="300">5 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transcription Tab */}
            <TabsContent value="transcription" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Transcription & AI Features
                  </CardTitle>
                  <CardDescription>
                    AI-powered transcription and analysis features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Transcription Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Transcription</Label>
                      <p className="text-sm text-muted-foreground">
                        Convert speech to text in real-time
                      </p>
                    </div>
                    <Switch
                      checked={settings.transcriptionEnabled}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, transcriptionEnabled: checked }))
                      }
                    />
                  </div>

                  {/* Language Selection */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Primary language for transcription
                      </p>
                    </div>
                    <Select
                      value={settings.language}
                      onValueChange={(value) =>
                        setSettings(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Summary Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Generate Summary</Label>
                      <p className="text-sm text-muted-foreground">
                        AI-generated meeting summary and key points
                      </p>
                    </div>
                    <Switch
                      checked={settings.summaryEnabled}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, summaryEnabled: checked }))
                      }
                    />
                  </div>

                  {/* Action Items Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Extract Action Items</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically identify tasks and follow-ups
                      </p>
                    </div>
                    <Switch
                      checked={settings.actionItemsEnabled}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, actionItemsEnabled: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Automation
                  </CardTitle>
                  <CardDescription>
                    Automatic behaviors for the meeting agent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Auto Join */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Join</Label>
                      <p className="text-sm text-muted-foreground">
                        Join immediately when meeting starts
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoJoin}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, autoJoin: checked }))
                      }
                    />
                  </div>

                  {/* Auto Leave */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Leave</Label>
                      <p className="text-sm text-muted-foreground">
                        Leave when meeting ends or reaches max duration
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoLeave}
                      onCheckedChange={(checked) =>
                        setSettings(prev => ({ ...prev, autoLeave: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleJoin}
            disabled={!meetingUrl || !urlValidation?.isValid || isValidating}
          >
            {isValidating ? 'Validating...' : 'Join Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
