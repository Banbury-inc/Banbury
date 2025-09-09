import { Network, CheckCircle, AlertCircle, Eye, Edit3 } from 'lucide-react';
import React, { useMemo, useState, useEffect } from 'react';

import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
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
  const [showPreview, setShowPreview] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const opSummary = useMemo(() => {
    const ops = operations || [];
    const counts: Record<string, number> = {};
    for (const op of ops) {
      counts[op.type] = (counts[op.type] || 0) + 1;
    }
    return counts;
  }, [operations]);

  // Automatically apply changes when component mounts
  useEffect(() => {
    const hasContent = 
      (diagramXml && diagramXml.trim().length > 0) || 
      (operations && operations.length > 0) ||
      (analysis && analysis.trim().length > 0);
    
    if (hasContent) {
      const payload = { 
        action: action || 'Diagram changes', 
        diagramName, 
        operations: operations || [], 
        diagramXml, 
        fileUrl,
        analysis,
        note 
      };
      window.dispatchEvent(new CustomEvent('drawio-ai-response', { detail: payload }));
      setApplied(true);
    }
  }, [action, diagramName, operations, diagramXml, fileUrl, analysis, note]);

  const handleApply = () => {
    const payload = { 
      action: action || 'Diagram changes', 
      diagramName, 
      operations: operations || [], 
      diagramXml,
      fileUrl,
      analysis,
      note 
    };
    window.dispatchEvent(new CustomEvent('drawio-ai-response', { detail: payload }));
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleEdit = () => {
    if (fileUrl) {
      const editUrl = `https://app.diagrams.net/?url=${encodeURIComponent(fileUrl)}`;
      window.open(editUrl, '_blank');
    }
  };

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

  return (
    <Card className="w-full max-w-4xl bg-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <CardTitle className="text-base">Diagram Analysis & Changes</CardTitle>
            {diagramName && <Badge variant="outline">Diagram: {diagramName}</Badge>}
          </div>
        </div>
        <CardDescription>
          {note ? note : 'Review the suggested diagram changes and analysis.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Analysis Section */}
        {analysis && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Analysis</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">{analysis}</p>
          </div>
        )}

        {/* Operations Summary */}
        {operations && operations.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Operations: {operations.length}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(opSummary).map(([k, v]) => (
                <Badge key={k} variant="secondary">{k}: {v}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <div className="flex-1" />
          
          {fileUrl && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowViewer(!showViewer)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showViewer ? 'Hide Viewer' : 'View Diagram'}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit in draw.io
              </Button>
            </>
          )}
          
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Hide Details' : 'Show Details'}
          </Button>
          
          {applied && (
            <Button variant="outline" size="sm" onClick={handleApply} className="text-blue-600 hover:text-blue-700">
              Reapply
            </Button>
          )}
        </div>

        {/* Diagram Viewer */}
        {showViewer && fileUrl && diagramName && (
          <div className="mt-4">
            <DrawioViewer
              fileUrl={fileUrl}
              fileName={diagramName}
              isEmbedded={true}
              className="border-2 border-dashed border-border"
            />
          </div>
        )}

        {/* Preview Details */}
        {showPreview && (
          <div className="mt-4 space-y-3">
            {operations && operations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Operations:</h4>
                <div className="p-3 bg-muted rounded text-xs max-h-40 overflow-auto">
                  {operations.slice(0, 10).map((op, idx) => (
                    <div key={idx} className="break-words mb-2 last:mb-0">
                      <span className="font-medium text-blue-600">{op.type}:</span> {op.description || JSON.stringify(op)}
                    </div>
                  ))}
                  {operations.length > 10 && (
                    <div className="opacity-70 italic">…{operations.length - 10} more operations</div>
                  )}
                </div>
              </div>
            )}
            
            {diagramXml && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Diagram XML:</h4>
                <div className="p-3 bg-muted rounded text-xs max-h-40 overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {diagramXml.slice(0, 2000)}{diagramXml.length > 2000 ? '…' : ''}
                  </code>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrawioAITool;
