import { AlertCircle, Download, Save, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ApiService } from '../services/apiService';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { useToast } from './ui/use-toast';
import CSVEditor from './workspaces/CSVEditor';

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
  const { toast } = useToast();

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

  useEffect(() => {
    let currentUrl: string | null = null;
    
    const loadDocument = async () => {
      if (!file.file_id) {
        setError('No file ID available for this spreadsheet');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Download the spreadsheet file content
        const result = await ApiService.downloadS3File(file.file_id, file.name);
        if (result.success && result.url) {
          currentUrl = result.url;
          setDocumentUrl(result.url);
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
      // Handle download error silently
    }
  };

  const handleSave = async () => {
    if (!file.file_id || !userInfo?.username) return;
    const contentToSave = currentContent || (latestData ? convertToCSV(latestData) : '');
    if (!contentToSave) return;
    
    setSaving(true);
    try {
      // First delete the existing file from S3
      await ApiService.deleteS3File(file.file_id);
      
      // Create CSV blob
      const blob = new Blob([contentToSave], { type: 'text/csv' });
      
      // Extract parent path from file path
      const parentPath = file.path ? file.path.split('/').slice(0, -1).join('/') : '';
      
      // Upload the new file to S3
      await ApiService.uploadToS3(
        blob,
        file.name,
        'web-editor',
        file.path || '',
        parentPath
      );
      
      // Call the save complete callback
      onSaveComplete?.();
      
      // Show success toast notification
      toast({
        title: "Spreadsheet saved successfully",
        description: `${file.name} has been saved.`,
        variant: "success",
      });
      
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
    <div className="h-full flex flex-col bg-background">
      {/* Header with file info and actions */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">{file.name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            onClick={handleSave}
            disabled={saving || (!currentContent && !latestData)}
            className="h-9 w-9 bg-primary hover:bg-primary/80"
            title="Save spreadsheet"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9 bg-primary hover:bg-primary/80"
            title="Download spreadsheet"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Spreadsheet display area with CSVEditor */}
      <div className="flex-1 overflow-hidden h-full">
        {documentUrl ? (
          <div className="h-full">
            <CSVEditor
              src={documentUrl}
              fileName={file.name}
              onError={() => setError('Failed to load spreadsheet in editor')}
              onLoad={() => setError(null)}
              onContentChange={(data) => setLatestData(data)}
              onSave={(content) => {
                setCurrentContent(content);
                handleSave();
              }}
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
