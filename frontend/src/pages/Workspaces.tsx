
import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Toolbar,
  IconButton,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Description as DocumentIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/apiService';
import { Button } from '../components/ui/button';

import { AppSidebar } from "../components/app-sidebar";
import { NavSidebar } from "../components/nav-sidebar";
import { TooltipProvider } from "../components/ui/tooltip";
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { ImageViewer } from '../components/ImageViewer';
import { PDFViewer } from '../components/PDFViewer';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Thread } from '../components/thread';
import { UploadIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';



interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}



const Workspaces = (): JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Helper functions to check file types
  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return imageExtensions.includes(extension)
  };

  const isPdfFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return extension === '.pdf'
  };

  const isViewableFile = (fileName: string): boolean => {
    return isImageFile(fileName) || isPdfFile(fileName)
  };

  // Handle file selection from sidebar
  const handleFileSelect = (file: FileSystemItem) => {
    setSelectedFile(file);
  };

  // Handle file upload
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !userInfo?.username) return;

      setUploading(true);
      setUploadStatus({ open: true, message: 'Uploading file...', severity: 'info' });

      try {
        // Upload file using the ApiService
        await ApiService.uploadFile(
          userInfo.username,
          file,
          file.name,
          `uploads/${file.name}`,
          file.type || 'application/octet-stream'
        );
        
        setUploadStatus({ 
          open: true, 
          message: 'File uploaded successfully!', 
          severity: 'success' 
        });
      } catch (error) {
        setUploadStatus({ 
          open: true, 
          message: 'Failed to upload file. Please try again.', 
          severity: 'error' 
        });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Handle Word document creation
  const handleCreateWordDocument = async () => {
    if (!userInfo?.username) return;

    setUploading(true);
    setUploadStatus({ open: true, message: 'Creating Word document...', severity: 'info' });

    try {
      // Dynamic import of docx library
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      // Create a new document with content
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "New Document",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Welcome to your new Word document! This document was created from the Banbury workspace.",
                  break: 1,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "You can edit this document and save your changes. The document supports:",
                  break: 1,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun("• Rich text formatting"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun("• Multiple paragraphs"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun("• Professional document structure"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Created on: ${new Date().toLocaleDateString()}`,
                  break: 2,
                  italics: true,
                }),
              ],
            }),
          ],
        }],
      });

      // Generate the document as a buffer
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const fileName = `New Document ${new Date().toISOString().split('T')[0]}.docx`;

      // Upload document using the ApiService
      await ApiService.uploadFile(
        userInfo.username,
        blob,
        fileName,
        `documents/${fileName}`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      
      // Trigger download of the created document
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setUploadStatus({ 
        open: true, 
        message: 'Word document created and downloaded successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      setUploadStatus({ 
        open: true, 
        message: 'Failed to create Word document. Please try again.', 
        severity: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setUploadStatus(prev => ({ ...prev, open: false }));
  };

  const runtime = useLocalRuntime({
    async run({ messages }) {
      const lastMessage = messages[messages.length - 1];
      const userContent = lastMessage?.content?.[0]?.type === 'text' 
        ? lastMessage.content[0].text 
        : 'Hello';
      
      return {
        content: [
          {
            type: "text" as const,
            text: `You said: "${userContent}". This is a local runtime response!`,
          },
        ],
      };
    },
  });



  useEffect(() => {
    // Ensure dark mode is enabled
    window.localStorage.setItem('themeMode', 'dark');
    
    const checkAuthAndFetchUser = async () => {
      try {
        setLoading(true);
        
        // Validate token first using ApiService
        const isValidToken = await ApiService.validateToken();

        if (!isValidToken) {
          // Token is invalid, redirect to login
          navigate('/login');
          return;
        }

        // Token is valid, create user info from stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        const basicUserInfo: UserInfo = {
          username: username || 'User',
          email: localStorage.getItem('userEmail') || username || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);
      } catch (err) {
        console.error('Auth check error:', err);
        // Still try to show basic info if we have some stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        if (username) {
          const basicUserInfo: UserInfo = {
            username: username,
            email: localStorage.getItem('userEmail') || username,
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(basicUserInfo);
        } else {
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    navigate('/');
  };



  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }



  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <div className="flex h-screen bg-black">

          {/* Navigation Sidebar - Fixed */}
          <NavSidebar onLogout={handleLogout} />
          
          {/* Main Content Area with Resizable Panels */}
          <div className="flex flex-1 ml-16 flex-col">
            {/* Toolbar */}
            <Toolbar 
              sx={{ 
                backgroundColor: 'black',
                borderBottom: '1px solid',
                borderBottomColor: 'gray',
                minHeight: '48px !important',
                paddingLeft: '16px !important',
                paddingRight: '16px !important',
                display: 'flex',
                justifyContent: 'left',
                alignItems: 'left'
              }}
            >
              {/* Add Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="h-8 bg-black hover:bg-primary disabled:bg-muted disabled:text-muted-foreground border border-zinc-300 dark:border-zinc-600 px-3 py-1 rounded flex items-center gap-1 mr-2"
                    disabled={uploading}
                    title="Add New"
                  >
                    <AddIcon style={{ fontSize: '16px' }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  style={{ zIndex: 999999 }}
                >
                  <DropdownMenuItem 
                    onSelect={handleCreateWordDocument}
                  >
                    <DocumentIcon fontSize="small" className="mr-2" />
                    Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleFileUpload}
                disabled={uploading}
                className="h-8 bg-black hover:bg-primary disabled:bg-muted border border-zinc-300 dark:border-zinc-600 disabled:text-muted-foreground rounded px-3 py-1"
                title="Upload File"
              >
                <UploadIcon className="h-4 w-4" />
              </Button>
            </Toolbar>

            {/* Resizable Panels */}
            <div className="flex flex-1">
              <Allotment>
                {/* File Sidebar Panel */}
                <Allotment.Pane minSize={200} preferredSize={280} maxSize={400} className="relative z-10">
                  <AppSidebar 
                    currentView="workspaces"
                    userInfo={userInfo}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                  />
                </Allotment.Pane>
                
                {/* Main Content Panel */}
                <Allotment.Pane minSize={300}>
                  <main className="h-full bg-black">
                    {selectedFile && isImageFile(selectedFile.name) ? (
                      <ImageViewer file={selectedFile} userInfo={userInfo} />
                    ) : selectedFile && isPdfFile(selectedFile.name) ? (
                      <PDFViewer file={selectedFile} userInfo={userInfo} />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center max-w-md">
                            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Workspaces</h1>
                            <p className="text-gray-300 text-lg mb-6">
                              Your collaborative workspace environment is ready. Create, organize, and manage your projects with ease.
                            </p>
                            <p className="text-gray-400 text-sm">
                              {selectedFile && !isViewableFile(selectedFile.name) 
                                ? `Selected: ${selectedFile.name} (Preview not available for this file type)`
                                : 'Select an image or PDF file from the sidebar to view it here. Use the toolbar above to upload files or create new documents. The AI assistant is available in the right panel to help you with your work.'
                              }
                            </p>
                          </div>
                        </div>
                    )}
                  </main>
                </Allotment.Pane>
                
                {/* Assistant Panel */}
                <Allotment.Pane minSize={250} preferredSize={350} maxSize={500}>
                  <div className="h-full bg-black border-l border-gray-800">
                    <Thread />
                  </div>
                </Allotment.Pane>
              </Allotment>
            </div>
          </div>
          
          {/* Upload Status Snackbar */}
          <Snackbar
            open={uploadStatus.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={handleCloseSnackbar} 
              severity={uploadStatus.severity}
              sx={{ width: '100%' }}
            >
              {uploadStatus.message}
            </Alert>
          </Snackbar>
        </div>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
};
export default Workspaces;