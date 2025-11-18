import { FileText } from 'lucide-react';
import React, { useMemo } from 'react';
import { AIToolCard } from './AIToolCard';

import type { AIToolCardConfig } from './AIToolCard';

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

  const hasPayload = Boolean((htmlContent && htmlContent.trim().length > 0) || (operations && operations.length > 0));

  const config: AIToolCardConfig = useMemo(() => ({
    icon: FileText,
    displayName: 'Document',
    changeType: 'document',
    eventPrefix: 'document-ai'
  }), []);

  const payload = useMemo(() => ({
    action: action || 'Document edits',
    note,
    htmlContent,
    operations: operations || []
  }), [action, note, htmlContent, operations]);

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasPayload}
    />
  );
};

export default DocumentAITool;


