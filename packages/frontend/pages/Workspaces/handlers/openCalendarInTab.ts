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

export const openCalendarInTab = (
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
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
};
