import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../../../common/ui/button';
import { Card, CardContent } from '../../../common/ui/card';
import { Typography } from '../../../common/ui/typography';

// Change types that create or modify documents (mutating tools)
const MUTATING_CHANGE_TYPES = [
  'tiptap',
  'spreadsheet', 
  'document',
  'pptx',
  'presentation',
  'tldraw',
  'canvas',
  'code-edit',
  'file-create',
  'file-download'
];

// Deterministic hash function to generate stable changeIds
function generateDeterministicChangeId(changeType: string, displayName: string, args: any): string {
  // Create a stable string representation of the input
  const payload = JSON.stringify({ changeType, displayName, args });
  
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) + payload.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Return positive hex string
  return `${changeType}-${Math.abs(hash).toString(16)}`;
}

export interface AIToolCardConfig {
  icon: React.ComponentType<{ className?: string }>;
  displayName: string;
  changeType: string;
  eventPrefix?: string;
  autoApply?: boolean;
  customAcceptHandler?: (detail: { changeId: string; preview: boolean; args: any }) => void;
  customRejectHandler?: (detail: { changeId: string; args: any }) => void;
  customPreviewHandler?: (detail: { changeId: string; preview: boolean; args: any }) => void;
  subtitle?: string;
  fileExtensions?: string[];
}

interface AIToolCardProps {
  config: AIToolCardConfig;
  args?: any;
  hasContent: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onPreview?: () => void;
}

export const AIToolCard: React.FC<AIToolCardProps> = ({
  config,
  args,
  hasContent,
  onAccept,
  onReject,
  onPreview
}) => {
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const hasPreviewedRef = useRef(false);
  const Icon = config.icon;

  // Resolve display name and file path from localStorage if file extensions provided
  const resolvedDisplayName = React.useMemo(() => {
    // First check if fileName is provided directly in args
    if (args?.fileName) {
      return args.fileName;
    }

    if (!config.fileExtensions || !config.fileExtensions.length) {
      return config.displayName;
    }

    try {
      const attachedFiles = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
      const matchingFile = attachedFiles.find((file: any) =>
        file.fileName && config.fileExtensions!.some(ext =>
          file.fileName.toLowerCase().endsWith(ext.toLowerCase())
        )
      );
      if (matchingFile) {
        return matchingFile.fileName;
      }
    } catch (error) {
      console.warn('Could not get attached file:', error);
    }

    return config.displayName;
  }, [args?.fileName, config.displayName, config.fileExtensions]);

  const resolvedFilePath = React.useMemo(() => {
    // First check if filePath is provided directly in args
    if (args?.filePath) {
      return args.filePath;
    }

    if (!config.fileExtensions || !config.fileExtensions.length) {
      return undefined;
    }

    try {
      const attachedFiles = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
      const matchingFile = attachedFiles.find((file: any) =>
        file.fileName && config.fileExtensions!.some(ext =>
          file.fileName.toLowerCase().endsWith(ext.toLowerCase())
        )
      );
      if (matchingFile) {
        return matchingFile.filePath || matchingFile.path;
      }
    } catch (error) {
      console.warn('Could not get attached file path:', error);
    }

    return undefined;
  }, [args?.filePath, config.fileExtensions]);

  const effectiveChangeId = React.useMemo(() => {
    const serverId = typeof args?.changeId === 'string' ? args.changeId.trim() : '';
    if (serverId) return serverId;
    return generateDeterministicChangeId(config.changeType, resolvedDisplayName, args);
  }, [args, config.changeType, resolvedDisplayName]);

  const effectiveChangeIdRef = useRef(effectiveChangeId);
  effectiveChangeIdRef.current = effectiveChangeId;

  const handleAcceptAll = () => {
    if (applied || rejected) return;
    const changeId = effectiveChangeIdRef.current;
    
    // Use custom handler if provided
    if (config.customAcceptHandler) {
      config.customAcceptHandler({ changeId, preview: false, args });
    } else if (onAccept) {
      onAccept();
    } else if (config.eventPrefix) {
      // Default: dispatch CustomEvent with changeId
      window.dispatchEvent(new CustomEvent(`${config.eventPrefix}-response`, { 
        detail: { ...args, preview: false, changeId } 
      }));
    }
    
    setApplied(true);

    if (changeId) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', {
        detail: { id: changeId }
      }));
    }

    // Trigger file sidebar refresh to update file list
    window.dispatchEvent(new CustomEvent('file-sidebar-refresh'));
  };

  const handleReject = () => {
    if (applied || rejected) return;
    
    // Use custom handler if provided
    const changeId = effectiveChangeIdRef.current;
    if (config.customRejectHandler) {
      config.customRejectHandler({ changeId, args });
    } else if (onReject) {
      onReject();
    } else if (config.eventPrefix) {
      // Default: dispatch reject event with changeId
      window.dispatchEvent(new CustomEvent(`${config.eventPrefix}-response-reject`, {
        detail: { changeId }
      }));
    }
    
    setRejected(true);
    
    if (changeId) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { 
        detail: { id: changeId } 
      }));
    }
  };

  const handlePreview = () => {
    const changeId = effectiveChangeIdRef.current;
    if (config.customPreviewHandler) {
      config.customPreviewHandler({ changeId, preview: true, args });
    } else if (onPreview) {
      onPreview();
    } else if (config.eventPrefix) {
      // Default: dispatch preview event with changeId
      window.dispatchEvent(new CustomEvent(`${config.eventPrefix}-response`, { 
        detail: { ...args, preview: true, changeId } 
      }));
    }
  };

  // Check if this is a mutating tool that should show the "Open" button
  const isMutatingTool = MUTATING_CHANGE_TYPES.includes(config.changeType);

  // Handle opening the file in the middle panel
  const handleOpenDocument = () => {
    // Get fileId from args if available (set by CreateFileTool/DownloadFileTool from result)
    const fileId = args?.fileId;
    
    // First, trigger a sidebar refresh to ensure the file appears in the file list
    window.dispatchEvent(new CustomEvent('file-sidebar-refresh'));
    
    if (fileId) {
      // If we have a valid file_id from the result, use it to open the file directly
      window.dispatchEvent(new CustomEvent('workspace-reopen-file', {
        detail: {
          newFile: {
            id: fileId,
            file_id: fileId,
            name: resolvedDisplayName,
            type: 'file',
            path: resolvedFilePath || ''
          }
        }
      }));
    } else if (resolvedFilePath) {
      // If we have a file path but no fileId, use the path as the id (like tldraw handler)
      window.dispatchEvent(new CustomEvent('workspace-reopen-file', {
        detail: {
          newFile: {
            id: resolvedFilePath,
            file_id: resolvedFilePath,
            name: resolvedDisplayName,
            type: 'file',
            path: resolvedFilePath
          }
        }
      }));
    }
  };

  // Auto-preview or auto-apply on mount
  useEffect(() => {
    if (hasContent && !hasPreviewedRef.current) {
      const changeId = effectiveChangeIdRef.current;
      
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: config.changeType,
          description: resolvedDisplayName,
          filePath: resolvedFilePath
        }
      }));
      
      const timer = setTimeout(() => {
        if (config.autoApply) {
          handleAcceptAll();
        } else {
          handlePreview();
        }
        hasPreviewedRef.current = true;
      }, 100);
      
      const handleGlobalAccept = () => {
        if (config.autoApply && !hasPreviewedRef.current) return;
        handleAcceptAll();
      };
      
      const handleGlobalReject = () => {
        handleReject();
      };
      
      window.addEventListener('ai-accept-all', handleGlobalAccept);
      window.addEventListener('ai-reject-all', handleGlobalReject);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('ai-accept-all', handleGlobalAccept);
        window.removeEventListener('ai-reject-all', handleGlobalReject);
        if (!applied && !rejected && effectiveChangeIdRef.current) {
          window.dispatchEvent(new CustomEvent('ai-change-resolved', { 
            detail: { id: effectiveChangeIdRef.current } 
          }));
        }
      };
    }
  }, [hasContent]);

  if (!hasContent) {
    return (
      <Card className="w-full max-w-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2 rounded-full bg-muted/50">
              <AlertCircle className="h-4 w-4" />
            </div>
            <Typography variant="muted" className="text-sm">
              No changes to apply
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine background and border colors based on state
  const bgColor = rejected 
    ? 'bg-destructive/10 dark:bg-destructive/20 border-destructive/30 dark:border-destructive/40'
    : applied 
    ? 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40'
    : 'bg-card dark:bg-card border-border shadow-sm hover:shadow-md';

  return (
    <div className={`w-full max-w-2xl ${bgColor} border rounded-xl overflow-hidden transition-all duration-200`}>
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-muted/80 dark:bg-muted flex-shrink-0">
              <Icon className="h-4 w-4 text-foreground/70 dark:text-foreground/80 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography
                variant="muted"
                className="text-foreground dark:text-foreground truncate font-medium text-sm"
              >
                {resolvedDisplayName}
              </Typography>
              {config.subtitle && (
                <Typography
                  variant="muted"
                  className="text-muted-foreground truncate text-xs mt-0.5"
                >
                  {config.subtitle}
                </Typography>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Open button for mutating tools */}
            {isMutatingTool && (resolvedFilePath || resolvedDisplayName) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleOpenDocument}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150"
                title="Open document in viewer"
              >
                <ExternalLink className="h-4 w-4 stroke-[2]" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolCard;

