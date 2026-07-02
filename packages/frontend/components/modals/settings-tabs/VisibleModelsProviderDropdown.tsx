import { ChevronDown, Check } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../common/ui/popover'
import { Typography } from '@/components/common/ui/typography'
import type { ModelConfig } from '../../RightPanel/composer/handlers/getModelDisplayName'
import {
  countVisibleModelsForProvider,
  formatVisibleModelsSummary,
} from './handlers/visibleModelsHandlers'
import { SettingsTabRow } from './settings-tab-layout'

interface VisibleModelsProviderDropdownProps {
  label: string
  models: ModelConfig[]
  visibleModelIds: string[]
  onToggle: (modelId: string, checked: boolean) => void
}

export function VisibleModelsProviderDropdown({
  label,
  models,
  visibleModelIds,
  onToggle,
}: VisibleModelsProviderDropdownProps) {
  const selectedCount = countVisibleModelsForProvider(visibleModelIds, models)
  const summary = formatVisibleModelsSummary(selectedCount, models.length)

  return (
    <SettingsTabRow label={label} align="center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-[11rem] justify-between gap-2 bg-background px-3"
            disabled={models.length === 0}
          >
            <Typography variant="small" className="truncate font-normal text-foreground">
              {summary}
            </Typography>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-72 p-0 bg-popover text-popover-foreground border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <div className="max-h-72 overflow-y-auto p-1">
            {models.length === 0 ? (
              <Typography variant="small" className="px-2 py-3 text-muted-foreground">
                No models available
              </Typography>
            ) : (
              models.map((model) => {
                const isSelected = visibleModelIds.includes(model.id)
                return (
                  <button
                    key={model.id}
                    type="button"
                    className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={() => onToggle(model.id, !isSelected)}
                  >
                    <span className="absolute right-2 flex size-3.5 items-center justify-center">
                      {isSelected && <Check className="size-4" />}
                    </span>
                    <Typography variant="small" className="font-normal text-foreground">
                      {model.name}
                    </Typography>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </SettingsTabRow>
  )
}
