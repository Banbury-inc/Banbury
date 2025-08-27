
import { Allotment } from 'allotment';
import { useState, useEffect, useCallback } from 'react';
// Using lucide-react icons instead of @mui/icons-material to avoid import issues
 
import { ClaudeRuntimeProvider } from '../assistant/ClaudeRuntimeProvider';
import { AppSidebar } from "../components/app-sidebar";
import OlympusTabs, { Tab as OlympusTab } from '../components/common/Tabs/Tabs';
import { DocumentViewer } from '../components/DocumentViewer';
import { EmailComposer } from '../components/EmailComposer';
import { EmailViewer } from '../components/EmailViewer';
import { ImageViewer } from '../components/ImageViewer';
import { CalendarViewer } from '../components/CalendarViewer';
import { NavSidebar } from "../components/nav-sidebar";
import { SpreadsheetViewer } from '../components/SpreadsheetViewer';
import { VideoViewer } from '../components/VideoViewer';
import CodeViewer from '../components/CodeViewer';
import IDE from '../components/IDE';
import { FileSystemItem } from '../utils/fileTreeUtils';
import 'allotment/dist/style.css';
import { Thread } from '../components/thread';
import { motion } from "framer-motion";
import BrowserViewer from '../components/BrowserViewer';


import { X, FileText, Folder, SplitSquareHorizontal, SplitSquareVertical, Move, FileSpreadsheet, Save, FolderOpen, Trash2, Edit3, Search, ChevronDown, Plus, TimerReset, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Menu } from 'lucide-react';
import { useRouter } from 'next/router';
import { dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { TiptapAIProvider } from '../contexts/TiptapAIContext';
import { PDFViewer } from '../components/PDFViewer';
import { Button } from '../components/ui/button';

import { TooltipProvider } from "../components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Toaster } from "../components/ui/toaster";
import { useToast } from "../components/ui/use-toast";
import { CONFIG } from '../config/config';
import { ApiService } from '../services/apiService';
import { extractEmailContent } from '../utils/emailUtils';
import { ConversationService } from '../services/conversationService';



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
  

  
  // Conversation management state
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showConversationDialog, setShowConversationDialog] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  
  // Multi-panel state management
  const [panelLayout, setPanelLayout] = useState<PanelGroup>({
    id: 'root',
    type: 'panel',
    panel: {
      id: 'main-panel',
      tabs: [],
      activeTabId: null
    }
  });
  const [activePanelId, setActivePanelId] = useState<string>('main-panel');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
    panelId: string;
  } | null>(null);
  
  // Email composition state (for reply context)
  const [replyToEmail, setReplyToEmail] = useState<any>(null);
  
  // Drag and drop state
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

  // Panel collapse state
  const [isFileSidebarCollapsed, setIsFileSidebarCollapsed] = useState(false);
  const [isAssistantPanelCollapsed, setIsAssistantPanelCollapsed] = useState(false);

  // Helper functions to check file types
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

  // Conversation management functions
  const loadConversations = async () => {
    if (!userInfo?.username) return;
    
    setIsLoadingConversations(true);
    try {
      const result = await ConversationService.getConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const saveCurrentConversation = async () => {
    if (!userInfo?.username || !conversationTitle.trim()) return;
    
    try {
      // Check if we have any messages to save
      // Since this is the Workspaces component, we don't have direct access to thread messages
      // We'll create a placeholder message to satisfy the backend requirement
      const placeholderMessage = {
        id: `placeholder-${Date.now()}`,
        role: 'user',
        content: [{ type: 'text', text: 'Conversation started in Workspaces' }],
        createdAt: new Date().toISOString()
      };
      
      const result = await ConversationService.saveConversation({
        title: conversationTitle,
        messages: [placeholderMessage],
        metadata: {
          workspace: 'workspaces',
          timestamp: new Date().toISOString(),
          note: 'This conversation was created in Workspaces. Actual messages will be available when opened in the Thread component.'
        }
      });
      
      if (result.success) {
        setSaveDialogOpen(false);
        setConversationTitle("");
        await loadConversations();
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const result = await ConversationService.getConversation(conversationId);
      if (result.success && result.conversation) {
        // Use the thread component's own loading mechanism
        // This will set the loadedMessagesBuffer and handle the loading properly
        const rawMessages = Array.isArray(result.conversation.messages) ? result.conversation.messages : [];
        const sanitized = rawMessages.map((msg: any, i: number) => ({
          id: msg.id || `msg-${i}-${Date.now()}`,
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: Array.isArray(msg.content)
            ? msg.content
            : (typeof msg.content === 'string' && msg.content.length > 0 ? [{ type: 'text', text: msg.content }] : []),
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        }));
        
        // Dispatch to thread component's event handler
        window.dispatchEvent(new CustomEvent('assistant-load-conversation', { detail: { messages: sanitized } }));
        setShowConversationDialog(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const result = await ConversationService.deleteConversation(conversationId);
      if (result.success) {
        await loadConversations();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Handle file selection from sidebar - now opens in tabs
  const handleFileSelect = useCallback((file: FileSystemItem) => {
    if (!isViewableFile(file.name)) {
      // For non-viewable files, just select them without opening in tabs
    setSelectedFile(file);
      return;
    }
    
    openFileInTab(file, activePanelId);
  }, [activePanelId]);
  
  // Helper function to find panel by ID
  const findPanel = useCallback((layout: PanelGroup, panelId: string): Panel | null => {
    if (layout.type === 'panel' && layout.panel?.id === panelId) {
      return layout.panel;
    }
    if (layout.type === 'group' && layout.children) {
      for (const child of layout.children) {
        const found = findPanel(child, panelId);
        if (found) return found;
      }
    }
    return null;
  }, []);
  
  // Helper function to get all tabs across all panels
  const getAllTabs = useCallback((layout: PanelGroup): WorkspaceTab[] => {
    if (layout.type === 'panel' && layout.panel) {
      return layout.panel.tabs;
    }
    if (layout.type === 'group' && layout.children) {
      return layout.children.flatMap(child => getAllTabs(child));
    }
    return [];
  }, []);
  
  // Open file in a new tab within specified panel
  const openFileInTab = useCallback((file: FileSystemItem, targetPanelId: string = activePanelId) => {
    // Check if file is already open in any panel
    const allTabs = getAllTabs(panelLayout);
    const existingTab = allTabs.find(tab => tab.type === 'file' && tab.filePath === file.path);
    
    if (existingTab) {
      // Find which panel contains this tab and switch to it
      const switchToExistingTab = (layout: PanelGroup): boolean => {
        if (layout.type === 'panel' && layout.panel) {
          const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id);
          if (tabExists) {
            setActivePanelId(layout.panel.id);
            setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id));
            setSelectedFile(file);
            return true;
          }
        }
        if (layout.type === 'group' && layout.children) {
          return layout.children.some(child => switchToExistingTab(child));
        }
        return false;
      };
      
      switchToExistingTab(panelLayout);
      return;
    }
    

    // Create new tab
    const tabId = `${file.path}_${Date.now()}`;
    const newTab: FileTab = {
      id: tabId,
      fileName: file.name,
      filePath: file.path,
      fileType: file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase(),
      file: file,
      type: 'file'
    };
    
    // Add tab to the target panel
    setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
    setActivePanelId(targetPanelId);
    setSelectedFile(file);
  }, [activePanelId, panelLayout, getAllTabs, findPanel]);

  // Open email in a new tab within specified panel
  const openEmailInTab = useCallback((email: any, targetPanelId: string = activePanelId) => {
    // Check if email is already open in any panel
    const allTabs = getAllTabs(panelLayout);
    const existingTab = allTabs.find(tab => tab.type === 'email' && tab.emailId === email.id);
    
    if (existingTab) {
      // Find which panel contains this tab and switch to it
      const switchToExistingTab = (layout: PanelGroup): boolean => {
        if (layout.type === 'panel' && layout.panel) {
          const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id);
          if (tabExists) {
            setActivePanelId(layout.panel.id);
            setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id));
            return true;
          }
        }
        if (layout.type === 'group' && layout.children) {
          return layout.children.some(child => switchToExistingTab(child));
        }
        return false;
      };
      
      switchToExistingTab(panelLayout);
      return;
    }
    
    // Extract subject from email headers
    const subject = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
    
    // Create new email tab
    const tabId = `email_${email.id}_${Date.now()}`;
    const newTab: EmailTab = {
      id: tabId,
      subject: subject,
      emailId: email.id,
      email: email,
      type: 'email'
    };
    
    // Add tab to the target panel
    setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
    setActivePanelId(targetPanelId);
    setSelectedEmail(email);
  }, [activePanelId, panelLayout, getAllTabs, findPanel]);
  
  // Helper functions for panel operations
  const updatePanelActiveTab = useCallback((layout: PanelGroup, panelId: string, tabId: string): PanelGroup => {
    if (layout.type === 'panel' && layout.panel?.id === panelId) {
      return {
        ...layout,
        panel: {
          ...layout.panel,
          activeTabId: tabId
        }
      };
    }
    if (layout.type === 'group' && layout.children) {
      return {
        ...layout,
        children: layout.children.map(child => updatePanelActiveTab(child, panelId, tabId))
      };
    }
    return layout;
  }, []);
  
  const addTabToPanel = useCallback((layout: PanelGroup, panelId: string, tab: FileTab): PanelGroup => {
    if (layout.type === 'panel' && layout.panel?.id === panelId) {
      return {
        ...layout,
        panel: {
          ...layout.panel,
          tabs: [...layout.panel.tabs, tab],
          activeTabId: tab.id
        }
      };
    }
    if (layout.type === 'group' && layout.children) {
      return {
        ...layout,
        children: layout.children.map(child => addTabToPanel(child, panelId, tab))
      };
    }
    return layout;
  }, []);
  
  const removeTabFromPanel = useCallback((layout: PanelGroup, panelId: string, tabId: string): PanelGroup => {
    if (layout.type === 'panel' && layout.panel?.id === panelId) {
      const newTabs = layout.panel.tabs.filter(tab => tab.id !== tabId);
      let newActiveTabId = layout.panel.activeTabId;
      
      // If closing the active tab, switch to another tab
      if (layout.panel.activeTabId === tabId) {
        newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }
      
      return {
        ...layout,
        panel: {
          ...layout.panel,
          tabs: newTabs,
          activeTabId: newActiveTabId
        }
      };
    }
    if (layout.type === 'group' && layout.children) {
      // Recursively remove tab, then collapse empty panels and groups
      const updatedChildren = layout.children
        .map(child => removeTabFromPanel(child, panelId, tabId))
        .filter(child => {
          if (child.type === 'panel' && child.panel) {
            return child.panel.tabs.length > 0;
          }
          return true;
        });

      // If a group ends up with only one child, collapse the group
      if (updatedChildren.length === 1) {
        return updatedChildren[0];
      }

      return {
        ...layout,
        children: updatedChildren
      };
    }
    return layout;
  }, []);
  
  // Close a tab
  const handleCloseTab = useCallback((tabId: string, panelId: string) => {
    setPanelLayout(prev => {
      // Dispatch an event before removal so listeners (e.g., Thread) can react
      try {
        const panelBefore = findPanel(prev, panelId);
        const closingTab = panelBefore?.tabs.find(tab => tab.id === tabId);
        if (closingTab && closingTab.type === 'file') {
          window.dispatchEvent(new CustomEvent('workspace-tab-closed', {
            detail: {
              fileId: closingTab.file.file_id,
              filePath: closingTab.file.path,
              fileName: closingTab.file.name,
            }
          }));
        }
      } catch {}

      const newLayout = removeTabFromPanel(prev, panelId, tabId);
      
      // Update selected file/email if needed
      const panel = findPanel(newLayout, panelId);
      if (panel && panel.activeTabId) {
        const activeTab = panel.tabs.find(tab => tab.id === panel.activeTabId);
        if (activeTab) {
          if ((activeTab as any).type === 'file') {
            setSelectedFile((activeTab as any).file);
            setSelectedEmail(null);
          } else if ((activeTab as any).type === 'email') {
            setSelectedFile(null);
            setSelectedEmail((activeTab as any).email || null);
          } else {
            setSelectedFile(null);
            setSelectedEmail(null);
          }
        }
      } else {
        setSelectedFile(null);
        setSelectedEmail(null);
      }
      
      return newLayout;
    });
  }, [removeTabFromPanel, findPanel]);
  
  // Switch to a different tab within a panel
  const handleTabChange = useCallback((panelId: string, tabId: string) => {
    setPanelLayout(prev => updatePanelActiveTab(prev, panelId, tabId));
    setActivePanelId(panelId);
    
    // Update selected file
    const panel = findPanel(panelLayout, panelId);
    if (panel) {
      const tab = panel.tabs.find(t => t.id === tabId);
      if (tab && (tab as any).type === 'file') {
        setSelectedFile((tab as any).file);
        setSelectedEmail(null);
      } else if (tab && (tab as any).type === 'email') {
        setSelectedFile(null);
        setSelectedEmail((tab as any).email || null);
      } else {
        setSelectedFile(null);
        setSelectedEmail(null);
      }
    }
  }, [updatePanelActiveTab, findPanel, panelLayout]);
  
  // Split panel functionality
  const splitPanel = useCallback((panelId: string, direction: SplitDirection, newFileTab?: FileTab) => {
    const newPanelId = `panel-${Date.now()}`;
    const newPanel: Panel = {
      id: newPanelId,
      tabs: newFileTab ? [newFileTab] : [],
      activeTabId: newFileTab ? newFileTab.id : null
    };
    
    setPanelLayout(prev => {
      const splitPanelInLayout = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel?.id === panelId) {
          // Convert panel to group with two children
          return {
            id: `group-${Date.now()}`,
            type: 'group',
            direction,
            children: [
              { ...layout, size: 50 },
              {
                id: newPanelId,
                type: 'panel',
                panel: newPanel,
                size: 50
              }
            ]
          };
        }
        if (layout.type === 'group' && layout.children) {
          return {
            ...layout,
            children: layout.children.map(child => splitPanelInLayout(child))
          };
        }
        return layout;
      };
      
      return splitPanelInLayout(prev);
    });
    
    setActivePanelId(newPanelId);
    if (newFileTab) {
      setSelectedFile(newFileTab.file);
    }
  }, []);

  // Open Calendar in a new tab within specified panel
  const openCalendarInTab = useCallback((targetPanelId: string = activePanelId) => {
    // Check if a calendar tab already exists
    const allTabs = getAllTabs(panelLayout);
    const existing = allTabs.find(tab => (tab as any).type === 'calendar') as CalendarTab | undefined;
    if (existing) {
      // Activate the panel containing this tab
      const activateExisting = (layout: PanelGroup): boolean => {
        if (layout.type === 'panel' && layout.panel) {
          const has = layout.panel.tabs.some(t => t.id === existing.id);
          if (has) {
            setActivePanelId(layout.panel.id);
            setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existing.id));
            return true;
          }
        }
        if (layout.type === 'group' && layout.children) {
          return layout.children.some(child => activateExisting(child));
        }
        return false;
      };
      activateExisting(panelLayout);
      return;
    }

    const tabId = `calendar_${Date.now()}`;
    const newTab: CalendarTab = { id: tabId, title: 'Calendar', type: 'calendar' };
    setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab as any));
    setActivePanelId(targetPanelId);
  }, [activePanelId, panelLayout, getAllTabs, updatePanelActiveTab]);
  
  // Handle context menu for tabs
  const handleTabContextMenu = useCallback((event: React.MouseEvent, tabId: string, panelId: string) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      tabId,
      panelId
    });
  }, []);
  
  // Mouse-based drag handlers (more reliable than HTML5 drag)
  const handleTabMouseDown = useCallback((event: React.MouseEvent, tab: FileTab, panelId: string) => {
    event.preventDefault();

    
    const startPos = { x: event.clientX, y: event.clientY };
    
    setDragState({
      isDragging: true,
      draggedTab: tab,
      draggedFromPanel: panelId,
      dragStartPosition: startPos,
      currentPosition: startPos,
      dragDirection: null,
      dropZone: null,
      dropTargetPanel: null,
    });
  }, []);
  
  // Mouse move handler: only update position/direction; creation happens on drop
  const handleGlobalMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.dragStartPosition) return;

    const currentPos = { x: event.clientX, y: event.clientY };
    const deltaX = event.clientX - dragState.dragStartPosition.x;
    const deltaY = event.clientY - dragState.dragStartPosition.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let direction: 'horizontal' | 'vertical' | null = null;
    if (dragDistance > 30) direction = absDeltaX > absDeltaY ? 'horizontal' : 'vertical';

    setDragState(prev => ({ ...prev, currentPosition: currentPos, dragDirection: direction }));
  }, [dragState.isDragging, dragState.dragStartPosition]);
  
  const handleGlobalMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;
    // Mouse-up does not create panels here; panel creation happens via monitor drop handler below
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
  }, [dragState.isDragging]);
  
  // No longer needed since we're using mouse events
  
  // Simplified drag handling - no drop zones needed since we auto-create panels
  
  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);
  
  // Split tab to new panel
  const splitTabToNewPanel = useCallback((direction: SplitDirection) => {
    if (!contextMenu) return;
    
    const panel = findPanel(panelLayout, contextMenu.panelId);
    const tab = panel?.tabs.find(t => t.id === contextMenu.tabId);
    
    if (tab) {
      // Remove tab from current panel
      setPanelLayout(prev => removeTabFromPanel(prev, contextMenu.panelId, contextMenu.tabId));
      
      // Create new panel with the tab
      splitPanel(contextMenu.panelId, direction, tab);
    }
    
    closeContextMenu();
  }, [contextMenu, findPanel, panelLayout, removeTabFromPanel, splitPanel, closeContextMenu]);
  
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
  const handleReplyToEmail = useCallback((email: any) => {
    // Create a compose tab with reply data
    const tabId = `reply_${email.id}_${Date.now()}`;
    const subject = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
    const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
    
    const newTab: EmailTab = {
      id: tabId,
      subject: replySubject,
      emailId: 'compose',
      email: null, // No email data for compose mode - reply data handled separately
      type: 'email'
    };
    
    // Set the reply context
    setReplyToEmail(email);
    
    // Add tab to the active panel
    setPanelLayout(prev => addTabToPanel(prev, activePanelId, newTab));
    setActivePanelId(activePanelId);
  }, [activePanelId]);

  
  // Render a single panel
  const renderPanel = useCallback((panel: Panel) => {
    const isActive = panel.id === activePanelId;
    const isDropTarget = dragState.dropTargetPanel === panel.id;
    const dropZone = isDropTarget ? dragState.dropZone : null;
    
    return (
      <div 
        key={panel.id}
        data-panel-id={panel.id}
        className={`h-full flex flex-col relative ${
          isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-700'
        }`}
        onClick={() => setActivePanelId(panel.id)}
      >
        {/* Panel Tab Bar (Olympus Tabs) */}
        {panel.tabs.length > 0 && (
          <div className="bg-black border-b border-zinc-600 min-h-[40px] flex items-end">
            <div className="flex items-end overflow-x-auto flex-1">
              <OlympusTabs
                tabs={panel.tabs.map<OlympusTab>((t) => ({ 
                  id: t.id, 
                  label: (t as any).type === 'email' ? (t as any).subject : ( (t as any).type === 'file' ? (t as any).fileName : 'Calendar' ) 
                }))}
                activeTab={panel.activeTabId || panel.tabs[0]?.id}
                onTabChange={(tabId) => handleTabChange(panel.id, tabId)}
                onTabClose={(tabId) => handleCloseTab(tabId, panel.id)}
                dragContext={{ panelId: panel.id }}
                onReorder={(sourceIndex, destinationIndex) => {
                  setPanelLayout((prev) => {
                    const reorderInLayout = (layout: PanelGroup): PanelGroup => {
                      if (layout.type === 'panel' && layout.panel?.id === panel.id) {
                        const newTabs = [...layout.panel.tabs];
                        const [moved] = newTabs.splice(sourceIndex, 1);
                        newTabs.splice(destinationIndex, 0, moved);
                        return {
                          ...layout,
                          panel: {
                            ...layout.panel,
                            tabs: newTabs,
                          },
                        };
                      }
                      if (layout.type === 'group' && layout.children) {
                        return { ...layout, children: layout.children.map(reorderInLayout) };
                      }
                      return layout;
                    };
                    return reorderInLayout(prev);
                  });
                }}
              />
            </div>
          </div>
        )}
        
        {/* Drop Zone Overlays */}
        {isDropTarget && dropZone && dragState.isDragging && (
          <>
            {dropZone === 'left' && (
              <div className="absolute left-0 top-0 w-1/2 h-full bg-blue-500 bg-opacity-30 border-2 border-blue-500 z-50 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                  <SplitSquareHorizontal size={16} />
                  <span>Split Left</span>
                </div>
              </div>
            )}
            {dropZone === 'right' && (
              <div className="absolute right-0 top-0 w-1/2 h-full bg-blue-500 bg-opacity-30 border-2 border-blue-500 z-50 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                  <SplitSquareHorizontal size={16} />
                  <span>Split Right</span>
                </div>
              </div>
            )}
            {dropZone === 'top' && (
              <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500 bg-opacity-30 border-2 border-blue-500 z-50 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                  <SplitSquareVertical size={16} />
                  <span>Split Top</span>
                </div>
              </div>
            )}
            {dropZone === 'bottom' && (
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-blue-500 bg-opacity-30 border-2 border-blue-500 z-50 flex items-center justify-center">
                <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2">
                  <SplitSquareVertical size={16} />
                  <span>Split Bottom</span>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Panel Content */}
        <div className="flex-1 overflow-hidden relative">
          {panel.activeTabId && panel.tabs.length > 0 ? (
            (() => {
              const activeTab = panel.tabs.find(tab => tab.id === panel.activeTabId);
              if (!activeTab) return null;
              
              // Handle email tabs
              if (activeTab.type === 'email') {
                // Check if this is a compose tab (email is null)
                if (activeTab.email === null) {
                  return (
                    <EmailComposer 
                      onBack={() => {
                        // Close the compose tab when back is clicked
                        handleCloseTab(activeTab.id, panel.id);
                      }}
                      onSendComplete={() => {
                        // Close the compose tab when send is complete
                        handleCloseTab(activeTab.id, panel.id);
                      }}
                      replyTo={replyToEmail ? {
                        to: replyToEmail.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value || '',
                        subject: replyToEmail.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '',
                        body: extractReplyBody(replyToEmail),
                        messageId: replyToEmail.id || ''
                      } : undefined}
                    />
                  );
                } else {
                  return (
                    <EmailViewer 
                      email={activeTab.email} 
                      onBack={() => {
                        // Close the email tab when back is clicked
                        handleCloseTab(activeTab.id, panel.id);
                      }}
                      onReply={handleReplyToEmail}
                    />
                  );
                }
              }
              
              // Handle file tabs
              if (activeTab.type === 'file') {
                const file = activeTab.file;
                
                // Browser session virtual file
                if (isBrowserFile(file.name)) {
                  const params = new URLSearchParams(file.path.split('?')[1] || '');
                  const viewerUrl = params.get('viewerUrl') || '';
                  const title = params.get('title') || 'Browser Session';
                  return <BrowserViewer viewerUrl={viewerUrl} title={title} />;
                }

                if (isImageFile(file.name)) {
                  return <ImageViewer file={file} userInfo={userInfo} />;
                } else if (isPdfFile(file.name)) {
                  return <PDFViewer file={file} userInfo={userInfo} />;
                } else if (isDocumentFile(file.name)) {
                  return (
                    <DocumentViewer 
                      file={file} 
                      userInfo={userInfo} 
                      onSaveComplete={triggerSidebarRefresh}
                    />
                  );
                } else if (isSpreadsheetFile(file.name)) {
                  return (
                    <SpreadsheetViewer 
                      file={file} 
                      userInfo={userInfo} 
                      onSaveComplete={triggerSidebarRefresh}
                    />
                  );
                } else if (isVideoFile(file.name)) {
                  return <VideoViewer file={file} userInfo={userInfo} />;
                } else if (isCodeFile(file.name)) {
                  return <IDE file={file} userInfo={userInfo} onSaveComplete={triggerSidebarRefresh} />;
                } else {
                  return (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <h3 className="text-xl font-semibold text-white mb-2">File Type Not Supported</h3>
                        <p className="text-gray-400">
                          Preview for this file type is not available yet.
                        </p>
                      </div>
                    </div>
                  );
                }
              }
              if ((activeTab as any).type === 'calendar') {
                return (
                  <CalendarViewer
                    initialView="month"
                    onEventClick={(ev) => {
                      // Optionally open event details in a new panel/tab using Email-like pattern
                    }}
                  />
                );
              }
              
              return null;
            })()
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to Workspaces</h2>
                <p className="text-gray-300 mb-4">
                  This panel is ready for files. Select a file from the sidebar to open it here.
                </p>
                <p className="text-gray-400 text-sm">
                  You can also drag tabs from other panels or use the split options.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [activePanelId, handleTabChange, handleTabContextMenu, handleCloseTab, handleTabMouseDown, splitPanel, userInfo, triggerSidebarRefresh, isImageFile, isPdfFile, isDocumentFile, isSpreadsheetFile, isVideoFile, isCodeFile, dragState, replyToEmail, handleReplyToEmail]);
  
  // Render panel group (recursive for nested splits)
  const renderPanelGroup = useCallback((group: PanelGroup): React.ReactNode => {
    if (group.type === 'panel' && group.panel) {
      return renderPanel(group.panel);
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

  // Handle file upload
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !userInfo?.username) return;

      setUploading(true);

      try {
        // Upload file using the uploadToS3 function
        await uploadToS3(
          file,
          userInfo.username,
          `uploads/${file.name}`,
          'uploads'
        );
        
        // Show success toast
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded.`,
          variant: "success",
        });
        
        // Trigger sidebar refresh after successful upload
        triggerSidebarRefresh();
      } catch (error) {
        // Check if it's a storage limit error
        if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
          // Show storage limit exceeded toast
          toast({
            title: "Storage limit exceeded",
            description: "You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.",
            variant: "destructive",
          });
        } else {
          // Show generic error toast
          toast({
            title: "Failed to upload file",
            description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Web-compatible version of uploadToS3 function
  const uploadToS3 = async (
    file: File | Blob,
    deviceName: string,
    filePath: string = '',
    fileParent: string = ''
  ): Promise<any> => {
    // Load authentication credentials from localStorage (web version)
    const token = localStorage.getItem('authToken');
    const apiKey = localStorage.getItem('apiKey'); // If you use API keys
    
    if (!token) {
      throw new Error('Authentication token not found. Please login first.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('device_name', deviceName);
    formData.append('file_path', filePath);
    formData.append('file_parent', fileParent);

    const response = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(apiKey && { 'X-API-Key': apiKey })
      },
      body: formData
    });

    if (!response.ok) {
      // Handle storage limit exceeded (413 Payload Too Large)
      if (response.status === 413) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`STORAGE_LIMIT_EXCEEDED: ${errorData.message || 'Storage limit exceeded. Please subscribe to Pro plan for unlimited storage.'}`);
      }
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  };

  // Handle Word document creation
  const handleCreateWordDocument = async () => {
    if (!userInfo?.username) return;

    setUploading(true);

    try {
      // Create simple document content
      const content = `New Document

Welcome to your new Word document! This document was created from the Banbury workspace.

You can edit this document directly in the browser with formatting support. The document includes:
• Rich text formatting 
• Multiple paragraphs
• Professional document structure
• Real-time editing capabilities

Created on: ${new Date().toLocaleDateString()}`;

      // Generate filename
      const fileName = `New Document ${new Date().toISOString().split('T')[0]}.docx`;

      // Create .docx using docx library
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "New Document",
              heading: HeadingLevel.HEADING_1,
            }),
            ...content.split('\n').slice(2).map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    break: 1,
                  }),
                ],
              })
            )
          ],
        }],
      });

      // Generate the document as a blob
      const blob = await Packer.toBlob(doc);

      // Upload document using the uploadToS3 function
      
      await uploadToS3(
        blob,
        userInfo.username,
        `documents/${fileName}`,
        'documents'
      );
      
      // Show success toast
      toast({
        title: "Document created successfully",
        description: `${fileName} has been created and uploaded.`,
        variant: "success",
      });
      
      // Trigger sidebar refresh after successful document creation
      triggerSidebarRefresh();
    } catch (error) {
      // Check if it's a storage limit error
      if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
        // Show storage limit exceeded toast
        toast({
          title: "Storage limit exceeded",
          description: "You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.",
          variant: "destructive",
        });
      } else {
        // Show generic error toast
        toast({
          title: "Failed to create document",
          description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle spreadsheet creation
  const handleCreateSpreadsheet = async () => {
    if (!userInfo?.username) return;

    setUploading(true);

    try {
      // Create simple CSV content with headers and sample data
      const csvContent = `Name,Email,Phone,Department
John Doe,john.doe@example.com,555-0101,Engineering
Jane Smith,jane.smith@example.com,555-0102,Marketing
Bob Johnson,bob.johnson@example.com,555-0103,Sales
Alice Brown,alice.brown@example.com,555-0104,HR`;

      // Generate filename
      const fileName = `New Spreadsheet ${new Date().toISOString().split('T')[0]}.csv`;

      // Create CSV blob
      const blob = new Blob([csvContent], { type: 'text/csv' });

      // Upload spreadsheet using the uploadToS3 function
      
      await uploadToS3(
        blob,
        userInfo.username,
        `spreadsheets/${fileName}`,
        'spreadsheets'
      );
      
      // Show success toast
      toast({
        title: "Spreadsheet created successfully",
        description: `${fileName} has been created and uploaded.`,
        variant: "success",
      });
      
      // Trigger sidebar refresh after successful spreadsheet creation
      triggerSidebarRefresh();
    } catch (error) {
      // Check if it's a storage limit error
      if (error instanceof Error && error.message.includes('STORAGE_LIMIT_EXCEEDED')) {
        // Show storage limit exceeded toast
        toast({
          title: "Storage limit exceeded",
          description: "You have exceeded the 10GB storage limit. Please subscribe to Pro plan for unlimited storage.",
          variant: "destructive",
        });
      } else {
        // Show generic error toast
        toast({
          title: "Failed to create spreadsheet",
          description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle folder creation
  const handleCreateFolder = () => {
    if (!userInfo?.username) return;

    // Trigger inline folder creation in the sidebar
    setFolderCreationTrigger(true);
    // Reset the trigger after a short delay so it can be triggered again
    setTimeout(() => setFolderCreationTrigger(false), 100);
  };



  // Handle email selection from EmailTab - now opens in tabs
  const handleEmailSelect = useCallback((email: any) => {
    setSelectedEmail(email);
    openEmailInTab(email, activePanelId);
  }, [openEmailInTab, activePanelId]);

  // Handle compose email - now opens in a tab
  const handleComposeEmail = useCallback(() => {
    // Create a special email tab for composing
    const tabId = `compose_${Date.now()}`;
    const newTab: EmailTab = {
      id: tabId,
      subject: 'New Email',
      emailId: 'compose',
      email: null, // No email data for compose mode
      type: 'email'
    };
    
    // Add tab to the active panel
    setPanelLayout(prev => addTabToPanel(prev, activePanelId, newTab));
    setActivePanelId(activePanelId);
  }, [activePanelId]);



  const handleFileDeleted = useCallback((fileId: string) => {
    // Remove tabs for the deleted file from all panels
    setPanelLayout(prev => {
      const removeFromAllPanels = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel) {
          const newTabs = layout.panel.tabs.filter(tab => tab.file.file_id !== fileId);
          let newActiveTabId = layout.panel.activeTabId;
          
          // If the active tab was deleted, switch to another tab
          const activeTabDeleted = layout.panel.tabs.find(tab => tab.id === layout.panel!.activeTabId && tab.file.file_id === fileId);
          if (activeTabDeleted) {
            newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
          }
          
          return {
            ...layout,
            panel: {
              ...layout.panel,
              tabs: newTabs,
              activeTabId: newActiveTabId
            }
          };
        }
        if (layout.type === 'group' && layout.children) {
          return {
            ...layout,
            children: layout.children.map(child => removeFromAllPanels(child))
          };
        }
        return layout;
      };
      
      return removeFromAllPanels(prev);
    });
    
    // If the deleted file was selected, clear the selection
    if (selectedFile?.file_id === fileId) {
      setSelectedFile(null);
    }
    
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
  }, [selectedFile]);

  const handleFileRenamed = useCallback((oldPath: string, newPath: string) => {
    const newFileName = newPath.split('/').pop() || newPath;
    
    // Update tabs for the renamed file in all panels
    setPanelLayout(prev => {
      const updateInAllPanels = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel) {
          const updatedTabs = layout.panel.tabs.map(tab => {
            if (tab.filePath === oldPath) {
              const updatedFile = { ...tab.file, path: newPath, name: newFileName };
              return {
                ...tab,
                filePath: newPath,
                fileName: newFileName,
                file: updatedFile
              };
            }
            return tab;
          });
          
          return {
            ...layout,
            panel: {
              ...layout.panel,
              tabs: updatedTabs
            }
          };
        }
        if (layout.type === 'group' && layout.children) {
          return {
            ...layout,
            children: layout.children.map(child => updateInAllPanels(child))
          };
        }
        return layout;
      };
      
      return updateInAllPanels(prev);
    });
    
    // If the renamed file was selected, update its path
    if (selectedFile?.path === oldPath) {
      setSelectedFile(prev => prev ? { ...prev, path: newPath, name: newFileName } : null);
    }
    
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
  }, [selectedFile]);

  const handleFileMoved = useCallback((fileId: string, oldPath: string, newPath: string) => {
    const newFileName = newPath.split('/').pop() || newPath;
    
    // Update tabs for the moved file in all panels
    setPanelLayout(prev => {
      const updateInAllPanels = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel) {
          const updatedTabs = layout.panel.tabs.map(tab => {
            if (tab.file.file_id === fileId) {
              const updatedFile = { ...tab.file, path: newPath, name: newFileName };
              return {
                ...tab,
                filePath: newPath,
                fileName: newFileName,
                file: updatedFile
              };
            }
            return tab;
          });
          
          return {
            ...layout,
            panel: {
              ...layout.panel,
              tabs: updatedTabs
            }
          };
        }
        if (layout.type === 'group' && layout.children) {
          return {
            ...layout,
            children: layout.children.map(child => updateInAllPanels(child))
          };
        }
        return layout;
      };
      
      return updateInAllPanels(prev);
    });
    
    // If the moved file was selected, update its path
    if (selectedFile?.file_id === fileId) {
      setSelectedFile(prev => prev ? { ...prev, path: newPath, name: newFileName } : null);
    }
    
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
  }, [selectedFile]);

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

  const handleFolderRenamed = useCallback((oldPath: string, newPath: string) => {
    const oldFolderName = oldPath.split('/').pop() || oldPath;
    const newFolderName = newPath.split('/').pop() || newPath;
    
    // Show success toast
    toast({
      title: "Folder renamed successfully",
      description: `Folder "${oldFolderName}" renamed to "${newFolderName}".`,
      variant: "success",
    });
    
    // Update tabs for files in the renamed folder
    setPanelLayout(prev => {
      const updateInAllPanels = (layout: PanelGroup): PanelGroup => {
        if (layout.type === 'panel' && layout.panel) {
          const updatedTabs = layout.panel.tabs.map(tab => {
            if (tab.filePath.startsWith(oldPath + '/')) {
              const newFilePath = tab.filePath.replace(oldPath, newPath);
              const newFileName = newFilePath.split('/').pop() || newFilePath;
              const updatedFile = { ...tab.file, path: newFilePath, name: newFileName };
              return {
                ...tab,
                filePath: newFilePath,
                fileName: newFileName,
                file: updatedFile
              };
            }
            return tab;
          });
          
          return {
            ...layout,
            panel: {
              ...layout.panel,
              tabs: updatedTabs
            }
          };
        }
        if (layout.type === 'group' && layout.children) {
          return {
            ...layout,
            children: layout.children.map(child => updateInAllPanels(child))
          };
        }
        return layout;
      };
      
      return updateInAllPanels(prev);
    });
    
    // If the selected file was in the renamed folder, update its path
    if (selectedFile && selectedFile.path.startsWith(oldPath + '/')) {
      const newFilePath = selectedFile.path.replace(oldPath, newPath);
      const newFileName = newFilePath.split('/').pop() || newFilePath;
      setSelectedFile({ ...selectedFile, path: newFilePath, name: newFileName });
    }
    
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
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
      openFileInTab(file, 'main-panel');
    };
    window.addEventListener('assistant-open-browser', handler as EventListener);
    return () => window.removeEventListener('assistant-open-browser', handler as EventListener);
  }, [openFileInTab]);
  
  // Load conversations on mount
  useEffect(() => {
    if (userInfo?.username) {
      loadConversations();
    }
  }, [userInfo?.username]);
  
  // Apply global drag styles
  useEffect(() => {
    if (dragState.isDragging) {
      document.body.classList.add('drag-cursor');
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    } else {
      document.body.classList.remove('drag-cursor');
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.body.classList.remove('drag-cursor');
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState.isDragging, handleGlobalMouseMove, handleGlobalMouseUp]);

  // Register panels as drop targets with closest-edge like Olympus
  useEffect(() => {
    const panelNodes = Array.from(document.querySelectorAll('[data-panel-id]')) as HTMLElement[];
    const cleanups: Array<() => void> = [];
    panelNodes.forEach((element) => {
      const panelId = element.getAttribute('data-panel-id');
      if (!panelId) return;
      const cleanup = dropTargetForElements({
        element,
        getData: (args) =>
          attachClosestEdge({ type: 'panel', panelId }, {
            element,
            input: args.input,
            allowedEdges: ['left', 'right', 'top', 'bottom'],
          }),
        onDrag: (args) => {
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
  }, [panelLayout, dragState.isDragging]);

  // Global monitor: create split on drop based on closest edge
  useEffect(() => {
    return monitorForElements({
      onDragStart() {
        setDragState((prev) => ({ ...prev, isDragging: true }));
      },
      onDrop({ location, source }) {
        if (source.data.type !== 'tab') return;
        const tabId = source.data.id as string;
        const fromPanelId = source.data.panelId as string | undefined; // may be undefined; we will derive

        // Determine target panel and edge
        const target = location.current.dropTargets.find((t) => t.data && (t.data as any).type === 'panel');
        if (!target) return;
        const edge = extractClosestEdge(target.data) as 'left' | 'right' | 'top' | 'bottom' | null;
        const targetPanelId = (target.data as any).panelId as string;
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
        splitPanel(targetPanelId, direction, draggedTab as any);

        // Reset state
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
  }, [panelLayout, getAllTabs, removeTabFromPanel, splitPanel]);

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
          <div className="flex h-screen bg-black">

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
                        <AppSidebar 
                          currentView="workspaces"
                          userInfo={userInfo}
                          onFileSelect={handleFileSelect}
                          selectedFile={selectedFile}
                          refreshTrigger={refreshTrigger}
                          onFileDeleted={handleFileDeleted}
                          onFileRenamed={handleFileRenamed}
                          onFileMoved={handleFileMoved}
                          onFolderCreated={handleFolderCreated}
                          onFolderRenamed={handleFolderRenamed}
                          triggerRootFolderCreation={folderCreationTrigger}
                          onEmailSelect={handleEmailSelect}
                          onComposeEmail={handleComposeEmail}
                          onCreateDocument={handleCreateWordDocument}
                          onCreateSpreadsheet={handleCreateSpreadsheet}
                          onCreateFolder={handleCreateFolder}
                          onOpenCalendar={() => openCalendarInTab(activePanelId)}
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
                  <Allotment.Pane minSize={300} preferredSize={400} maxSize={600}>
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
                                      onClick={() => loadConversation(conversation._id)}
                                      className="flex items-center justify-between group"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm truncate">{conversation.title}</div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteConversation(conversation._id);
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
                    handleCloseTab(contextMenu.tabId, contextMenu.panelId);
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
                  onClick={saveCurrentConversation}
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
                          onClick={() => loadConversation(conversation._id)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                          title="Load conversation"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteConversation(conversation._id)}
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
        
        {/* Drag Preview */}
        {dragState.isDragging && dragState.currentPosition && (
          <div 
            className="fixed pointer-events-none z-50 bg-gray-800 text-white px-3 py-1 rounded shadow-lg border border-gray-600"
            style={{
              left: dragState.currentPosition.x + 10,
              top: dragState.currentPosition.y - 10,
              transform: 'translate(0, -100%)'
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              {dragState.dragDirection === 'horizontal' && (
                <>
                  <SplitSquareHorizontal size={14} />
                  <span>Horizontal Split</span>
                </>
              )}
              {dragState.dragDirection === 'vertical' && (
                <>
                  <SplitSquareVertical size={14} />
                  <span>Vertical Split</span>
                </>
              )}
              {!dragState.dragDirection && (
                <>
                  <Move size={14} />
                  <span>Drag to split</span>
                </>
              )}
            </div>
          </div>
        )}
        



        {/* Global Drag Styles */}
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