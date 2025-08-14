import { AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';


import WordViewer from './workspaces/WordViewer';
import { ApiService } from '../services/apiService';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { useToast } from './ui/use-toast';

interface DocumentViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
  onSaveComplete?: () => void;
}

export function DocumentViewer({ file, userInfo, onSaveComplete }: DocumentViewerProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileSystemItem>(file);
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  // Prevent duplicate loads (e.g., React StrictMode) for the same file
  const lastFetchKeyRef = useRef<string | null>(null);

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  useEffect(() => {
    let currentUrl: string | null = null;
    
    const loadDocument = async () => {
      const fetchKey = `${currentFile.file_id}|${currentFile.name}`;
      if (lastFetchKeyRef.current === fetchKey) {
        return;
      }
      lastFetchKeyRef.current = fetchKey;
      
      if (!currentFile.file_id) {
        setError('No file ID available for this document');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Download the document file content
        const result = await ApiService.downloadS3File(currentFile.file_id, currentFile.name);
        if (result.success && result.url) {
          currentUrl = result.url;
          setDocumentUrl(result.url);
          setDocumentBlob(result.blob);
        } else {
          setError('Failed to load document content');
        }
      } catch (err) {
        setError('Failed to load document content');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    // Cleanup function
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentUrl);
      }
      setDocumentBlob(null);
    };
  }, [currentFile.file_id, currentFile.name]);

  // Listen for AI document edit responses and update current content
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
                const rx = new RegExp(op.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
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
                const rx = new RegExp(op.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
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
                const rx = new RegExp(op.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
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
                const rx = new RegExp(op.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
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

      if (htmlContent && typeof htmlContent === 'string') {
        setCurrentContent(htmlContent);
        return;
      }
      if (operations && Array.isArray(operations)) {
        setCurrentContent((prev) => applyOps(prev || '', operations));
      }
    };

    window.addEventListener('document-ai-response', handler as EventListener);
    return () => window.removeEventListener('document-ai-response', handler as EventListener);
  }, []);

  const handleDownload = async () => {
    if (!currentFile.file_id) return;
    
    try {
      // Prefer reusing the existing blob URL to avoid another fetch
      if (documentUrl) {
        const a = document.createElement('a');
        a.href = documentUrl;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      // Fallback to fetching if no URL is available
      const result = await ApiService.downloadS3File(currentFile.file_id, currentFile.name);
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(result.url), 1000);
      }
    } catch (err) {
      // no-op
    }
  };





  const handleSave = async () => {
    if (!currentFile.file_id || !userInfo?.username || !currentContent) return;
    
    setSaving(true);
    try {
      // Clean up the current blob URL before saving
      if (documentUrl && documentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(documentUrl);
      }
      
      // First delete the existing file from S3
      await ApiService.deleteS3File(currentFile.file_id);
      
      // Determine the file extension and content format
      const fileExtension = currentFile.name.toLowerCase().split('.').pop() || '';
      const isDocxFile = fileExtension === 'docx';
      
      let blob;
      let contentType;
      
      if (isDocxFile) {
        // For DOCX files, we'll save the HTML content but mark it as a custom format
        // that our system can recognize as edited DOCX content
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${currentFile.name}</title>
    <meta name="original-format" content="docx">
    <meta name="editor" content="banbury-editor">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    </style>
</head>
<body>
    ${currentContent}
</body>
</html>`;
        // Use a custom content type that indicates this is edited DOCX content
        blob = new Blob([htmlContent], { type: 'application/vnd.banbury.docx-html' });
        contentType = 'application/vnd.banbury.docx-html';
      } else if (fileExtension === 'html' || fileExtension === 'htm') {
        // For HTML files, save with proper HTML structure
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${currentFile.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    </style>
</head>
<body>
    ${currentContent}
</body>
</html>`;
        blob = new Blob([htmlContent], { type: 'text/html' });
        contentType = 'text/html';
      } else {
        // For other files, save just the content with appropriate type
        blob = new Blob([currentContent], { type: 'text/html' });
        contentType = 'text/html';
      }
      
      // Extract parent path from file path
      const parentPath = currentFile.path ? currentFile.path.split('/').slice(0, -1).join('/') : '';
      
      // Upload the new file to S3 with original filename
      await ApiService.uploadToS3(
        blob,
        currentFile.name,  // Always use original filename
        'web-editor',
        currentFile.path || '',
        parentPath
      );
      
      // Call the save complete callback first to refresh file system
      onSaveComplete?.();
      
      // Attempt to reload the document with retry logic to handle S3 propagation delay
      const reloadDocument = async (retryCount = 0) => {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second
        
        try {
          // First, get the updated file information to get the new file ID
          if (!userInfo?.username) {
            throw new Error('No username available');
          }
          
          const userFilesResult = await ApiService.getUserFiles(userInfo.username);
          if (!userFilesResult.success) {
            throw new Error('Failed to get updated file list');
          }
          
          // Find the file by path since the file ID has changed
          const updatedFile = userFilesResult.files.find(f => f.file_path === currentFile.path);
          if (!updatedFile || !updatedFile.file_id) {
            throw new Error('Updated file not found in file list');
          }
          
          // Update our currentFile state with the new file information
          const newFileSystemItem: FileSystemItem = {
            id: updatedFile.file_path,
            file_id: updatedFile.file_id,
            name: updatedFile.file_name,
            path: updatedFile.file_path,
            type: 'file',
            size: updatedFile.file_size,
            modified: new Date(updatedFile.date_modified),
            s3_url: updatedFile.s3_url
          };
          setCurrentFile(newFileSystemItem);
          
          // Now download the file using the new file ID
          const result = await ApiService.downloadS3File(updatedFile.file_id, currentFile.name);
          if (result.success && result.url) {
            setDocumentUrl(result.url);
            return;
          }
          
          // If we get here, the download didn't succeed, try again
          if (retryCount < maxRetries) {
            setTimeout(() => reloadDocument(retryCount + 1), retryDelay);
          } else {
            throw new Error('Document download failed after retries');
          }
        } catch (reloadErr) {
          if (retryCount < maxRetries) {
            // Retry after delay
            setTimeout(() => reloadDocument(retryCount + 1), retryDelay);
          } else {
            // Final failure - show warning but don't fail the save operation
            toast({
              title: "Document saved but reload failed",
              description: "Document was saved successfully, but you may need to refresh to see changes.",
              variant: "destructive",
            });
          }
        }
      };
      
      // Start the reload process with initial delay
      setTimeout(() => reloadDocument(), 500);
      
      // Show success toast
      toast({
        title: "Document saved successfully",
        description: `${currentFile.name} has been saved.`,
        variant: "success",
      });
      
    } catch (err) {
      setError('Failed to save document');
      
      // Show error toast
      toast({
        title: "Failed to save document",
        description: "There was an error saving your document. Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load document</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Document display area with TiptapWordEditor */}
      <div className="flex-1 overflow-hidden">
        {documentUrl ? (
          <WordViewer
            src={documentUrl}
            fileName={currentFile.name}
            srcBlob={documentBlob || undefined}
            onError={() => setError('Failed to load document in editor')}
            onLoad={() => setError(null)}
            onSave={(content) => {
              setCurrentContent(content);
            }}
            onSaveDocument={handleSave}
            onDownloadDocument={handleDownload}
            saving={saving}
            canSave={!!currentContent}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">No document to display</div>
          </div>
        )}
      </div>
    </div>
  );
}
