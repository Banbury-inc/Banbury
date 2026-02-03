import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Typography } from "../../../../common/ui/typography";
import { cn } from "../../../../../utils";
import type { FC } from "react";

// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const {
  ThreadPrimitive,
  useThreadRuntime,
} = AssistantUI as any;

export const StreamingStatus: FC = () => {
  const runtime = useThreadRuntime();
  const [statusDetails, setStatusDetails] = useState<any>(null);

  useEffect(() => {
    // Listen for status changes from the runtime
    const updateStatus = () => {
      try {
        const lastMessage = runtime.messages[runtime.messages.length - 1];
        if (lastMessage?.status?.details) {
          setStatusDetails(lastMessage.status.details);
        } else {
          setStatusDetails(null);
        }
      } catch (e) {
        // Ignore errors accessing runtime
      }
    };

    // Subscribe to runtime changes if possible
    updateStatus();
    
    // Set up a polling interval to check for status updates
    const interval = setInterval(updateStatus, 100);
    
    return () => clearInterval(interval);
  }, [runtime]);

  if (!statusDetails) return null;

  // Determine agent badge colors based on agent type
  const getAgentBadgeStyles = (agentType: string) => {
    switch (agentType) {
      case "planning":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-800/40",
          text: "text-emerald-700 dark:text-emerald-300",
          dot: "bg-emerald-500"
        }
      case "document":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/30",
          border: "border-purple-200 dark:border-purple-800/40",
          text: "text-purple-700 dark:text-purple-300",
          dot: "bg-purple-500"
        }
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-950/20",
          border: "border-blue-200 dark:border-blue-800/30",
          text: "text-blue-700 dark:text-blue-300",
          dot: "bg-blue-500"
        }
    }
  }

  return (
    <ThreadPrimitive.If running>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mx-auto max-w-[var(--thread-max-width)] px-[var(--thread-padding-x)] mb-4"
      >
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
          {/* Agent Type Badge */}
          {statusDetails.agentType && (
            <div className={cn(
              "flex items-center gap-2 mb-2 pb-2 border-b",
              getAgentBadgeStyles(statusDetails.agentType).border
            )}>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                getAgentBadgeStyles(statusDetails.agentType).bg,
                getAgentBadgeStyles(statusDetails.agentType).text
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  getAgentBadgeStyles(statusDetails.agentType).dot
                )}></span>
                {statusDetails.agentLabel || statusDetails.agentType}
              </div>
              {statusDetails.agentDescription && (
                <Typography variant="xs" className="text-muted-foreground">
                  {statusDetails.agentDescription}
                </Typography>
              )}
            </div>
          )}

          {statusDetails.thinking && (
            <div className="flex items-center text-blue-700 dark:text-blue-300 mb-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              <Typography variant="small">{statusDetails.thinking}</Typography>
            </div>
          )}
          
          {statusDetails.step && statusDetails.totalSteps && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                <Typography variant="xs">Step {statusDetails.step} of {statusDetails.totalSteps}</Typography>
                <Typography variant="xs">{Math.round(statusDetails.progress || 0)}%</Typography>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800/30 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${statusDetails.progress || 0}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {statusDetails.toolStatus && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              <Typography variant="xs" className="font-medium">{statusDetails.toolStatus.tool}:</Typography>
              <Typography variant="xs" className="ml-1">{statusDetails.toolStatus.message}</Typography>
            </div>
          )}
          
          {statusDetails.toolCompleted && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckIcon className="w-4 h-4 mr-2" strokeWidth={1} />
              <Typography variant="xs" className="font-medium">{statusDetails.toolCompleted.tool}:</Typography>
              <Typography variant="xs" className="ml-1">{statusDetails.toolCompleted.message}</Typography>
            </div>
          )}

          {statusDetails.waitingForContent && (
            <div className="flex items-center text-blue-600 dark:text-blue-400 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800/30">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
              <Typography variant="xs">Processing...</Typography>
            </div>
          )}
        </div>
      </motion.div>
    </ThreadPrimitive.If>
  );
};
