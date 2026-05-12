import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import {
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
} from "lucide-react";
import { ContentRenderer } from "../../components/ContentRenderer";
import { ToolFallback } from "../../components/tool-fallback";
import { TooltipIconButton } from "../../../tooltip-icon-button";
import { WebSearchTool } from "../../components/web-search-result";
import { TiptapAITool } from "../../components/TiptapAITool";
import { SheetAITool } from "../../components/SheetAITool";
import { DocxAITool } from "../../components/DocxAITool";
import { PptxAITool } from "../../components/PptxAITool";
import { TldrawAITool } from "../../components/TldrawAITool";
import { DrawioAITool } from "../../../../MiddlePanel/CanvasViewer/DrawioAITool";
import { DocumentAITool } from "../../components/DocumentAITool";
import { BrowserTool } from "../../components/BrowserTool";
import { SubagentTool } from "../../components/SubagentTool";
import { CreateFileTool } from "../../components/CreateFileTool";
import { DownloadFileTool } from "../../components/DownloadFileTool";
import { OneDriveTool } from "../../components/OneDriveTool";
import { BranchPicker } from "./BranchPicker";
import { VoiceControls } from "./VoiceControls";
import { typographyVariants } from "../../../../common/ui/typography";
import { cn } from "../../../../../utils";
import type { FC } from "react";

// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const {
  MessagePrimitive,
  ActionBarPrimitive,
  ErrorPrimitive,
} = AssistantUI as any;

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="border-destructive bg-destructive/10 dark:bg-destructive/5 text-destructive mt-2 rounded-md border p-3 dark:text-red-200">
        <ErrorPrimitive.Message className={cn(typographyVariants({ variant: "small" }), "line-clamp-2")} />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      autohideFloat="never"
      className="text-muted-foreground absolute right-0 bottom-0 mt-2 flex gap-1"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <VoiceControls />
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

export const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-1"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="assistant"
      >
        <div className={cn(typographyVariants({ variant: "small" }), "col-start-1 row-start-1 leading-none break-words overflow-x-auto max-w-full pb-10")}>
          <MessagePrimitive.Content
            components={{
              Text: ContentRenderer,
                tools: { 
                by_name: {
                  web_search: WebSearchTool,
                  tiptap_ai: TiptapAITool,
                  sheet_ai: SheetAITool,
                  docx_ai: DocxAITool,
                  pptx_ai: PptxAITool,
                  tldraw_ai: TldrawAITool,
                  drawio_ai: DrawioAITool,
                  document_ai: DocumentAITool,
                  browser: BrowserTool,
                  spawn_subagents: SubagentTool,
                  create_file: CreateFileTool,
                  download_from_url: DownloadFileTool,
                  onedrive_status: OneDriveTool,
                  onedrive_list_root: OneDriveTool,
                  onedrive_list_folder: OneDriveTool,
                  onedrive_search: OneDriveTool,
                  onedrive_get_item: OneDriveTool,
                  onedrive_download_file: OneDriveTool,
                  onedrive_upload_text_file: OneDriveTool,
                  onedrive_update_text_file: OneDriveTool,
                  onedrive_create_folder: OneDriveTool,
                  onedrive_rename_move: OneDriveTool,
                  onedrive_delete_item: OneDriveTool,
                  onedrive_create_share_link: OneDriveTool,
                  onedrive_invite: OneDriveTool,
                  onedrive_get_permissions: OneDriveTool,
                },
                Fallback: ToolFallback 
              },
            }}
          />
          <MessageError />
        </div>

        <AssistantActionBar />

        <BranchPicker className="col-start-1 row-start-2" />
      </motion.div>
    </MessagePrimitive.Root>
  );
};
