import { useState, useEffect } from 'react'
import { Brain, Mail, Sparkles } from 'lucide-react'
import { Switch } from '../../ui/switch'
import { Typography } from 'frontend/components/ui/typography'
import { Label } from 'frontend/components/ui/label'
import { Separator } from 'frontend/components/ui/separator'
import { AVAILABLE_MODELS, DEFAULT_VISIBLE_MODELS, type ModelProvider } from '../../RightPanel/composer/handlers/getModelDisplayName'

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
  model_provider: "anthropic" | "openai" | "google"
  visibleModels?: string[]
}

export function AISettingsTab() {
  const [toolPreferences, setToolPreferences] = useState<ToolPreferences>(() => {
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
          model_provider: parsed.model_provider === 'google' ? 'google' : (parsed.model_provider === 'openai' ? 'openai' : 'anthropic'),
          visibleModels: Array.isArray(parsed.visibleModels) ? parsed.visibleModels : DEFAULT_VISIBLE_MODELS,
        }
      }
    } catch {}
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

  return (
    <div className="space-y-6">
      <Typography variant="h3" className="mb-4 flex items-center text-zinc-900 dark:text-white">
        <Brain className="h-5 w-5 mr-2" />
        AI Tool Settings
      </Typography>
      <Separator />

      <div className="space-y-6">
        {/* Gmail Send Message Tool */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <div className="flex-1">
                <Label htmlFor="gmail-send-toggle">
                  <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">
                    Gmail Send Email
                  </Typography>
                </Label>
                <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mt-1">
                  Allow the AI assistant to send emails on your behalf (reading emails and creating drafts is always allowed)
                </Typography>
              </div>
            </div>
            <Switch
              id="gmail-send-toggle"
              checked={toolPreferences.gmailSend}
              onCheckedChange={handleGmailSendToggle}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>

        <Separator />

        {/* Model Visibility Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <div>
              <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">
                Visible Models
              </Typography>
              <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mt-1">
                Choose which AI models appear in the model dropdown
              </Typography>
            </div>
          </div>

          {/* OpenAI Models */}
          <div className="space-y-2 pl-8">
            <Typography variant="small" className="text-zinc-700 dark:text-zinc-300 font-semibold">
              OpenAI Models
            </Typography>
            <div className="space-y-2">
              {AVAILABLE_MODELS.filter(m => m.provider === "openai").map(model => (
                <div key={model.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.id}`}>
                      <Typography variant="small" className="text-zinc-900 dark:text-white">
                        {model.name}
                      </Typography>
                    </Label>
                  </div>
                  <Switch
                    id={`model-${model.id}`}
                    checked={(toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS).includes(model.id)}
                    onCheckedChange={(checked) => handleModelVisibilityToggle(model.id, checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Anthropic Models */}
          <div className="space-y-2 pl-8">
            <Typography variant="small" className="text-zinc-700 dark:text-zinc-300 font-semibold">
              Anthropic Models
            </Typography>
            <div className="space-y-2">
              {AVAILABLE_MODELS.filter(m => m.provider === "anthropic").map(model => (
                <div key={model.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.id}`}>
                      <Typography variant="small" className="text-zinc-900 dark:text-white">
                        {model.name}
                      </Typography>
                    </Label>
                  </div>
                  <Switch
                    id={`model-${model.id}`}
                    checked={(toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS).includes(model.id)}
                    onCheckedChange={(checked) => handleModelVisibilityToggle(model.id, checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Google Models */}
          <div className="space-y-2 pl-8">
            <Typography variant="small" className="text-zinc-700 dark:text-zinc-300 font-semibold">
              Google Models
            </Typography>
            <div className="space-y-2">
              {AVAILABLE_MODELS.filter(m => m.provider === "google").map(model => (
                <div key={model.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.id}`}>
                      <Typography variant="small" className="text-zinc-900 dark:text-white">
                        {model.name}
                      </Typography>
                    </Label>
                  </div>
                  <Switch
                    id={`model-${model.id}`}
                    checked={(toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS).includes(model.id)}
                    onCheckedChange={(checked) => handleModelVisibilityToggle(model.id, checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">
          <strong>Note:</strong> Disabling tools will prevent the AI from using them in conversations. Changes take effect immediately.
        </Typography>
      </div>
    </div>
  )
}

