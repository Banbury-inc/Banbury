import { FileSystemItem } from '../utils/fileTreeUtils';
import { ApiService } from '../services/apiService';
import { useState, useEffect } from 'react';
import { AlertCircle, Download, FileText, ExternalLink, Save } from 'lucide-react';
import { Button } from './ui/button';
import WordViewer from './workspaces/WordViewer';

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

  useEffect(() => {
    let currentUrl: string | null = null;
    
    const loadDocument = async () => {
      if (!file.file_id) {
        setError('No file ID available for this document');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Download the document file content
        const result = await ApiService.downloadS3File(file.file_id, file.name);
        if (result.success && result.url) {
          currentUrl = result.url;
          setDocumentUrl(result.url);
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
    };
  }, [file.file_id, file.name]);

  const handleDownload = async () => {
    if (!file.file_id) return;
    
    try {
      const result = await ApiService.downloadS3File(file.file_id, file.name);
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Clean up the blob URL after download
        setTimeout(() => window.URL.revokeObjectURL(result.url), 1000);
      }
    } catch (err) {
      // console.error('Failed to download document:', err);
    }
  };

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleSave = async () => {
    if (!file.file_id || !userInfo?.username || !currentContent) return;
    
    setSaving(true);
    try {
      // First delete the existing file from S3
      await ApiService.deleteS3File(file.file_id);
      
      // Determine the file extension and content format
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
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
    <title>${file.name}</title>
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
    <title>${file.name}</title>
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
      const parentPath = file.path ? file.path.split('/').slice(0, -1).join('/') : '';
      
      // Upload the new file to S3 with original filename
      await ApiService.uploadToS3(
        blob,
        file.name,  // Always use original filename
        'web-editor',
        file.path || '',
        parentPath
      );
      
      // Call the save complete callback
      onSaveComplete?.();
      
    } catch (err) {
      setError('Failed to save document');
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
      {/* Header with file info and actions */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">{file.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            onClick={handleSave}
            disabled={saving || !currentContent}
            className="h-9 w-9 bg-green-600 hover:bg-green-700"
            title="Save document"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={handleOpenInNewTab}
            className="h-9 w-9 bg-primary hover:bg-primary/80"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9 bg-primary hover:bg-primary/80"
            title="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Document display area with TiptapWordEditor */}
      <div className="flex-1 overflow-hidden">
        {documentUrl ? (
          <WordViewer
            src={documentUrl}
            fileName={file.name}
            onError={() => setError('Failed to load document in editor')}
            onLoad={() => setError(null)}
            onSave={(content) => {
              setCurrentContent(content);
            }}
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
