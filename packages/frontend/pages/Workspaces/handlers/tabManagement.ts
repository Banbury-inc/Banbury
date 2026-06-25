import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { Panel, PanelGroup, WorkspaceTab, FileTab, EmailTab, TaskTab, MeetingTab, AdminTab, TerminalTab, DatabaseTableTab, OpenDatabaseTablePayload, FlowTab, FlowItem, MapTab, MapPlaceLocation, ImageUrlTab, ImageUrlTabPayload } from '../types';
import { Task } from '../../../pages/TaskStudio/types';
import { MeetingSession } from '../../../types/meeting-types';

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

// Open task in a new tab within specified panel
export const openTaskInTab = (
  task: Task | null, // null for create task composer
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  // For create task composer (task is null), always create a new tab
  if (task === null) {
    const tabId = `task_create_${Date.now()}`;
    const newTab: TaskTab = {
      id: tabId,
      taskId: '',
      title: 'Create Task',
      task: null,
      type: 'task'
    };
    setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
    setActivePanelId(targetPanelId);
    return;
  }

  // Check if task is already open in any panel
  const allTabs = getAllTabs(panelLayout);
  const existingTab = allTabs.find(tab => tab.type === 'task' && tab.taskId === task.id);
  
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
  
  // Create new task tab
  const tabId = `task_${task.id}_${Date.now()}`;
  const newTab: TaskTab = {
    id: tabId,
    taskId: task.id,
    title: task.title,
    task: task,
    type: 'task'
  };
  
  // Add tab to the target panel
  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
  setActivePanelId(targetPanelId);
};

// Open meeting in a new tab within specified panel
export function getMeetingTranscriptFileId(meetingId: string): string {
  return `meeting-transcript-${meetingId}`
}

export const openMeetingInTab = async (
  meeting: MeetingSession | null, // null for join meeting composer
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedMeeting?: React.Dispatch<React.SetStateAction<MeetingSession | null>>
) => {
  // For join meeting composer (meeting is null), always create a new tab
  if (meeting === null) {
    const tabId = `meeting_join_${Date.now()}`;
    const newTab: MeetingTab = {
      id: tabId,
      meetingId: '',
      title: 'Join Meeting',
      meeting: null,
      type: 'meeting'
    };
    setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
    setActivePanelId(targetPanelId);
    return;
  }

  // Check if meeting is already open in any panel
  const allTabs = getAllTabs(panelLayout);
  const existingTab = allTabs.find(tab => tab.type === 'meeting' && tab.meetingId === meeting.id);
  
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
    setSelectedMeeting?.(meeting);
    return;
  }
  
  // Use the meeting data that's already available from the sessions endpoint
  // No need to fetch additional details
  const tabId = `meeting_${meeting.id}_${Date.now()}`;
  const newTab: MeetingTab = {
    id: tabId,
    meetingId: meeting.id,
    title: meeting.title || 'Untitled Meeting',
    meeting: meeting,
    type: 'meeting'
  };
  
  // Add tab to the target panel
  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
  setActivePanelId(targetPanelId);
};

// Open a map in a new tab within specified panel
export const openMapInTab = (
  place: MapPlaceLocation | null,
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  highlightedPlaces: MapPlaceLocation[] = [],
  title?: string
) => {
  const allTabs = getAllTabs(panelLayout);
  const hasHighlightedPlaces = highlightedPlaces.length > 0
  const tabTitle = title || place?.name || (hasHighlightedPlaces ? 'Highlighted places' : 'Map')
  const existingTab = allTabs.find(tab => {
    if (tab.type !== 'map') return false
    if (hasHighlightedPlaces) return tab.title === tabTitle
    if (!place && !tab.place) return true
    if (!place || !tab.place) return false
    return tab.place.longitude === place.longitude && tab.place.latitude === place.latitude
  })

  if (existingTab) {
    const updateExistingMapTab = (layout: PanelGroup): PanelGroup => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (!tabExists) return layout

        return {
          ...layout,
          panel: {
            ...layout.panel,
            tabs: layout.panel.tabs.map(tab => (
              tab.id === existingTab.id && tab.type === 'map'
                ? {
                    ...tab,
                    title: tabTitle,
                    place,
                    highlightedPlaces,
                  }
                : tab
            )),
          },
        }
      }

      if (layout.type === 'group' && layout.children)
        return { ...layout, children: layout.children.map(updateExistingMapTab) }

      return layout
    }

    const switchToExistingTab = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (tabExists) {
          setActivePanelId(layout.panel.id)
          setPanelLayout(prev => updatePanelActiveTab(updateExistingMapTab(prev), layout.panel!.id, existingTab.id))
          return true
        }
      }
      if (layout.type === 'group' && layout.children) {
        return layout.children.some(child => switchToExistingTab(child))
      }
      return false
    }

    switchToExistingTab(panelLayout)
    return
  }

  const tabId = place ? `map_${place.longitude}_${place.latitude}_${Date.now()}` : `map_${Date.now()}`
  const newTab: MapTab = {
    id: tabId,
    title: tabTitle,
    place,
    highlightedPlaces,
    type: 'map',
  }

  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
  setActivePanelId(targetPanelId)
}

export const openImageUrlInTab = (
  image: ImageUrlTabPayload,
  targetPanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  const allTabs = getAllTabs(panelLayout)
  const existingTab = allTabs.find(tab => tab.type === 'image-url' && tab.imageUrl === image.imageUrl)

  if (existingTab) {
    const switchToExistingTab = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (tabExists) {
          setActivePanelId(layout.panel.id)
          setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id))
          return true
        }
      }

      if (layout.type === 'group' && layout.children)
        return layout.children.some(child => switchToExistingTab(child))

      return false
    }

    switchToExistingTab(panelLayout)
    return
  }

  const newTab: ImageUrlTab = {
    id: `image_${Date.now()}`,
    title: image.title,
    imageUrl: image.imageUrl,
    alt: image.alt,
    type: 'image-url',
  }

  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
  setActivePanelId(targetPanelId)
}

// Close a tab
export const handleCloseTab = (
  tabId: string,
  panelId: string,
  findPanel: (layout: PanelGroup, panelId: string) => Panel | null,
  removeTabFromPanel: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>,
  setSelectedMeeting?: React.Dispatch<React.SetStateAction<MeetingSession | null>>
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
      } else if (closingTab && closingTab.type === 'meeting' && closingTab.meetingId) {
        window.dispatchEvent(new CustomEvent('workspace-tab-closed', {
          detail: {
            fileId: getMeetingTranscriptFileId(closingTab.meetingId),
          }
        }));
      }
    } catch {}

    const newLayout = removeTabFromPanel(prev, panelId, tabId);
    
    // Update selected file/email/meeting if needed
    const panel = findPanel(newLayout, panelId);
    if (panel && panel.activeTabId) {
      const activeTab = panel.tabs.find(tab => tab.id === panel.activeTabId);
      if (activeTab) {
        if ((activeTab as any).type === 'file') {
          setSelectedFile((activeTab as any).file);
          setSelectedEmail(null);
          setSelectedMeeting?.(null);
        } else if ((activeTab as any).type === 'email') {
          setSelectedFile(null);
          setSelectedEmail((activeTab as any).email || null);
          setSelectedMeeting?.(null);
        } else if ((activeTab as any).type === 'meeting' && (activeTab as MeetingTab).meeting) {
          setSelectedFile(null);
          setSelectedEmail(null);
          setSelectedMeeting?.((activeTab as MeetingTab).meeting);
        } else {
          setSelectedFile(null);
          setSelectedEmail(null);
          setSelectedMeeting?.(null);
        }
      }
    } else {
      setSelectedFile(null);
      setSelectedEmail(null);
      setSelectedMeeting?.(null);
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
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>,
  setSelectedMeeting?: React.Dispatch<React.SetStateAction<MeetingSession | null>>
) => {
  setPanelLayout(prev => updatePanelActiveTab(prev, panelId, tabId));
  setActivePanelId(panelId);
  
  // Update selected file/email/meeting
  const panel = findPanel(panelLayout, panelId);
  if (panel) {
    const tab = panel.tabs.find(t => t.id === tabId);
    if (tab && (tab as any).type === 'file') {
      setSelectedFile((tab as any).file);
      setSelectedEmail(null);
      setSelectedMeeting?.(null);
    } else if (tab && (tab as any).type === 'email') {
      setSelectedFile(null);
      setSelectedEmail((tab as any).email || null);
      setSelectedMeeting?.(null);
    } else if (tab && (tab as any).type === 'meeting' && (tab as MeetingTab).meeting) {
      setSelectedFile(null);
      setSelectedEmail(null);
      setSelectedMeeting?.((tab as MeetingTab).meeting);
    } else {
      setSelectedFile(null);
      setSelectedEmail(null);
      setSelectedMeeting?.(null);
    }
  }
};

export const openAdminInTab = (
  adminTabType: string, // 'admin-overview', 'admin-users', etc.
  targetPanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  // Extract the type without 'admin-' prefix
  const typeWithoutPrefix = adminTabType.replace('admin-', '') as AdminTab['adminTabType']

  // Check if this admin tab is already open
  const allTabs = getAllTabs(panelLayout)
  const existingTab = allTabs.find(tab => tab.type === 'admin' && tab.adminTabType === typeWithoutPrefix)

  if (existingTab) {
    // Switch to existing tab
    const switchToExistingTab = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (tabExists) {
          setActivePanelId(layout.panel.id)
          setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id))
          return true
        }
      }
      if (layout.type === 'group' && layout.children) {
        return layout.children.some(child => switchToExistingTab(child))
      }
      return false
    }

    switchToExistingTab(panelLayout)
    return
  }

  // Map admin tab types to display titles
  const titleMap: Record<string, string> = {
    'overview': 'Overview',
    'users': 'User Management',
    'analytics-overview': 'Analytics',
    'visitors': 'Visitors',
    'marketing': 'Marketing',
    'conversations': 'AI Conversations',
    'filetypes': 'File Types',
    'api-usage': 'API Usage',
    'engagement': 'Engagement',
    'retention': 'Retention',
    'features': 'Features',
    'errors': 'Errors'
  }

  // Create new admin tab
  const tabId = `admin_${typeWithoutPrefix}_${Date.now()}`
  const newTab: AdminTab = {
    id: tabId,
    adminTabType: typeWithoutPrefix,
    title: titleMap[typeWithoutPrefix] || typeWithoutPrefix,
    type: 'admin'
  }

  // Add tab to the target panel
  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
  setActivePanelId(targetPanelId)
}

export const openTerminalInTab = (
  targetPanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  cwd?: string
) => {
  const allTabs = getAllTabs(panelLayout)
  const existingTab = allTabs.find(tab => tab.type === 'terminal' && tab.cwd === cwd)

  if (existingTab) {
    const switchToExistingTab = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (tabExists) {
          setActivePanelId(layout.panel.id)
          setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id))
          return true
        }
      }
      if (layout.type === 'group' && layout.children)
        return layout.children.some(child => switchToExistingTab(child))
      return false
    }

    switchToExistingTab(panelLayout)
    return
  }

  const tabId = `terminal_${Date.now()}`
  const newTab: TerminalTab = {
    id: tabId,
    title: 'Terminal',
    type: 'terminal',
    cwd,
  }

  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
  setActivePanelId(targetPanelId)
}

export const openDatabaseTableInTab = (
  payload: OpenDatabaseTablePayload,
  targetPanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  const allTabs = getAllTabs(panelLayout)
  const existingTab = allTabs.find(tab => (
    tab.type === 'database-table'
    && tab.provider === payload.provider
    && tab.database === payload.database
    && tab.schema === payload.schema
    && tab.table === payload.table
    && tab.collection === payload.collection
  ))

  if (existingTab) {
    const switchToExistingTab = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (tabExists) {
          setActivePanelId(layout.panel.id)
          setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id))
          return true
        }
      }

      if (layout.type === 'group' && layout.children)
        return layout.children.some(child => switchToExistingTab(child))

      return false
    }

    switchToExistingTab(panelLayout)
    return
  }

  const targetName = payload.table || payload.collection || 'Database'
  const descriptor = payload.schema ? `${payload.database}.${payload.schema}` : payload.database
  const newTab: DatabaseTableTab = {
    id: `db_${payload.provider}_${targetName}_${Date.now()}`,
    title: `${targetName} (${descriptor})`,
    type: 'database-table',
    provider: payload.provider,
    connection: payload.connection,
    database: payload.database,
    schema: payload.schema,
    table: payload.table,
    collection: payload.collection,
  }

  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
  setActivePanelId(targetPanelId)
}

export const openFlowInTab = (
  flow: FlowItem | null,
  targetPanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  if (flow === null) {
    const tabId = `flow_create_${Date.now()}`
    const newTab: FlowTab = {
      id: tabId,
      flowId: '',
      title: 'New Flow',
      flow: null,
      type: 'flow',
    }
    setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
    setActivePanelId(targetPanelId)
    return
  }

  const allTabs = getAllTabs(panelLayout)
  const existingTab = allTabs.find(tab => tab.type === 'flow' && tab.flowId === flow.id)

  if (existingTab) {
    const switchToExistingTab = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const tabExists = layout.panel.tabs.some(tab => tab.id === existingTab.id)
        if (tabExists) {
          setActivePanelId(layout.panel.id)
          setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existingTab.id))
          return true
        }
      }
      if (layout.type === 'group' && layout.children)
        return layout.children.some(child => switchToExistingTab(child))
      return false
    }
    switchToExistingTab(panelLayout)
    return
  }

  const tabId = `flow_${flow.id}_${Date.now()}`
  const newTab: FlowTab = {
    id: tabId,
    flowId: flow.id,
    title: flow.name,
    flow,
    type: 'flow',
  }

  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab))
  setActivePanelId(targetPanelId)
}
