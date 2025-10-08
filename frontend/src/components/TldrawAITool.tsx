import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { CheckIcon, PaintbrushIcon, AlertCircle, Check, X } from 'lucide-react';
import { Typography } from './ui/typography';

interface TldrawAIToolProps {
  args: {
    action: string;
    canvasName?: string;
    operations?: Array<{
      type: string;
      [key: string]: any;
    }>;
    canvasData?: any;
    note?: string;
  };
}

export function TldrawAITool({ args }: TldrawAIToolProps) {
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const hasAppliedRef = useRef(false);
  const changeIdRef = useRef<string>('');

  // Try to get the actual file name from attached files if not provided
  const canvasName = useMemo(() => {
    if (args.canvasName) return args.canvasName;
    
    try {
      const attachedFiles = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
      const canvasFile = attachedFiles.find((file: any) => 
        file.fileName && file.fileName.toLowerCase().endsWith('.tldraw')
      );
      if (canvasFile) {
        return canvasFile.fileName;
      }
    } catch (error) {
      console.warn('Could not get attached canvas file:', error);
    }
    
    return 'Canvas';
  }, [args.canvasName]);

  const handleAcceptAll = () => {
    if (applied || rejected) return; // Prevent double-application
    const event = new CustomEvent('tldraw-ai-response', {
      detail: {
        action: args.action,
        canvasName: canvasName,
        operations: args.operations,
        canvasData: args.canvasData,
        note: args.note,
      }
    });
    
    window.dispatchEvent(event);
    setApplied(true);
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  const handleReject = () => {
    if (applied || rejected) return; // Prevent double-rejection
    setRejected(true);
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  // Automatically apply changes when component mounts
  useEffect(() => {
    if (!hasAppliedRef.current) {
      // Generate unique ID for this change
      const changeId = `canvas-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      // Register this change with the global tracker
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: 'canvas',
          description: canvasName
        }
      }));
      
      const timer = setTimeout(() => {
        handleAcceptAll();
        hasAppliedRef.current = true;
      }, 100);
      
      // Listen for global accept/reject
      const handleGlobalAccept = () => {
        if (!hasAppliedRef.current) {
          handleAcceptAll();
          hasAppliedRef.current = true;
        }
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
        // Only dispatch resolved if not already applied or rejected
        if (!applied && !rejected && changeIdRef.current) {
          window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
        }
      };
    }
  }, []);

  if (rejected) {
    return (
      <div className="w-full max-w-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PaintbrushIcon className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                {canvasName}
              </Typography>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <X className="h-4 w-4 text-red-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applied) {
    return (
      <div className="w-full max-w-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PaintbrushIcon className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                {canvasName}
              </Typography>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Check className="h-4 w-4 text-green-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <PaintbrushIcon className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
            <Typography
              variant="muted"
              className="text-zinc-900 dark:text-white truncate"
            >
              {canvasName}
            </Typography>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="primary" 
              size="xsm" 
              onClick={handleAcceptAll}
              className="bg-green-600 hover:bg-green-700 text-white border border-zinc-300 dark:border-zinc-700 p-2"
            >
              <Check className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="primary" 
              size="xsm" 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 text-white border border-zinc-300 dark:border-zinc-700 p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
