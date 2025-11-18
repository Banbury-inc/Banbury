import { useState, useEffect, useRef } from 'react';
import { inlineImagesInHtml } from './handlers/inlineImages';
import { useToast } from '../../ui/use-toast';
import WordViewer from './WordViewer';
import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils';

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
        // Check if this is a Google Drive file
        const isDriveFile = currentFile.path?.startsWith('drive://');
        const isGoogleDoc = currentFile.mimeType?.includes('vnd.google-apps.document');
        
        if (isDriveFile && isGoogleDoc) {
          console.log('DocumentViewer: Exporting Google Doc as DOCX:', currentFile.file_id);
          // Export Google Doc as DOCX
          const blob = await ApiService.Drive.exportDocAsDocx(currentFile.file_id);
          currentUrl = URL.createObjectURL(blob);
          console.log('DocumentViewer: Created blob URL for exported DOCX:', currentUrl);
          setDocumentUrl(currentUrl);
          setDocumentBlob(blob);
        } else {
          // Download regular file from S3
          const result = await ApiService.downloadFromS3(currentFile.file_id, currentFile.name);
          if (result.success && result.url) {
            currentUrl = result.url;
            setDocumentUrl(result.url);
            setDocumentBlob(result.blob);
          } else {
            setError('Failed to load document content');
          }
        }
      } catch (err) {
        console.error('DocumentViewer: Error loading document:', err);
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
      const isDriveFile = currentFile.path?.startsWith('drive://');
      const isGoogleDoc = currentFile.mimeType?.includes('vnd.google-apps.document');
      
      // Determine download filename
      let downloadName = currentFile.name;
      if (isDriveFile && isGoogleDoc && !downloadName.toLowerCase().endsWith('.docx')) {
        downloadName += '.docx';
      }
      
      // Prefer reusing the existing blob URL to avoid another fetch
      if (documentUrl) {
        const a = document.createElement('a');
        a.href = documentUrl;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      
      // Fallback to fetching if no URL is available
      if (isDriveFile && isGoogleDoc) {
        const blob = await ApiService.Drive.exportDocAsDocx(currentFile.file_id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const result = await ApiService.downloadFromS3(currentFile.file_id, currentFile.name);
        if (result.success && result.url) {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(result.url), 1000);
        }
      }
    } catch (err) {
      // no-op
    }
  };





  const handleSave = async () => {
    if (!currentFile.file_id || !currentContent) return;
    
    setSaving(true);
    try {
      // Check if this is a Google Drive file
      const isDriveFile = currentFile.path?.startsWith('drive://');
      const isGoogleDoc = currentFile.mimeType?.includes('vnd.google-apps.document');
      
      // Clean up the current blob URL before saving
      if (documentUrl && documentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(documentUrl);
      }
      
      // Determine the file extension and content format
      const fileExtension = currentFile.name.toLowerCase().split('.').pop() || '';
      const isDocxFile = fileExtension === 'docx' || isGoogleDoc;
      
      let blob;
      let contentType;
      
      if (isDocxFile) {
        // Inline external images as data URIs so they are embedded for downstream DOCX conversion
        const { html: inlinedHtml } = await inlineImagesInHtml({ html: currentContent })
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
    ${inlinedHtml}
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
      
      // Wrap Blob in a File to ensure filename and type are preserved for multipart
      const fileToUpload = new File([blob], currentFile.name, { type: contentType })

      // Save to Google Drive or S3 depending on file type
      if (isDriveFile && isGoogleDoc) {
        console.log('DocumentViewer: Saving to Google Drive:', currentFile.file_id);
        const driveResult = await ApiService.Drive.updateFile(
          currentFile.file_id,
          fileToUpload,
          currentFile.name
        );
        console.log('DocumentViewer: Google Drive save result:', driveResult);
        
        // Show success toast
        toast({
          title: "Document saved to Google Drive",
          description: `${currentFile.name} has been updated successfully.`,
          variant: "success",
        });
        
        // Call save complete callback if provided
        if (onSaveComplete) {
          onSaveComplete();
        }
      } else {
        // Update the existing file in S3 using the new update endpoint
        const updateResult = await ApiService.updateS3File(
          currentFile.file_id || currentFile.id,
          fileToUpload,
          currentFile.name
        );
        
        if (!updateResult.success) {
          throw new Error('Failed to update file');
        }

        // Show success toast
        toast({
          title: "Document saved successfully",
          description: `${currentFile.name} has been saved.`,
          variant: "success",
        });
        
        // Call save complete callback if provided
        if (onSaveComplete) {
          onSaveComplete();
        }
      }
     

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-accent">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-accent">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-2 border-destructive flex items-center justify-center text-destructive font-bold">!</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load document</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-accent border-0">
      {/* Document display area with TiptapWordEditor */}
      <div className="flex-1 overflow-hidden border-0 bg-accent">
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
