import React from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Composer, ComposerToolPreferences } from "../../../components/RightPanel/composer/Composer";
import { TooltipProvider } from "../../../components/common/ui/tooltip";
import { toolConfigs } from "../../../components/RightPanel/composer/handlers/toolConfig";
import { Check } from "lucide-react";
import { Typography } from "../../../components/common/ui/typography";
import type { FileSystemItem } from "../../../utils/fileTreeUtils";

// Default tool preferences for mock composers
const defaultToolPreferences: ComposerToolPreferences = {
  web_search: true,
  tiptap_ai: true,
  read_file: true,
  gmail: false,
  langgraph_mode: false,
  browser: true,
  x_api: false,
  slack: false,
  teams: false,
  onedrive: false,
  sheet_ai: true,
  docx_ai: true,
  pptx_ai: true,
  tldraw_ai: true,
  document_ai: true,
  create_file: true,
  create_folder: true,
  download_from_url: true,
  search_files: true,
  calendar: false,
  msCalendar: false,
  meeting_analysis: true,
  notion: false,
  github: false,
  generate_image: true,
  generate_video: true,
  memory: true,
  plan_mode: false,
  ask_mode: false,
  model_provider: "anthropic" as const,
};

// Mock runtime wrapper for AssistantUI
function MockRuntimeWrapper({ children }: { children: React.ReactNode }) {
  const runtime = useLocalRuntime({
    async run() {
      return {
        content: [{ type: "text" as const, text: "Mock response" }],
        status: { type: "complete" as const, reason: "stop" as const },
      };
    },
  });

  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}

// Common container styling for docs
function DocsComposerContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: "400px",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
        pointerEvents: "none", // Disable interactions for docs display
      }}
    >
      {children}
    </div>
  );
}

// Base mock composer component
function BaseMockComposer({
  attachedFiles = [],
}: {
  attachedFiles?: FileSystemItem[];
}) {
  return (
    <MockRuntimeWrapper>
      <DocsComposerContainer>
        <Composer
          attachedFiles={attachedFiles}
          attachedEmails={[]}
          onFileAttach={() => {}}
          onFileRemove={() => {}}
          onEmailAttach={() => {}}
          onEmailRemove={() => {}}
          userInfo={{ username: "demo", email: "demo@example.com" }}
          toolPreferences={defaultToolPreferences}
          onUpdateToolPreferences={() => {}}
          attachmentPayloads={{}}
          onAttachmentPayload={() => {}}
          onSend={() => {}}
          onFileView={() => {}}
          pendingChanges={[]}
          onAcceptAll={() => {}}
          onRejectAll={() => {}}
          onOpenFile={() => {}}
          queuedMessages={[]}
          onQueueMessage={() => {}}
          onRemoveQueuedMessage={() => {}}
          onMoveQueuedMessageToFront={() => {}}
          onSendNextQueued={() => {}}
        />
      </DocsComposerContainer>
    </MockRuntimeWrapper>
  );
}

// Basic empty composer for Steps 1 & 2
export function MockComposerBasic() {
  return <BaseMockComposer />;
}

// Composer with attached file for Step 3
export function MockComposerWithFile() {
  const mockFile: FileSystemItem = {
    id: "mock-file-1",
    name: "quarterly-report.pdf",
    path: "/documents/quarterly-report.pdf",
    type: "file",
    file_id: "mock-file-1",
    size: 1024000,
  };

  return <BaseMockComposer attachedFiles={[mockFile]} />;
}

// Static tools panel that visually mimics the dropdown for Step 4
function StaticToolsPanel() {
  // Show a subset of tools to keep the panel reasonable size
  const displayedTools = toolConfigs.slice(0, 10);

  return (
    <div
      className="bg-popover text-popover-foreground border rounded-md shadow-md"
      style={{
        width: "288px", // w-72 = 18rem = 288px
        maxHeight: "384px", // max-h-96
        overflow: "hidden",
      }}
    >
      <div className="p-1 flex flex-col">
        {displayedTools.map((tool) => {
          const Icon = tool.icon;
          const isEnabled = tool.defaultEnabled;

          return (
            <div
              key={tool.key}
              className="relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm"
            >
              <span className="absolute right-2 flex size-3.5 items-center justify-center">
                {isEnabled && <Check className="size-4" />}
              </span>
              <div className="flex items-center">
                <Icon
                  size={16}
                  strokeWidth={1}
                  className={`mr-2 ${tool.iconColor}`}
                />
                <Typography variant="xs" className="text-xs font-medium">
                  {tool.label}
                </Typography>
              </div>
            </div>
          );
        })}
        <div className="px-2 py-1 text-xs text-muted-foreground">
          + {toolConfigs.length - displayedTools.length} more tools...
        </div>
      </div>
    </div>
  );
}

// Composer with tools dropdown displayed open for Step 4
export function MockComposerWithToolsOpen() {
  return (
    <MockRuntimeWrapper>
      <div style={{ maxWidth: "400px" }}>
        {/* Static tools panel positioned above the composer */}
        <div
          style={{
            marginBottom: "8px",
            pointerEvents: "none",
          }}
        >
          <StaticToolsPanel />
        </div>

        {/* The composer below */}
        <DocsComposerContainer>
          <Composer
            attachedFiles={[]}
            attachedEmails={[]}
            onFileAttach={() => {}}
            onFileRemove={() => {}}
            onEmailAttach={() => {}}
            onEmailRemove={() => {}}
            userInfo={{ username: "demo", email: "demo@example.com" }}
            toolPreferences={defaultToolPreferences}
            onUpdateToolPreferences={() => {}}
            attachmentPayloads={{}}
            onAttachmentPayload={() => {}}
            onSend={() => {}}
            onFileView={() => {}}
            pendingChanges={[]}
            onAcceptAll={() => {}}
            onRejectAll={() => {}}
            onOpenFile={() => {}}
            queuedMessages={[]}
            onQueueMessage={() => {}}
            onRemoveQueuedMessage={() => {}}
            onMoveQueuedMessageToFront={() => {}}
            onSendNextQueued={() => {}}
          />
        </DocsComposerContainer>
      </div>
    </MockRuntimeWrapper>
  );
}
