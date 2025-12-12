import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Minimize2, Download, Edit3, RefreshCw, Eye } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { cn } from '../../../utils';
import { ApiService } from '../../../../backend/api/apiService';

interface DrawioViewerProps {
  fileUrl: string;
  fileName: string;
  fileId?: string;
  isEmbedded?: boolean;
  onEdit?: () => void;
  className?: string;
}

interface DrawioConfig {
  xml?: string;
  url?: string;
  editable?: boolean;
  toolbar?: string;
  ui?: string;
  spin?: boolean;
  modified?: boolean;
  keepmodified?: boolean;
  proto?: string;
  save?: string;
  exit?: string;
  noSaveBtn?: boolean;
  noExitBtn?: boolean;
  saveAndExit?: boolean;
}

export const DrawioViewer: React.FC<DrawioViewerProps> = ({
  fileUrl,
  fileName,
  fileId,
  isEmbedded = false,
  onEdit,
  className
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Get file extension to determine if it's a draw.io file
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isDrawioFile = useCallback(() => {
    const ext = getFileExtension(fileName);
    return ['drawio', 'xml'].includes(ext) || fileName.includes('drawio');
  }, [fileName]);

  // Build draw.io URL with proper configuration
  const buildDrawioUrl = useCallback((config: DrawioConfig = {}): string => {
    const baseUrl = 'https://viewer.diagrams.net/';
    const params = new URLSearchParams();

    // Set viewer configuration
    params.set('highlight', '0000ff');
    params.set('edit', '_blank');
    params.set('layers', '1');
    params.set('nav', '1');
    params.set('title', fileName);

    // Prioritize XML content embedding over URL loading to avoid CORS issues
    if (fileContent && !config.url) {
      params.set('xml', encodeURIComponent(fileContent));
    } else {
      // Fallback to URL if no XML content available
      const urlToUse = blobUrl || fileUrl;
      if (urlToUse && !urlToUse.startsWith('blob:')) {
        // Only use non-blob URLs as blob URLs don't work with diagrams.net proxy
        params.set('url', encodeURIComponent(urlToUse));
      } else {
        console.warn('[DrawioViewer] No usable URL or content available for draw.io viewer');
      }
    }

    // Add custom configuration
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });

    const finalUrl = `${baseUrl}?${params.toString()}`;
    return finalUrl;
  }, [fileUrl, fileName, blobUrl, fileContent]);

  // Build edit URL for draw.io using embed version (no CSP issues)
  const buildEditUrl = useCallback((): string => {
    const baseUrl = 'https://embed.diagrams.net/';
    const params = new URLSearchParams();
    
    // Set embed-specific parameters
    params.set('embed', '1');
    params.set('ui', 'atlas');
    params.set('spin', '1');
    params.set('proto', 'json');
    params.set('title', fileName);
    
    // Prioritize XML content embedding for edit mode
    if (fileContent) {
      params.set('xml', encodeURIComponent(fileContent));
    } else {
      // Fallback to URL if no XML content available (but not blob URLs)
      const urlToUse = blobUrl || fileUrl;
      if (urlToUse && !urlToUse.startsWith('blob:')) {
        params.set('url', encodeURIComponent(urlToUse));
      }
    }
    
    return `${baseUrl}?${params.toString()}`;
  }, [fileUrl, fileName, blobUrl, fileContent]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load diagram. Please check the file URL and try again.');
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle edit mode
  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit();
    } else {
      // Open in new tab for editing
      window.open(buildEditUrl(), '_blank');
    }
  }, [onEdit, buildEditUrl]);

  // Download the file
  const handleDownload = useCallback(async () => {
    if (blobUrl) {
      // Use blob URL if available
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
    } else if (fileId) {
      // Fetch file through API if we have fileId
      try {
        const result = await ApiService.downloadS3File(fileId, fileName);
        if (result.success && result.url) {
          const link = document.createElement('a');
          link.href = result.url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Clean up the blob URL after download
          setTimeout(() => window.URL.revokeObjectURL(result.url), 1000);
        }
      } catch (err) {
        console.error('Failed to download file:', err);
      }
    } else {
      // Fallback to direct URL
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  }, [fileUrl, fileName, blobUrl, fileId]);

  // Refresh the viewer
  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  // Toggle between view and edit mode
  const toggleMode = useCallback(() => {
    setIsEditMode(!isEditMode);
    setIsLoading(true);
  }, [isEditMode]);

  // Effect to fetch file content
  useEffect(() => {
    let currentBlobUrl: string | null = null;

    const fetchFileContent = async () => {
      if (!fileId) {
        // If no fileId, try to use the fileUrl directly
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Download the file content using ApiService
        const result = await ApiService.downloadS3File(fileId, fileName);
        if (result.success && result.url) {
          currentBlobUrl = result.url;
          setBlobUrl(result.url);
          
          // Also try to read the content as text if it's XML/drawio
          try {
            const response = await fetch(result.url);
            const text = await response.text();
            setFileContent(text);
          } catch (textError) {
            // If we can't read as text, just use the blob URL
            console.warn('[DrawioViewer] Could not read file as text:', textError);
          }
        } else {
          setError('Failed to load draw.io file content');
        }
      } catch (err) {
        setError('Failed to load draw.io file content');
        console.error('Error fetching draw.io file:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();

    // Cleanup function to revoke blob URL
    return () => {
      if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(currentBlobUrl);
        setBlobUrl(null);
        setFileContent(null);
      }
    };
  }, [fileId, fileName]);

  // Effect to handle messages from embedded draw.io editor
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from draw.io domains
      if (!event.origin.includes('diagrams.net') && !event.origin.includes('draw.io')) {
        return;
      }

      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        switch (message.event) {
          case 'init':
            setIsLoading(false);
            // Send the diagram data to the editor
            if (fileContent && iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ action: 'load', xml: fileContent }),
                '*'
              );
            }
            break;
          case 'save':
            // Request export of the current diagram
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ action: 'export', format: 'xml' }),
                '*'
              );
            }
            break;
          case 'export':
            // Handle the exported diagram data
            const updatedContent = message.data;
            if (updatedContent && fileId) {
              // Here you could save the updated content back to the server
              setFileContent(updatedContent);
            }
            break;
          case 'exit':
            setIsEditMode(false);
            break;
        }
      } catch (error) {
        console.warn('[DrawioViewer] Error parsing message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fileContent, fileId]);

  // Effect to handle fullscreen changes
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Don't render if not a draw.io file
  if (!isDrawioFile()) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>This file type is not supported by the draw.io viewer.</p>
            <p className="text-sm mt-2">Supported formats: .drawio, .xml</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use viewer for view mode, embedded editor for edit mode
  const iframeUrl = isEditMode 
    ? buildEditUrl()
    : buildDrawioUrl({ editable: false });

  const containerClasses = cn(
    'draw-io-viewer-container',
    {
      'fixed inset-0 z-50 bg-background': isFullscreen,
      'relative': !isFullscreen,
    },
    className
  );

  return (
    <div className={containerClasses}>
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{fileName}</CardTitle>
              <Badge variant={isEditMode ? 'default' : 'secondary'}>
                {isEditMode ? 'Edit Mode' : 'View Mode'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMode}
                title={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
              >
                {isEditMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {!isEmbedded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading diagram...</span>
              </div>
            </div>
          )}
          
          {error ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <div className="text-center">
                <p className="font-medium">Error loading diagram</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className="w-full h-full border-0"
              style={{ minHeight: isFullscreen ? '100vh' : '600px' }}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              title={`Draw.io diagram: ${fileName}`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrawioViewer;
