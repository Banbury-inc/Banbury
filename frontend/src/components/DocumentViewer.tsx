import { AlertCircle, Download, FileText, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from './ui/button';
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
  const { toast } = useToast();

  // Update currentFile when file prop changes
  useEffect(() => {
    setCurrentFile(file);
  }, [file]);

  useEffect(() => {
    let currentUrl: string | null = null;
    
    const loadDocument = async () => {
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
  }, [currentFile.file_id, currentFile.name]);

  const handleDownload = async () => {
    if (!currentFile.file_id) return;
    
    try {
      const result = await ApiService.downloadS3File(currentFile.file_id, currentFile.name);
      if (result.success && result.url) {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = currentFile.name;
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
            file_id: updatedFile.file_id,
            name: updatedFile.file_name,
            path: updatedFile.file_path,
            type: updatedFile.file_type,
            size: updatedFile.file_size,
            date_modified: updatedFile.date_modified,
            date_uploaded: updatedFile.date_uploaded,
            s3_url: updatedFile.s3_url,
            device_name: updatedFile.device_name,
            kind: 'file'
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
              variant: "warning",
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
      {/* Header with file info and actions */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">{currentFile.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            onClick={handleSave}
            disabled={saving || !currentContent}
            className="h-9 w-9 bg-primary hover:bg-primary/80"
            title="Save document"
          >
            <Save className="h-4 w-4" />
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
            fileName={currentFile.name}
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
