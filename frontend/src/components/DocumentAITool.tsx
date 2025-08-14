import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [showPreview, setShowPreview] = useState(false);

  const opSummary = useMemo(() => {
    const ops = operations || [];
    const counts: Record<string, number> = {};
    for (const op of ops) {
      counts[op.type] = (counts[op.type] || 0) + 1;
    }
    return counts;
  }, [operations]);

  const hasPayload = Boolean((htmlContent && htmlContent.trim().length > 0) || (operations && operations.length > 0));

  const handleApply = () => {
    const detail = {
      action: action || 'Document edits',
      note,
      htmlContent,
      operations: operations || [],
    };
    window.dispatchEvent(new CustomEvent('document-ai-response', { detail }));
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <CardTitle className="text-base">AI Document Suggestion</CardTitle>
            <Badge variant="default">{action || 'Edits'}</Badge>
          </div>
          {applied && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Applied!</span>
            </div>
          )}
        </div>
        <CardDescription>
          {note ? note : 'Review the suggested document changes and apply them to the open document.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {operations && operations.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Operations: {operations.length}
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(opSummary).map(([k, v]) => (
                <Badge key={k} variant="secondary">{k}: {v as number}</Badge>
              ))}
            </div>
          </div>
        )}

        {htmlContent && (
          <div className="text-xs text-muted-foreground">
            Full HTML replacement provided ({htmlContent.length.toLocaleString()} chars)
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleApply} disabled={applied} className="flex items-center gap-2">
            {applied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Applied
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Apply to Document
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Hide' : 'Preview'}
          </Button>
        </div>

        {showPreview && (
          <div className="mt-2 space-y-2">
            {operations && operations.length > 0 && (
              <div className="p-3 bg-muted rounded text-xs">
                {operations.slice(0, 12).map((op, idx) => (
                  <div key={idx} className="break-words">{JSON.stringify(op)}</div>
                ))}
                {operations.length > 12 && <div className="opacity-70">…{operations.length - 12} more</div>}
              </div>
            )}
            {htmlContent && (
              <div className="p-3 bg-muted rounded text-xs max-h-40 overflow-auto">
                <code className="whitespace-pre-wrap break-all">{htmlContent.slice(0, 2000)}{htmlContent.length > 2000 ? '…' : ''}</code>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentAITool;


