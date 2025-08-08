
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
import { Add as AddIcon, Description as DocumentIcon, Folder as FolderIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { ApiService } from '../services/apiService';
import { CONFIG } from '../config/config';
import { Button } from '../components/ui/button';

import { AppSidebar } from "../components/app-sidebar";
import { NavSidebar } from "../components/nav-sidebar";
import { TooltipProvider } from "../components/ui/tooltip";
 
import { ClaudeRuntimeProvider } from '../assistant/ClaudeRuntimeProvider';
import { ImageViewer } from '../components/ImageViewer';
import { PDFViewer } from '../components/PDFViewer';
import { DocumentViewer } from '../components/DocumentViewer';
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
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

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

  const isDocumentFile = (fileName: string): boolean => {
    const documentExtensions = ['.docx', '.doc']
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    return documentExtensions.includes(extension)
  };

  const isViewableFile = (fileName: string): boolean => {
    return isImageFile(fileName) || isPdfFile(fileName) || isDocumentFile(fileName)
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
        // Upload file using the uploadToS3 function
        await uploadToS3(
          file,
          userInfo.username,
          `uploads/${file.name}`,
          'uploads'
        );
        
        setUploadStatus({ 
          open: true, 
          message: 'File uploaded to S3 successfully!', 
          severity: 'success' 
        });
        
        // Trigger sidebar refresh after successful upload
        triggerSidebarRefresh();
      } catch (error) {
        setUploadStatus({ 
          open: true, 
          message: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          severity: 'error' 
        });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Web-compatible version of uploadToS3 function
  const uploadToS3 = async (
    file: File | Blob,
    deviceName: string,
    filePath: string = '',
    fileParent: string = ''
  ): Promise<any> => {
    // Load authentication credentials from localStorage (web version)
    const token = localStorage.getItem('authToken');
    const apiKey = localStorage.getItem('apiKey'); // If you use API keys
    
    if (!token) {
      throw new Error('Authentication token not found. Please login first.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('device_name', deviceName);
    formData.append('file_path', filePath);
    formData.append('file_parent', fileParent);

    const response = await fetch(`${CONFIG.url}/files/upload_to_s3/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(apiKey && { 'X-API-Key': apiKey })
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  };

  // Handle Word document creation
  const handleCreateWordDocument = async () => {
    if (!userInfo?.username) return;

    setUploading(true);
    setUploadStatus({ open: true, message: 'Creating Word document...', severity: 'info' });

    try {
      // Create simple document content
      const content = `New Document

Welcome to your new Word document! This document was created from the Banbury workspace.

You can edit this document directly in the browser with formatting support. The document includes:
• Rich text formatting 
• Multiple paragraphs
• Professional document structure
• Real-time editing capabilities

Created on: ${new Date().toLocaleDateString()}`;

      // Generate filename
      const fileName = `Another New Test Document ${new Date().toISOString().split('T')[0]}.docx`;

      // Create .docx using docx library
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "New Document",
              heading: HeadingLevel.HEADING_1,
            }),
            ...content.split('\n').slice(2).map(line => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    break: 1,
                  }),
                ],
              })
            )
          ],
        }],
      });

      // Generate the document as a blob
      const blob = await Packer.toBlob(doc);

      // Upload document using the uploadToS3 function
      setUploadStatus({ open: true, message: 'Uploading document to S3...', severity: 'info' });
      
      await uploadToS3(
        blob,
        userInfo.username,
        `documents/${fileName}`,
        'documents'
      );
      
      setUploadStatus({ 
        open: true, 
        message: 'Word document created and uploaded successfully!', 
        severity: 'success' 
      });
      
      // Trigger sidebar refresh after successful document creation
      triggerSidebarRefresh();
    } catch (error) {
      setUploadStatus({ 
        open: true, 
        message: `Failed to create Word document: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        severity: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!userInfo?.username) return;

    // Prompt user for folder name
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9\s\-_]/g, '');
    if (!sanitizedFolderName) {
      setUploadStatus({ 
        open: true, 
        message: 'Invalid folder name. Please use only letters, numbers, spaces, hyphens, and underscores.', 
        severity: 'error' 
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ open: true, message: 'Creating folder...', severity: 'info' });

    try {
      // Create a placeholder file to represent the folder structure
      // This is a common pattern when the backend doesn't have explicit folder creation
      const placeholderContent = `This folder was created on ${new Date().toLocaleDateString()}`;
      const blob = new Blob([placeholderContent], { type: 'text/plain' });
      const placeholderFileName = '.folder_placeholder';

      // Upload placeholder file to create the folder structure
      await uploadToS3(
        blob,
        userInfo.username,
        `${sanitizedFolderName}/${placeholderFileName}`,
        sanitizedFolderName
      );
      
      setUploadStatus({ 
        open: true, 
        message: `Folder "${sanitizedFolderName}" created successfully!`, 
        severity: 'success' 
      });
      
      // Trigger sidebar refresh after successful folder creation
      triggerSidebarRefresh();
    } catch (error) {
      setUploadStatus({ 
        open: true, 
        message: `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`, 
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

  // Function to trigger sidebar refresh
  const triggerSidebarRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileDeleted = (fileId: string) => {
    // If the deleted file was selected, clear the selection
    if (selectedFile?.file_id === fileId) {
      setSelectedFile(null);
    }
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
  };

  const handleFileRenamed = (oldPath: string, newPath: string) => {
    // If the renamed file was selected, update its path
    if (selectedFile?.path === oldPath) {
      setSelectedFile(prev => prev ? { ...prev, path: newPath, name: newPath.split('/').pop() || newPath } : null);
    }
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
  };

  const handleFileMoved = (fileId: string, oldPath: string, newPath: string) => {
    // If the moved file was selected, update its path
    if (selectedFile?.file_id === fileId) {
      setSelectedFile(prev => prev ? { ...prev, path: newPath, name: newPath.split('/').pop() || newPath } : null);
    }
    // Refresh the sidebar to update the file list
    triggerSidebarRefresh();
  };

  



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
          router.push('/login');
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
          router.push('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [router]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
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
      <ClaudeRuntimeProvider>
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
                  <DropdownMenuItem 
                    onSelect={handleCreateFolder}
                  >
                    <FolderIcon fontSize="small" className="mr-2" />
                    Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleFileUpload}
                disabled={uploading}
                className="h-8 bg-black hover:bg-primary disabled:bg-muted border border-zinc-300 dark:border-zinc-600 disabled:text-muted-foreground rounded px-3 py-1"
                title="Upload File"
              >
                <UploadIcon className="h-4 w-4 text-white" />
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
                    refreshTrigger={refreshTrigger}
                    onFileDeleted={handleFileDeleted}
                    onFileRenamed={handleFileRenamed}
                    onFileMoved={handleFileMoved}
                  />
                </Allotment.Pane>
                
                {/* Main Content Panel */}
                <Allotment.Pane minSize={300}>
                  <main className="h-full bg-black">
                    {selectedFile && isImageFile(selectedFile.name) ? (
                      <ImageViewer file={selectedFile} userInfo={userInfo} />
                    ) : selectedFile && isPdfFile(selectedFile.name) ? (
                      <PDFViewer file={selectedFile} userInfo={userInfo} />
                    ) : selectedFile && isDocumentFile(selectedFile.name) ? (
                      <DocumentViewer 
                        file={selectedFile} 
                        userInfo={userInfo} 
                        onSaveComplete={triggerSidebarRefresh}
                      />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center max-w-md">
                            <h1 className="text-4xl font-bold text-white mb-4">Welcome to Workspaces</h1>
                            <p className="text-gray-300 text-lg mb-6">
                              Your collaborative workspace environment is ready. Create, organize, and manage your projects with ease.
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
      </ClaudeRuntimeProvider>
    </TooltipProvider>
  );
};
export default Workspaces;