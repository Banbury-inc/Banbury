import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Wand2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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
  // Debug logging removed for production

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
  const [preview, setPreview] = useState(false);

  const handleApplyToEditor = () => {
    if (content && actionType) {
      handleAIResponse(content, actionType, selection);
      setApplied(true);
      
      // Show confirmation for a moment
      setTimeout(() => setApplied(false), 2000);
    }
  };

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

  const getActionIcon = () => {
    switch (actionType) {
      case 'rewrite':
      case 'correct':
      case 'expand':
        return <Wand2 className="h-4 w-4" />;
      case 'translate':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = () => {
    switch (actionType) {
      case 'correct':
        return 'destructive';
      case 'translate':
        return 'secondary';
      case 'rewrite':
      case 'expand':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'rewrite':
        return 'Improved version of the selected text';
      case 'correct':
        return 'Grammar and spelling corrections applied';
      case 'expand':
        return 'Expanded content with more details';
      case 'translate':
        return `Translated to ${language || 'target language'}`;
      case 'summarize':
        return 'Summary of the content';
      case 'outline':
        return 'Structured outline of the content';
      default:
        return 'AI-generated content';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getActionIcon()}
            <CardTitle className="text-base">AI Content Suggestion</CardTitle>
            <Badge variant={getActionColor()}>{action}</Badge>
          </div>
          {applied && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Applied!</span>
            </div>
          )}
        </div>
        <CardDescription>{getActionDescription()}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Original Text (if applicable) */}
        {targetText && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Original:</div>
            <div className="p-3 bg-muted rounded-lg text-sm border-l-4 border-muted-foreground/20">
              {targetText}
            </div>
          </div>
        )}
        
        {/* AI Generated Content */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            AI Suggestion:
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm border-l-4 border-blue-400">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleApplyToEditor}
            disabled={applied}
            className="flex items-center gap-2"
          >
            {applied ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Applied
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Apply to Document
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setPreview(!preview)}
            size="sm"
          >
            {preview ? 'Hide' : 'Preview'} HTML
          </Button>
        </div>
        
        {/* HTML Preview */}
        {preview && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-xs font-medium text-muted-foreground mb-2">HTML:</div>
            <code className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
              {content}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
