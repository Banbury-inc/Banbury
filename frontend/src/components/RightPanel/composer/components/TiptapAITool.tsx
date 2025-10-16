import { FileText } from 'lucide-react';
import React, { useMemo, useCallback } from 'react';
import { AIToolCard } from './AIToolCard';
import { handleAIResponse } from '../../../../contexts/TiptapAIContext';

import type { AIToolCardConfig } from './AIToolCard';

interface TiptapAIToolProps {
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
  const { action, content, selection, targetText, actionType, language } = props.args || props;

  const hasContent = Boolean(content && actionType);

  const handleAccept = useCallback(() => {
    if (content && actionType) {
      handleAIResponse(content, actionType, selection);
    }
  }, [content, actionType, selection]);

  const config: AIToolCardConfig = useMemo(() => ({
    icon: FileText,
    displayName: 'Document',
    changeType: 'tiptap',
    customAcceptHandler: handleAccept,
    customPreviewHandler: handleAccept,
    autoApply: true
  }), [handleAccept]);

  return (
    <AIToolCard
      config={config}
      hasContent={hasContent}
    />
  );
};
