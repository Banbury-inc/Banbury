import ToolCallCard from "./ToolCallCard";
import { Button } from "../../../ui/button";

import type { FC, ReactNode } from "react";

interface BrowserToolResult {
  sessionId: string;
  viewerUrl: string;
  title?: string;
  url?: string;
}

interface ToolCallProps {
  toolName: string;
  argsText: string;
  result?: unknown;
}

export const BrowserTool: FC<ToolCallProps> = ({ toolName, argsText, result }) => {
  if (toolName !== "browserbase") return null;

  const parseResult = (value: unknown): BrowserToolResult | null => {
    try {
      if (!value) return null;
      if (typeof value === "string") return JSON.parse(value) as BrowserToolResult;
      return value as BrowserToolResult;
    } catch {
      return null;
    }
  };

  const parsed = parseResult(result);

  const handleOpen = () => {
    if (!parsed?.viewerUrl) return;
    try {
      window.dispatchEvent(new CustomEvent('assistant-open-browser', { detail: { viewerUrl: parsed.viewerUrl, title: parsed.title || 'Browser Session', sessionId: parsed.sessionId } }));
    } catch {}
  };

  const renderOutput = (_value: unknown): ReactNode => {
    if (!parsed) {
      return <div className="text-sm text-muted-foreground">Launching browser...</div>;
    }
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground truncate">
          {parsed.title || 'Browser Session'}
        </div>
        <Button size="sm" onClick={handleOpen} className="h-7 px-3">
          Open in panel
        </Button>
      </div>
    );
  };

  return (
    <ToolCallCard
      toolName="browserbase"
      label="Opening browser"
      argsText={argsText}
      result={result}
      renderOutput={renderOutput}
    />
  );
};

export default BrowserTool;


