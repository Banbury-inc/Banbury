import { ActionItem } from '../../../types/meeting-types'
import { Checkbox } from '../../ui/checkbox'
import { Typography } from '../../ui/typography'
import { cn } from '../../../utils'

interface ActionItemsChecklistProps {
  actionItems: ActionItem[]
  checkedStates: Map<string, boolean>
  onCheckedChange: (actionItemId: string, checked: boolean) => void
  className?: string
}

export function ActionItemsChecklist({ 
  actionItems, 
  checkedStates,
  onCheckedChange,
  className 
}: ActionItemsChecklistProps) {

  if (actionItems.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Typography variant="h4" className="text-base font-semibold">
        Action Items
      </Typography>
      <div className="space-y-2">
        {actionItems.map((item) => {
          const isChecked = checkedStates.get(item.id) === true
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-md transition-colors",
                isChecked ? "bg-muted/50" : "hover:bg-muted/30"
              )}
            >
              <Checkbox
                id={`action-item-${item.id}`}
                checked={isChecked}
                onCheckedChange={(checked) => {
                  onCheckedChange(item.id, checked === true)
                }}
                className="mt-1"
              />
              <label
                htmlFor={`action-item-${item.id}`}
                className={cn(
                  "flex-1 cursor-pointer",
                  isChecked && "line-through text-muted-foreground"
                )}
              >
                <Typography variant="p" className="text-sm">
                  {item.description}
                </Typography>
                {item.assignee && (
                  <Typography variant="small" className="text-xs text-muted-foreground mt-0.5">
                    Assigned to: {item.assignee}
                  </Typography>
                )}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
