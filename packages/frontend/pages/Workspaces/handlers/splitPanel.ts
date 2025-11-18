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

export const splitPanel = (
  panelId: string,
  direction: SplitDirection,
  newFileTab: FileTab | undefined,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>
) => {
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
};
