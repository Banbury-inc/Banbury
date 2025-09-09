# Google Drive Integration

## Overview

The Google Drive integration allows users to view, browse, and interact with their Google Drive files directly within the workspace left panel. This feature provides seamless access to Google Drive files without leaving the application.

## Features

### File Browsing
- **Hierarchical File Tree**: Browse Google Drive files and folders in a tree structure
- **Search Functionality**: Search for files by name across the entire Google Drive
- **File Type Icons**: Visual indicators for different file types (Google Docs, Sheets, Slides, images, etc.)
- **Real-time Loading**: Dynamic loading of file structure with loading indicators

### File Operations
- **Preview Files**: Open files in Google Drive's web interface for viewing/editing
- **Download Files**: Download files to local device with proper format conversion
- **Google Workspace Export**: Automatically convert Google Docs/Sheets/Slides to Office formats
- **External Links**: Direct links to open files in Google Drive

### Authentication
- **Incremental Authorization**: Request Google Drive access only when needed
- **Scope Management**: Integrated with existing Google OAuth scope system
- **Access Indicators**: Clear UI feedback for authentication status

## Components

### GoogleDriveTab
Main component that renders in the left panel as a tab alongside Files, Email, and Calendar.

**Location**: `frontend/src/components/LeftPanel/GoogleDriveTab.tsx`

**Features**:
- File tree rendering with expand/collapse
- Search functionality
- Authentication prompts
- File selection and interaction

### GoogleDriveFileViewer
Modal component for viewing file details and performing actions.

**Location**: `frontend/src/components/GoogleDriveFileViewer.tsx`

**Features**:
- File metadata display
- Preview, download, and external link actions
- File type detection and appropriate handling
- Error handling for failed operations

### GoogleDriveService
Service class for Google Drive API interactions.

**Location**: `frontend/src/services/googleDriveService.ts`

**Methods**:
- `hasDriveAccess()`: Check if user has granted Drive permissions
- `listFiles()`: Get files from Google Drive with pagination
- `searchFiles()`: Search for files by name
- `downloadFile()`: Download files with format conversion
- `buildDriveFileTree()`: Convert flat file list to hierarchical structure

## API Endpoints

The integration expects these backend endpoints to be available:

### File Listing
- `GET /authentication/google/drive/list` - List files with query parameters
- `GET /authentication/google/drive/file/{fileId}` - Get file metadata

### File Operations
- `GET /authentication/google/drive/download/{fileId}` - Download regular files
- `GET /authentication/google/drive/export/{fileId}` - Export Google Workspace files

### Authentication
- Uses existing scope management system
- Requires `drive` feature to be available in `/authentication/scopes/features/`

## File Type Support

### Google Workspace Files
- **Google Docs**: Export as DOCX, preview in Drive
- **Google Sheets**: Export as XLSX, preview in Drive  
- **Google Slides**: Export as PPTX, preview in Drive
- **Google Drawings**: Export as PNG, preview in Drive
- **Other Google Apps**: Export as PDF, preview in Drive

### Regular Files
- **Documents**: PDF, Word, text files
- **Images**: All common formats (PNG, JPG, GIF, etc.)
- **Videos**: All common formats (MP4, MOV, etc.)
- **Audio**: All common formats (MP3, WAV, etc.)
- **Archives**: ZIP, RAR, etc.

## Usage

### Activating Google Drive
1. Click on the "Drive" tab in the left panel
2. If not authenticated, click "Connect Google Drive"
3. Complete OAuth flow to grant permissions
4. Files will load automatically

### Browsing Files
1. Click folders to expand/collapse
2. Click files to view details and actions
3. Use search bar to find specific files
4. Refresh button to reload file structure

### File Actions
1. **Preview**: Click on file or use Preview button in file viewer
2. **Download**: Use Download button in file viewer or context menu
3. **Open in Drive**: Use external link button to open in Google Drive

## Error Handling

### Authentication Errors
- Clear prompts to connect Google Drive
- Automatic scope checking before API calls
- Graceful fallback when permissions are insufficient

### API Errors
- Network error handling with user-friendly messages
- Retry mechanisms for temporary failures
- Loading states during API operations

### File Operation Errors
- Download failure handling with error messages
- Export format fallbacks for unsupported file types
- Permission error handling for restricted files

## Integration Points

### Left Panel
- New "Drive" tab added alongside existing tabs
- Consistent UI styling with other tabs
- Shared file selection interface

### Scope Management
- Integrates with existing `ScopeService`
- Uses same OAuth flow as Gmail and Calendar
- Respects user permission preferences

### File System
- Compatible with existing file interfaces
- Consistent file tree structure
- Shared file selection callbacks

## Future Enhancements

### Planned Features
- **File Upload**: Upload files from local device to Google Drive
- **Folder Management**: Create, rename, delete folders
- **File Management**: Rename, move, delete files
- **Collaborative Features**: Share files, manage permissions
- **Offline Access**: Cache frequently accessed files

### Performance Optimizations
- **Lazy Loading**: Load folders on-demand
- **Caching**: Cache file metadata and thumbnails
- **Pagination**: Handle large file lists efficiently
- **Background Sync**: Keep file list updated

## Configuration

### Required Scopes
The backend must request these Google OAuth scopes for full functionality:
- `https://www.googleapis.com/auth/drive` - Full Drive access
- `https://www.googleapis.com/auth/drive.file` - File-specific access

### Environment Variables
Backend configuration should include:
- Google OAuth client credentials
- Appropriate redirect URIs
- Drive API enablement

## Troubleshooting

### Common Issues
1. **Files not loading**: Check Google Drive permissions in scope management
2. **Download failures**: Verify file permissions and export format support
3. **Authentication loops**: Clear browser storage and re-authenticate

### Debug Information
- Check browser console for API errors
- Verify scope status in ScopeService
- Test individual API endpoints
- Check network requests in browser dev tools