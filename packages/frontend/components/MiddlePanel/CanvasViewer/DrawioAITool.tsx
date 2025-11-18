import { Network, CheckCircle, AlertCircle, Eye, Edit3, Check, X } from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Typography } from '../../ui/typography';
import DrawioViewer from './DrawioViewer';

interface DrawioOperation {
  type: 'create' | 'update' | 'delete' | 'analyze';
  elementId?: string;
  elementType?: 'shape' | 'connector' | 'text' | 'group';
  properties?: Record<string, any>;
  content?: string;
  description?: string;
}

interface DrawioAIToolProps {
  args?: {
    action: string;
    diagramName?: string;
    operations?: DrawioOperation[];
    diagramXml?: string;
    fileUrl?: string;
    analysis?: string;
    note?: string;
  };
  action?: string;
  diagramName?: string;
  operations?: DrawioOperation[];
  diagramXml?: string;
  fileUrl?: string;
  analysis?: string;
  note?: string;
}

export const DrawioAITool: React.FC<DrawioAIToolProps> = (props) => {
  const { action, diagramName, operations, diagramXml, fileUrl, analysis, note } = props.args || props;
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
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

  const handlePreview = () => {
    const payload = { 
      action: action || 'Diagram changes', 
      diagramName, 
      operations: operations || [], 
      diagramXml, 
      fileUrl,
      analysis,
      note,
      preview: true
    };
    window.dispatchEvent(new CustomEvent('drawio-ai-response', { detail: payload }));
  };

  const handleAcceptAll = () => {
    if (applied || rejected) return;
    const payload = { 
      action: action || 'Diagram changes', 
      diagramName, 
      operations: operations || [], 
      diagramXml,
      fileUrl,
      analysis,
      note,
      preview: false
    };
    window.dispatchEvent(new CustomEvent('drawio-ai-response', { detail: payload }));
    setApplied(true);
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  const handleReject = () => {
    if (applied || rejected) return;
    setRejected(true);
    window.dispatchEvent(new CustomEvent('drawio-ai-response-reject'));
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  // Automatically show preview when component mounts
  useEffect(() => {
    const hasContent = 
      (diagramXml && diagramXml.trim().length > 0) || 
      (operations && operations.length > 0) ||
      (analysis && analysis.trim().length > 0);
    
    if (hasContent && !hasPreviewedRef.current) {
      const changeId = `drawio-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: 'diagram',
          description: diagramName || 'Diagram'
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

  const hasContent = 
    (diagramXml && diagramXml.trim().length > 0) || 
    (operations && operations.length > 0) ||
    (analysis && analysis.trim().length > 0);

  if (!hasContent) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No diagram changes to apply</span>
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
              <Network className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                {diagramName || 'Diagram'}
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
              <Network className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                {diagramName || 'Diagram'}
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
            <Network className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
            <Typography
              variant="muted"
              className="text-zinc-900 dark:text-white truncate"
            >
              {diagramName || 'Diagram'}
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

export default DrawioAITool;
