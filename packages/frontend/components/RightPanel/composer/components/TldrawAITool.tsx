import React, { useMemo } from 'react';
import { PaintbrushIcon } from 'lucide-react';
import { AIToolCard } from './AIToolCard';

import type { AIToolCardConfig } from './AIToolCard';

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
  const hasContent = true;

  const config: AIToolCardConfig = useMemo(() => ({
    icon: PaintbrushIcon,
    displayName: args.canvasName || 'Canvas',
    changeType: 'canvas',
    eventPrefix: 'tldraw-ai',
    autoApply: true,
    fileExtensions: ['.tldraw']
  }), [args.canvasName]);

  const payload = useMemo(() => ({
    action: args.action,
    canvasName: config.displayName,
    operations: args.operations,
    canvasData: args.canvasData,
    note: args.note
  }), [args, config.displayName]);

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasContent}
    />
  );
}
