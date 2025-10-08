import { Table, CheckCircle, AlertCircle, Check, X } from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Typography } from './ui/typography';

interface SheetOperationSetCell { type: 'setCell'; row: number; col: number; value: string | number }
interface SheetOperationSetRange { type: 'setRange'; range: { startRow: number; startCol: number; endRow: number; endCol: number }; values: (string | number)[][] }
interface SheetOperationInsertRows { type: 'insertRows'; index: number; count?: number }
interface SheetOperationDeleteRows { type: 'deleteRows'; index: number; count?: number }
interface SheetOperationInsertCols { type: 'insertCols'; index: number; count?: number }
interface SheetOperationDeleteCols { type: 'deleteCols'; index: number; count?: number }

type SheetOperation =
  | SheetOperationSetCell
  | SheetOperationSetRange
  | SheetOperationInsertRows
  | SheetOperationDeleteRows
  | SheetOperationInsertCols
  | SheetOperationDeleteCols;

interface SheetAIToolProps {
  args?: {
    action: string;
    sheetName?: string;
    operations?: SheetOperation[];
    csvContent?: string;
    note?: string;
  };
  action?: string;
  sheetName?: string;
  operations?: SheetOperation[];
  csvContent?: string;
  note?: string;
}

export const SheetAITool: React.FC<SheetAIToolProps> = (props) => {
  const { action, sheetName: providedSheetName, operations, csvContent, note } = props.args || props;
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hasPreviewedRef = useRef(false);
  const changeIdRef = useRef<string>('');

  // Try to get the actual file name from attached files if not provided
  const sheetName = useMemo(() => {
    if (providedSheetName) return providedSheetName;
    
    try {
      const attachedFiles = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
      const sheetFile = attachedFiles.find((file: any) => 
        file.fileName && (
          file.fileName.toLowerCase().endsWith('.xlsx') ||
          file.fileName.toLowerCase().endsWith('.xls') ||
          file.fileName.toLowerCase().endsWith('.csv')
        )
      );
      if (sheetFile) {
        return sheetFile.fileName;
      }
    } catch (error) {
      console.warn('Could not get attached spreadsheet file:', error);
    }
    
    return 'Spreadsheet';
  }, [providedSheetName]);

  const opSummary = useMemo(() => {
    const ops = operations || [];
    const counts: Record<string, number> = {};
    for (const op of ops) {
      counts[op.type] = (counts[op.type] || 0) + 1;
    }
    return counts;
  }, [operations]);

  const handlePreview = () => {
    const payload = { action: action || 'Spreadsheet edits', sheetName, operations: operations || [], csvContent, note, preview: true };
    window.dispatchEvent(new CustomEvent('sheet-ai-response', { detail: payload }));
  };

  const handleAcceptAll = () => {
    if (applied || rejected) return; // Prevent double-application
    const payload = { action: action || 'Spreadsheet edits', sheetName, operations: operations || [], csvContent, note, preview: false };
    window.dispatchEvent(new CustomEvent('sheet-ai-response', { detail: payload }));
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
    window.dispatchEvent(new CustomEvent('sheet-ai-response-reject'));
    
    // Immediately notify that this change has been resolved
    if (changeIdRef.current) {
      window.dispatchEvent(new CustomEvent('ai-change-resolved', { detail: { id: changeIdRef.current } }));
    }
  };

  // Automatically show preview when component mounts
  useEffect(() => {
    const hasContent = (csvContent && csvContent.trim().length > 0) || (operations && operations.length > 0);
    if (hasContent && !hasPreviewedRef.current) {
      // Generate unique ID for this change
      const changeId = `sheet-${Date.now()}-${Math.random()}`;
      changeIdRef.current = changeId;
      
      // Register this change with the global tracker
      window.dispatchEvent(new CustomEvent('ai-change-registered', {
        detail: {
          id: changeId,
          type: 'spreadsheet',
          description: sheetName || 'Spreadsheet'
        }
      }));
      
      // Delay to ensure editor is ready
      const timer = setTimeout(() => {
        handlePreview();
        setShowPreview(true);
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

  const hasContent = (csvContent && csvContent.trim().length > 0) || (operations && operations.length > 0);

  if (!hasContent) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No spreadsheet changes to apply</span>
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
              <Table className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                {sheetName}
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
              <Table className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
              <Typography
                variant="muted"
                className="text-zinc-900 dark:text-white truncate"
              >
                {sheetName}
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
            <Table className="h-4 w-4 text-zinc-900 dark:text-white stroke-[2.5] flex-shrink-0" />
            <Typography
              variant="muted"
              className="text-zinc-900 dark:text-white truncate"
            >
              {sheetName}
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

export default SheetAITool;


