declare module "@assistant-ui/react" {
  import type { ReactNode } from "react";

  export const AssistantRuntimeProvider: React.FC<{ runtime: any; children?: ReactNode }>;
}


