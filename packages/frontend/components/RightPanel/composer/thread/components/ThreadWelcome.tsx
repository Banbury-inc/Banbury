import * as AssistantUI from "@assistant-ui/react";
import type { FC } from "react";

// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const { ThreadPrimitive } = AssistantUI as any;

export const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)]">
        <div className="flex w-full flex-grow flex-col items-center justify-center gap-6" />
      </div>
    </ThreadPrimitive.Empty>
  );
};
