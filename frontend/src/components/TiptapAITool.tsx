import { Wand2, FileText, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Typography } from './ui/typography';
import { handleAIResponse } from '../contexts/TiptapAIContext';

interface TiptapAIToolProps {
  // When used via assistant-ui, args come as a nested object
  args?: {
    action: string;
    content: string;
    selection?: {
      from: number;
      to: number;
      text: string;
    };
    targetText?: string;
    actionType: 'rewrite' | 'correct' | 'expand' | 'translate' | 'summarize' | 'outline' | 'insert';
    language?: string;
  };
  // Legacy support for direct prop passing
  action?: string;
  content?: string;
  selection?: {
    from: number;
    to: number;
    text: string;
  };
  targetText?: string;
  actionType?: 'rewrite' | 'correct' | 'expand' | 'translate' | 'summarize' | 'outline' | 'insert';
  language?: string;
}

export const TiptapAITool: React.FC<TiptapAIToolProps> = (props) => {
  // Extract values from either args object or direct props
  const {
    action,
    content,
    selection,
    targetText,
    actionType,
    language
  } = props.args || props;
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [preview, setPreview] = useState(false);
  const hasPreviewedRef = useRef(false);
  const changeIdRef = useRef<string>('');

  const handlePreview = () => {
    if (content && actionType) {
      handleAIResponse(content, actionType, selection, true);
    }
  };

  const handleAcceptAll = () => {
    if (applied || rejected) return;
    if (content && actionType) {
      handleAIResponse(content, actionType, selection, false);
      setApplied(true);
      
      // Immediately notify that this change has been resolved
      if (changeIdRef.current) {
        window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
      }
    }
  };

  const handleReject = () => {
    if (applied || rejected) return;
    setRejected(true);
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  // Auto-preview the changes when component mounts
  useEffect(() => {
    if (content && actionType && !hasPreviewedRef.current) {
      const changeId = `tiptap-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: 'tiptap',
          description: 'Document'
        }
      }));
      
      const timer = setTimeout(() => {
        handlePreview();
        hasPreviewedRef.current = true;
      }, 100);
      
      const handleGlobalAccept = () => {
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
        // Only dispatch resolved if not already applied or rejected
        if (!applied && !rejected && changeIdRef.current) {
          window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
        }
      };
    }
  }, []);

  // Add safety check - if no content, don't render
  if (!content) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No content available to display</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rejected) {
    return (
      <div className="w-full max-w-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
        <div className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                Document
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
              <FileText className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                Document
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
            <FileText className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
            <Typography
              variant="muted"
              className="text-zinc-900 dark:text-white truncate"
            >
              Document
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
};
