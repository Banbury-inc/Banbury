import { useMemo } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "../../../common/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "../../../common/ui/popover"
import { Typography } from "@/components/common/ui/typography"
import {
  getModelDisplayName,
  getAvailableModels,
  getModelById,
  getDefaultModelForProvider,
  DEFAULT_VISIBLE_MODELS,
} from "../handlers/getModelDisplayName"
import { getModelsForSelectorSection } from "../handlers/getModelsForSelector"
import type { ComposerToolPreferences } from "../Composer"

interface ModelSelectorProps {
  dynamicModelsCatalogRevision?: number
  toolPreferences: ComposerToolPreferences
  onUpdateToolPreferences: (prefs: ComposerToolPreferences) => void
  isMeasuring: boolean
  isVisible: boolean
}

export function ModelSelector({
  dynamicModelsCatalogRevision = 0,
  toolPreferences,
  onUpdateToolPreferences,
  isMeasuring,
  isVisible,
}: ModelSelectorProps) {
  const availableModels = useMemo(
    () => getAvailableModels(),
    [dynamicModelsCatalogRevision],
  )
  const visibleModels = toolPreferences.visibleModels || DEFAULT_VISIBLE_MODELS
  const openaiSection = useMemo(
    () => getModelsForSelectorSection(availableModels, visibleModels, "openai"),
    [availableModels, visibleModels],
  )
  const anthropicSection = useMemo(
    () => getModelsForSelectorSection(availableModels, visibleModels, "anthropic"),
    [availableModels, visibleModels],
  )
  const googleSection = useMemo(
    () => getModelsForSelectorSection(availableModels, visibleModels, "google"),
    [availableModels, visibleModels],
  )
  if (!isMeasuring && !isVisible) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="primary"
          size="xs"
          className="h-7 px-2 gap-1 flex-shrink-0 whitespace-nowrap"
          title="Model"
          aria-label="Model"
        >
          <Typography variant="small" className="text-xs font-medium">
            {getModelDisplayName(toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider))}
          </Typography>
          <ChevronDown height={16} width={16} strokeWidth={1} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-56 p-0 bg-popover text-popover-foreground border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-h-96 overflow-y-auto"
      >
        <div className="p-1 flex flex-col">
          {openaiSection.map((model) => {
            const isSelected = (toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)) === model.id
            return (
              <div
                key={model.id}
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  const selectedModel = getModelById(model.id)
                  if (selectedModel) {
                    onUpdateToolPreferences({ 
                      ...toolPreferences, 
                      model_id: model.id,
                      model_provider: selectedModel.provider 
                    })
                  }
                }}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {isSelected && <Check className="size-4" />}
                </span>
                <div className="flex items-center">
                  <Typography variant="xs">{model.name}</Typography>
                </div>
              </div>
            )
          })}
          {anthropicSection.map((model) => {
            const isSelected = (toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)) === model.id
            return (
              <div
                key={model.id}
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  const selectedModel = getModelById(model.id)
                  if (selectedModel) {
                    onUpdateToolPreferences({ 
                      ...toolPreferences, 
                      model_id: model.id,
                      model_provider: selectedModel.provider 
                    })
                  }
                }}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {isSelected && <Check className="size-4" />}
                </span>
                <div className="flex items-center">
                  <Typography variant="xs">{model.name}</Typography>
                </div>
              </div>
            )
          })}
          {googleSection.map((model) => {
            const isSelected = (toolPreferences.model_id || getDefaultModelForProvider(toolPreferences.model_provider)) === model.id
            return (
              <div
                key={model.id}
                className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  const selectedModel = getModelById(model.id)
                  if (selectedModel) {
                    onUpdateToolPreferences({ 
                      ...toolPreferences, 
                      model_id: model.id,
                      model_provider: selectedModel.provider 
                    })
                  }
                }}
              >
                <span className="absolute right-2 flex size-3.5 items-center justify-center">
                  {isSelected && <Check className="size-4" />}
                </span>
                <div className="flex items-center">
                  <Typography variant="xs">{model.name}</Typography>
                </div>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
