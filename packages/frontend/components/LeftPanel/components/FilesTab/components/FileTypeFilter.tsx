import { CheckIcon, ChevronDownIcon, Filter, X } from "lucide-react"
import type { Dispatch } from "react"
import { cn } from "../../../../../lib/utils"
import { Typography } from "../../../../common/ui/typography"
import { Popover, PopoverContent, PopoverTrigger } from "../../../../common/ui/popover"
import { FILE_TYPE_CATEGORIES } from "../handlers/handleFileTypeFilter"

interface FileTypeFilterProps {
  activeFilters: Set<string>
  onToggleFilter: Dispatch<string>
  onClearFilters(): void
}

export function FileTypeFilter({ activeFilters, onToggleFilter, onClearFilters }: FileTypeFilterProps) {
  return (
    <Popover>
      <PopoverTrigger
        data-slot="select-trigger"
        data-size="xs"
        title="Filter by file type"
        aria-label="Filter by file type"
        className={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent hover:text-accent-foreground flex min-w-14 w-fit items-center justify-between gap-2 rounded-md bg-transparent whitespace-nowrap shadow-xs transition-[color,background-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=default]:px-3 data-[size=default]:py-2 data-[size=default]:text-sm data-[size=sm]:h-8 data-[size=sm]:px-3 data-[size=sm]:py-1.5 data-[size=sm]:text-sm data-[size=xs]:h-7 data-[size=xs]:px-2 data-[size=xs]:py-1 data-[size=xs]:text-xs *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:overflow-hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[size=xs]:[&_svg:not([class*='size-'])]:size-3 flex-shrink-0 relative",
          activeFilters.size > 0 && "border-primary"
        )}
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        <ChevronDownIcon className="size-4 opacity-50 flex-shrink-0" />
        {activeFilters.size > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
            {activeFilters.size}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="end"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="flex items-center justify-between mb-2 pb-2 border-b">
          <Typography variant="xs" className="font-medium">Filter by type</Typography>
          {activeFilters.size > 0 && (
            <button
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {Object.entries(FILE_TYPE_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              type="button"
              role="menuitemcheckbox"
              aria-checked={activeFilters.has(key)}
              onClick={() => onToggleFilter(key)}
              className="focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <span className="absolute right-2 flex size-3.5 items-center justify-center">
                {activeFilters.has(key) && <CheckIcon className="size-4" />}
              </span>
              <Typography variant="xs">{category.label}</Typography>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
