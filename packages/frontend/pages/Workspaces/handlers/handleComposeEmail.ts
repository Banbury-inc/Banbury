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
  file: any;
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

export const handleComposeEmail = (
  activePanelId: string,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
) => {
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
};
