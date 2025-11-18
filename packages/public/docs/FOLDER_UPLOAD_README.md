# Folder Upload Functionality

This document describes the new folder upload functionality that has been added to the Banbury Website application.

## Features Added

### 1. Folder Upload via Button
- Added a folder upload button in the sidebar header (next to the file upload button)
- Users can click the folder icon to select and upload entire folders
- The folder structure is preserved during upload

### 2. Drag and Drop Support
- Users can drag and drop entire folders from their file system into the sidebar
- Visual feedback is provided when dragging files/folders over the upload area
- Both individual files and folders are supported in the same drag operation

### 3. Context Menu Integration
- Right-click context menu now includes "Upload File" and "Upload Folder" options
- These options are available when right-clicking on any folder in the file tree

### 4. Visual Feedback
- Loading indicators show when folders are being uploaded
- Drag-over visual feedback with blue border and upload message
- Progress indication during upload process

## Technical Implementation

### Backend API
- Added `uploadFolder` method to `ApiService` class
- Handles multiple file uploads with preserved folder structure
- Uses existing `uploadToS3` method for individual files

### Frontend Components
- Updated `AppSidebar` component with folder upload functionality
- Added drag and drop event handlers
- Integrated with existing file tree structure
- Added visual feedback components

### File Structure Preservation
- Folder structure is maintained using `webkitRelativePath` property
- Files are uploaded with their relative paths preserved
- Folder hierarchy is recreated in the S3 storage

## Usage Instructions

### Method 1: Button Upload
1. Click the folder icon (📁) in the sidebar header
2. Select a folder from your file system
3. The folder and all its contents will be uploaded

### Method 2: Drag and Drop
1. Drag a folder from your file explorer
2. Drop it onto the sidebar area
3. The folder will be uploaded with its structure intact

### Method 3: Context Menu
1. Right-click on any folder in the file tree
2. Select "Upload Folder" from the context menu
3. Choose a folder to upload

## Browser Compatibility

- **Chrome/Edge**: Full support for folder uploads
- **Firefox**: Full support for folder uploads
- **Safari**: Full support for folder uploads
- **Internet Explorer**: Limited support (no folder upload)

## File Size Limits

- Individual files: Same as existing file upload limits
- Total folder size: Limited by browser memory and network timeout
- Large folders may take time to upload depending on file count and size

## Error Handling

- Network errors are caught and displayed to the user
- Partial uploads are handled gracefully
- Upload progress is shown to prevent user confusion
- Failed uploads can be retried

## Security Considerations

- File types are validated during upload
- File paths are sanitized to prevent directory traversal
- Upload limits are enforced at both client and server levels
- Authentication is required for all upload operations

## Testing

A test file `test-folder-upload.html` has been created to verify the folder upload functionality works correctly. You can open this file in a browser to test the drag and drop and file selection features.

## Future Enhancements

- Progress bars for individual files within folders
- Resume upload functionality for interrupted uploads
- Batch upload queue management
- Upload speed optimization for large folders
- Folder upload templates and presets
