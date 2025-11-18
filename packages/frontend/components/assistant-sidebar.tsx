import { Thread } from "./thread";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import { ClaudeRuntimeProvider } from "../assistant/ClaudeRuntimeProvider/ClaudeRuntimeProvider";

import type { FC, PropsWithChildren } from "react";


export const AssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={75} minSize={50}>
        {children}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <ClaudeRuntimeProvider>
          <Thread />
        </ClaudeRuntimeProvider>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
