import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Maximize2, Minimize2, RefreshCw, Save, MousePointer2, Hand, Pencil, Eraser, ArrowUpRight, Type, StickyNote, Image, Square, Menu, Plus, Undo, Redo } from 'lucide-react';
import { Tldraw, Editor, loadSnapshot, TLPage, TLPageId } from 'tldraw';

// Import Tldraw CSS
import 'tldraw/tldraw.css';

import { Button } from '../../common/ui/button';
import { Card, CardContent } from '../../common/ui/card';
import { cn } from '../../../utils';
import { ApiService } from '../../../../backend/api/apiService';
import { createSaveTldrawHandler } from './handlers/save-tldraw';
import { createTldrawHistoryHandlers } from './handlers/tldraw-history-handlers';
import { createCreateTldrawPageHandler, createSetTldrawPageHandler } from './handlers/tldraw-menu-handlers';
import { createSetTldrawToolHandler } from './handlers/tldraw-tool-handlers';
import styles from '../../../styles/SimpleTiptapEditor.module.css';
import { useToast } from '../../common/ui/use-toast';
import { registerTldrawEditor, unregisterTldrawEditor, setCurrentTldrawEditor } from '../../RightPanel/handlers/handle-tldraw-ai-response';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../common/ui/dropdown-menu';

interface TldrawViewerProps {
  fileUrl: string;
  fileName: string;
  fileId?: string;
  isEmbedded?: boolean;
  onSaveComplete?: () => void;
  className?: string;
}

const TLDRAW_TOOLBAR_ITEMS = [
  { id: 'select', label: 'Select', shortcut: 'V', Icon: MousePointer2 },
  { id: 'hand', label: 'Hand', shortcut: 'H', Icon: Hand },
  { id: 'draw', label: 'Draw', shortcut: 'D', Icon: Pencil },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', Icon: Eraser },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', Icon: ArrowUpRight },
  { id: 'text', label: 'Text', shortcut: 'T', Icon: Type },
  { id: 'note', label: 'Note', shortcut: 'N', Icon: StickyNote },
  { id: 'asset', label: 'Asset', shortcut: 'Ctrl U', Icon: Image },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', Icon: Square },
];

const TLDRAW_LICENSE_KEY = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY;

export const TldrawViewer: React.FC<TldrawViewerProps> = ({
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
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentToolId, setCurrentToolId] = useState('select');
  const [pages, setPages] = useState<TLPage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<TLPageId | null>(null);

  const components = useMemo(() => ({
    MenuPanel: null,
    Toolbar: null
  }), []);

  const setTldrawTool = useMemo(() => createSetTldrawToolHandler({
    editorRef,
    setCurrentToolId,
  }), []);

  const setTldrawPage = useMemo(() => createSetTldrawPageHandler({
    editorRef,
    setCurrentPageId,
  }), []);

  const createTldrawPage = useMemo(() => createCreateTldrawPageHandler({
    editorRef,
    setCurrentPageId,
    setPages,
  }), []);

  const { undo, redo } = useMemo(() => createTldrawHistoryHandlers({
    editorRef,
  }), []);

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
    setCurrentToolId(editor.getCurrentToolId());
    setPages(editor.getPages());
    setCurrentPageId(editor.getCurrentPageId());
    
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
      setCurrentToolId(editor.getCurrentToolId());
      setPages(editor.getPages());
      setCurrentPageId(editor.getCurrentPageId());
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

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

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

  const currentPageName = pages.find((page) => page.id === currentPageId)?.name ?? 'Page';

  // Effect to fetch file content
  useEffect(() => {
    const fetchFileContent = async () => {
      if (!fileId) {
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
            } catch (e) {
              console.warn('[TldrawViewer] Failed to read blob as text:', e)
            }
          } else if ((result as any).url) {
            // Fallback: fetch from remote URL with cache-busting
            const remoteUrl = (result as any).url as string
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
      setFileContent(null);
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
    'tldraw-viewer-container',
    {
      'fixed inset-0 z-50 h-screen bg-card': isFullscreen,
      'relative h-full min-h-0': !isFullscreen,
    },
    className
  );

  return (
    <div className={containerClasses}>
      <Card className="w-full h-full flex flex-col rounded-bl-none pb-1">
        <div className={styles['simple-tiptap-toolbar']} style={{ border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={styles['toolbar-button']}
                    title="Menu"
                    aria-label="Menu"
                  >
                    <Menu size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Drawing</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSave} disabled={!hasUnsavedChanges}>
                    Save drawing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRefresh}>
                    Refresh
                  </DropdownMenuItem>
                  {!isEmbedded && (
                    <DropdownMenuItem onClick={toggleFullscreen}>
                      {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(styles['toolbar-button'], 'w-auto min-w-20 max-w-32 justify-start px-2 text-xs')}
                    title={currentPageName}
                    aria-label={`Current page: ${currentPageName}`}
                  >
                    <span className="truncate">{currentPageName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Pages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pages.map((page) => (
                    <DropdownMenuItem
                      key={page.id}
                      onClick={() => setTldrawPage(page.id)}
                      className={cn(page.id === currentPageId && 'bg-accent text-accent-foreground')}
                    >
                      {page.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={createTldrawPage}>
                    <Plus className="mr-2 h-4 w-4" />
                    New page
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={undo}
                className={styles['toolbar-button']}
                title="Undo"
                aria-label="Undo"
              >
                <Undo size={16} />
              </button>
              <button
                type="button"
                onClick={redo}
                className={styles['toolbar-button']}
                title="Redo"
                aria-label="Redo"
              >
                <Redo size={16} />
              </button>
              {TLDRAW_TOOLBAR_ITEMS.map(({ id, label, shortcut, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTldrawTool(id)}
                  className={cn(
                    styles['toolbar-button'],
                    currentToolId === id && styles.active
                  )}
                  title={`${label} - ${shortcut}`}
                  aria-label={label}
                  aria-pressed={currentToolId === id}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={styles['toolbar-button']}
              title="Save drawing"
            >
              <Save size={16} />
            </button>
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
            <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
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
                  size="xs"
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
                    <div className="h-full min-h-0 w-full">
                      <style>{`
                        .tl-background {
                          background-color: hsl(var(--card)) !important;
                        }
                        .tlui-style-panel.tlui-style-panel__wrapper {
                          background-color: hsl(var(--accent)) !important;
                          color: hsl(var(--accent-foreground)) !important;
                        }
                        .tlui-button.tlui-button__menu.tlui-page-menu__trigger {
                          background-color: hsl(var(--accent)) !important;
                          color: hsl(var(--accent-foreground)) !important;
                        }
                        [data-radix-popper-content-wrapper] {
                          background-color: hsl(var(--accent)) !important;
                        }
                        .tldraw-viewer-container .tlui-layout__bottom {
                          display: none !important;
                        }
                      `}</style>
                      <Tldraw
                        onMount={handleEditorMount}
                        inferDarkMode
                        components={components}
                        licenseKey={TLDRAW_LICENSE_KEY}
                      />


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
