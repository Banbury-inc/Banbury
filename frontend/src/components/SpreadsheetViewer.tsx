import { AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useToast } from './ui/use-toast';
import CSVEditor from './workspaces/CSVEditor';
import { ApiService } from '../services/apiService';
import { FileSystemItem } from '../utils/fileTreeUtils';

interface SpreadsheetViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
  onSaveComplete?: () => void;
}

export function SpreadsheetViewer({ file, userInfo, onSaveComplete }: SpreadsheetViewerProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [latestData, setLatestData] = useState<any[][] | null>(null);
  const [currentFile, setCurrentFile] = useState<FileSystemItem>(file);
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const { toast } = useToast();

  // Prevent duplicate loads (e.g., React StrictMode) for the same file
  const lastFetchKeyRef = useRef<string | null>(null);

  // Convert table data to CSV (mirrors CSVEditor's logic)
  const convertToCSV = (data: any[][]): string => {
    return data
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? '');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
      .join('\n');
  };

  // keep local file in sync
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
        setError('No file ID available for this spreadsheet');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Download the spreadsheet file content
        const result = await ApiService.downloadS3File(currentFile.file_id, currentFile.name);
        if (result.success && result.url) {
          currentUrl = result.url;
          // Avoid setting a new blob URL if it's unchanged to prevent re-renders
          setDocumentUrl(prev => (prev === result.url ? prev : result.url));
          setDocumentBlob(result.blob);
        } else {
          setError('Failed to load spreadsheet content');
        }
      } catch (err) {
        setError('Failed to load spreadsheet content');
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

  const handleDownload = async () => {
    if (!currentFile.file_id) return;
    
    try {
      if (documentUrl) {
        const a = document.createElement('a');
        a.href = documentUrl;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
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
      // Handle download error silently
    }
  };

  const handleSave = async () => {
    if (!currentFile.file_id || !userInfo?.username) return;
    const contentToSave = currentContent || (latestData ? convertToCSV(latestData) : '');
    if (!contentToSave) return;
    
    setSaving(true);
    try {
      // Clean up the current blob URL before saving
      if (documentUrl && documentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(documentUrl);
      }
      // First delete the existing file from S3
      await ApiService.deleteS3File(currentFile.file_id);
      
      // Create CSV blob
      const blob = new Blob([contentToSave], { type: 'text/csv' });
      
      // Extract parent path from file path
      const parentPath = currentFile.path ? currentFile.path.split('/').slice(0, -1).join('/') : '';
      
      // Upload the new file to S3
      await ApiService.uploadToS3(
        blob,
        currentFile.name,
        'web-editor',
        currentFile.path || '',
        parentPath
      );
      
      // Call the save complete callback to refresh the sidebar
      onSaveComplete?.();

      // Reload the saved spreadsheet with retry (S3 propagation)
      const reloadSpreadsheet = async (retryCount = 0) => {
        const maxRetries = 3;
        const retryDelay = 1000;
        try {
          const userFilesResult = await ApiService.getUserFiles(userInfo.username);
          if (!userFilesResult.success) {
            throw new Error('Failed to get updated file list');
          }
          const updatedFile = userFilesResult.files.find((f: any) => f.file_path === currentFile.path);
          if (!updatedFile || !updatedFile.file_id) {
            throw new Error('Updated file not found');
          }

          const newFile: FileSystemItem = {
            id: updatedFile.file_path,
            file_id: updatedFile.file_id,
            name: updatedFile.file_name,
            path: updatedFile.file_path,
            type: updatedFile.file_type === 'folder' ? 'folder' : 'file',
            size: updatedFile.file_size,
            modified: new Date(updatedFile.date_modified),
            s3_url: updatedFile.s3_url,
          };
          setCurrentFile(newFile);

          const dl = await ApiService.downloadS3File(updatedFile.file_id, currentFile.name);
          if (dl.success && dl.url) {
            setDocumentUrl(dl.url);
            setDocumentBlob(dl.blob);
            toast({
              title: "Spreadsheet saved successfully",
              description: `${currentFile.name} has been saved.`,
              variant: "success",
            });
            return;
          }

          if (retryCount < maxRetries) {
            setTimeout(() => reloadSpreadsheet(retryCount + 1), retryDelay);
          } else {
            throw new Error('Reload failed');
          }
        } catch (e) {
          if (retryCount < 3) {
            setTimeout(() => reloadSpreadsheet(retryCount + 1), 1000);
          } else {
            toast({
              title: "Spreadsheet saved but reload failed",
              description: "Saved successfully, but you may need to refresh to see changes.",
              variant: "destructive",
            });
          }
        }
      };
      setTimeout(() => reloadSpreadsheet(), 500);
      
    } catch (err) {
      setError('Failed to save spreadsheet');
      // Show error toast notification
      toast({
        title: "Failed to save spreadsheet",
        description: "There was an error saving your spreadsheet. Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveXlsx = async (xlsxBlob: Blob, suggestedFileName: string) => {
    if (!currentFile.file_id || !userInfo?.username) return;
    setSaving(true);
    try {
      if (documentUrl && documentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(documentUrl);
      }
      await ApiService.deleteS3File(currentFile.file_id);

      const parentPath = currentFile.path ? currentFile.path.split('/').slice(0, -1).join('/') : '';
      const newFileName = suggestedFileName || currentFile.name.replace(/\.[^/.]+$/, '.xlsx');
      const newPath = currentFile.path
        ? currentFile.path.split('/').slice(0, -1).concat(newFileName).join('/')
        : '';

      await ApiService.uploadToS3(
        xlsxBlob,
        newFileName,
        'web-editor',
        newPath,
        parentPath
      );

      onSaveComplete?.();

      const reloadSpreadsheet = async (retryCount = 0) => {
        const maxRetries = 3;
        const retryDelay = 1000;
        try {
          const userFilesResult = await ApiService.getUserFiles(userInfo.username);
          if (!userFilesResult.success) {
            throw new Error('Failed to get updated file list');
          }
          const updatedFile = userFilesResult.files.find((f: any) => f.file_path === newPath);
          if (!updatedFile || !updatedFile.file_id) {
            throw new Error('Updated file not found');
          }

          const newFile: FileSystemItem = {
            id: updatedFile.file_path,
            file_id: updatedFile.file_id,
            name: updatedFile.file_name,
            path: updatedFile.file_path,
            type: updatedFile.file_type === 'folder' ? 'folder' : 'file',
            size: updatedFile.file_size,
            modified: new Date(updatedFile.date_modified),
            s3_url: updatedFile.s3_url,
          };
          setCurrentFile(newFile);

          const dl = await ApiService.downloadS3File(updatedFile.file_id, newFileName);
          if (dl.success && dl.url) {
            setDocumentUrl(dl.url);
            setDocumentBlob(dl.blob);
            toast({
              title: 'Spreadsheet saved successfully',
              description: `${newFileName} has been saved.`,
              variant: 'success',
            });
            return;
          }

          if (retryCount < maxRetries) {
            setTimeout(() => reloadSpreadsheet(retryCount + 1), retryDelay);
          } else {
            throw new Error('Reload failed');
          }
        } catch (e) {
          if (retryCount < 3) {
            setTimeout(() => reloadSpreadsheet(retryCount + 1), 1000);
          } else {
            toast({
              title: 'Spreadsheet saved but reload failed',
              description: 'Saved successfully, but you may need to refresh to see changes.',
              variant: 'destructive',
            });
          }
        }
      };
      setTimeout(() => reloadSpreadsheet(), 500);
    } catch (err) {
      setError('Failed to save spreadsheet');
      toast({
        title: 'Failed to save spreadsheet',
        description: 'There was an error saving your spreadsheet. Please try again.',
        variant: 'error',
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
          <p className="text-muted-foreground">Loading spreadsheet...</p>
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load spreadsheet</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Spreadsheet display area with CSVEditor */}
      <div className="flex-1 overflow-hidden">
        {documentUrl ? (
          <div className="h-full">
            <CSVEditor
              src={documentUrl}
              fileName={currentFile.name}
              srcBlob={documentBlob || undefined}
              onError={() => setError('Failed to load spreadsheet in editor')}
              onLoad={() => setError(null)}
              onContentChange={(data) => setLatestData(data)}
              onSave={(content) => {
                // Save immediately with the provided content to avoid race conditions
                setCurrentContent(content);
                (async () => {
                  if (!currentFile.file_id || !userInfo?.username) return;
                  const contentToSave = content;
                  if (!contentToSave) return;
                  setSaving(true);
                  try {
                    if (documentUrl && documentUrl.startsWith('blob:')) {
                      window.URL.revokeObjectURL(documentUrl);
                    }
                    await ApiService.deleteS3File(currentFile.file_id);
                    const blob = new Blob([contentToSave], { type: 'text/csv' });
                    const parentPath = currentFile.path ? currentFile.path.split('/').slice(0, -1).join('/') : '';
                    await ApiService.uploadToS3(
                      blob,
                      currentFile.name,
                      'web-editor',
                      currentFile.path || '',
                      parentPath
                    );
                    onSaveComplete?.();
                    const reloadSpreadsheet = async (retryCount = 0) => {
                      const maxRetries = 3;
                      const retryDelay = 1000;
                      try {
                        const userFilesResult = await ApiService.getUserFiles(userInfo.username);
                        if (!userFilesResult.success) {
                          throw new Error('Failed to get updated file list');
                        }
                        const updatedFile = userFilesResult.files.find((f: any) => f.file_path === currentFile.path);
                        if (!updatedFile || !updatedFile.file_id) {
                          throw new Error('Updated file not found');
                        }
                        const newFile: FileSystemItem = {
                          id: updatedFile.file_path,
                          file_id: updatedFile.file_id,
                          name: updatedFile.file_name,
                          path: updatedFile.file_path,
                          type: updatedFile.file_type === 'folder' ? 'folder' : 'file',
                          size: updatedFile.file_size,
                          modified: new Date(updatedFile.date_modified),
                          s3_url: updatedFile.s3_url,
                        };
                        setCurrentFile(newFile);
                        const dl = await ApiService.downloadS3File(updatedFile.file_id, currentFile.name);
                        if (dl.success && dl.url) {
                          setDocumentUrl(dl.url);
                          setDocumentBlob(dl.blob);
                          toast({
                            title: 'Spreadsheet saved successfully',
                            description: `${currentFile.name} has been saved.`,
                            variant: 'success',
                          });
                          return;
                        }
                        if (retryCount < maxRetries) {
                          setTimeout(() => reloadSpreadsheet(retryCount + 1), retryDelay);
                        } else {
                          throw new Error('Reload failed');
                        }
                      } catch (e) {
                        if (retryCount < 3) {
                          setTimeout(() => reloadSpreadsheet(retryCount + 1), 1000);
                        } else {
                          toast({
                            title: 'Spreadsheet saved but reload failed',
                            description: 'Saved successfully, but you may need to refresh to see changes.',
                            variant: 'destructive',
                          });
                        }
                      }
                    };
                    setTimeout(() => reloadSpreadsheet(), 500);
                  } catch (err) {
                    setError('Failed to save spreadsheet');
                    toast({
                      title: 'Failed to save spreadsheet',
                      description: 'There was an error saving your spreadsheet. Please try again.',
                      variant: 'error',
                    });
                  } finally {
                    setSaving(false);
                  }
                })();
              }}
              onSaveXlsx={(blob, fname) => {
                handleSaveXlsx(blob, fname);
              }}
              onSaveDocument={handleSave}
              onDownloadDocument={handleDownload}
              saving={saving}
              canSave={!!currentContent || !!latestData}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">No spreadsheet to display</div>
          </div>
        )}
      </div>
    </div>
  );
}
