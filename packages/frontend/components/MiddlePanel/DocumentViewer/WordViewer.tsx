import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import mammoth from 'mammoth';
import React, { useState, useEffect } from 'react';
import TiptapWordEditor from './TiptapWordEditor';
import { useTiptapAIContext } from '../../../contexts/TiptapAIContext';



interface WordViewerProps {
  src: string;
  fileName?: string;
  srcBlob?: Blob;
  onError?: () => void;
  onLoad?: () => void;
  onSave?: (content: string) => void;
  documentActions?: any;
  onDocumentEditorChange?: (editor: any, content: string, fileName: string) => void;
  onSaveDocument?: () => void;
  onDownloadDocument?: () => void;
  saving?: boolean;
  canSave?: boolean;
}

const WordViewer: React.FC<WordViewerProps> = ({
  src,
  fileName,
  srcBlob,
  onError,
  onLoad,
  onSave,
  onDocumentEditorChange,
  onSaveDocument,
  onDownloadDocument,
  saving,
  canSave
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { editor } = useTiptapAIContext();

  // Load DOCX content using mammoth
  useEffect(() => {
    if (!src && !srcBlob) return;

    const loadDocxContent = async () => {
      try {
        setLoading(true);
        setError(null);

        let filePath = src;
        
        // Remove file:// protocol if present
        if (filePath.startsWith('file://')) {
          filePath = filePath.replace('file://', '');
        }
        
        // Fetch the document content
        let htmlContent;
        if (srcBlob) {
          const blob = srcBlob;
          
          // Check the content type and file extension to determine how to parse
          const contentType = blob.type;
          const fileExtension = fileName?.toLowerCase().split('.').pop() || '';
          
          // Check if this is our custom edited DOCX format
          const isEditedDocx = contentType === 'application/vnd.banbury.docx-html';
          
          if (contentType.includes('text/html') || contentType.includes('html') || fileExtension === 'html' || isEditedDocx) {
            // It's an HTML file (including edited DOCX) - read it directly
            const text = await blob.text();
            
            // Check if it has our special meta tags indicating it's an edited DOCX
            const hasOriginalFormatMeta = text.includes('meta name="original-format" content="docx"');
            const hasEditorMeta = text.includes('meta name="editor" content="banbury-editor"');
            
            if (hasOriginalFormatMeta && hasEditorMeta) {
              // This is our edited DOCX format - extract the body content
              const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              htmlContent = bodyMatch ? bodyMatch[1] : text;
            } else {
              // Regular HTML file
              const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              htmlContent = bodyMatch ? bodyMatch[1] : text;
            }
          } else if (fileExtension === 'docx') {
            // Original DOCX file - use mammoth to convert
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              htmlContent = result.value;
            } catch (mammothError) {
              // If mammoth fails on a .docx file, it might be our edited format
              const text = await blob.text();
              if (text.includes('<') && text.includes('>')) {
                const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                htmlContent = bodyMatch ? bodyMatch[1] : text;
              } else {
                throw mammothError; // Re-throw the original error
              }
            }
          } else {
            // Try to parse as DOCX first, if it fails, treat as HTML/text
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              htmlContent = result.value;
            } catch (mammothError) {
              // If mammoth fails, try reading as text/HTML
              const text = await blob.text();
              // Check if it looks like HTML content
              if (text.includes('<') && text.includes('>')) {
                const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                htmlContent = bodyMatch ? bodyMatch[1] : text;
              } else {
                // If it's plain text, wrap it in a paragraph
                htmlContent = `<p>${text}</p>`;
            }
          }
        }
        }
        else if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('blob:')) {
          const response = await fetch(filePath);
          const blob = await response.blob();
          
          // Check the content type and file extension to determine how to parse
          const contentType = blob.type;
          const fileExtension = fileName?.toLowerCase().split('.').pop() || '';
          
          // Check if this is our custom edited DOCX format
          const isEditedDocx = contentType === 'application/vnd.banbury.docx-html';
          
          if (contentType.includes('text/html') || contentType.includes('html') || fileExtension === 'html' || isEditedDocx) {
            const text = await blob.text();
            const hasOriginalFormatMeta = text.includes('meta name="original-format" content="docx"');
            const hasEditorMeta = text.includes('meta name="editor" content="banbury-editor"');
            if (hasOriginalFormatMeta && hasEditorMeta) {
              const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              htmlContent = bodyMatch ? bodyMatch[1] : text;
            } else {
              const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              htmlContent = bodyMatch ? bodyMatch[1] : text;
            }
          } else if (fileExtension === 'docx') {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              htmlContent = result.value;
            } catch (mammothError) {
              const text = await blob.text();
              if (text.includes('<') && text.includes('>')) {
                const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                htmlContent = bodyMatch ? bodyMatch[1] : text;
              } else {
                throw mammothError;
              }
            }
          } else {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              htmlContent = result.value;
            } catch (mammothError) {
              const text = await blob.text();
              if (text.includes('<') && text.includes('>')) {
                const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                htmlContent = bodyMatch ? bodyMatch[1] : text;
              } else {
                htmlContent = `<p>${text}</p>`;
              }
            }
          }
        } else {
          throw new Error('Local file access not supported in web environment');
        }
        
        const initial = htmlContent || '<p>Start editing this document...</p>';
        setContent(initial);
        // Propagate initial content so parent can enable Save button
        onSave?.(initial);
        onLoad?.();
        
      } catch (err) {
        const errorMessage = `Failed to load document: ${err instanceof Error ? err.message : 'Unable to parse DOCX file'}`;
        setError(errorMessage);
        const fallback = `
          <div>
            <h2>Document: ${fileName}</h2>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 4px; margin: 16px 0;">
              <p style="margin: 0; color: #856404;"><strong>Unable to load DOCX content</strong></p>
              <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">
                The document format may not be supported or the file may be corrupted. 
                You can start editing with rich text formatting below.
              </p>
            </div>
            <p>Start typing your content here...</p>
          </div>
        `;
        setContent(fallback);
        // Also propagate fallback so parent can enable Save button
        onSave?.(fallback);
        onError?.();
      } finally {
        setLoading(false);
      }
    };

    loadDocxContent();
  }, [src, srcBlob, fileName]);

  // Listen for AI document edit responses and apply to editor + internal state
  useEffect(() => {
    const handler = (event: any) => {
      const detail = event?.detail || {};
      const { htmlContent, operations } = detail as {
        htmlContent?: string;
        operations?: Array<
          | { type: 'setContent'; html: string }
          | { type: 'replaceText'; target: string; replacement: string; all?: boolean; caseSensitive?: boolean }
          | { type: 'replaceBetween'; from: number; to: number; html: string }
          | { type: 'insertAfterText'; target: string; html: string; occurrence?: number; caseSensitive?: boolean }
          | { type: 'insertBeforeText'; target: string; html: string; occurrence?: number; caseSensitive?: boolean }
          | { type: 'deleteText'; target: string; all?: boolean; caseSensitive?: boolean }
        >
      };

      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const applyOps = (html: string, ops: any[]): string => {
        let next = html;
        for (const op of ops) {
          if (!op || typeof op !== 'object') continue;
          switch (op.type) {
            case 'setContent':
              if (typeof op.html === 'string') next = op.html;
              break;
            case 'replaceText': {
              const flags = `${op.all ? 'g' : ''}${op.caseSensitive ? '' : 'i'}`;
              try {
                const rx = new RegExp(escapeRegExp(op.target), flags);
                next = next.replace(rx, op.replacement);
              } catch {}
              break;
            }
            case 'replaceBetween': {
              if (typeof op.from === 'number' && typeof op.to === 'number' && typeof op.html === 'string') {
                const from = Math.max(0, Math.min(op.from, next.length));
                const to = Math.max(from, Math.min(op.to, next.length));
                next = next.slice(0, from) + op.html + next.slice(to);
              }
              break;
            }
            case 'insertAfterText': {
              const flags = op.caseSensitive ? '' : 'i';
              try {
                const rx = new RegExp(escapeRegExp(op.target), flags);
                const occurrence = Math.max(1, Number(op.occurrence) || 1);
                let count = 0;
                next = next.replace(rx, (m) => {
                  count += 1;
                  return count === occurrence ? m + op.html : m;
                });
              } catch {}
              break;
            }
            case 'insertBeforeText': {
              const flags = op.caseSensitive ? '' : 'i';
              try {
                const rx = new RegExp(escapeRegExp(op.target), flags);
                const occurrence = Math.max(1, Number(op.occurrence) || 1);
                let count = 0;
                next = next.replace(rx, (m) => {
                  count += 1;
                  return count === occurrence ? op.html + m : m;
                });
              } catch {}
              break;
            }
            case 'deleteText': {
              const flags = op.caseSensitive ? 'g' : 'gi';
              try {
                const rx = new RegExp(escapeRegExp(op.target), flags);
                next = next.replace(rx, '');
              } catch {}
              break;
            }
            default:
              break;
          }
        }
        return next;
      };

      let nextHTML = content;
      if (htmlContent && typeof htmlContent === 'string') {
        nextHTML = htmlContent;
      } else if (operations && Array.isArray(operations)) {
        nextHTML = applyOps(content || '', operations);
      }

      if (nextHTML && typeof nextHTML === 'string') {
        setContent(nextHTML);
        // update the live editor if available
        try {
          editor?.commands.setContent(nextHTML, { emitUpdate: true });
        } catch {}
        // bubble up so save button enables
        onSave?.(nextHTML);
      }
    };

    window.addEventListener('document-ai-response', handler as EventListener);
    return () => window.removeEventListener('document-ai-response', handler as EventListener);
  }, [content, editor, onSave]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onSave?.(newContent);
    
    // Mock editor object for backward compatibility
    const mockEditor = {
      getHTML: () => newContent,
      getText: () => newContent.replace(/<[^>]*>/g, ''),
    };
    
    onDocumentEditorChange?.(mockEditor, newContent, fileName || 'Untitled Document');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#27272a]">
        <div className="flex flex-col items-center gap-4">
          <CircularProgress sx={{ color: '#9ca3af' }} />
          <Typography sx={{ color: '#f3f4f6' }}>Loading document...</Typography>
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '0', bg: '#27272a' }}>
      {error && (
        <Alert severity="warning" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      <TiptapWordEditor
        initialContent={content}
        onContentChange={handleContentChange}
        placeholder={`Start editing ${fileName || 'your document'}...`}
        onSave={onSaveDocument}
        onDownload={onDownloadDocument}
        saving={saving}
        canSave={canSave}
      />
    </Box>
  );
};

export default WordViewer;
