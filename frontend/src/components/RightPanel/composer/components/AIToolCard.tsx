import React, { useState, useEffect, useRef } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { Typography } from '../../../ui/typography';

export interface AIToolCardConfig {
  icon: React.ComponentType<{ className?: string }>;
  displayName: string;
  changeType: string;
  eventPrefix?: string;
  autoApply?: boolean;
  customAcceptHandler?: () => void;
  customRejectHandler?: () => void;
  customPreviewHandler?: () => void;
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
  const changeIdRef = useRef<string>('');
  const Icon = config.icon;

  // Resolve display name from localStorage if file extensions provided
  const resolvedDisplayName = React.useMemo(() => {
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
  }, [config.displayName, config.fileExtensions]);

  const handleAcceptAll = () => {
    if (applied || rejected) return;
    
    // Use custom handler if provided
    if (config.customAcceptHandler) {
      config.customAcceptHandler();
    } else if (onAccept) {
      onAccept();
    } else if (config.eventPrefix) {
      // Default: dispatch CustomEvent
      window.dispatchEvent(new CustomEvent(`${config.eventPrefix}-response`, { 
        detail: { ...args, preview: false } 
      }));
    }
    
    setApplied(true);
    
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { 
        detail: { id: changeIdRef.current } 
      }));
    }
  };

  const handleReject = () => {
    if (applied || rejected) return;
    
    // Use custom handler if provided
    if (config.customRejectHandler) {
      config.customRejectHandler();
    } else if (onReject) {
      onReject();
    } else if (config.eventPrefix) {
      // Default: dispatch reject event
      window.dispatchEvent(new CustomEvent(`${config.eventPrefix}-response-reject`));
    }
    
    setRejected(true);
    
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { 
        detail: { id: changeIdRef.current } 
      }));
    }
  };

  const handlePreview = () => {
    if (config.customPreviewHandler) {
      config.customPreviewHandler();
    } else if (onPreview) {
      onPreview();
    } else if (config.eventPrefix) {
      // Default: dispatch preview event
      window.dispatchEvent(new CustomEvent(`${config.eventPrefix}-response`, { 
        detail: { ...args, preview: true } 
      }));
    }
  };

  // Auto-preview or auto-apply on mount
  useEffect(() => {
    if (hasContent && !hasPreviewedRef.current) {
      const changeId = `${config.changeType}-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: config.changeType,
          description: resolvedDisplayName
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
        if (!applied && !rejected && changeIdRef.current) {
          window.dispatchEvent(new CustomEvent('ai-change-resolved', { 
            detail: { id: changeIdRef.current } 
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
            <Typography
              variant="muted"
              className="text-foreground dark:text-foreground truncate font-medium text-sm"
            >
              {resolvedDisplayName}
            </Typography>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {rejected && (
              <div className="flex items-center gap-2 text-destructive dark:text-destructive">
                <span className="text-xs font-medium">Rejected</span>
                <div className="p-1 rounded-full bg-destructive/20 dark:bg-destructive/30">
                  <X className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            {applied && (
              <div className="flex items-center gap-2 text-success dark:text-success">
                <span className="text-xs font-medium">Applied</span>
                <div className="p-1 rounded-full bg-success/20 dark:bg-success/30">
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            {!applied && !rejected && (
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="primary" 
                  size="icon-sm" 
                  onClick={handleAcceptAll}
                  className="h-8 w-8 !bg-green-600 hover:!bg-green-700 active:!bg-green-800 text-white border-0 shadow-sm hover:shadow transition-all duration-150"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </Button>
                
                <Button 
                  variant="primary" 
                  size="icon-sm" 
                  onClick={handleReject}
                  className="h-8 w-8 !bg-destructive hover:!bg-destructive/90 active:!bg-destructive/80 text-white border-0 shadow-sm hover:shadow transition-all duration-150"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolCard;

