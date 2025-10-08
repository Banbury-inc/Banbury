import { FileText, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Typography } from './ui/typography';

interface DocxOperationInsertText { type: 'insertText'; position: number; text: string }
interface DocxOperationReplaceText { type: 'replaceText'; startPosition: number; endPosition: number; text: string }
interface DocxOperationInsertParagraph { type: 'insertParagraph'; position: number; text: string; style?: string }
interface DocxOperationReplaceParagraph { type: 'replaceParagraph'; paragraphIndex: number; text: string; style?: string }
interface DocxOperationInsertHeading { type: 'insertHeading'; position: number; text: string; level: number }
interface DocxOperationReplaceHeading { type: 'replaceHeading'; headingIndex: number; text: string; level?: number }
interface DocxOperationInsertList { type: 'insertList'; position: number; items: string[]; listType: 'bulleted' | 'numbered' }
interface DocxOperationInsertTable { type: 'insertTable'; position: number; rows: string[][]; hasHeaders?: boolean }
interface DocxOperationFormatText { 
  type: 'formatText'; 
  startPosition: number; 
  endPosition: number; 
  formatting: { 
    bold?: boolean; 
    italic?: boolean; 
    underline?: boolean; 
    fontSize?: number; 
    color?: string 
  }
}
interface DocxOperationInsertImage { type: 'insertImage'; position: number; imageUrl: string; alt?: string; width?: number; height?: number }
interface DocxOperationSetPageSettings { 
  type: 'setPageSettings'; 
  margins?: { top: number; bottom: number; left: number; right: number }; 
  orientation?: 'portrait' | 'landscape' 
}

type DocxOperation =
  | DocxOperationInsertText
  | DocxOperationReplaceText
  | DocxOperationInsertParagraph
  | DocxOperationReplaceParagraph
  | DocxOperationInsertHeading
  | DocxOperationReplaceHeading
  | DocxOperationInsertList
  | DocxOperationInsertTable
  | DocxOperationFormatText
  | DocxOperationInsertImage
  | DocxOperationSetPageSettings;

interface DocxAIToolProps {
  args?: {
    action: string;
    documentName?: string;
    operations?: DocxOperation[];
    htmlContent?: string;
    note?: string;
  };
  action?: string;
  documentName?: string;
  operations?: DocxOperation[];
  htmlContent?: string;
  note?: string;
}

export const DocxAITool: React.FC<DocxAIToolProps> = (props) => {
  const { action, documentName: providedDocumentName, operations, htmlContent, note } = props.args || props;
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hasPreviewedRef = useRef(false);
  const changeIdRef = useRef<string>('');

  // Try to get the actual file name from attached files if not provided
  const documentName = useMemo(() => {
    if (providedDocumentName) return providedDocumentName;
    
    try {
      const attachedFiles = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
      const docxFile = attachedFiles.find((file: any) => 
        file.fileName && (
          file.fileName.toLowerCase().endsWith('.docx') ||
          file.fileName.toLowerCase().endsWith('.doc')
        )
      );
      if (docxFile) {
        return docxFile.fileName;
      }
    } catch (error) {
      console.warn('Could not get attached document file:', error);
    }
    
    return 'Document';
  }, [providedDocumentName]);

  const opSummary = useMemo(() => {
    const ops = operations || [];
    const counts: Record<string, number> = {};
    for (const op of ops) {
      counts[op.type] = (counts[op.type] || 0) + 1;
    }
    return counts;
  }, [operations]);

  const handlePreview = () => {
    const payload = { action: action || 'Document edits', documentName, operations: operations || [], htmlContent, note, preview: true };
    window.dispatchEvent(new CustomEvent('docx-ai-response', { detail: payload }));
  };

  const handleAcceptAll = () => {
    if (applied || rejected) return; // Prevent double-application
    const payload = { action: action || 'Document edits', documentName, operations: operations || [], htmlContent, note, preview: false };
    window.dispatchEvent(new CustomEvent('docx-ai-response', { detail: payload }));
    setApplied(true);
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  const handleReject = () => {
    if (applied || rejected) return; // Prevent double-rejection
    setRejected(true);
    // Dispatch reject event to clear preview if active
    window.dispatchEvent(new CustomEvent('docx-ai-response-reject'));
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  // Automatically show preview when component mounts
  useEffect(() => {
    const hasContent = (htmlContent && htmlContent.trim().length > 0) || (operations && operations.length > 0);
    if (hasContent && !hasPreviewedRef.current) {
      // Generate unique ID for this change
      const changeId = `docx-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      // Register this change with the global tracker
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: 'document',
          description: documentName || 'Document'
        }
      }));
      
      // Delay to ensure editor is ready
      const timer = setTimeout(() => {
        handlePreview();
        hasPreviewedRef.current = true;
      }, 100);
      
      // Listen for global accept/reject
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

  const hasContent = (htmlContent && htmlContent.trim().length > 0) || (operations && operations.length > 0);

  if (!hasContent) {
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
                {documentName}
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
                {documentName}
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
        {/* Header: Filename + Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
            <Typography
              variant="muted"
              className="text-zinc-900 dark:text-white truncate"
            >
              {documentName}
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

export default DocxAITool;
