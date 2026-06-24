import { AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../common/ui/use-toast';
import CSVEditor from './CSVEditor';
import { ApiService } from '../../../../backend/api/apiService'
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { handleSpreadsheetSave } from './handlers/handle-spreadsheet-save';
import { useSpreadsheetAutosave } from './handlers/use-spreadsheet-autosave';

interface SpreadsheetViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
  onSaveComplete?: () => void;
}

export function SpreadsheetViewer({ file, onSaveComplete }: SpreadsheetViewerProps) {
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
    cellLinks: {[key: string]: string};
  } | null>(null);
  const [allSheets, setAllSheets] = useState<any[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const { toast } = useToast();

  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentFile(file);
    setLatestData(null);
    setLatestFormatting(null);
    setAllSheets([]);
    setActiveSheetIndex(0);
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
        // Check if this is a Google Drive or OneDrive file
        const isDriveFile = currentFile.path?.startsWith('drive://');
        const isOneDriveFile = currentFile.path?.startsWith('onedrive://');
        const isDropboxFile = currentFile.path?.startsWith('dropbox://');
        const isGoogleSheet = currentFile.mimeType?.includes('vnd.google-apps.spreadsheet');
        
        if (isDriveFile) {
          const blob = isGoogleSheet
            ? await ApiService.Drive.exportSheetAsXlsx(currentFile.file_id)
            : await ApiService.Drive.getFileBlob(currentFile.file_id);
          currentUrl = URL.createObjectURL(blob);
          setDocumentUrl(currentUrl);
          setDocumentBlob(blob);
        } else if (isOneDriveFile) {
          // Download from OneDrive
          const blob = await ApiService.OneDrive.getFileBlob(currentFile.file_id);
          currentUrl = URL.createObjectURL(blob);
          setDocumentUrl(currentUrl);
          setDocumentBlob(blob);
        } else if (isDropboxFile) {
          const blob = await ApiService.Dropbox.getFileBlob(currentFile.file_id);
          currentUrl = URL.createObjectURL(blob);
          setDocumentUrl(currentUrl);
          setDocumentBlob(blob);
        } else {
          // Download regular file from S3
          const result = await ApiService.Files.downloadS3File(currentFile.file_id, currentFile.name);
          if (result.success && result.url) {
            currentUrl = result.url;
            // Avoid setting a new blob URL if it's unchanged to prevent re-renders
            setDocumentUrl(prev => (prev === result.url ? prev : result.url));
            setDocumentBlob(result.blob);
          } else {
            console.error('SpreadsheetViewer: Download failed, no URL in result');
            setError('Failed to load spreadsheet content');
          }
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
      const isDriveFile = currentFile.path?.startsWith('drive://');
      const isOneDriveFile = currentFile.path?.startsWith('onedrive://');
      const isDropboxFile = currentFile.path?.startsWith('dropbox://');
      const isGoogleSheet = currentFile.mimeType?.includes('vnd.google-apps.spreadsheet');
      
      // Determine download filename
      let downloadName = currentFile.name;
      if (isDriveFile && isGoogleSheet && !downloadName.toLowerCase().endsWith('.xlsx')) {
        downloadName += '.xlsx';
      }
      
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
      if (isDriveFile) {
        const blob = isGoogleSheet
          ? await ApiService.Drive.exportSheetAsXlsx(currentFile.file_id)
          : await ApiService.Drive.getFileBlob(currentFile.file_id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (isOneDriveFile) {
        const blob = await ApiService.OneDrive.getFileBlob(currentFile.file_id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (isDropboxFile) {
        const blob = await ApiService.Dropbox.getFileBlob(currentFile.file_id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const result = await ApiService.Files.downloadS3File(currentFile.file_id, currentFile.name);
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
      // Handle download error silently
    }
  };

  const saveSpreadsheetSnapshot = useCallback(async ({ isAutosave }: { isAutosave: boolean }) => {
    if (!latestData) return;
    setSaving(true);
    try {
      await handleSpreadsheetSave({
        currentFile,
        latestData,
        onSaveComplete,
        toast,
        setError,
        cellFormats: latestFormatting?.cellFormats,
        cellStyles: latestFormatting?.cellStyles,
        cellTypeMeta: latestFormatting?.cellTypeMeta,
        columnWidths: latestFormatting?.columnWidths,
        conditionalFormatting: latestFormatting?.conditionalFormatting,
        cellLinks: latestFormatting?.cellLinks,
        allSheets: allSheets.length > 0 ? allSheets : undefined,
        activeSheetIndex,
        isAutosave
      });
    } catch (err) {
      throw err
    } finally {
      setSaving(false);
    }
  }, [activeSheetIndex, allSheets, currentFile, latestData, latestFormatting, onSaveComplete, toast]);

  const spreadsheetSnapshotKey = useMemo(() => {
    if (!latestData) return ''

    return JSON.stringify({
      latestData,
      latestFormatting,
      allSheets,
      activeSheetIndex,
    })
  }, [activeSheetIndex, allSheets, latestData, latestFormatting])

  const {
    status: autosaveStatus,
    lastSavedAt,
    saveNow: handleSave,
  } = useSpreadsheetAutosave({
    snapshotKey: spreadsheetSnapshotKey,
    canSave: !!currentFile.file_id && !!latestData && latestData.length > 0,
    fileKey: `${currentFile.file_id}|${currentFile.name}`,
    saveSpreadsheet: saveSpreadsheetSnapshot,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-card">
        <div className="flex flex-col items-center gap-4 bg-card">
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
    <div className="h-full flex flex-col bg-card relative z-10 isolate">
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {documentUrl ? (
          <div className="h-full flex flex-col relative z-10">
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
              onSheetsLoaded={(sheets, activeIndex) => {
                setAllSheets(sheets);
                setActiveSheetIndex(activeIndex);
              }}
              saving={saving}
              canSave={!!latestData && latestData.length > 0}
              autosaveStatus={autosaveStatus}
              lastSavedAt={lastSavedAt}
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
