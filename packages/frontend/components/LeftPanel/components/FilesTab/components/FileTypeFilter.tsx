import { Filter, X } from "lucide-react"
import { Button } from "../../../../common/ui/button"
import { Typography } from "../../../../common/ui/typography"
import { Popover, PopoverContent, PopoverTrigger } from "../../../../common/ui/popover"
import { Checkbox } from "../../../../common/ui/checkbox"
import { FILE_TYPE_CATEGORIES } from "../handlers/handleFileTypeFilter"

interface FileTypeFilterProps {
  activeFilters: Set<string>
  onToggleFilter: (categoryKey: string) => void
  onClearFilters: () => void
}

export function FileTypeFilter({ activeFilters, onToggleFilter, onClearFilters }: FileTypeFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          title="Filter by file type"
          className={`flex-shrink-0 relative ${activeFilters.size > 0 ? 'border-primary' : ''} hover:bg-accent hover:text-accent-foreground`}
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          {activeFilters.size > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {activeFilters.size}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
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
            <label
              key={key}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={activeFilters.has(key)}
                onCheckedChange={() => onToggleFilter(key)}
              />
              <Typography variant="xs">{category.label}</Typography>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
