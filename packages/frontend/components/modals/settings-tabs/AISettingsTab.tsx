import { useEffect, useMemo, useState } from 'react'
import { Brain, Mail, Sparkles, Trash2 } from 'lucide-react'
import { Switch } from '../../common/ui/switch'
import { Button } from '../../common/ui/button'
import { Typography } from '@/components/common/ui/typography'
import { Label } from '@/components/common/ui/label'
import { Separator } from '@/components/common/ui/separator'
import { useToast } from '../../common/ui/use-toast'
import { getAvailableModels, DEFAULT_VISIBLE_MODELS } from '../../RightPanel/composer/handlers/getModelDisplayName'
import { fetchAnthropicModelsCatalog } from '../../RightPanel/composer/handlers/fetchAnthropicModelsCatalog'
import { fetchOpenAIModelsCatalog } from '../../RightPanel/composer/handlers/fetchOpenAIModelsCatalog'
import { fetchGoogleModelsCatalog } from '../../RightPanel/composer/handlers/fetchGoogleModelsCatalog'
import { getModelsCatalogRevision } from '../../RightPanel/composer/handlers/getModelDisplayName'
import { deleteAllConversations } from './handlers/aiSettingsHandlers'

interface ToolPreferences {
  web_search: boolean
  tiptap_ai: boolean
  read_file: boolean
  gmail: boolean
  gmailSend: boolean
  langgraph_mode: boolean
  browser: boolean
  x_api: boolean
  slack: boolean
  onedrive: boolean
  notion: boolean
  model_provider: "anthropic" | "openai" | "google"
  visibleModels?: string[]
}

export function AISettingsTab() {
  const { toast } = useToast()
  const [modelsCatalogRevision, setModelsCatalogRevision] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      fetchOpenAIModelsCatalog(),
      fetchAnthropicModelsCatalog(),
      fetchGoogleModelsCatalog(),
    ]).then(() => {
      setModelsCatalogRevision(getModelsCatalogRevision())
    })
  }, [])

  const availableModels = useMemo(
    () => getAvailableModels(),
    [modelsCatalogRevision],
  )
  const [toolPreferences, setToolPreferences] = useState<ToolPreferences>(() => {
    if (typeof window === 'undefined') {
      return {
        web_search: true,
        tiptap_ai: true,
        read_file: true,
        gmail: true,
        gmailSend: true,
        langgraph_mode: true,
        browser: false,
        x_api: false,
        slack: false,
        onedrive: false,
        notion: false,
        model_provider: 'anthropic',
        visibleModels: DEFAULT_VISIBLE_MODELS,
      }
    }

    try {
      const saved = localStorage.getItem('toolPreferences')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          web_search: parsed.web_search !== false,
          tiptap_ai: parsed.tiptap_ai !== false,
          read_file: parsed.read_file !== false,
          gmail: parsed.gmail !== false,
          gmailSend: parsed.gmailSend !== false,
          langgraph_mode: true,
          browser: typeof parsed.browser === 'boolean' ? parsed.browser : false,
          x_api: typeof parsed.x_api === 'boolean' ? parsed.x_api : false,
          slack: typeof parsed.slack === 'boolean' ? parsed.slack : false,
          onedrive: typeof parsed.onedrive === 'boolean' ? parsed.onedrive : false,
          notion: typeof parsed.notion === 'boolean' ? parsed.notion : false,
          model_provider: parsed.model_provider === 'google' ? 'google' : (parsed.model_provider === 'openai' ? 'openai' : 'anthropic'),
          visibleModels: Array.isArray(parsed.visibleModels) ? parsed.visibleModels : DEFAULT_VISIBLE_MODELS,
        }
      }
    } catch {
      localStorage.removeItem('toolPreferences')
    }
    return {
      web_search: true,
      tiptap_ai: true,
      read_file: true,
      gmail: true,
      gmailSend: true,
      langgraph_mode: true,
      browser: false,
      x_api: false,
      slack: false,
      onedrive: false,
      notion: false,
      model_provider: 'anthropic',
      visibleModels: DEFAULT_VISIBLE_MODELS,
    }
  })

  function handleGmailSendToggle(checked: boolean) {
    const updatedPreferences = {
      ...toolPreferences,
      gmailSend: checked,
    }
    setToolPreferences(updatedPreferences)
    localStorage.setItem('toolPreferences', JSON.stringify(updatedPreferences))

    // Dispatch storage event for other components to pick up
    window.dispatchEvent(new Event('storage'))
  }

  function handleModelVisibilityToggle(modelId: string, checked: boolean) {
    const currentVisible = toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS
    const updatedVisible = checked
      ? [...currentVisible, modelId]
      : currentVisible.filter(id => id !== modelId)

    const updatedPreferences = {
      ...toolPreferences,
      visibleModels: updatedVisible,
    }
    setToolPreferences(updatedPreferences)
    localStorage.setItem('toolPreferences', JSON.stringify(updatedPreferences))

    // Dispatch storage event for other components to pick up
    window.dispatchEvent(new Event('storage'))
  }

  async function handleDeleteAllConversations() {
    const confirmed = window.confirm(
      'Are you sure you want to delete all your AI conversations? This action cannot be undone.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    const result = await deleteAllConversations()
    setIsDeleting(false)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete conversations',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Conversations Deleted',
      description: `Successfully deleted ${result.deletedCount ?? 'all'} conversations.`,
    })

    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('assistant-conversations-cleared'))
  }

  return (
    <div className="space-y-6">
      <Typography variant="h3" className="mb-4 flex items-center text-foreground">
        <Brain className="h-5 w-5 mr-2" />
        AI Tool Settings
      </Typography>
      <Separator />

      <div className="space-y-6">
        {/* Gmail Send Message Tool */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="gmail-send-toggle">
                  <Typography variant="p" className="font-medium text-foreground">
                    Gmail Send Email
                  </Typography>
                </Label>
                <Typography variant="small" className="mt-1 text-muted-foreground">
                  Allow the AI assistant to send emails on your behalf. Reading emails and creating drafts stays available.
                </Typography>
              </div>
            </div>
            <Switch
              id="gmail-send-toggle"
              checked={toolPreferences.gmailSend}
              onCheckedChange={handleGmailSendToggle}
            />
          </div>
        </div>

        <Separator />

        {/* Model Visibility Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <div>
              <Typography variant="p" className="font-medium text-foreground">
                Visible Models
              </Typography>
              <Typography variant="small" className="mt-1 text-muted-foreground">
                Choose which AI models appear in the model picker.
              </Typography>
            </div>
          </div>

          {/* OpenAI Models */}
          <div className="space-y-2 pl-8">
            <Typography variant="small" className="font-semibold text-foreground">
              OpenAI Models
            </Typography>
            <div className="space-y-2">
              {availableModels.filter(m => m.provider === "openai").map(model => (
                <div key={model.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.id}`}>
                      <Typography variant="small" className="text-foreground">
                        {model.name}
                      </Typography>
                    </Label>
                  </div>
                  <Switch
                    id={`model-${model.id}`}
                    checked={(toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS).includes(model.id)}
                    onCheckedChange={(checked) => handleModelVisibilityToggle(model.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Anthropic Models */}
          <div className="space-y-2 pl-8">
            <Typography variant="small" className="font-semibold text-foreground">
              Anthropic Models
            </Typography>
            <div className="space-y-2">
              {availableModels.filter(m => m.provider === "anthropic").map(model => (
                <div key={model.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.id}`}>
                      <Typography variant="small" className="text-foreground">
                        {model.name}
                      </Typography>
                    </Label>
                  </div>
                  <Switch
                    id={`model-${model.id}`}
                    checked={(toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS).includes(model.id)}
                    onCheckedChange={(checked) => handleModelVisibilityToggle(model.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Google Models */}
          <div className="space-y-2 pl-8">
            <Typography variant="small" className="font-semibold text-foreground">
              Google Models
            </Typography>
            <div className="space-y-2">
              {availableModels.filter(m => m.provider === "google").map(model => (
                <div key={model.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.id}`}>
                      <Typography variant="small" className="text-foreground">
                        {model.name}
                      </Typography>
                    </Label>
                  </div>
                  <Switch
                    id={`model-${model.id}`}
                    checked={(toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS).includes(model.id)}
                    onCheckedChange={(checked) => handleModelVisibilityToggle(model.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
        <Typography variant="small" className="text-muted-foreground">
          <strong>Note:</strong> Disabling tools will prevent the AI from using them in conversations. Changes take effect immediately.
        </Typography>
      </div>

      <Separator className="my-6" />

      {/* Danger Zone */}
      <div className="space-y-4">
        <Typography variant="h3" className="flex items-center text-destructive">
          <Trash2 className="h-5 w-5 mr-2" />
          Danger Zone
        </Typography>
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Typography variant="p" className="font-medium text-foreground">
                Delete All AI Conversations
              </Typography>
              <Typography variant="small" className="mt-1 text-muted-foreground">
                Permanently delete all saved AI conversations associated with your account. This action cannot be undone.
              </Typography>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAllConversations}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

