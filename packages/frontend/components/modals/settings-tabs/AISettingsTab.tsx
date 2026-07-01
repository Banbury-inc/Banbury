import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Switch } from '../../common/ui/switch'
import { Button } from '../../common/ui/button'
import { Typography } from '@/components/common/ui/typography'
import { useToast } from '../../common/ui/use-toast'
import { getAvailableModels, DEFAULT_VISIBLE_MODELS } from '../../RightPanel/composer/handlers/getModelDisplayName'
import { fetchAnthropicModelsCatalog } from '../../RightPanel/composer/handlers/fetchAnthropicModelsCatalog'
import { fetchOpenAIModelsCatalog } from '../../RightPanel/composer/handlers/fetchOpenAIModelsCatalog'
import { fetchGoogleModelsCatalog } from '../../RightPanel/composer/handlers/fetchGoogleModelsCatalog'
import { getModelsCatalogRevision } from '../../RightPanel/composer/handlers/getModelDisplayName'
import { deleteAllConversations } from './handlers/aiSettingsHandlers'
import { toggleVisibleModel } from './handlers/visibleModelsHandlers'
import { VisibleModelsProviderDropdown } from './VisibleModelsProviderDropdown'
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabLabel,
  SettingsTabNote,
  SettingsTabRow,
  SettingsTabSection,
} from './settings-tab-layout'

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
  meeting_analysis: boolean
  model_provider: "anthropic" | "openai" | "google"
  visibleModels?: string[]
}

const MODEL_PROVIDERS = [
  { id: 'openai', label: 'OpenAI Models' },
  { id: 'anthropic', label: 'Anthropic Models' },
  { id: 'google', label: 'Google Models' },
] as const

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
        meeting_analysis: true,
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
          meeting_analysis: typeof parsed.meeting_analysis === 'boolean' ? parsed.meeting_analysis : true,
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
      meeting_analysis: true,
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
    window.dispatchEvent(new Event('storage'))
  }

  function handleModelVisibilityToggle(modelId: string, checked: boolean) {
    const currentVisible = toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS
    const updatedVisible = toggleVisibleModel(currentVisible, modelId, checked)

    const updatedPreferences = {
      ...toolPreferences,
      visibleModels: updatedVisible,
    }
    setToolPreferences(updatedPreferences)
    localStorage.setItem('toolPreferences', JSON.stringify(updatedPreferences))
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

    window.dispatchEvent(new CustomEvent('assistant-conversations-cleared'))
  }

  return (
    <SettingsTabLayout>
      <SettingsTabHeader title="AI Tool Settings" />

      <SettingsTabCard>
        <SettingsTabCardBody>
          <SettingsTabRow
            label="Gmail Send Email"
            description="Allow the AI assistant to send emails on your behalf. Reading emails and creating drafts stays available."
            htmlFor="gmail-send-toggle"
            align="start"
          >
            <Switch
              id="gmail-send-toggle"
              checked={toolPreferences.gmailSend}
              onCheckedChange={handleGmailSendToggle}
            />
          </SettingsTabRow>
        </SettingsTabCardBody>
      </SettingsTabCard>

      <SettingsTabSection title="Visible Models">
        <Typography variant="small" className="-mt-2 text-muted-foreground">
          Choose which AI models appear in the model picker.
        </Typography>
        <SettingsTabCard>
          <SettingsTabCardBody>
            {MODEL_PROVIDERS.map((provider) => (
              <VisibleModelsProviderDropdown
                key={provider.id}
                label={provider.label}
                models={availableModels.filter((model) => model.provider === provider.id)}
                visibleModelIds={toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS}
                onToggle={handleModelVisibilityToggle}
              />
            ))}
          </SettingsTabCardBody>
        </SettingsTabCard>
      </SettingsTabSection>

      <SettingsTabNote>
        <strong>Note:</strong> Disabling tools will prevent the AI from using them in conversations. Changes take effect immediately.
      </SettingsTabNote>

      <SettingsTabSection title="Danger Zone">
        <SettingsTabCard className="border-destructive/50">
          <SettingsTabCardBody>
            <div className="flex items-start justify-between gap-4 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <SettingsTabLabel
                  label="Delete All AI Conversations"
                  description="Permanently delete all saved AI conversations associated with your account. This action cannot be undone."
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAllConversations}
                disabled={isDeleting}
                className="shrink-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </SettingsTabCardBody>
        </SettingsTabCard>
      </SettingsTabSection>
    </SettingsTabLayout>
  )
}
