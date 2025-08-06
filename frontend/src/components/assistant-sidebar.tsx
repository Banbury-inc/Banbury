import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import type { FC, PropsWithChildren } from "react";

import { Thread } from "./thread";

export const AssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={75} minSize={50}>
        {children}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <Thread />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
