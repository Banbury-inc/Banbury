import React, { useMemo, useState } from "react";

import { Button } from "../../../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../../ui/dropdown-menu";

import type { ReactNode, SVGProps } from "react";

const Wrench = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M21.79 13.61a8 8 0 1 1-10.4-10.4l2.6 2.6a2 2 0 0 0 2.83 2.83l2.6 2.6a8.05 8.05 0 0 1 2.37 2.37z" />
    <line x1="22" y1="22" x2="16.65" y2="16.65" />
  </svg>
);

const Loader2 = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

const Check = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronDown = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const DotsHorizontal = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </svg>
);

interface ToolCallCardProps {
  toolName: string;
  argsText: string;
  result?: unknown;
  icon?: ReactNode;
  label?: string;
  initialTab?: "args" | "result";
  initialCollapsed?: boolean;
  renderOutput?: (result: unknown) => ReactNode;
}

export const ToolCallCard = ({
  toolName,
  argsText,
  result,
  icon,
  label,
  initialTab = "args",
  initialCollapsed = true,
  renderOutput,
}: ToolCallCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<"args" | "result">(initialTab);

  const prettyArgs = useMemo(() => {
    try {
      const parsed = JSON.parse(argsText);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return argsText;
    }
  }, [argsText]);

  const prettyResult = useMemo(() => {
    if (result === undefined) return "";
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return result;
      }
    }
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }, [result]);

  const isRunning = result === undefined;

  return (
    <div className="mb-2 w-full">
      <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {icon || <Wrench className="h-3.5 w-3.5 text-zinc-500" />}
          <span className="font-medium text-foreground/90">{label || toolName}</span>
        </div>
        <div className="ml-1 flex items-center gap-1">
          {isRunning ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-green-600" />
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
          {!isCollapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <DotsHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setActiveTab("args")}>
                  Arguments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("result")}>
                  Result
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-1 py-1">
          {activeTab === "args" && (
            <pre className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {prettyArgs}
            </pre>
          )}
          {activeTab === "result" && (
            <div>
              {isRunning ? (
                <div className="text-xs text-muted-foreground">waiting for output…</div>
              ) : renderOutput ? (
                <>{renderOutput(result)}</>
              ) : (
                <pre className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {prettyResult}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolCallCard;


