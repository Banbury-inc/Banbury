import { FileSystemItem } from '../../../utils/fileTreeUtils';

// Types from Workspaces.tsx
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

// Open file in a new tab within specified panel
export const openFileInTab = (
  file: FileSystemItem,
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
) => {
  
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
  
  // Safely extract file extension with null checks
  const fileName = file.name || 'Unknown File';
  const fileExtension = fileName.includes('.') 
    ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
    : 'unknown';
  
  const newTab: FileTab = {
    id: tabId,
    fileName: fileName,
    filePath: file.path || '',
    fileType: fileExtension,
    file: file,
    type: 'file'
  };
  
  
  // Add tab to the target panel
  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
  setActivePanelId(targetPanelId);
  setSelectedFile(file);
  
};

// Open email in a new tab within specified panel
export const openEmailInTab = (
  email: any,
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>
) => {
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
};

// Close a tab
export const handleCloseTab = (
  tabId: string,
  panelId: string,
  findPanel: (layout: PanelGroup, panelId: string) => Panel | null,
  removeTabFromPanel: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>
) => {
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
};

// Switch to a different tab within a panel
export const handleTabChange = (
  panelId: string,
  tabId: string,
  panelLayout: PanelGroup,
  findPanel: (layout: PanelGroup, panelId: string) => Panel | null,
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>
) => {
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
};
