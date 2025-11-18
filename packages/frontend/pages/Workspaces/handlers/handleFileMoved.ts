import { FileSystemItem } from '../../../utils/fileTreeUtils';

interface Panel {
  id: string;
  tabs: any[];
  activeTabId: string | null;
}

interface PanelGroup {
  id: string;
  type: 'panel' | 'group';
  direction?: 'horizontal' | 'vertical';
  children?: PanelGroup[];
  panel?: Panel;
  size?: number;
}

interface HandleFileMovedProps {
  fileId: string;
  oldPath: string;
  newPath: string;
  selectedFile: FileSystemItem | null;
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>;
  triggerSidebarRefresh: () => void;
}

export const handleFileMoved = ({
  fileId,
  oldPath,
  newPath,
  selectedFile,
  setPanelLayout,
  setSelectedFile,
  triggerSidebarRefresh
}: HandleFileMovedProps) => {
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
};
