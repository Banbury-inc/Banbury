import React from 'react';
import Image from 'next/image';
import OlympusTabs, { Tab as OlympusTab } from '../../../components/common/Tabs/Tabs';
import { DocumentViewer } from '../../../components/MiddlePanel/DocumentViewer/DocumentViewer';
import { EmailComposer } from '../../../components/MiddlePanel/EmailViewer/EmailComposer';
import { Typography } from '../../../components/ui/typography';
import { EmailViewer } from '../../../components/MiddlePanel/EmailViewer/EmailViewer';
import { ImageViewer } from '../../../components/MiddlePanel/ImageViewer';
import { CalendarViewer } from '../../../components/MiddlePanel/CalendarViewer/CalendarViewer';
import { SpreadsheetViewer } from '../../../components/MiddlePanel/SpreadsheetViewer/SpreadsheetViewer';
import { VideoViewer } from '../../../components/MiddlePanel/VideoViewer/VideoViewer';
import CodeViewer from '../../../components/MiddlePanel/CodeViewer/CodeViewer';
import IDE from '../../../components/MiddlePanel/CodeViewer/IDE';
import BrowserViewer from '../../../components/MiddlePanel/BrowserViewer/BrowserViewer';
import NotebookViewer from '../../../components/MiddlePanel/NotebookViewer/NotebookViewer';
import NotebookLabViewer from '../../../components/MiddlePanel/NotebookViewer/NotebookLabViewer';
import { CONFIG } from '../../../config/config';
import { PDFViewer } from '../../../components/MiddlePanel/PDFViewer';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { isNotebookFile, isTldrawFile, isDriveImageFile, isDrivePdfFile, isDriveDocumentFile, isDriveSpreadsheetFile, isDriveVideoFile, isDriveCodeFile } from './fileTypeUtils';
import DrawioViewer from '../../../components/MiddlePanel/CanvasViewer/DrawioViewer';
import TldrawViewer from '../../../components/MiddlePanel/CanvasViewer/TldrawViewer';
import { GoogleDriveViewer } from '../../../components/MiddlePanel/GoogleDriveViewer';
import BanburyLogo from '../../../assets/images/Logo.png';
import { Kbd, KbdGroup } from '../../../components/ui/kbd';

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
  email: any;
  type: 'email';
}

interface CalendarTab {
  id: string;
  type: 'calendar';
}

type WorkspaceTab = FileTab | EmailTab | CalendarTab;

interface Panel {
  id: string;
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}

interface DragState {
  isDragging: boolean;
  draggedTab: WorkspaceTab | null;
  draggedFromPanel: string | null;
  dragStartPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
  dragDirection: 'horizontal' | 'vertical' | null;
  dropZone: 'left' | 'right' | 'top' | 'bottom' | null;
  dropTargetPanel: string | null;
}

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
  setPanelLayout: React.Dispatch<React.SetStateAction<any>>;
  onSplitPreview?: (direction: 'horizontal' | 'vertical' | null, position: { x: number; y: number }) => void;
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
  setPanelLayout,
  isMac = false,
  onSplitPreview
}: RenderPanelProps) => {
  const isActive = panel.id === activePanelId;
  const isDropTarget = dragState.dropTargetPanel === panel.id;
  const dropZone = isDropTarget ? dragState.dropZone : null;
  
  // Debug logging (no hooks in non-component functions)
  if (dragState.isDragging) {
    console.log('Panel render debug:', {
      panelId: panel.id,
      isDropTarget,
      dropZone,
      dragState
    });
  }
  
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
        <div className="bg-zinc-100 dark:bg-[#252526] flex items-stretch">
          <div className="flex items-stretch flex-1">
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
                  console.log('Rendering file tab:', file.name, 'file type:', file.name.split('.').pop());
                  
                  // Check if this is a Google Drive file
                  const isDriveFile = file.path?.startsWith('drive://');
                  
                  // For Google Drive files, route to appropriate viewer based on mimeType
                  if (isDriveFile) {
                    const mimeType = file.mimeType
                    
                    console.log('Rendering Drive file:', file.name, 'mimeType:', mimeType)
                    
                    // Check for Google Workspace files FIRST (Docs, Sheets, Slides)
                    // Export them to native formats and open in appropriate editors
                    if (mimeType?.includes('vnd.google-apps')) {
                      console.log('Detected Google Workspace file')
                      
                      // Google Docs -> Export as DOCX and use DocumentViewer
                      if (mimeType.includes('vnd.google-apps.document')) {
                        console.log('Google Doc detected, exporting as DOCX')
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
                        console.log('Google Sheet detected, exporting as XLSX')
                        return (
                          <SpreadsheetViewer 
                            file={file} 
                            userInfo={userInfo} 
                            onSaveComplete={triggerSidebarRefresh}
                          />
                        )
                      }
                      
                      // For other Workspace files (Slides, Forms, etc), use GoogleDriveViewer
                      console.log('Other Google Workspace file, using GoogleDriveViewer')
                      return <GoogleDriveViewer file={file} />
                    }
                    
                    // For non-Workspace Drive files, route to appropriate native viewer
                    console.log('Detected regular Drive file, routing to native viewer')
                    
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
                    } else {
                      // Fallback to GoogleDriveViewer for unsupported types
                      console.log('Unknown Drive file type, using GoogleDriveViewer fallback')
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
                  } else if (isVideoFile(file.name)) {
                    console.log('Rendering VideoViewer for file:', file.name);
                    console.log('userInfo in renderPanel:', userInfo);
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
                if ((tab as any).type === 'calendar') {
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
