import {
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import type { FC } from "react";

import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { Button } from "@/components/ui/button";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="text-foreground flex flex-col items-stretch gap-1.5">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button className="data-active:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" variant="ghost">
        <PlusIcon />
        New Thread
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return (
    <div className="flex flex-col gap-1">
      {/* Placeholder for thread items - this would be populated by the assistant-ui runtime */}
      <div className="data-active:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2">
        <button className="flex-grow px-3 py-2 text-start">
          <p className="text-sm">New Chat</p>
        </button>
        <TooltipIconButton
          className="hover:text-foreground/60 p-4 text-foreground ml-auto mr-1 size-4"
          variant="ghost"
          tooltip="Archive thread"
        >
          <ArchiveIcon />
        </TooltipIconButton>
      </div>
    </div>
  );
};
