import { FileText } from 'lucide-react';
import React, { useMemo } from 'react';
import { AIToolCard } from './AIToolCard';

import type { AIToolCardConfig } from './AIToolCard';

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
  const { action, documentName, operations, htmlContent, note } = props.args || props;

  const hasContent = Boolean((htmlContent && htmlContent.trim().length > 0) || (operations && operations.length > 0));

  const config: AIToolCardConfig = useMemo(() => ({
    icon: FileText,
    displayName: documentName || 'Document',
    changeType: 'document',
    eventPrefix: 'docx-ai',
    fileExtensions: ['.docx', '.doc']
  }), [documentName]);

  const payload = useMemo(() => ({
    action: action || 'Document edits',
    documentName: config.displayName,
    operations: operations || [],
    htmlContent,
    note
  }), [action, config.displayName, operations, htmlContent, note]);

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasContent}
    />
  );
};

export default DocxAITool;
