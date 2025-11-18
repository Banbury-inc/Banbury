import { AlertCircle, Download, FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { Button } from '../ui/button';
import { ApiService } from '../../../backend/api/apiService'
import { FileSystemItem } from '../../utils/fileTreeUtils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker from cdnjs to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;

interface PDFViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

export function PDFViewer({ file, userInfo }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    let currentUrl: string | null = null;

    const loadPDF = async () => {
      if (!file.file_id) {
        setError('No file ID available for this PDF');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const isDriveFile = file.path?.startsWith('drive://');
        
        if (isDriveFile) {
          // Handle Google Drive file
          const blob = await ApiService.Drive.getFileBlob(file.file_id);
          const url = window.URL.createObjectURL(blob);
          currentUrl = url;
          setPdfUrl(url);
        } else {
          // Handle local/S3 file
          const result = await ApiService.downloadS3File(file.file_id, file.name);
          if (result.success && result.url) {
            currentUrl = result.url;
            setPdfUrl(result.url);
          } else {
            setError('Failed to load PDF content');
          }
        }
      } catch (err) {
        setError('Failed to load PDF content');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();

    // Cleanup function to revoke blob URL
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentUrl);
      }
    };
  }, [file.file_id, file.name, file.path]);

  const handleDownload = async () => {
    if (!file.file_id) return;
    
    try {
      const isDriveFile = file.path?.startsWith('drive://');
      let url: string;
      
      if (isDriveFile) {
        const blob = await ApiService.Drive.getFileBlob(file.file_id);
        url = window.URL.createObjectURL(blob);
      } else {
        const result = await ApiService.downloadS3File(file.file_id, file.name);
        if (!result.success || !result.url) return;
        url = result.url;
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Clean up the blob URL after download
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      // Failed to download PDF
    }
  };



  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(`Failed to load PDF document: ${error.message}`);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pdfUrl || loading || error) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          if (pageNumber > 1) {
            goToPrevPage();
            event.preventDefault();
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          if (pageNumber < numPages) {
            goToNextPage();
            event.preventDefault();
          }
          break;
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            zoomIn();
            event.preventDefault();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            zoomOut();
            event.preventDefault();
          }
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            resetZoom();
            event.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfUrl, loading, error, pageNumber, numPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load PDF</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">

      {/* PDF Controls */}
      {pdfUrl && !loading && !error && (
        <div className="flex items-center justify-between p-3 bg-accent border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="h-8 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">
                Page
              </span>
              <span className="text-muted-foreground text-sm font-medium min-w-[60px] text-center">
                {pageNumber} of {numPages}
              </span>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="h-8 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="icon"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="h-8 min-w-[60px] text-sm font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              title="Reset zoom to 100%"
            >
              {Math.round(scale * 100)}%
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="h-8 w-8 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF display area */}
      <div className="flex-1 flex justify-center overflow-auto bg-background p-6">
        {pdfUrl ? (
          <div className="flex flex-col items-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-foreground">Failed to load PDF</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                loading={
                  <div className="flex items-center justify-center p-8 bg-background border border-border rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-8 bg-background border border-border rounded-lg">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-muted-foreground">Failed to load page</p>
                    </div>
                  </div>
                }
                className="shadow-lg"
              />
            </Document>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-white dark:bg-zinc-900">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">PDF URL not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
