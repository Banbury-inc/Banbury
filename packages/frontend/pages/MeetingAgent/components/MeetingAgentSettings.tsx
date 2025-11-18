import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/old-input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/old-switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/old-select'
import { Separator } from '../../../components/ui/separator'
import { Badge } from '../../../components/ui/badge'
import { 
  Settings, 
  Key, 
  Bell, 
  Globe, 
  Save, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { ApiService } from '../../../../backend/api/apiService'
import { MeetingAgentConfig, MeetingPlatform } from '../../../types/meeting-types'
import { useToast } from '../../../components/ui/use-toast'

export function MeetingAgentSettings() {
  const [config, setConfig] = useState<MeetingAgentConfig | null>(null)
  const [platforms, setPlatforms] = useState<MeetingPlatform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null)
  const { toast } = useToast()

  // Load configuration and platforms
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load config with fallback
        let configResult = null
        try {
          configResult = await ApiService.MeetingAgent.getAgentConfig()
        } catch (configError) {
          console.warn('Failed to load config, using defaults:', configError)
          // Fallback config
          configResult = {
            name: 'Meeting Agent',
            defaultSettings: {
              recordingEnabled: true,
              transcriptionEnabled: true,
              summaryEnabled: true,
              actionItemsEnabled: true,
              language: 'en',
              quality: 'high',
              autoJoin: false,
              autoLeave: true,
              maxDuration: 120
            },
            notificationSettings: {
              emailNotifications: true,
              slackNotifications: false,
              webhookNotifications: false,
              summaryDelivery: 'immediate'
            },
            webhookUrl: '',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
        
        // Load platforms with fallback
        let platformsResult = []
        try {
          platformsResult = await ApiService.MeetingAgent.getSupportedPlatforms()
        } catch (platformsError) {
          console.warn('Failed to load platforms, using defaults:', platformsError)
          // Fallback platforms
          platformsResult = [
            { id: 'zoom', name: 'Zoom', icon: '🎥', supported: true, authRequired: true },
            { id: 'teams', name: 'Microsoft Teams', icon: '💼', supported: true, authRequired: true },
            { id: 'meet', name: 'Google Meet', icon: '📞', supported: true, authRequired: true },
            { id: 'webex', name: 'Cisco Webex', icon: '🎦', supported: false, authRequired: true }
          ]
        }
        
        setConfig(configResult)
        setPlatforms(platformsResult)
        
        // Show warning if API is not available
        if (!configResult || platformsResult.length === 0) {
          toast({
            title: 'Limited Functionality',
            description: 'Meeting agent service is not available. Settings may not save properly.',
            variant: 'destructive'
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load settings'
        console.error('Settings load error:', err)
        
        // Still set fallback data so page loads
        setConfig({
          name: 'Meeting Agent',
          defaultSettings: {
            recordingEnabled: true,
            transcriptionEnabled: true,
            summaryEnabled: true,
            actionItemsEnabled: true,
            language: 'en',
            quality: 'high',
            autoJoin: false,
            autoLeave: true,
            maxDuration: 120
          },
          notificationSettings: {
            emailNotifications: true,
            slackNotifications: false,
            webhookNotifications: false,
            summaryDelivery: 'immediate'
          },
          webhookUrl: '',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setPlatforms([
          { id: 'zoom', name: 'Zoom', icon: '🎥', supported: true, authRequired: true },
          { id: 'teams', name: 'Microsoft Teams', icon: '💼', supported: true, authRequired: true },
          { id: 'meet', name: 'Google Meet', icon: '📞', supported: true, authRequired: true },
          { id: 'webex', name: 'Cisco Webex', icon: '🎦', supported: false, authRequired: true }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Save configuration
  const handleSaveConfig = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      const result = await ApiService.MeetingAgent.updateAgentConfig(config)
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully'
        })
        if (result.config) {
          setConfig(result.config)
        }
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings'
      
      // Check if it's a connection error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        toast({
          title: 'Connection Error',
          description: 'Unable to save settings. Meeting agent service is not available.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Test platform authentication
  const handleTestPlatformAuth = async (platformId: string) => {
    try {
      setTestingPlatform(platformId)
      const result = await ApiService.MeetingAgent.testPlatformAuth(platformId)
      
      const statusMessages = {
        valid: 'Authentication is working correctly',
        invalid: 'Authentication credentials are invalid',
        expired: 'Authentication has expired, please re-authenticate',
        missing: 'No authentication credentials found'
      }
      
      toast({
        title: result.success ? 'Success' : 'Authentication Issue',
        description: statusMessages[result.authStatus] || result.message,
        variant: result.success ? 'default' : 'destructive'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test authentication'
      
      // Check if it's a connection error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        toast({
          title: 'Connection Error',
          description: 'Unable to test authentication. Meeting agent service is not available.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } finally {
      setTestingPlatform(null)
    }
  }

  // Update config helper
  const updateConfig = (updates: Partial<MeetingAgentConfig>) => {
    if (!config) return
    setConfig(prev => prev ? { ...prev, ...updates } : null)
  }

  // Update default settings helper
  const updateDefaultSettings = (updates: Partial<typeof config.defaultSettings>) => {
    if (!config) return
    setConfig(prev => prev ? {
      ...prev,
      defaultSettings: { ...prev.defaultSettings, ...updates }
    } : null)
  }

  // Update notification settings helper
  const updateNotificationSettings = (updates: Partial<typeof config.notificationSettings>) => {
    if (!config) return
    setConfig(prev => prev ? {
      ...prev,
      notificationSettings: { ...prev.notificationSettings, ...updates }
    } : null)
  }

  if (isLoading || !config) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Platform Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Platform Authentication
          </CardTitle>
          <CardDescription>
            Configure authentication for meeting platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((platform) => (
            <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {platform.supported ? 'Supported' : 'Coming soon'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={platform.supported ? 'default' : 'outline'}>
                  {platform.supported ? 'Available' : 'Unsupported'}
                </Badge>
                {platform.supported && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestPlatformAuth(platform.id)}
                    disabled={testingPlatform === platform.id}
                  >
                    <TestTube className="h-3 w-3 mr-1" />
                    {testingPlatform === platform.id ? 'Testing...' : 'Test Auth'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Default Meeting Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Default Meeting Settings
          </CardTitle>
          <CardDescription>
            These settings will be applied to new meetings by default
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Recording</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Recording by Default</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically record new meetings
                </p>
              </div>
              <Switch
                checked={config.defaultSettings.recordingEnabled}
                onCheckedChange={(checked) =>
                  updateDefaultSettings({ recordingEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Default Quality</Label>
                <p className="text-sm text-muted-foreground">
                  Recording quality for new meetings
                </p>
              </div>
              <Select
                value={config.defaultSettings.quality}
                onValueChange={(value: 'low' | 'medium' | 'high') =>
                  updateDefaultSettings({ quality: value })
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
          </div>

          <Separator />

          {/* Transcription Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Transcription</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Transcription by Default</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically transcribe new meetings
                </p>
              </div>
              <Switch
                checked={config.defaultSettings.transcriptionEnabled}
                onCheckedChange={(checked) =>
                  updateDefaultSettings({ transcriptionEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Default Language</Label>
                <p className="text-sm text-muted-foreground">
                  Primary language for transcription
                </p>
              </div>
              <Select
                value={config.defaultSettings.language}
                onValueChange={(value) =>
                  updateDefaultSettings({ language: value })
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
          </div>

          <Separator />

          {/* AI Features */}
          <div className="space-y-4">
            <h4 className="font-medium">AI Features</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Generate Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically generate meeting summaries
                </p>
              </div>
              <Switch
                checked={config.defaultSettings.summaryEnabled}
                onCheckedChange={(checked) =>
                  updateDefaultSettings({ summaryEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Extract Action Items</Label>
                <p className="text-sm text-muted-foreground">
                  Identify tasks and follow-ups
                </p>
              </div>
              <Switch
                checked={config.defaultSettings.actionItemsEnabled}
                onCheckedChange={(checked) =>
                  updateDefaultSettings({ actionItemsEnabled: checked })
                }
              />
            </div>
          </div>

          <Separator />

          {/* Automation */}
          <div className="space-y-4">
            <h4 className="font-medium">Automation</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Join</Label>
                <p className="text-sm text-muted-foreground">
                  Join meetings automatically when they start
                </p>
              </div>
              <Switch
                checked={config.defaultSettings.autoJoin}
                onCheckedChange={(checked) =>
                  updateDefaultSettings({ autoJoin: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Leave</Label>
                <p className="text-sm text-muted-foreground">
                  Leave meetings when they end
                </p>
              </div>
              <Switch
                checked={config.defaultSettings.autoLeave}
                onCheckedChange={(checked) =>
                  updateDefaultSettings({ autoLeave: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Max Duration (minutes)</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically leave after this time
                </p>
              </div>
              <Select
                value={config.defaultSettings.maxDuration.toString()}
                onValueChange={(value) =>
                  updateDefaultSettings({ maxDuration: parseInt(value) })
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
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how you receive meeting updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={config.notificationSettings.emailNotifications}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Slack Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send updates to Slack
              </p>
            </div>
            <Switch
              checked={config.notificationSettings.slackNotifications}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ slackNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Webhook Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send updates to custom webhook
              </p>
            </div>
            <Switch
              checked={config.notificationSettings.webhookNotifications}
              onCheckedChange={(checked) =>
                updateNotificationSettings({ webhookNotifications: checked })
              }
            />
          </div>

          {config.notificationSettings.webhookNotifications && (
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://your-webhook-url.com/meetings"
                value={config.webhookUrl || ''}
                onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Summary Delivery</Label>
              <p className="text-sm text-muted-foreground">
                How often to send meeting summaries
              </p>
            </div>
            <Select
              value={config.notificationSettings.summaryDelivery}
              onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                updateNotificationSettings({ summaryDelivery: value })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveConfig} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
