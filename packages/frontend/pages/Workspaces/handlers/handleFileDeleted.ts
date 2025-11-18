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

export const handleFileDeleted = (
  fileId: string,
  selectedFile: FileSystemItem | null,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  triggerSidebarRefresh: () => void
) => {
  // Remove tabs for the deleted file from all panels
  setPanelLayout(prev => {
    const removeFromAllPanels = (layout: PanelGroup): PanelGroup => {
      if (layout.type === 'panel' && layout.panel) {
        const newTabs = layout.panel.tabs.filter(tab => tab.type === 'file' && tab.file.file_id !== fileId);
        let newActiveTabId = layout.panel.activeTabId;
        
        // If the active tab was deleted, switch to another tab
        const activeTabDeleted = layout.panel.tabs.find(tab => tab.id === layout.panel!.activeTabId && tab.type === 'file' && tab.file.file_id === fileId);
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
};
