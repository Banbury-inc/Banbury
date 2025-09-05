
import { Allotment } from 'allotment';
import { useState, useEffect, useCallback } from 'react';
import { ClaudeRuntimeProvider } from '../../assistant/ClaudeRuntimeProvider';
import { LeftPanel } from "../../components/LeftPanel/LeftPanel";
import { NavSidebar } from "../../components/nav-sidebar";
import { FileSystemItem } from '../../utils/fileTreeUtils';
import 'allotment/dist/style.css';
import { Thread } from '../../components/RightPanel/thread';
import { X, FileText, Folder, SplitSquareHorizontal, SplitSquareVertical, Move, FileSpreadsheet, Save, FolderOpen, Trash2, Edit3, Search, ChevronDown, Plus, TimerReset, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Menu } from 'lucide-react';
import { SplitPreview } from '../../components/common/SplitPreview';
import { SplitZones } from '../../components/common/SplitZones';
import { useRouter } from 'next/router';
import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { TiptapAIProvider } from '../../contexts/TiptapAIContext';
import { TooltipProvider } from "../../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ApiService } from '../../services/apiService';
import { extractEmailContent } from '../../utils/emailUtils';
import { handleCreateSpreadsheet } from './handlers/handleCreateSpreadsheet';
import { handleCreateWordDocument } from './handlers/handleCreateWordDocument';
import { handleCreateNotebook } from './handlers/handleCreateNotebook';
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

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}

interface FileTab {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  file: FileSystemItem;
  type: 'file';
}

interface EmailTab {
  id: string;
  subject: string;
  emailId: string;
  email: any; // Gmail message object
  type: 'email';
}

interface CalendarTab {
  id: string;
  title: string;
  type: 'calendar';
}

type WorkspaceTab = FileTab | EmailTab | CalendarTab;

interface Panel {
  id: string;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}

type SplitDirection = 'horizontal' | 'vertical';

interface PanelGroup {
  id: string;
  type: 'panel' | 'group';
  direction?: SplitDirection;
  children?: PanelGroup[];
  panel?: Panel;
  size?: number;
}



const Workspaces = (): JSX.Element => {
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
    return videoExtensions.includes(extension)
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
    return isBrowserFile(fileName) || isImageFile(fileName) || isPdfFile(fileName) || isDocumentFile(fileName) || isSpreadsheetFile(fileName) || isVideoFile(fileName) || isCodeFile(fileName)
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
    if (!isViewableFile(file.name)) {
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
  }, [activePanelId, dragState, userInfo, replyToEmail, setActivePanelId, handleTabChangeCallback, handleCloseTabCallback, handleReplyToEmail, triggerSidebarRefresh, extractReplyBody, isImageFile, isPdfFile, isDocumentFile, isSpreadsheetFile, isVideoFile, isCodeFile, isBrowserFile, setPanelLayout]);
  
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
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Workspaces</h1>
          <p className="text-gray-300 text-lg mb-6">
            Your collaborative workspace environment is ready. Create, organize, and manage your projects with ease.
          </p>
          <p className="text-gray-400 text-sm">
            Select a file from the sidebar to open it in a new tab. Use split options to view multiple files simultaneously.
          </p>
        </div>
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
        } else {
          router.push('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [router]);

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }



  return (
    <TooltipProvider>
      <TiptapAIProvider>
        <ClaudeRuntimeProvider>
          <div 
            className="flex h-screen bg-black"
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
                  <Allotment.Pane minSize={250} preferredSize={350} maxSize={500} className="relative z-10">
                    <div className="h-full flex flex-col relative">
                      {/* Collapse button for file sidebar - positioned on right border */}
                      <button
                        onClick={() => setIsFileSidebarCollapsed(true)}
                        className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black shadow-lg burger-button"
                        title="Collapse file sidebar"
                      >
                        <Menu className="h-3 w-3" />
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
                          onGenerateImage={handleGenerateImage}
                          onCreateFolder={handleCreateFolder}
                          onOpenCalendar={() => openCalendarInTabCallback(activePanelId)}
                        />
                      </div>
                    </div>
                  </Allotment.Pane>
                )}
                
                {/* Main Content Panel */}
                <Allotment.Pane minSize={300}>
                  <main className="h-full bg-black relative">
                    {/* Expand button for file sidebar when collapsed - positioned on left border */}
                    {isFileSidebarCollapsed && (
                      <button
                        onClick={() => setIsFileSidebarCollapsed(false)}
                        className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black shadow-lg burger-button"
                        title="Expand file sidebar"
                      >
                        <Menu className="h-3 w-3" />
                      </button>
                    )}
                    {/* Expand button for assistant panel when collapsed - positioned on right border */}
                    {isAssistantPanelCollapsed && (
                      <button
                        onClick={() => setIsAssistantPanelCollapsed(false)}
                        className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black shadow-lg burger-button"
                        title="Expand assistant panel"
                      >
                        <Menu className="h-3 w-3" />
                      </button>
                    )}
                    {renderPanelGroup(panelLayout)}
                  </main>
                </Allotment.Pane>
                
                {/* Assistant Panel */}
                {!isAssistantPanelCollapsed && (
                  <Allotment.Pane minSize={300} preferredSize={400}>
                    <div className="h-full bg-black border-l border-gray-800 flex flex-col relative">
                      {/* Collapse button for assistant panel - positioned on left border */}
                      <button
                        onClick={() => setIsAssistantPanelCollapsed(true)}
                        className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-20 h-6 w-6 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black shadow-lg burger-button"
                        title="Collapse assistant panel"
                      >
                        <Menu className="h-3 w-3" />
                      </button>
                      {/* Conversation Management Dropdown */}
                      <div className="bg-black px-4 py-2 flex items-center justify-end gap-2">
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-8 px-3 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors rounded-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black">
                                <TimerReset className="h-3 w-3" />
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64 max-h-96 overflow-y-auto">
                              {isLoadingConversations ? (
                                <div className="px-2 py-2 text-sm text-gray-400 text-center">
                                  Loading conversations...
                                </div>
                              ) : conversations.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-gray-400 text-center">
                                  No saved conversations
                                </div>
                              ) : (
                                <>
                                  <div className="px-2 py-1 text-xs font-medium text-gray-500 tracking-wide">
                                    Saved Conversations
                                  </div>
                                  {conversations.map((conversation) => (
                                    <DropdownMenuItem 
                                      key={conversation._id}
                                      onClick={() => loadConversationCallback(conversation._id)}
                                      className="flex items-center justify-between group"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate">{conversation.title}</div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteConversationCallback(conversation._id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-red-400 hover:text-red-300 transition-opacity"
                                        title="Delete conversation"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <div className="relative group">
                            <button
                              onClick={() => {
                                // Clear the current conversation and start fresh
                                // Dispatch an event to clear the conversation and show welcome message
                                window.dispatchEvent(new CustomEvent('clear-conversation', {}));
                              }}
                              className="h-8 w-8 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            {/* Custom CSS tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                              Clear Conversation
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Thread Component */}
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <Thread 
                          userInfo={userInfo} 
                          selectedFile={selectedFile}
                          selectedEmail={selectedEmail}
                          onEmailSelect={handleEmailSelect}
                        />
                      </div>
                    </div>
                  </Allotment.Pane>
                )}
              </Allotment>
            </div>
          </div>
          
          {/* Context Menu */}
          {contextMenu && (
            <div
              className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg py-1 z-50"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={closeContextMenu}
            >
              <div className="px-3 py-2 text-gray-400 text-sm border-b border-gray-600">
                Tip: Drag the tab to create a new panel
              </div>
              <button
                onClick={() => {
                  if (contextMenu) {
                    handleCloseTabCallback(contextMenu.tabId, contextMenu.panelId);
                  }
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <X size={16} />
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
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold text-white mb-4">Save Conversation</h3>
              <input
                type="text"
                placeholder="Enter conversation title..."
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                className="w-full p-2 bg-zinc-800 border border-zinc-600 rounded text-white mb-4"
              />
              <div className="flex gap-2 justify-end">
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
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Load Conversation</h3>
              {isLoadingConversations ? (
                <div className="text-white text-center py-4">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="text-white text-center py-4">No saved conversations found.</div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded border border-zinc-700"
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
                          className="p-1 text-blue-400 hover:text-blue-300"
                          title="Load conversation"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteConversationCallback(conversation._id)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Delete conversation"
                        >
                          <Trash2 className="h-4 w-4" />
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
          /* Nice border styling for tabs (Olympus Tabs use .tab class) */
          .tab {
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            transition: border-color 150ms ease, box-shadow 150ms ease, transform 120ms ease;
          }
          .tab:hover {
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
          }
          .tab--active {
            border-bottom: 0;
            border-color: rgba(255, 255, 255, 0.6);
          }
          .tab:active {
            transform: translateY(1px);
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