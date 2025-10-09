import * as AssistantUI from "@assistant-ui/react";
import { ArrowDownIcon } from "lucide-react";
import { TooltipIconButton } from "../tooltip-icon-button";

import type { FC } from "react";

const { ThreadPrimitive } = AssistantUI as any;

export const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="dark:bg-background dark:hover:bg-accent absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible pointer-events-auto"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

