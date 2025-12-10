import { Allotment } from 'allotment';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ClaudeRuntimeProvider } from '../../assistant/ClaudeRuntimeProvider/ClaudeRuntimeProvider';
import { LeftPanel } from "../../components/LeftPanel/LeftPanel";
import { MiddlePanel } from "../../components/MiddlePanel/MiddlePanel";
import { RightPanel } from "../../components/RightPanel/RightPanel";
import { NavSidebar } from "../../components/nav-sidebar";
import { FileSystemItem } from '../../utils/fileTreeUtils';
import 'allotment/dist/style.css';
import { X, FolderOpen, Trash2, Menu } from 'lucide-react';
import BanburyLogo from '../../assets/images/Logo.png';
import { SplitZones } from '../../components/common/SplitZones';
import { useRouter } from 'next/router';
import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { TiptapAIProvider } from '../../contexts/TiptapAIContext';
import { TooltipProvider } from "../../components/ui/tooltip";
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";
import { ApiService } from '../../../backend/api/apiService';
import { extractEmailContent } from '../../utils/emailUtils';
import { handleCreateSpreadsheet } from './handlers/handleCreateSpreadsheet';
import { handleCreateWordDocument } from './handlers/handleCreateWordDocument';
import { handleCreateNotebook } from './handlers/handleCreateNotebook';
import { handleCreateDrawio } from './handlers/handleCreateDrawio';
import { handleCreateTldraw } from './handlers/handleCreateTldraw';
import { handleCreateImage } from './handlers/handleCreateImage';
import { renderPanel } from './handlers/renderPanel';
import { handleFileMoved } from './handlers/handleFileMoved';
import { handleFolderRenamed } from './handlers/handleFolderRenamed';
import { handleFileDeleted } from './handlers/handleFileDeleted';
import { handleFileRenamed } from './handlers/handleFileRenamed';
import { splitPanel } from './handlers/splitPanel';
import { openCalendarInTab } from './handlers/openCalendarInTab';
import { handleReplyToEmail } from './handlers/handleReplyToEmail';
import { handleComposeEmail } from './handlers/handleComposeEmail';
import { loadConversations, saveCurrentConversation, loadConversation, deleteConversation } from './handlers/conversationManagement';
import { findPanel, getAllTabs, updatePanelActiveTab, addTabToPanel, removeTabFromPanel } from './handlers/panelUtils';
import { openFileInTab, openEmailInTab, handleCloseTab, handleTabChange } from './handlers/tabManagement';
import { isDrawioFile, isTldrawFile } from './handlers/fileTypeUtils';
import {
  UserInfo,
  FileTab,
  WorkspaceTab,
  Panel,
  SplitDirection,
  PanelGroup,
} from './types';




const Workspaces = (): React.ReactNode => {
  const router = useRouter();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [folderCreationTrigger, setFolderCreationTrigger] = useState<boolean>(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [replyToEmail, setReplyToEmail] = useState<any>(null);
  const [activePanelId, setActivePanelId] = useState<string>('main-panel');
  const [isFileSidebarCollapsed, setIsFileSidebarCollapsed] = useState(false);
  const [isAssistantPanelCollapsed, setIsAssistantPanelCollapsed] = useState(false);
  const [panelLayout, setPanelLayout] = useState<PanelGroup>({
    id: 'root',
    type: 'panel',
    panel: {
      id: 'main-panel',
      tabs: [],
      activeTabId: null
    }
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
    panelId: string;
  } | null>(null);
  

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedTab: WorkspaceTab | null;
    draggedFromPanel: string | null;
    dragStartPosition: { x: number; y: number } | null;
    currentPosition: { x: number; y: number } | null;
    dragDirection: 'horizontal' | 'vertical' | null;
    dropZone: 'left' | 'right' | 'top' | 'bottom' | null;
    dropTargetPanel: string | null;
  }>({
    isDragging: false,
    draggedTab: null,
    draggedFromPanel: null,
    dragStartPosition: null,
    currentPosition: null,
    dragDirection: null,
    dropZone: null,
    dropTargetPanel: null,
  });



  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  };

  const isPdfFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.pdf'
  };

  const isDocumentFile = (fileName: string): boolean => {
    const documentExtensions = ['.docx', '.doc']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return documentExtensions.includes(extension)
  };

  const isSpreadsheetFile = (fileName: string): boolean => {
    const spreadsheetExtensions = ['.csv', '.xlsx', '.xls']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return spreadsheetExtensions.includes(extension)
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const isVideo = videoExtensions.includes(extension)
    return isVideo
  };

  const isCodeFile = (fileName: string): boolean => {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh', '.fish',
      '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd', '.coffee', '.litcoffee', '.iced',
      '.md', '.markdown', '.tex', '.rtex', '.bib', '.vue', '.svelte'
    ]
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return codeExtensions.includes(extension)
  };

  const isBrowserFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.browserbase'
  };

  const isViewableFile = (fileName: string): boolean => {
    return isBrowserFile(fileName) || isImageFile(fileName) || isPdfFile(fileName) || isDocumentFile(fileName) || isSpreadsheetFile(fileName) || isVideoFile(fileName) || isCodeFile(fileName) || isDrawioFile(fileName) || isTldrawFile(fileName)
  };

  const loadConversationsCallback = async () => {
    await loadConversations(setIsLoadingConversations, setConversations);
  };

  const saveCurrentConversationCallback = async () => {
    await saveCurrentConversation(userInfo, conversationTitle, setSaveDialogOpen, setConversationTitle, loadConversationsCallback, toast);
  };

  const loadConversationCallback = async (conversationId: string) => {
    await loadConversation(conversationId, setShowConversationDialog, toast);
  };

  const deleteConversationCallback = async (conversationId: string) => {
    await deleteConversation(conversationId, loadConversationsCallback);
  };

  const handleFileSelect = useCallback((file: FileSystemItem) => {
    // Check if it's a Drive file
    const isDriveFile = file.path?.startsWith('drive://')
    
    // For Drive files, check mimeType; for local files, check extension
    let viewable = false
    if (isDriveFile) {
      // Google Workspace files are always viewable (Docs, Sheets, Slides)
      if (file.mimeType?.includes('vnd.google-apps')) {
        viewable = true
      } else {
        // Check other Drive file types (images, PDFs, videos, documents, spreadsheets, etc)
        viewable = !!(file.mimeType && (
          file.mimeType.includes('image/') ||
          file.mimeType.includes('pdf') ||
          file.mimeType.includes('video/') ||
          file.mimeType.includes('text/') ||
          file.mimeType.includes('msword') ||
          file.mimeType.includes('wordprocessingml') ||
          file.mimeType.includes('excel') ||
          file.mimeType.includes('spreadsheetml') ||
          file.mimeType.includes('csv')
        ))
      }
    } else {
      viewable = isViewableFile(file.name)
    }
    
    if (!viewable) {
      setSelectedFile(file);
      return;
    }
    
    openFileInTabCallback(file, activePanelId);
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout, setSelectedFile]);
  
  const openFileInTabCallback = useCallback((file: FileSystemItem, targetPanelId: string = activePanelId) => {
    openFileInTab(
      file,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedFile
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout, setSelectedFile]);

  const openEmailInTabCallback = useCallback((email: any, targetPanelId: string = activePanelId) => {
    openEmailInTab(
      email,
      targetPanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedEmail
    );
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout, setSelectedEmail]);

  const handleCloseTabCallback = useCallback((tabId: string, panelId: string) => {
    handleCloseTab(tabId, panelId, findPanel, removeTabFromPanel, setPanelLayout, setSelectedFile, setSelectedEmail);
  }, [findPanel, removeTabFromPanel, setPanelLayout, setSelectedFile, setSelectedEmail]);

  const handleTabChangeCallback = useCallback((panelId: string, tabId: string) => {
    handleTabChange(panelId, tabId, panelLayout, findPanel, updatePanelActiveTab, setPanelLayout, setActivePanelId, setSelectedFile, setSelectedEmail);
  }, [panelLayout, findPanel, updatePanelActiveTab, setPanelLayout, setActivePanelId, setSelectedFile, setSelectedEmail]);
  
  const splitPanelCallback = useCallback((panelId: string, direction: SplitDirection, newFileTab?: FileTab) => {
    splitPanel(panelId, direction, newFileTab, setPanelLayout, setActivePanelId, setSelectedFile);
  }, [setPanelLayout, setActivePanelId, setSelectedFile]);

  const openCalendarInTabCallback = useCallback((targetPanelId: string = activePanelId) => {
    openCalendarInTab(targetPanelId, activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout);
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab, addTabToPanel, setActivePanelId, setPanelLayout]);
  
  // Split preview while dragging is controlled by the Olympus Tabs component via onSplitPreview
  
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  // Function to trigger sidebar refresh
  const triggerSidebarRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Helper function to extract and format email body for replies
  const extractReplyBody = useCallback((email: any): string => {
    if (!email?.payload) return '';
    
    // Extract full email content
    const emailContent = extractEmailContent(email.payload);
    
    // Prefer HTML content if available, otherwise use text
    let body = emailContent.html || emailContent.text || email.snippet || '';
    
    // If we have HTML content, clean it up for reply formatting
    if (emailContent.html) {
      // Remove excessive styling but keep structure
      body = body
        .replace(/style="[^"]*"/g, '') // Remove inline styles
        .replace(/class="[^"]*"/g, '') // Remove classes
        .replace(/<div[^>]*>/g, '<p>') // Convert divs to paragraphs
        .replace(/<\/div>/g, '</p>') // Close paragraphs
        .replace(/<br\s*\/?>/g, '<br>') // Normalize line breaks
        .replace(/<p><\/p>/g, '') // Remove empty paragraphs
        .replace(/<p><br><\/p>/g, '<br>') // Convert empty paragraphs to line breaks
        .trim();
    } else if (emailContent.text) {
      // For plain text, preserve line breaks
      body = emailContent.text
        .replace(/\n/g, '<br>') // Convert newlines to HTML line breaks
        .trim();
    }
    
    return body;
  }, []);

  // Handle reply to email - opens a new compose tab
  const handleReplyToEmailCallback = useCallback((email: any) => {
    handleReplyToEmail(email, activePanelId, addTabToPanel, setPanelLayout, setActivePanelId, setReplyToEmail);
  }, [activePanelId, addTabToPanel, setPanelLayout, setActivePanelId, setReplyToEmail]);

  
  // Render a single panel - using extracted function
  const renderPanelWrapper = useCallback((panel: Panel) => {
    return renderPanel({
      panel,
      activePanelId,
      dragState,
      userInfo,
      replyToEmail,
      setActivePanelId,
      handleTabChange: handleTabChangeCallback,
      handleCloseTab: handleCloseTabCallback,
      handleReplyToEmail: handleReplyToEmailCallback,
      triggerSidebarRefresh,
      extractReplyBody,
      isImageFile,
      isPdfFile,
      isDocumentFile,
      isSpreadsheetFile,
      isVideoFile,
      isCodeFile,
      isBrowserFile,
      isDrawioFile,
      isTldrawFile,
      setPanelLayout,
      onSplitPreview: (direction, position) => {
        // Update drag state with split preview information
        setDragState(prev => ({
          ...prev,
          dragDirection: direction,
          currentPosition: position,
        }));
      }
    });
  }, [activePanelId, dragState, userInfo, replyToEmail, setActivePanelId, handleTabChangeCallback, handleCloseTabCallback, handleReplyToEmail, triggerSidebarRefresh, extractReplyBody, isImageFile, isPdfFile, isDocumentFile, isSpreadsheetFile, isVideoFile, isCodeFile, isBrowserFile, isDrawioFile, isTldrawFile, setPanelLayout]);
  
  // Render panel group (recursive for nested splits)
  const renderPanelGroup = useCallback((group: PanelGroup): React.ReactNode => {
    if (group.type === 'panel' && group.panel) {
      return renderPanelWrapper(group.panel);
    }
    
    if (group.type === 'group' && group.children) {
      return (
        <Allotment
          vertical={group.direction === 'vertical'}
          proportionalLayout={true}
          defaultSizes={group.children.map((child) => child.size || 50)}
          key={group.id}
        >
          {group.children.map((child) => (
            <Allotment.Pane key={child.id}>
              {renderPanelGroup(child)}
            </Allotment.Pane>
          ))}
        </Allotment>
      );
    }
    
    return (
      <div className="h-full flex items-center justify-center">
        <Image 
          src={BanburyLogo} 
          alt="Banbury" 
          className="opacity-20 dark:opacity-15"
          width={80}
          height={80}
          priority
        />
      </div>
    );
  }, [renderPanel]);

  const handleCreateWordDocumentWrapper = async (documentName: string) => {
    await handleCreateWordDocument(userInfo, setUploading, toast, triggerSidebarRefresh, documentName);
  };

  const handleCreateSpreadsheetWrapper = async (spreadsheetName: string) => {
    await handleCreateSpreadsheet(userInfo, setUploading, toast, triggerSidebarRefresh, spreadsheetName);
  };

  const handleCreateNotebookWrapper = async (notebookName: string) => {
    await handleCreateNotebook(userInfo, setUploading, toast, triggerSidebarRefresh, notebookName);
  };

  const handleCreateDrawioWrapper = async (diagramName: string) => {
    await handleCreateDrawio(userInfo, setUploading, toast, triggerSidebarRefresh, diagramName);
  };

  const handleCreateTldrawWrapper = async (canvasName: string) => {
    await handleCreateTldraw(userInfo, setUploading, toast, triggerSidebarRefresh, canvasName);
  };

  const handleGenerateImage = async () => {
    const prompt = window.prompt('Describe the image to generate') || '';
    if (!prompt.trim()) return;
    await handleCreateImage(
      userInfo,
      setUploading,
      toast,
      triggerSidebarRefresh,
      { prompt, size: '1024x1024', folder: 'images' }
    );
  };



  const handleCreateFolder = () => {
    if (!userInfo?.username) return;
    setFolderCreationTrigger(true);
    setTimeout(() => setFolderCreationTrigger(false), 100);
  };



  // Handle email selection from EmailTab - now opens in tabs
  const handleEmailSelect = useCallback((email: any) => {
    setSelectedEmail(email);
    openEmailInTabCallback(email, activePanelId);
  }, [openEmailInTabCallback, activePanelId]);

  // Handle compose email - now opens in a tab
  const handleComposeEmailCallback = useCallback(() => {
    handleComposeEmail(activePanelId, addTabToPanel, setPanelLayout, setActivePanelId);
  }, [activePanelId, addTabToPanel, setPanelLayout, setActivePanelId]);



  const handleFileDeletedCallback = useCallback((fileId: string) => {
    handleFileDeleted(fileId, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh);
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh]);

  const handleFileRenamedCallback = useCallback((oldPath: string, newPath: string) => {
    handleFileRenamed(oldPath, newPath, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh);
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh]);

  // Handle file moved - using extracted function
  const handleFileMovedWrapper = useCallback((fileId: string, oldPath: string, newPath: string) => {
    handleFileMoved({
      fileId,
      oldPath,
      newPath,
      selectedFile,
      setPanelLayout,
      setSelectedFile,
      triggerSidebarRefresh
    });
  }, [selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh]);

  const handleFolderCreated = useCallback((folderPath: string) => {
    // Show success toast
    toast({
      title: "Folder created successfully",
      description: `Folder "${folderPath}" has been created.`,
      variant: "success",
    });
    // Refresh sidebar to show the new folder
    triggerSidebarRefresh();
  }, [toast, triggerSidebarRefresh]);

  const handleFolderRenamedCallback = useCallback((oldPath: string, newPath: string) => {
    handleFolderRenamed(oldPath, newPath, selectedFile, setPanelLayout, setSelectedFile, triggerSidebarRefresh, toast);
  }, [selectedFile, toast, triggerSidebarRefresh]);


  useEffect(() => {
    // Ensure dark mode is enabled
    window.localStorage.setItem('themeMode', 'dark');
    
    // Force cleanup of any demo mocks that might still be active
    if (typeof window !== 'undefined' && (window as any).__DEMO_MODE_ACTIVE__) {
      // Import and run cleanup if available
      import('../Home/components/DemoApp').then(module => {
        // The cleanup function is internal, but we can rely on React's unmount
        // Just trigger a file refresh after a short delay
        setTimeout(() => {
          triggerSidebarRefresh();
        }, 100);
      }).catch(() => {
        // If import fails, just continue
      });
      (window as any).__DEMO_MODE_ACTIVE__ = false;
    }
    
    const checkAuthAndFetchUser = async () => {
      try {
        setLoading(true);
        
        // Validate token first using ApiService
        const isValidToken = await ApiService.validateToken();

        if (!isValidToken) {
          // Token is invalid, redirect to login
          router.push('/login');
          return;
        }

        // Token is valid, create user info from stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        const basicUserInfo: UserInfo = {
          username: username || 'User',
          email: localStorage.getItem('userEmail') || username || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);
        
        // Trigger a file refresh after userInfo is set to ensure real files are loaded
        setTimeout(() => {
          triggerSidebarRefresh();
        }, 500);
      } catch (err) {
        // Still try to show basic info if we have some stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        if (username) {
          const basicUserInfo: UserInfo = {
            username: username,
            email: localStorage.getItem('userEmail') || username,
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(basicUserInfo);
          
          // Trigger a file refresh here too
          setTimeout(() => {
            triggerSidebarRefresh();
          }, 500);
        } else {
          router.push('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    const trackWorkspaceVisit = async () => {
      try {
        await ApiService.trackWorkspaceVisit();
      } catch (error) {
        // Silently fail - don't interrupt user experience
      }
    };

    checkAuthAndFetchUser();

    setTimeout(() => {
      trackWorkspaceVisit();
    }, 1000); // Small delay to ensure auth is complete
  }, [router, triggerSidebarRefresh]);

  // Listen for requests to reopen a file (e.g., after save generates a new file id)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const { newFile } = detail as { oldPath?: string; newFile: FileSystemItem };
      if (!newFile) return;
      // Close any tab showing the old path, then open the new file in the active panel
      try {
        const allTabs = getAllTabs(panelLayout);
        const fileTabs = allTabs.filter(t => (t as any).type === 'file');
        const targets = fileTabs.filter(t => (t as any).file.path === (detail.oldPath || newFile.path));
        targets.forEach(t => handleCloseTabCallback((t as any).id, activePanelId));
      } catch {}
      openFileInTabCallback(newFile, activePanelId);
    };
    window.addEventListener('workspace-reopen-file', handler as EventListener);
    return () => window.removeEventListener('workspace-reopen-file', handler as EventListener);
  }, [panelLayout, activePanelId, openFileInTabCallback, handleCloseTabCallback]);

  // Listen for assistant-open-browser events to open a virtual browser tab
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const { viewerUrl, title } = detail;
      if (!viewerUrl) return;

      const virtualName = `${title || 'Browser Session'}.browserbase`;
      const virtualPath = `browserbase/${virtualName}?viewerUrl=${encodeURIComponent(viewerUrl)}&title=${encodeURIComponent(title || 'Browser Session')}`;
      const file: FileSystemItem = {
        id: virtualPath,
        file_id: virtualPath,
        name: virtualName,
        type: 'file',
        path: virtualPath,
      } as FileSystemItem;

      // Always open browser sessions in the middle (main) panel
      openFileInTabCallback(file, 'main-panel');
    };
    window.addEventListener('assistant-open-browser', handler as EventListener);
    return () => window.removeEventListener('assistant-open-browser', handler as EventListener);
  }, [openFileInTabCallback]);

  // Listen for file sidebar refresh events (from AI file modifications)
  useEffect(() => {
    const handler = () => {
      triggerSidebarRefresh();
    };
    window.addEventListener('file-sidebar-refresh', handler);
    return () => window.removeEventListener('file-sidebar-refresh', handler);
  }, [triggerSidebarRefresh]);
  
  // Load conversations on mount
  useEffect(() => {
    if (userInfo?.username) {
      loadConversationsCallback();
    }
  }, [userInfo?.username]);
  
  // Apply global drag styles (cursor only)
  useEffect(() => {
    if (dragState.isDragging) document.body.classList.add('drag-cursor');
    else document.body.classList.remove('drag-cursor');

    return () => document.body.classList.remove('drag-cursor');
  }, [dragState.isDragging]);

  // Register panels as drop targets with closest-edge (panel body only)
  useEffect(() => {
    const panelNodes = Array.from(document.querySelectorAll('[data-panel-id]')) as HTMLElement[];
    const cleanups: Array<() => void> = [];
    panelNodes.forEach((element) => {
      const panelId = element.getAttribute('data-panel-id');
      if (!panelId) return;
      const cleanup = dropTargetForElements({
        element,
        getData: (args: any) =>
          attachClosestEdge({ type: 'panel', panelId }, {
            element,
            input: args.input,
            allowedEdges: ['left', 'right', 'top', 'bottom'],
          }),
        onDrag: (args: any) => {
          if (!args?.source?.data || args.source.data.type !== 'tab') return;
          const edge = extractClosestEdge(args.self.data);
          setDragState((prev) => ({
            ...prev,
            dropTargetPanel: panelId,
            dropZone: edge as any,
          }));
        },
        onDragLeave: () => {
          setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
        },
        onDrop: () => {
          setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
        },
      });
      cleanups.push(cleanup);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [panelLayout]);

  // Global monitor: create split on drop based on closest edge
  useEffect(() => {
    return monitorForElements({
      onDragStart({ source, location }: any) {
        if (source?.data?.type !== 'tab') return;
        const tabs = getAllTabs(panelLayout);
        const dragged = tabs.find((t) => t.id === source.data.id) || null;
        const input = location?.current?.input;
        const pos = input && typeof input.clientX === 'number' && typeof input.clientY === 'number'
          ? { x: input.clientX, y: input.clientY }
          : null;
        setDragState((prev) => ({
          ...prev,
          isDragging: true,
          draggedTab: dragged,
          draggedFromPanel: source.data.panelId || null,
          dragStartPosition: pos,
          currentPosition: pos || prev.currentPosition,
        }));
      },
      onDrag({ source, location }: any) {
        if (source?.data?.type !== 'tab') return;
        const input = location?.current?.input;
        if (input && typeof input.clientX === 'number' && typeof input.clientY === 'number') {
          const pos = { x: input.clientX, y: input.clientY };
          setDragState((prev) => ({ ...prev, currentPosition: pos }));
        }
      },
      onDrop({ location, source }: any) {
        if (source.data.type !== 'tab') return;
        const tabId = source.data.id as string;

        // Determine target panel and edge
        const target = location.current.dropTargets.find((t: any) => t.data && (t.data as any).type === 'panel');
        let edge = target ? (extractClosestEdge(target.data) as 'left' | 'right' | 'top' | 'bottom' | null) : null;
        let targetPanelId = target ? ((target.data as any).panelId as string) : '';

        // Fallback: compute panel and edge from mouse position when not detected (e.g., dropping over tab header)
        if (!target || !edge || !targetPanelId) {
          const pos = dragState.currentPosition;
          if (!pos) {
            // As a last resort, try to use the last mouse move event position via document.elementFromPoint with event-less estimation
            // If not available, abort
            setDragState((prev) => ({
              ...prev,
              isDragging: false,
              draggedTab: null,
              draggedFromPanel: null,
              dragStartPosition: null,
              currentPosition: null,
              dragDirection: null,
              dropZone: null,
              dropTargetPanel: null,
            }));
            return;
          }
          const el = document.elementFromPoint(pos.x, pos.y) as HTMLElement | null;
          const panelEl = el ? (el.closest('[data-panel-id]') as HTMLElement | null) : null;
          if (!panelEl) return;
          const pid = panelEl.getAttribute('data-panel-id') || '';
          if (!pid) return;
          targetPanelId = pid;
          const rect = panelEl.getBoundingClientRect();
          const relX = Math.max(0, Math.min(pos.x - rect.left, rect.width));
          const relY = Math.max(0, Math.min(pos.y - rect.top, rect.height));
          const leftDist = relX;
          const rightDist = rect.width - relX;
          const topDist = relY;
          const bottomDist = rect.height - relY;
          const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
          if (minDist === leftDist) edge = 'left';
          else if (minDist === rightDist) edge = 'right';
          else if (minDist === topDist) edge = 'top';
          else edge = 'bottom';
        }

        if (!edge || !targetPanelId) return;

        // Find the dragged tab and its real source panel
        const allTabs = getAllTabs(panelLayout);
        const draggedTab = allTabs.find((t) => t.id === tabId);
        if (!draggedTab) return;
        let actualSourcePanelId: string | null = null;
        const findSource = (layout: PanelGroup): void => {
          if (layout.type === 'panel' && layout.panel) {
            if (layout.panel.tabs.some((t) => t.id === tabId)) {
              actualSourcePanelId = layout.panel.id;
            }
          } else if (layout.type === 'group' && layout.children) {
            layout.children.forEach(findSource);
          }
        };
        findSource(panelLayout);
        if (!actualSourcePanelId) return;

        // Remove tab from source
        setPanelLayout((prev) => removeTabFromPanel(prev, actualSourcePanelId!, tabId));

        // Split the target panel with the dragged tab
        const direction: SplitDirection = edge === 'left' || edge === 'right' ? 'horizontal' : 'vertical';
        splitPanelCallback(targetPanelId, direction, draggedTab as any);

        // Reset drag state after handling drop
        setDragState({
          isDragging: false,
          draggedTab: null,
          draggedFromPanel: null,
          dragStartPosition: null,
          currentPosition: null,
          dragDirection: null,
          dropZone: null,
          dropTargetPanel: null,
        });
      },
    });
      }, [panelLayout, getAllTabs, removeTabFromPanel, splitPanelCallback, dragState, setDragState]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }



  return (
    <TooltipProvider>
      <TiptapAIProvider>
        <ClaudeRuntimeProvider>
          <div 
            className="flex h-screen bg-background dark:bg-background"
            onClick={(e) => {
              // Check if the click is outside any CSV editor
              const target = e.target as HTMLElement;
              const isCSVEditorClick = target.closest('.csv-editor-container') || 
                                     target.closest('.handsontable-container-full') || 
                                     target.closest('.ht_master') ||
                                     target.closest('[role="menu"]') ||
                                     target.closest('[role="dialog"]');
              
              // If click is outside CSV editor, dispatch event to deselect cells
              if (!isCSVEditorClick) {
                window.dispatchEvent(new CustomEvent('workspace-outside-click'));
              }
            }}
          >

          {/* Navigation Sidebar - Fixed */}
          <NavSidebar onLogout={handleLogout} />
          
          {/* Main Content Area with Resizable Panels */}
          <div className="flex flex-1 ml-16 flex-col">
            {/* Resizable Panels */}
            <div className="flex flex-1">
              <Allotment>
                {/* File Sidebar Panel */}
                {!isFileSidebarCollapsed && (
                  <Allotment.Pane minSize={200} preferredSize={300} maxSize={400} className="relative z-10">
                    <div className="h-full flex flex-col relative">
                      {/* Collapse button for file sidebar - positioned on right border */}
                      <button
                        onClick={() => setIsFileSidebarCollapsed(true)}
                        className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-zinc-900 dark:text-white hover:bg-accent dark:hover:bg-accent bg-background border border-zinc-300 dark:border-white/[0.06] transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black shadow-soft burger-button"
                        title="Collapse file sidebar"
                      >
                        <Menu className="h-4 w-4" strokeWidth={1} />
                      </button>
                      {/* File Sidebar Content */}
                      <div className="flex-1 overflow-hidden">
                        <LeftPanel 
                          currentView="workspaces"
                          userInfo={userInfo}
                          onFileSelect={handleFileSelect}
                          selectedFile={selectedFile}
                          refreshTrigger={refreshTrigger}
                          onFileDeleted={handleFileDeletedCallback}
                          onFileRenamed={handleFileRenamedCallback}
                          onFileMoved={handleFileMovedWrapper}
                          onFolderCreated={handleFolderCreated}
                          onFolderRenamed={handleFolderRenamedCallback}
                          triggerRootFolderCreation={folderCreationTrigger}
                          onEmailSelect={handleEmailSelect}
                          onComposeEmail={handleComposeEmailCallback}
                          onCreateDocument={handleCreateWordDocumentWrapper}
                          onCreateSpreadsheet={handleCreateSpreadsheetWrapper}
                          onCreateNotebook={handleCreateNotebookWrapper}
                          onCreateDrawio={handleCreateDrawioWrapper}
                          onCreateTldraw={handleCreateTldrawWrapper}
                          onGenerateImage={handleGenerateImage}
                          onCreateFolder={handleCreateFolder}
                          onOpenCalendar={() => openCalendarInTabCallback(activePanelId)}
                        />
                      </div>
                    </div>
                  </Allotment.Pane>
                )}
                
                {/* Main Content Panel */}
                <Allotment.Pane minSize={400}>
                  <MiddlePanel
                    isFileSidebarCollapsed={isFileSidebarCollapsed}
                    isAssistantPanelCollapsed={isAssistantPanelCollapsed}
                    panelLayout={panelLayout}
                    onToggleFileSidebar={() => setIsFileSidebarCollapsed(false)}
                    onToggleAssistantPanel={() => setIsAssistantPanelCollapsed(false)}
                    renderPanelGroup={renderPanelGroup}
                  />
                </Allotment.Pane>
                
                {/* Assistant Panel */}
                {!isAssistantPanelCollapsed && (
                  <Allotment.Pane minSize={280} preferredSize={380} maxSize={500}>
                    <RightPanel
                      userInfo={userInfo}
                      selectedFile={selectedFile}
                      selectedEmail={selectedEmail}
                      conversations={conversations}
                      isLoadingConversations={isLoadingConversations}
                      onToggleCollapse={() => setIsAssistantPanelCollapsed(true)}
                      onLoadConversation={loadConversationCallback}
                      onDeleteConversation={deleteConversationCallback}
                      onClearConversation={() => {
                        window.dispatchEvent(new CustomEvent('clear-conversation', {}))
                      }}
                      onEmailSelect={handleEmailSelect}
                    />
                  </Allotment.Pane>
                )}
              </Allotment>
            </div>
          </div>
          
          {/* Context Menu */}
          {contextMenu && (
            <div
              className="fixed bg-zinc-800 border border-white/[0.06] rounded-md shadow-soft-md py-2 z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={closeContextMenu}
            >
              <div className="px-4 py-2 text-zinc-400 text-sm border-b border-white/[0.06]">
                Tip: Drag the tab to create a new panel
              </div>
              <button
                onClick={() => {
                  if (contextMenu) {
                    handleCloseTabCallback(contextMenu.tabId, contextMenu.panelId);
                  }
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-zinc-700 flex items-center gap-2"
              >
                <X size={16} strokeWidth={1} />
                Close Tab
              </button>
        </div>
          )}
          
          {/* Click outside to close context menu */}
          {contextMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={closeContextMenu}
            />
          )}

        </div>
        
        {/* Conversation Dialogs */}
        {saveDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-6 w-96 shadow-soft-md">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Save Conversation</h3>
              <input
                type="text"
                placeholder="Enter conversation title..."
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="w-full p-3 bg-zinc-800 border border-white/[0.06] rounded text-white mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setSaveDialogOpen(false);
                    setConversationTitle("");
                  }}
                  className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentConversationCallback}
                  disabled={!conversationTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showConversationDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-6 w-96 max-h-96 overflow-y-auto shadow-soft-md">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Load Conversation</h3>
              {isLoadingConversations ? (
                <div className="text-zinc-900 dark:text-white text-center py-4">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-white text-center py-4">No saved conversations found.</div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded border border-white/[0.06]"
                    >
                      <div className="flex-1">
                        <div className="text-white font-medium">{conversation.title}</div>
                        <div className="text-zinc-400 text-sm">
                          {new Date(conversation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadConversationCallback(conversation._id,)}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title="Load conversation"
                        >
                          <FolderOpen className="h-4 w-4" strokeWidth={1} />
                        </button>
                        <button
                          onClick={() => deleteConversationCallback(conversation._id)}
                          className="p-2 text-red-400 hover:text-red-300"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowConversationDialog(false)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Split Zones for visual feedback */}
        <SplitZones
          isVisible={dragState.isDragging}
          mousePosition={dragState.currentPosition}
        />

        <style>{`
          .drag-cursor {
            cursor: grabbing !important;
          }
          .drag-cursor * {
            cursor: grabbing !important;
          }
          .select-none {
            user-select: none;
          }
          /* VSCode-style tabs (Olympus Tabs use .tab class) */
          .tab {
            border: none;
            transition: background-color 150ms ease, color 150ms ease;
          }
          .tab:hover {
            border: none;
            box-shadow: none;
          }
          .tab--active {
            border: none;
          }
          /* Panel collapse/expand transitions */
          .panel-transition {
            transition: all 0.3s ease-in-out;
          }
          /* Burger button styling */
          .burger-button {
            transition: all 0.2s ease-in-out;
          }
          .burger-button:hover {
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
        `}</style>



        </ClaudeRuntimeProvider>
      </TiptapAIProvider>
      <Toaster />
    </TooltipProvider>
  );
};
export default Workspaces;