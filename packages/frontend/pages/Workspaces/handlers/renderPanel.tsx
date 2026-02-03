import React from 'react';
import Image from 'next/image';
import OlympusTabs, { Tab as OlympusTab } from '../../../components/common/Tabs/Tabs';
import { DocumentViewer } from '../../../components/MiddlePanel/DocumentViewer/DocumentViewer';
import { EmailComposer } from '../../../components/MiddlePanel/EmailViewer/EmailComposer';
import { EmailViewer } from '../../../components/MiddlePanel/EmailViewer/EmailViewer';
import { ImageViewer } from '../../../components/MiddlePanel/ImageViewer/ImageViewer';
import { CalendarViewer } from '../../../components/MiddlePanel/CalendarViewer/CalendarViewer';
import { FileBrowserViewer } from '../../../components/MiddlePanel/FileBrowserViewer/FileBrowserViewer';
import { EmailInboxViewer } from '../../../components/MiddlePanel/EmailInboxViewer/EmailInboxViewer';
import { SpreadsheetViewer } from '../../../components/MiddlePanel/SpreadsheetViewer/SpreadsheetViewer';
import { VideoViewer } from '../../../components/MiddlePanel/VideoViewer/VideoViewer';
import IDE from '../../../components/MiddlePanel/CodeViewer/IDE';
import BrowserViewer from '../../../components/MiddlePanel/BrowserViewer/BrowserViewer';
import NotebookViewer from '../../../components/MiddlePanel/NotebookViewer/NotebookViewer';
import NotebookLabViewer from '../../../components/MiddlePanel/NotebookViewer/NotebookLabViewer';
import { CONFIG } from '../../../config/config';
import { PDFViewer } from '../../../components/MiddlePanel/PDFViewer/PDFViewer';
import { isNotebookFile, isDriveImageFile, isDrivePdfFile, isDriveDocumentFile, isDriveSpreadsheetFile, isDriveVideoFile, isDriveCodeFile, isDrivePresentationFile, isPlanFile } from './fileTypeUtils';
import { PlanViewer } from '../../../components/MiddlePanel/PlanViewer/PlanViewer';
import DrawioViewer from '../../../components/MiddlePanel/CanvasViewer/DrawioViewer';
import TldrawViewer from '../../../components/MiddlePanel/CanvasViewer/TldrawViewer';
import { PowerPointViewer } from '../../../components/MiddlePanel/PowerPointViewer/PowerPointViewer';
import { GoogleDriveViewer } from '../../../components/MiddlePanel/GoogleDriveViewer';
import { CalendarEvent } from '../../../../backend/api/calendar/calendar';
import { Panel, DragState, UserInfo } from '../types';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { Typography } from '../../../components/common/ui/typography';
import { Kbd, KbdGroup } from '../../../components/common/ui/kbd';
import BanburyLogo from '../../../assets/images/Logo.png';
import { TaskViewer } from '../../../components/MiddlePanel/TaskViewer/TaskViewer';
import { TaskComposer } from '../../../components/MiddlePanel/TaskViewer/TaskComposer';
import { MeetingViewer } from '../../../components/MiddlePanel/MeetingViewer/MeetingViewer';
import { MeetingJoinComposer } from '../../../components/MiddlePanel/MeetingViewer/MeetingJoinComposer';
import { AdminViewer } from '../../../components/MiddlePanel/AdminViewer/AdminViewer';

interface RenderPanelProps {
  panel: Panel;
  activePanelId: string;
  dragState: DragState;
  userInfo: UserInfo | null;
  replyToEmail: any;
  setActivePanelId: (panelId: string) => void;
  handleTabChange: (panelId: string, tabId: string) => void;
  handleCloseTab: (tabId: string, panelId: string) => void;
  handleReplyToEmail: (email: any) => void;
  triggerSidebarRefresh: () => void;
  extractReplyBody: (email: any) => string;
  isImageFile: (fileName: string) => boolean;
  isPdfFile: (fileName: string) => boolean;
  isDocumentFile: (fileName: string) => boolean;
  isSpreadsheetFile: (fileName: string) => boolean;
  isVideoFile: (fileName: string) => boolean;
  isCodeFile: (fileName: string) => boolean;
  isBrowserFile: (fileName: string) => boolean;
  isDrawioFile: (fileName: string) => boolean;
  isTldrawFile: (fileName: string) => boolean;
  isPowerPointFile: (fileName: string) => boolean;
  panelLayout: any;
  setPanelLayout: React.Dispatch<React.SetStateAction<any>>;
  isMac?: boolean;
  onSplitPreview?: (direction: 'horizontal' | 'vertical' | null, position: { x: number; y: number }) => void;
  calendarJumpDate?: Date | null;
  onCalendarJumpComplete?: () => void;
  calendarSelectedEvent?: CalendarEvent | null;
  onCalendarSelectedEventConsumed?: () => void;
  // Props for AI tab rendering
  selectedFile?: FileSystemItem | null;
  selectedEmail?: any;
  onEmailSelect?: (email: any) => void;
  onClearConversation?: (tabId: string) => void;
  // Callbacks for opening content in tabs
  openFileInTabCallback: (file: FileSystemItem, panelId: string) => void;
  openEmailInTabCallback: (email: any, panelId: string) => void;
  setSelectedFile: (file: FileSystemItem | null) => void;
  setSelectedEmail: (email: any | null) => void;
  toast: any;
}

export const renderPanel = ({
  panel,
  activePanelId,
  dragState,
  userInfo,
  replyToEmail,
  setActivePanelId,
  handleTabChange,
  handleCloseTab,
  handleReplyToEmail,
  triggerSidebarRefresh,
  extractReplyBody,
  isImageFile,
  isPdfFile,
  isDocumentFile,
  isSpreadsheetFile,
  isVideoFile,
  isCodeFile,
  isBrowserFile,
  isDrawioFile,
  isTldrawFile,
  isPowerPointFile,
  panelLayout,
  setPanelLayout,
  isMac = false,
  onSplitPreview,
  calendarJumpDate,
  onCalendarJumpComplete,
  calendarSelectedEvent,
  onCalendarSelectedEventConsumed,
  selectedFile,
  selectedEmail,
  onEmailSelect,
  onClearConversation,
  openFileInTabCallback,
  openEmailInTabCallback,
  setSelectedFile,
  setSelectedEmail,
  toast,
}: RenderPanelProps) => {
  const isActive = panel.id === activePanelId;
  const isDropTarget = dragState.dropTargetPanel === panel.id;
  const dropZone = isDropTarget ? dragState.dropZone : null;
  
  return (
    <div 
      key={panel.id}
      data-panel-id={panel.id}
      className={`h-full flex flex-col relative shadow-soft ${
        isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-zinc-300 dark:ring-white/[0.06]'
      }`}
      onClick={() => setActivePanelId(panel.id)}
    >
      {/* Panel Tab Bar (Olympus Tabs) */}
      {panel.tabs.length > 0 && (
        <div className="bg-background flex items-stretch border-b border-zinc-200 dark:border-white/[0.06] pt-[12px] md:pt-0">
          <div className="flex items-stretch flex-1 overflow-x-auto min-w-0">
            <OlympusTabs
              tabs={panel.tabs.map<OlympusTab>((t) => {
                let label = 'Unknown';
                if (t.type === 'email') label = t.subject;
                else if (t.type === 'file') label = t.fileName;
                else if (t.type === 'calendar') label = t.title || 'Calendar';
                else if (t.type === 'ai') label = t.label;
                else if (t.type === 'task') label = t.title;
                else if (t.type === 'meeting') label = t.title;
                else if (t.type === 'admin') label = t.title;
                return { id: t.id, label };
              })}
              activeTab={panel.activeTabId || panel.tabs[0]?.id}
              onTabChange={(tabId) => handleTabChange(panel.id, tabId)}
              onTabClose={(tabId) => handleCloseTab(tabId, panel.id)}
              dragContext={{ panelId: panel.id }}
              onReorder={(sourceIndex, destinationIndex) => {
                setPanelLayout((prev: any) => {
                  const reorderInLayout = (layout: any): any => {
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
              suppressReorderIndicator={Boolean(dragState.dropTargetPanel && dragState.dropZone)}
              onSplitPreview={onSplitPreview}
            />
          </div>
        </div>
      )}
      
      {/* Overlays are now handled at the root level in Workspaces.tsx */}
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden relative">
        {panel.tabs.length > 0 ? (
          <>
            {/* Render all tabs but hide inactive ones to preserve state */}
            {panel.tabs.map((tab) => {
              const isTabActive = tab.id === panel.activeTabId;
              
              function renderTabContent() {
                // Handle email tabs
                if (tab.type === 'email') {
                  // Check if this is a compose tab (email is null)
                  if (tab.email === null) {
                    return (
                      <EmailComposer 
                        onBack={() => {
                          // Close the compose tab when back is clicked
                          handleCloseTab(tab.id, panel.id);
                        }}
                        onSendComplete={() => {
                          // Close the compose tab when send is complete
                          handleCloseTab(tab.id, panel.id);
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
                        email={tab.email} 
                        onBack={() => {
                          // Close the email tab when back is clicked
                          handleCloseTab(tab.id, panel.id);
                        }}
                        onReply={handleReplyToEmail}
                      />
                    );
                  }
                }
                
                // Handle file tabs
                if (tab.type === 'file') {
                  const file = tab.file;
                  
                  // Check if this is a Google Drive file
                  const isDriveFile = file.path?.startsWith('drive://');
                  
                  // For Google Drive files, route to appropriate viewer based on mimeType
                  if (isDriveFile) {
                    const mimeType = file.mimeType
                    
                    // Check for Google Workspace files FIRST (Docs, Sheets, Slides)
                    // Export them to native formats and open in appropriate editors
                    if (mimeType?.includes('vnd.google-apps')) {
                      // Google Docs -> Export as DOCX and use DocumentViewer
                      if (mimeType.includes('vnd.google-apps.document')) {
                        return (
                          <DocumentViewer 
                            file={file} 
                            userInfo={userInfo} 
                            onSaveComplete={triggerSidebarRefresh}
                          />
                        )
                      }
                      
                      // Google Sheets -> Export as XLSX and use SpreadsheetViewer
                      if (mimeType.includes('vnd.google-apps.spreadsheet')) {
                        return (
                          <SpreadsheetViewer 
                            file={file} 
                            userInfo={userInfo} 
                            onSaveComplete={triggerSidebarRefresh}
                          />
                        )
                      }
                      
                      // Google Slides -> Export as PPTX and use PowerPointViewer
                      if (mimeType.includes('vnd.google-apps.presentation')) {
                        return (
                          <PowerPointViewer 
                            file={file} 
                            userInfo={userInfo} 
                            onSaveComplete={triggerSidebarRefresh}
                          />
                        )
                      }
                      
                      // For other Workspace files (Forms, etc), use GoogleDriveViewer
                      return <GoogleDriveViewer file={file} />
                    }
                    
                    // For non-Workspace Drive files, route to appropriate native viewer
                    if (isDriveImageFile(mimeType)) {
                      return <ImageViewer file={file} userInfo={userInfo} />
                    } else if (isDrivePdfFile(mimeType)) {
                      return <PDFViewer file={file} userInfo={userInfo} />
                    } else if (isDriveVideoFile(mimeType)) {
                      return <VideoViewer file={file} userInfo={userInfo} />
                    } else if (isDriveCodeFile(mimeType, file.name)) {
                      return <IDE file={file} userInfo={userInfo} onSaveComplete={triggerSidebarRefresh} />
                    } else if (isDriveDocumentFile(mimeType)) {
                      // Regular documents (Word, text) - can be downloaded and edited
                      return (
                        <DocumentViewer 
                          file={file} 
                          userInfo={userInfo} 
                          onSaveComplete={triggerSidebarRefresh}
                        />
                      )
                    } else if (isDriveSpreadsheetFile(mimeType)) {
                      // Regular spreadsheets (Excel, CSV) - can be downloaded and edited
                      return (
                        <SpreadsheetViewer 
                          file={file} 
                          userInfo={userInfo} 
                          onSaveComplete={triggerSidebarRefresh}
                        />
                      )
                    } else if (isDrivePresentationFile(mimeType)) {
                      // Regular presentations (PowerPoint) - can be downloaded and edited
                      return (
                        <PowerPointViewer 
                          file={file} 
                          userInfo={userInfo} 
                          onSaveComplete={triggerSidebarRefresh}
                        />
                      )
                    } else {
                      // Fallback to GoogleDriveViewer for unsupported types
                      return <GoogleDriveViewer file={file} />
                    }
                  }
                  
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
                  } else if (isPowerPointFile(file.name)) {
                    return (
                      <PowerPointViewer 
                        file={file} 
                        userInfo={userInfo} 
                        onSaveComplete={triggerSidebarRefresh}
                      />
                    );
                  } else if (isVideoFile(file.name)) {
                    return <VideoViewer file={file} userInfo={userInfo} />;
                  } else if (isNotebookFile(file.name)) {
                    const useLab = !!CONFIG.jupyterUrl
                    if (useLab) {
                      return <NotebookLabViewer file={file} userInfo={userInfo} />
                    }
                    return (
                      <NotebookViewer 
                        file={file} 
                        userInfo={userInfo} 
                        onSaveComplete={triggerSidebarRefresh} 
                      />
                    )
                  } else if (isPlanFile(file.name)) {
                    return (
                      <PlanViewer 
                        file={file} 
                        userInfo={userInfo} 
                        onSaveComplete={triggerSidebarRefresh}
                      />
                    );
                  } else if (isCodeFile(file.name)) {
                    return <IDE file={file} userInfo={userInfo} onSaveComplete={triggerSidebarRefresh} />;
                  } else if (isTldrawFile(file.name)) {
                    // Use S3 URL if available, otherwise fall back to file path
                    const fileUrl = file.s3_url || file.path;
                    return (
                      <TldrawViewer
                        fileUrl={fileUrl}
                        fileName={file.name}
                        fileId={file.file_id}
                        isEmbedded={false}
                      />
                    );
                  } else if (isDrawioFile(file.name)) {
                    // Keep draw.io support for existing files
                    const fileUrl = file.s3_url || file.path;
                    return (
                      <DrawioViewer
                        fileUrl={fileUrl}
                        fileName={file.name}
                        fileId={file.file_id}
                        isEmbedded={false}
                      />
                    );
                  } else {
                    return (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                          <Typography variant="h3" className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">File Type Not Supported</Typography>
                          <Typography variant="p" className="text-zinc-600 dark:text-gray-400">
                            Preview for this file type is not available yet.
                          </Typography>
                        </div>
                      </div>
                    );
                  }
                }
                if (tab.type === 'calendar') {
                  return (
                    <CalendarViewer
                      initialDate={calendarJumpDate || undefined}
                      initialView="month"
                      onEventClick={() => {
                        // Optionally open event details in a new panel/tab using Email-like pattern
                      }}
                      onDateChange={onCalendarJumpComplete}
                      initialEvent={calendarSelectedEvent || undefined}
                      onInitialEventConsumed={onCalendarSelectedEventConsumed}
                    />
                  );
                }

                // File Browser tab
                if (tab.type === 'file-browser') {
                  return (
                    <FileBrowserViewer
                      userInfo={userInfo}
                      onFileSelect={(file) => openFileInTabCallback(file, panel.id)}
                      activePanelId={activePanelId}
                      panelLayout={panelLayout}
                      setPanelLayout={setPanelLayout}
                      setActivePanelId={setActivePanelId}
                      setSelectedFile={setSelectedFile}
                      triggerSidebarRefresh={triggerSidebarRefresh}
                      toast={toast}
                    />
                  );
                }

                // Email Inbox tab
                if (tab.type === 'email-inbox') {
                  return (
                    <EmailInboxViewer
                      provider={(tab as any).provider}
                      onEmailSelect={(email) => openEmailInTabCallback(email, panel.id)}
                      activePanelId={activePanelId}
                      panelLayout={panelLayout}
                      setPanelLayout={setPanelLayout}
                      setActivePanelId={setActivePanelId}
                      setSelectedEmail={setSelectedEmail}
                    />
                  );
                }
                
                // Handle AI tabs - render a portal container
                // The actual AiConversationTabPane is rendered by AiTabRuntimeHost and portaled here
                if (tab.type === 'ai') {
                  return (
                    <div className="h-full bg-card">
                      <div
                        data-ai-tab-container={tab.id}
                        className="h-full w-full"
                      />
                    </div>
                  );
                }
                
                // Handle task tabs
                if (tab.type === 'task') {
                  // Check if this is a create task composer (task is null)
                  if (tab.task === null) {
                    return (
                      <TaskComposer 
                        onBack={() => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                        onTaskCreated={() => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                      />
                    );
                  } else {
                    return (
                      <TaskViewer 
                        task={tab.task}
                        onBack={() => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                        onTaskUpdated={(updatedTask) => {
                          // Update the tab with the new task data
                          setPanelLayout((prev: any) => {
                            const updateTaskInLayout = (layout: any): any => {
                              if (layout.type === 'panel' && layout.panel?.id === panel.id) {
                                const updatedTabs = layout.panel.tabs.map((t: any) => 
                                  t.id === tab.id ? { ...t, task: updatedTask, title: updatedTask.title } : t
                                );
                                return {
                                  ...layout,
                                  panel: {
                                    ...layout.panel,
                                    tabs: updatedTabs,
                                  },
                                };
                              }
                              if (layout.type === 'group' && layout.children) {
                                return { ...layout, children: layout.children.map(updateTaskInLayout) };
                              }
                              return layout;
                            };
                            return updateTaskInLayout(prev);
                          });
                        }}
                        onTaskDeleted={(taskId) => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                      />
                    );
                  }
                }
                
                // Handle meeting tabs
                if (tab.type === 'meeting') {
                  // Check if this is a join meeting composer (meeting is null)
                  if (tab.meeting === null) {
                    return (
                      <MeetingJoinComposer 
                        onBack={() => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                        onMeetingJoined={() => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                      />
                    );
                  } else {
                    return (
                      <MeetingViewer 
                        meeting={tab.meeting}
                        onBack={() => {
                          handleCloseTab(tab.id, panel.id);
                        }}
                        onMeetingUpdated={(updatedMeeting) => {
                          // Update the tab with the new meeting data
                          setPanelLayout((prev: any) => {
                            const updateMeetingInLayout = (layout: any): any => {
                              if (layout.type === 'panel' && layout.panel?.id === panel.id) {
                                const updatedTabs = layout.panel.tabs.map((t: any) => 
                                  t.id === tab.id ? { ...t, meeting: updatedMeeting, title: updatedMeeting.title || 'Untitled Meeting' } : t
                                );
                                return {
                                  ...layout,
                                  panel: {
                                    ...layout.panel,
                                    tabs: updatedTabs,
                                  },
                                };
                              }
                              if (layout.type === 'group' && layout.children) {
                                return { ...layout, children: layout.children.map(updateMeetingInLayout) };
                              }
                              return layout;
                            };
                            return updateMeetingInLayout(prev);
                          });
                        }}
                      />
                    );
                  }
                }

                // Handle admin tabs
                if (tab.type === 'admin') {
                  return (
                    <div className="h-full overflow-y-auto bg-card">
                      <AdminViewer activeTab={`admin-${tab.adminTabType}`} />
                    </div>
                  );
                }

                return null;
              }
              
              return (
                <div
                  key={tab.id}
                  className="absolute inset-0"
                  style={{ display: isTabActive ? 'block' : 'none' }}
                >
                  {renderTabContent()}
                </div>
              );
            })}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Image 
              src={BanburyLogo} 
              alt="Banbury" 
              className="opacity-20 dark:opacity-15 mb-4"
              width={80}
              height={80}
              priority
            />
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#9ca3af' }}>New Agent:</span>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  <span style={{ color: '#9ca3af' }}>+</span>
                  <Kbd>N</Kbd>
                </KbdGroup>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#9ca3af' }}>Search files:</span>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  <span style={{ color: '#9ca3af' }}>+</span>
                  <Kbd>P</Kbd>
                </KbdGroup>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#9ca3af' }}>Toggle sidebar:</span>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  <span style={{ color: '#9ca3af' }}>+</span>
                  <Kbd>H</Kbd>
                </KbdGroup>
                <span className="text-xs" style={{ color: '#9ca3af' }}>or</span>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  <span style={{ color: '#9ca3af' }}>+</span>
                  <Kbd>⇧</Kbd>
                  <span style={{ color: '#9ca3af' }}>+</span>
                  <Kbd>L</Kbd>
                </KbdGroup>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
