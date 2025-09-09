import { useState, useCallback, useEffect } from 'react';

interface UseDrawioViewerProps {
  fileUrl: string;
  fileName: string;
  onFileChange?: (newUrl: string) => void;
}

interface DrawioViewerHandlers {
  isLoading: boolean;
  error: string | null;
  isFullscreen: boolean;
  isEditMode: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsEditMode: (editMode: boolean) => void;
  handleDownload: () => void;
  handleRefresh: () => void;
  handleEdit: () => void;
  handleToggleFullscreen: () => void;
  handleToggleMode: () => void;
  buildViewerUrl: (editMode?: boolean) => string;
  isValidDrawioFile: () => boolean;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isDrawioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['drawio', 'xml'].includes(ext) || filename.toLowerCase().includes('drawio');
}

function buildDrawioViewerUrl(fileUrl: string, fileName: string, editMode = false): string {
  const baseUrl = editMode 
    ? 'https://app.diagrams.net/'
    : 'https://viewer.diagrams.net/';
  
  const params = new URLSearchParams();
  
  if (!editMode) {
    // Viewer-specific parameters
    params.set('highlight', '0000ff');
    params.set('edit', '_blank');
    params.set('layers', '1');
    params.set('nav', '1');
  }
  
  params.set('title', fileName);
  params.set('url', encodeURIComponent(fileUrl));
  
  return `${baseUrl}?${params.toString()}`;
}

function downloadFile(url: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback - open in new tab
    window.open(url, '_blank');
  }
}

function handleFullscreenEscape(callback: () => void): () => void {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}

export function useDrawioViewer({
  fileUrl,
  fileName,
  onFileChange,
}: UseDrawioViewerProps): DrawioViewerHandlers {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const isValidDrawioFile = useCallback(() => {
    return isDrawioFile(fileName);
  }, [fileName]);

  const buildViewerUrl = useCallback((editMode = false) => {
    return buildDrawioViewerUrl(fileUrl, fileName, editMode);
  }, [fileUrl, fileName]);

  const handleDownload = useCallback(() => {
    downloadFile(fileUrl, fileName);
  }, [fileUrl, fileName]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    // Trigger a refresh by updating the URL with a cache-busting parameter
    const refreshUrl = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    onFileChange?.(refreshUrl);
  }, [fileUrl, onFileChange]);

  const handleEdit = useCallback(() => {
    const editUrl = buildDrawioViewerUrl(fileUrl, fileName, true);
    window.open(editUrl, '_blank');
  }, [fileUrl, fileName]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleToggleMode = useCallback(() => {
    setIsEditMode(prev => !prev);
    setIsLoading(true);
  }, []);

  // Handle fullscreen escape key
  useEffect(() => {
    if (isFullscreen) {
      const cleanup = handleFullscreenEscape(() => setIsFullscreen(false));
      document.body.style.overflow = 'hidden';
      
      return () => {
        cleanup();
        document.body.style.overflow = '';
      };
    }
  }, [isFullscreen]);

  // Validate file when props change
  useEffect(() => {
    if (!isValidDrawioFile()) {
      setError('File type not supported. Only .drawio and .xml files are supported.');
      setIsLoading(false);
    } else {
      setError(null);
    }
  }, [isValidDrawioFile]);

  return {
    isLoading,
    error,
    isFullscreen,
    isEditMode,
    setIsLoading,
    setError,
    setIsFullscreen,
    setIsEditMode,
    handleDownload,
    handleRefresh,
    handleEdit,
    handleToggleFullscreen,
    handleToggleMode,
    buildViewerUrl,
    isValidDrawioFile,
  };
}

// Export utility functions for use in other components
export {
  isDrawioFile,
  buildDrawioViewerUrl,
  downloadFile,
  getFileExtension,
};
