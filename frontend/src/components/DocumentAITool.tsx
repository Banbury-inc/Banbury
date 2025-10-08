import { FileText, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Typography } from './ui/typography';

type DocumentOperation =
  | { type: 'setContent'; html: string }
  | { type: 'replaceText'; target: string; replacement: string; all?: boolean; caseSensitive?: boolean }
  | { type: 'replaceBetween'; from: number; to: number; html: string }
  | { type: 'insertAfterText'; target: string; html: string; occurrence?: number; caseSensitive?: boolean }
  | { type: 'insertBeforeText'; target: string; html: string; occurrence?: number; caseSensitive?: boolean }
  | { type: 'deleteText'; target: string; all?: boolean; caseSensitive?: boolean };

interface DocumentAIToolProps {
  args?: {
    action: string;
    note?: string;
    htmlContent?: string;
    operations?: DocumentOperation[];
  };
  action?: string;
  note?: string;
  htmlContent?: string;
  operations?: DocumentOperation[];
}

export const DocumentAITool: React.FC<DocumentAIToolProps> = (props) => {
  const { action, note, htmlContent, operations } = props.args || props;
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hasPreviewedRef = useRef(false);
  const changeIdRef = useRef<string>('');

  const opSummary = useMemo(() => {
    const ops = operations || [];
    const counts: Record<string, number> = {};
    for (const op of ops) {
      counts[op.type] = (counts[op.type] || 0) + 1;
    }
    return counts;
  }, [operations]);

  const hasPayload = Boolean((htmlContent && htmlContent.trim().length > 0) || (operations && operations.length > 0));

  const handlePreview = () => {
    const detail = {
      action: action || 'Document edits',
      note,
      htmlContent,
      operations: operations || [],
      preview: true
    };
    window.dispatchEvent(new CustomEvent('document-ai-response', { detail }));
  };

  const handleAcceptAll = () => {
    if (applied || rejected) return;
    const detail = {
      action: action || 'Document edits',
      note,
      htmlContent,
      operations: operations || [],
      preview: false
    };
    window.dispatchEvent(new CustomEvent('document-ai-response', { detail }));
    setApplied(true);
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  const handleReject = () => {
    if (applied || rejected) return;
    setRejected(true);
    window.dispatchEvent(new CustomEvent('document-ai-response-reject'));
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  useEffect(() => {
    if (hasPayload && !hasPreviewedRef.current) {
      const changeId = `document-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: 'document',
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

  if (!hasPayload) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No document changes to apply</span>
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

export default DocumentAITool;


