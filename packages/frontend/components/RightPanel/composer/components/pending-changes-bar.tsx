import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRightIcon,
  File,
  FileText,
  Table,
  PaintbrushIcon,
} from "lucide-react";
import { Button } from "../../../ui/button";

import type { FC } from "react";

interface PendingChange {
  id: string;
  type: string;
  description: string;
}

interface PendingChangesBarProps {
  pendingChanges: PendingChange[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const PendingChangesBar: FC<PendingChangesBarProps> = ({
  pendingChanges,
  onAcceptAll,
  onRejectAll,
}) => {
  const [isPendingChangesExpanded, setIsPendingChangesExpanded] = useState(false);

  if (pendingChanges.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" strokeWidth={1} />;
      case 'spreadsheet':
        return <Table className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" strokeWidth={1} />;
      case 'canvas':
        return <PaintbrushIcon className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" strokeWidth={1} />;
      default:
        return <File className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" strokeWidth={1} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="w-full"
    >
      <div className="bg-accent backdrop-blur-sm border-b border-border px-2 py-2">
        <div className="space-y-1">
          {/* Dropdown header */}
          <div className="flex items-center justify-between gap-2">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 p-1 rounded flex-1"
              onClick={() => setIsPendingChangesExpanded(!isPendingChangesExpanded)}
            >
              {isPendingChangesExpanded ? (
                <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" strokeWidth={1} />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" strokeWidth={1} />
              )}
              <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                {pendingChanges.length} File{pendingChanges.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={onRejectAll}
                className="text-primary hover:text-primary/80 hover:bg-primary/10 h-7 text-xs px-2 mr-2"
              >
                Reject all
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={onAcceptAll}
                className="h-7 text-xs px-2 mr-2 hover:bg-primary/10 hover:text-primary/80"
              >
                Accept all
              </Button>
            </div>
          </div>

          {/* File list */}
          {isPendingChangesExpanded && (
            <div className="ml-6 space-y-1">
              {pendingChanges.map((change) => (
                <div
                  key={change.id}
                  className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
                >
                  {getIcon(change.type)}
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1" title={change.description}>
                    {change.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

