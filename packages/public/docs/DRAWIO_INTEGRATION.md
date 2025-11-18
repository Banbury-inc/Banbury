# Draw.io Integration for Banbury Website

This document describes the draw.io file handling functionality that has been integrated into the Banbury website, similar to how athena-intelligence handles draw.io files.

## Features

### 1. Draw.io File Viewer
- **Component**: `DrawioViewer.tsx`
- **Purpose**: Display and interact with .drawio and .xml diagram files
- **Features**:
  - View mode for readonly diagram viewing
  - Edit mode with direct integration to app.diagrams.net
  - Fullscreen support
  - Download functionality
  - Refresh capability
  - Error handling for invalid files

### 2. File Attachment Integration
- **Enhanced**: `file-attachment-display.tsx`
- **Features**:
  - Automatic detection of draw.io files (.drawio, .xml)
  - Special icon (Network) for diagram files
  - Quick view button for draw.io files
  - Seamless integration with existing file attachment system

### 3. Draw.io AI Tool
- **Component**: `DrawioAITool.tsx`
- **Purpose**: Handle AI interactions with draw.io files
- **Features**:
  - Display AI analysis of diagrams
  - Show operation summaries (create, update, delete, analyze)
  - Embedded viewer for quick preview
  - Export to external draw.io editor

### 4. Modal Viewer
- **Component**: `DrawioViewerModal.tsx`
- **Purpose**: Full-screen modal for viewing diagrams
- **Features**:
  - Large viewport for detailed diagram inspection
  - Clean modal interface
  - Keyboard shortcuts (Escape to close)

### 5. Integration Dashboard
- **Component**: `DrawioIntegration.tsx`
- **Purpose**: Comprehensive file management for diagrams
- **Features**:
  - File statistics (total files, diagrams, documents)
  - Grid view of diagram files
  - Create new diagram button
  - Separate sections for diagrams vs. other documents

## Usage

### For Users

1. **Upload Draw.io Files**
   - Use the existing file attachment system
   - Supported formats: `.drawio`, `.xml`
   - Files are automatically detected as diagrams

2. **View Diagrams**
   - Click the eye icon next to any diagram file
   - Opens in a modal with full draw.io viewer
   - Use viewer controls for zoom, navigation

3. **Edit Diagrams**
   - Click "Edit in draw.io" button
   - Opens the file in app.diagrams.net in a new tab
   - Make changes and save back to your file system

4. **AI Interactions**
   - Ask AI questions about your diagrams
   - AI can analyze diagram content and structure
   - Get suggestions for improvements or modifications

### For Developers

#### Adding Draw.io Support to New Components

```tsx
import { isDrawioFile } from './handlers/drawio-viewer-handlers';
import DrawioViewer from './DrawioViewer';

// Check if file is a draw.io file
if (isDrawioFile(fileName)) {
  // Render draw.io viewer
  return <DrawioViewer fileUrl={url} fileName={name} />;
}
```

#### Integrating with File Lists

```tsx
import { FileAttachmentDisplay } from './file-attachment-display';

<FileAttachmentDisplay
  files={files}
  onFileView={handleDrawioFileView} // Add this for draw.io support
  onFileClick={handleFileRemove}
/>
```

#### Handling AI Tool Events

```tsx
useEffect(() => {
  const handleDrawioEvent = (event: CustomEvent) => {
    const { detail } = event;
    // Handle draw.io AI tool responses
  };

  window.addEventListener('drawio-ai-response', handleDrawioEvent);
  return () => window.removeEventListener('drawio-ai-response', handleDrawioEvent);
}, []);
```

## File Structure

```
src/components/
├── DrawioViewer.tsx              # Main viewer component
├── DrawioAITool.tsx             # AI integration component
├── DrawioViewerModal.tsx        # Modal wrapper
├── DrawioIntegration.tsx        # Dashboard component
├── file-attachment-display.tsx  # Enhanced with draw.io support
└── handlers/
    └── drawio-viewer-handlers.ts # Utility functions
```

## Configuration

The draw.io integration uses the following external services:

- **Viewer**: `https://viewer.diagrams.net/`
- **Editor**: `https://app.diagrams.net/`

These are the official draw.io/diagrams.net services and don't require additional API keys or configuration.

## Security

- All draw.io interactions happen via secure HTTPS
- File URLs are properly encoded
- iframe sandbox restrictions are in place
- No sensitive data is sent to external services

## Browser Compatibility

- Modern browsers with iframe support
- JavaScript enabled
- Clipboard API support (for copy functionality)
- File download support

## Troubleshooting

### Common Issues

1. **Diagram not loading**
   - Check if the file URL is accessible
   - Verify the file is a valid .drawio or .xml format
   - Try refreshing the viewer

2. **Edit mode not working**
   - Ensure popup blockers are disabled
   - Check if the file URL is publicly accessible
   - Verify network connectivity

3. **File not recognized as diagram**
   - Check file extension (.drawio or .xml)
   - Verify filename contains "drawio"
   - Ensure file is properly uploaded

### Debug Mode

Enable debug logging by adding this to your console:

```javascript
localStorage.setItem('drawio-debug', 'true');
```

## Future Enhancements

- Real-time collaborative editing
- Version history tracking
- Custom draw.io configurations
- Diagram thumbnail generation
- Export to multiple formats (PNG, SVG, PDF)
