import { AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useToast } from '../../ui/use-toast';
import CSVEditor from './CSVEditor';
import { ApiService } from '../../../services/apiService';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { handleSpreadsheetSave } from './handlers/handle-spreadsheet-save';

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
  const [latestFormatting, setLatestFormatting] = useState<{
    cellFormats: {[key: string]: {className?: string}};
    cellStyles: {[key: string]: React.CSSProperties};
    cellTypeMeta: {[key: string]: { type: 'dropdown' | 'checkbox' | 'numeric' | 'date' | 'text'; source?: string[]; numericFormat?: { pattern?: string; culture?: string }; dateFormat?: string }};
    columnWidths: {[key: string]: number};
    conditionalFormatting: any[];
  } | null>(null);
  const { toast } = useToast();

  const lastFetchKeyRef = useRef<string | null>(null);

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
        console.log('SpreadsheetViewer: Downloading file:', currentFile.file_id, currentFile.name);
        const result = await ApiService.downloadS3File(currentFile.file_id, currentFile.name);
        console.log('SpreadsheetViewer: Download result:', result);
        if (result.success && result.url) {
          currentUrl = result.url;
          console.log('SpreadsheetViewer: Blob URL created:', currentUrl, 'Blob size:', result.blob?.size, 'type:', result.blob?.type);
          // Avoid setting a new blob URL if it's unchanged to prevent re-renders
          setDocumentUrl(prev => (prev === result.url ? prev : result.url));
          setDocumentBlob(result.blob);
        } else {
          console.error('SpreadsheetViewer: Download failed, no URL in result');
          setError('Failed to load spreadsheet content');
        }
      } catch (err) {
        console.error('SpreadsheetViewer: Download error:', err);
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
    if (!latestData) return;
    setSaving(true);
    try {
      await handleSpreadsheetSave({
        currentFile,
        latestData,
        onSaveComplete,
        toast,
        setError,
        documentUrl,
        cellFormats: latestFormatting?.cellFormats,
        cellStyles: latestFormatting?.cellStyles,
        cellTypeMeta: latestFormatting?.cellTypeMeta,
        columnWidths: latestFormatting?.columnWidths,
        conditionalFormatting: latestFormatting?.conditionalFormatting
      });
    } catch (err) {
      // Error handling is done in the handler function
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#27272a]">
        <div className="flex flex-col items-center gap-4 bg-[#27272a]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9ca3af]"></div>
          <p className="text-[#f3f4f6]">Loading spreadsheet...</p>
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
    <div className="h-screen flex flex-col bg-background relative z-10 isolate">
      <div className="flex-1 overflow-hidden relative z-10">
        {documentUrl ? (
          <div className="h-full relative z-10">
            <CSVEditor
              src={documentUrl}
              fileName={currentFile.name}
              srcBlob={documentBlob || undefined}
              onError={() => setError('Failed to load spreadsheet in editor')}
              onLoad={() => setError(null)}
              onContentChange={(data) => setLatestData(data)}
              onFormattingChange={(formatting) => setLatestFormatting(formatting)}
              onSaveDocument={handleSave}
              onDownloadDocument={handleDownload}
              saving={saving}
              canSave={!!latestData && latestData.length > 0}
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
