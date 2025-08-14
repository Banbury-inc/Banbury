declare module "@assistant-ui/react" {
  import type { ReactNode } from "react";

  export type ChatModelRunOptions = {
    messages: any[];
    abortSignal?: AbortSignal;
  };

  export type ChatModelRunResult = {
    content: any[];
    status: any;
  };

  export type ChatModelAdapter = {
    run(options: ChatModelRunOptions): Promise<ChatModelRunResult>;
  };

  export const AssistantRuntimeProvider: React.FC<{
    runtime: any;
    children?: ReactNode;
  }>;

  export function useLocalRuntime(adapter: ChatModelAdapter): any;

  // Minimal ambient declarations used throughout the app
  export const ThreadPrimitive: any;
  export const ComposerPrimitive: any;
  export const MessagePrimitive: any;
  export const ActionBarPrimitive: any;
  export const BranchPickerPrimitive: any;
  export const ErrorPrimitive: any;
  export function useComposerRuntime(): any;
  export function useThreadRuntime(): any;
}


