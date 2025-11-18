import * as AssistantUI from "@assistant-ui/react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { TooltipIconButton } from "../../../tooltip-icon-button"
import { cn } from "../../../../../utils"

import type { FC } from "react"

// Destructure Assistant UI primitives from namespace import
const {
  BranchPickerPrimitive,
} = AssistantUI as any

export const BranchPicker: FC<any> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn("text-muted-foreground inline-flex items-center text-xs", className)}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  )
}

