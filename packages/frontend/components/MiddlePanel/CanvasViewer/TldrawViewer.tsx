import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Minimize2, Download, RefreshCw, Save } from 'lucide-react';
import { Tldraw, Editor, exportToBlob, TLShapeId, loadSnapshot, getSnapshot } from 'tldraw';

// Import Tldraw CSS
import 'tldraw/tldraw.css';

import { Button } from '../../ui/button';
import { Card, CardContent, CardTitle } from '../../ui/card';
import { cn } from '../../../utils';
import { ApiService } from '../../../../backend/api/apiService';
import { createSaveTldrawHandler } from './handlers/save-tldraw';
import styles from '../../../styles/SimpleTiptapEditor.module.css';
import { useToast } from '../../ui/use-toast';
import { registerTldrawEditor, unregisterTldrawEditor, setCurrentTldrawEditor } from '../../RightPanel/handlers/handle-tldraw-ai-response';

interface TldrawViewerProps {
  fileUrl: string;
  fileName: string;
  fileId?: string;
  isEmbedded?: boolean;
  onSaveComplete?: () => void;
  className?: string;
}

export const TldrawViewer: React.FC<TldrawViewerProps> = ({
  fileUrl,
  fileName,
  fileId,
  isEmbedded = false,
  onSaveComplete,
  className
}) => {
  const editorRef = useRef<Editor | null>(null);
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true); // Default to edit mode for tldraw files
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get file extension to determine if it's a tldraw file
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isTldrawFile = useCallback(() => {
    const ext = getFileExtension(fileName);
    return ['tldraw', 'tldr', 'json'].includes(ext) || fileName.includes('tldraw');
  }, [fileName]);

  // Handle editor events
  const handleEditorMount = useCallback((editor: Editor) => {

    
    editorRef.current = editor;
    
    // Register this editor for AI interactions
    registerTldrawEditor(editor);
    setCurrentTldrawEditor(editor);
    
    // Do not clear loading here; wait for file content to arrive
    
    // Force dark mode
    try {
      const isDark = (editor as any).user?.getIsDarkMode?.()
      if (!isDark) (editor as any).user?.updateUserPreferences?.({ colorScheme: 'dark' })
    } catch (e) {
      console.warn('[TldrawViewer] Failed to force dark mode:', e)
    }
    

    
    // Load content if available and valid
    if (fileContent && fileContent.trim()) {
      try {
        const data = JSON.parse(fileContent)
        try {
          // Supports both { document, session } and legacy store snapshots
          loadSnapshot(editor.store, data)
        } catch (loadError) {
          console.warn('[TldrawViewer] Failed to load snapshot, starting with blank canvas:', loadError)
          editor.store.clear()
        }
      } catch (parseError) {
        console.warn('[TldrawViewer] Could not parse JSON, starting with blank canvas:', parseError)
        editor.store.clear()
      }
    } else {
    }

    // Listen for changes to track unsaved state
    const handleChange = () => {
      setHasUnsavedChanges(true);
    };

    const unsubscribe = editor.store.listen(handleChange);
    
    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Unregister editor when component unmounts or editor changes
      unregisterTldrawEditor(editor);
      if (editorRef.current === editor) {
        setCurrentTldrawEditor(null);
      }
    };
  }, [fileContent]);

  // Cleanup editor registration on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        unregisterTldrawEditor(editorRef.current);
        setCurrentTldrawEditor(null);
      }
    };
  }, []);

  // Load snapshot whenever new file content arrives after mount
  useEffect(() => {
    if (!editorRef.current) return;
    if (!fileContent || !fileContent.trim()) return;
    try {
      const data = JSON.parse(fileContent);
      loadSnapshot(editorRef.current.store, data);
      setHasUnsavedChanges(false);
    } catch (e) {
      console.warn('[TldrawViewer] Failed to load snapshot from updated fileContent:', e);
    }
  }, [fileContent]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load diagram. Please check the file and try again.');
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Toggle between view and edit mode
  const toggleMode = useCallback(() => {
    setIsEditMode(!isEditMode);
    setIsLoading(true);
  }, [isEditMode]);

  // Save the current drawing
  const handleSave = useCallback(async () => {
    const save = createSaveTldrawHandler({
      editorRef,
      fileId,
      fileName,
      onSaved: (content: string) => setFileContent(content),
      clearUnsaved: () => setHasUnsavedChanges(false),
    })
    const result = await save()
    if (result.ok) {
      toast({ title: 'Saved', description: 'Drawing saved successfully.' })
      if (onSaveComplete) onSaveComplete()
    } else {
      toast({ title: 'Save failed', description: 'Could not save the drawing. Check console for details.', variant: 'destructive' })
    }
  }, [editorRef, fileId, fileName, onSaveComplete, toast])

  // Context toolbar handlers
  const handleEditShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  const handleDuplicateShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  const handleDeleteShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  const handleGroupShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  const handleUngroupShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  const handleLockShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  const handleUnlockShapes = useCallback((shapeIds: TLShapeId[]) => {
  }, []);

  // Export drawing as image
  const handleExportImage = useCallback(async () => {
    if (!editorRef.current) return;

    try {
      const blob = await exportToBlob({
        editor: editorRef.current,
        ids: Array.from(editorRef.current.getCurrentPageShapeIds()),
        format: 'png',
        opts: { background: true, padding: 32 }
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName.replace(/\.[^/.]+$/, '')}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[TldrawViewer] Error exporting image:', error);
    }
  }, [fileName]);

  // Download the file
  const handleDownload = useCallback(async () => {
    // Prefer downloading the live editor snapshot to avoid any remote cache staleness
    if (editorRef.current) {
      try {
        const snapshot = editorRef.current.store.getStoreSnapshot()
        const content = JSON.stringify(snapshot, null, 2)
        const freshBlob = new Blob([content], { type: 'application/json' })
        const freshUrl = URL.createObjectURL(freshBlob)
        const link = document.createElement('a')
        link.href = freshUrl
        link.download = fileName
        link.click()
        setTimeout(() => URL.revokeObjectURL(freshUrl), 5000)
        return
      } catch {}
    }

    if (blobUrl) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();
    } else if (fileId) {
      // Fetch file through API if we have fileId
      try {
        const result = await ApiService.downloadFromS3(fileId, fileName);
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
  const reloadFromServer = useCallback(async () => {
    if (!fileId || !editorRef.current) return
    try {
      setIsLoading(true)
      setError(null)
      const result = await ApiService.downloadFromS3(fileId, fileName)
      const blob = (result as any)?.blob as Blob | undefined
      if (blob) {
        const text = await blob.text()
        setFileContent(text)
        try {
          const data = JSON.parse(text)
          loadSnapshot(editorRef.current.store, data)
          setHasUnsavedChanges(false)
        } catch (e) {
          console.warn('[TldrawViewer] Failed to parse refreshed content')
        }
      }
    } catch (e) {
      setError('Failed to refresh drawing from server')
    } finally {
      setIsLoading(false)
    }
  }, [fileId, fileName])

  const handleRefresh = useCallback(() => {
    reloadFromServer()
  }, [reloadFromServer]);

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
        const result = await ApiService.downloadFromS3(fileId, fileName);
        if (result?.success) {
          const blob = (result as any).blob as Blob | undefined
          if (blob) {
            // Prefer blob to avoid remote cache freshness issues
            try {
              const text = await blob.text()
              setFileContent(text)
              // Create/refresh a local object URL for download
              const objUrl = URL.createObjectURL(blob)
              currentBlobUrl = objUrl
              setBlobUrl(objUrl)
            } catch (e) {
              console.warn('[TldrawViewer] Failed to read blob as text:', e)
            }
          } else if ((result as any).url) {
            // Fallback: fetch from remote URL with cache-busting
            const remoteUrl = (result as any).url as string
            currentBlobUrl = remoteUrl
            setBlobUrl(remoteUrl)
            try {
              const response = await fetch(`${remoteUrl}${remoteUrl.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' })
              const text = await response.text()
              setFileContent(text)
            } catch (textError) {
              console.warn('[TldrawViewer] Could not read remote file as text:', textError)
            }
          } else {
            setError('Failed to load tldraw file content')
          }
        } else {
          setError('Failed to load tldraw file content')
        }
      } catch (err) {
        setError('Failed to load tldraw file content');
        console.error('Error fetching tldraw file:', err);
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

  // Debug: Check if Tldraw DOM elements are being created
  useEffect(() => {
    const checkTldrawElements = () => {
      const tldrawElements = document.querySelectorAll('[data-testid="canvas"], .tldraw, .tldraw__canvas');
    };
    
    // Check immediately and after a delay
    checkTldrawElements();
    const timeoutId = setTimeout(checkTldrawElements, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Don't render if not a tldraw file
  if (!isTldrawFile()) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>This file type is not supported by the tldraw viewer.</p>
            <p className="text-sm mt-2">Supported formats: .tldraw, .tldr, .json</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerClasses = cn(
    'tldraw-viewer-container h-screen',
    {
      'fixed inset-0 z-50 bg-background': isFullscreen,
      'relative': !isFullscreen,
    },
    className
  );

  return (
    <div className={containerClasses}>
      <Card className="w-full h-full flex flex-col pb-1">
        <div className={styles['simple-tiptap-toolbar']} style={{ border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-2">
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isEditMode && (
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={styles['toolbar-button']}
                title="Save drawing"
              >
                <Save size={16} />
              </button>
            )}
            <button
              onClick={handleRefresh}
              className={styles['toolbar-button']}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            {!isEmbedded && (
              <button
                onClick={toggleFullscreen}
                className={styles['toolbar-button']}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
          </div>
        </div>
        
        <CardContent className="flex-1 p-0 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading drawing...</span>
              </div>
            </div>
          )}
          
          {error ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <div className="text-center">
                <p className="font-medium">Error loading drawing</p>
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
            <div className="absolute inset-0 ">
              {(() => {
                if (!Tldraw) {
                  console.error('[TldrawViewer] Tldraw component not available');
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-yellow-100 border-2 border-yellow-300">
                      <div className="text-center">
                        <p className="text-yellow-800 font-semibold mb-2">Tldraw Not Available</p>
                        <p className="text-sm text-yellow-700">Tldraw component failed to import</p>
                      </div>
                    </div>
                  );
                }

                try {
                  return (
                    <div className="w-full h-full pb-10">
                      <Tldraw onMount={handleEditorMount} inferDarkMode />


                    </div>
                  );
                } catch (error) {
                  console.error('[TldrawViewer] Error rendering Tldraw:', error);
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-red-300">
                      <div className="text-center">
                        <p className="text-red-600 font-semibold mb-2">Tldraw Render Error</p>
                        <p className="text-sm text-gray-600">Check console for details</p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TldrawViewer;
