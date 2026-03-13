import React, { useState, useEffect } from 'react';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { ApiService } from '../services/apiService';
import { getLanguageDisplayName } from './languageUtils';
import { CodeHeader } from './CodeHeader';

interface CodeViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ file }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileContent = async () => {

      try {
        setLoading(true);
        setError(null);

        const isDriveFile = file.path?.startsWith('drive://');
        const isOneDriveFile = file.path?.startsWith('onedrive://');
        
        let fileContent: string;
        
        if (isDriveFile) {
          // Get file content from Google Drive
          const blob = await ApiService.Drive.getFileBlob(file.file_id);
          fileContent = await blob.text();
        } else if (isOneDriveFile) {
          // Get file content from OneDrive
          const blob = await ApiService.OneDrive.getFileBlob(file.file_id);
          fileContent = await blob.text();
        } else {
          // Get the file content from S3 using the ApiService
          const downloadResult = await ApiService.downloadS3File(file.file_id, file.name);
          
          if (!downloadResult.success) {
            throw new Error('Failed to download file');
          }

          // Convert blob to text
          fileContent = await downloadResult.blob.text();
        }
        
        setContent(fileContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [file]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background" aria-busy="true">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4 motion-reduce:animate-none" aria-hidden />
          <p className="text-muted-foreground">Loading code file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h3 className="text-xl font-semibold text-foreground mb-2">Error loading file</h3>
          <p className="text-muted-foreground mb-2">{error}</p>
          <p className="text-muted-foreground text-sm mb-4">File: {file.name}</p>
          <p className="text-muted-foreground text-sm">Try opening another file.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <CodeHeader
        fileName={file.name}
        language={getLanguageDisplayName(file.name)}
        mode="view"
        fileSize={file.size}
      />

      {/* Code Content */}
      <div className="flex-1 min-h-0 p-4">
        <pre className="bg-background text-foreground text-sm p-2 rounded-lg overflow-auto h-full font-mono whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;
