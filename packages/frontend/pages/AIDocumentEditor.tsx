import { 
  Download, 
  Upload, 
  FileText, 
  Save, 
  Share,
  Settings,
  Wand2,
  MessageSquare
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { AITiptapEditor } from '../components/AITiptapEditor';
import { AssistantSidebar } from '../components/assistant-sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TiptapAIProvider } from '../contexts/TiptapAIContext';
import { cn } from '../utils';

interface DocumentStats {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
}

export const AIDocumentEditor: React.FC = () => {
  const [documentContent, setDocumentContent] = useState('<h1>Welcome to AI Document Editor</h1><p>Start typing your document here, or use the AI assistant on the right to help you create and edit content...</p>');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    wordCount: 0,
    characterCount: 0,
    paragraphCount: 0
  });
  const [isAIAssistantExpanded, setIsAIAssistantExpanded] = useState(true);

  // Calculate document statistics
  useEffect(() => {
    const textContent = documentContent
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const words = textContent ? textContent.split(' ').filter(word => word.length > 0) : [];
    const paragraphs = documentContent.split('</p>').length - 1;
    
    setDocumentStats({
      wordCount: words.length,
      characterCount: textContent.length,
      paragraphCount: Math.max(paragraphs, 1)
    });
  }, [documentContent]);

  const handleSaveDocument = () => {
    // Implement save functionality
    const blob = new Blob([documentContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = () => {
    // This would integrate with a DOCX export library
    console.log('Exporting to DOCX...');
    // TODO: Implement DOCX export using docx library
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.txt,.md';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setDocumentContent(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Listen for AI requests from the editor
  useEffect(() => {
    const handleAIRequest = (event: CustomEvent) => {
      const { message, action, selection } = event.detail;
      
      // Auto-focus on the assistant panel
      setIsAIAssistantExpanded(true);
      
      // Create enhanced message for document editing
      const enhancedMessage = `Please help me with the following document editing task:

${message}

${selection ? `\nSelected text: "${selection.text}"` : ''}

Please use the tiptap_ai tool to provide your response so it can be directly applied to the document editor. Make sure to preserve proper formatting and structure.`;
      
      // Store the message for the runtime to pick up
      localStorage.setItem('pendingAIRequest', JSON.stringify({
        message: enhancedMessage,
        timestamp: Date.now(),
        action,
        selection
      }));
      
      // Trigger a custom event that the runtime can listen for
      window.dispatchEvent(new CustomEvent('assistant-ai-request', {
        detail: { message: enhancedMessage, action, selection }
      }));
    };

    window.addEventListener('tiptap-ai-request', handleAIRequest as EventListener);
    
    return () => {
      window.removeEventListener('tiptap-ai-request', handleAIRequest as EventListener);
    };
  }, []);

  return (
    <TiptapAIProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h1 className="text-lg font-semibold">AI Document Editor</h1>
            </div>
            
            {/* Document Stats */}
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <span>{documentStats.wordCount} words</span>
              <span>{documentStats.characterCount} characters</span>
              <span>{documentStats.paragraphCount} paragraphs</span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportFile}
              className="hidden sm:flex"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDocument}
              className="hidden sm:flex"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportDocx}
              className="hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAIAssistantExpanded(!isAIAssistantExpanded)}
              className="md:hidden"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <AssistantSidebar>
            <div className="h-full flex flex-col">
              {/* AI Quick Actions Bar */}
              <div className="border-b p-3 bg-muted/30">
                <div className="flex items-center gap-2 text-sm">
                  <Wand2 className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">AI Assistant Active</span>
                  <span className="text-muted-foreground">
                    Select text in the editor and use AI tools, or chat with the assistant →
                  </span>
                </div>
              </div>

              {/* Editor Container */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <AITiptapEditor
                    initialContent={documentContent}
                    onContentChange={setDocumentContent}
                    placeholder="Start writing your document... Use the AI assistant on the right for help!"
                    className="min-h-[600px] bg-card shadow-sm"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-3 bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>AI-powered document editor with real-time assistance</div>
                  <div className="flex items-center gap-4">
                    <span>{documentStats.wordCount} words</span>
                    <span>{documentStats.characterCount} chars</span>
                  </div>
                </div>
              </div>
            </div>
          </AssistantSidebar>
        </div>
      </div>
    </TiptapAIProvider>
  );
};
