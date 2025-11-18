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

// Toast type
type Toast = (props: {
  title: string;
  description: string;
  variant: 'default' | 'destructive' | 'success' | 'error';
}) => void;

export const handleFolderRenamed = (
  oldPath: string,
  newPath: string,
  selectedFile: FileSystemItem | null,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  triggerSidebarRefresh: () => void,
  toast: Toast
) => {
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
          if (tab.type === 'file' && tab.filePath.startsWith(oldPath + '/')) {
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
};
