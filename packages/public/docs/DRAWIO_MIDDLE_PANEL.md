# Draw.io Middle Panel Integration

This document describes the integration of draw.io file viewing in the middle panel when files are selected from the left panel.

## What's Implemented

### ✨ **Draw.io File Viewing in Middle Panel**
Users can now click on draw.io files in the left panel and view them directly in the middle panel using the full DrawioViewer component.

### 🎯 **Features Added**

1. **File Type Detection**: Added `isDrawioFile()` function to detect .drawio and .xml files containing "drawio"
2. **Viewer Integration**: DrawioViewer component displays in middle panel with all features:
   - View mode and edit mode toggle
   - Fullscreen support
   - Download functionality
   - Refresh capability
   - Direct editing in draw.io app
3. **Seamless UI**: Integrates with existing tab system and panel management

### 🔧 **Technical Implementation**

#### Files Modified:
1. **`fileTypeUtils.ts`** - Added `isDrawioFile()` detection function
2. **`renderPanel.tsx`** - Added DrawioViewer integration for file tabs
3. **`Workspaces.tsx`** - Added isDrawioFile parameter passing

#### Key Components:
1. **File Type Detection**: 
   ```typescript
   export const isDrawioFile = (fileName: string): boolean => {
     const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
     return extension === '.drawio' || (extension === '.xml' && fileName.toLowerCase().includes('drawio'));
   };
   ```

2. **Viewer Integration**:
   ```typescript
   } else if (isDrawioFile(file.name)) {
     const fileUrl = file.s3_url || file.path;
     return (
       <DrawioViewer
         fileUrl={fileUrl}
         fileName={file.name}
         isEmbedded={false}
       />
     );
   }
   ```

3. **Complete Integration Chain**:
   - File detection → Tab creation → Viewer rendering → Full functionality

### 📋 **User Experience**

1. **File Selection**:
   - Click any .drawio file in the left panel file tree
   - File opens as a new tab in the middle panel
   - Tab shows with the filename

2. **Viewer Features**:
   - **View Mode**: Read-only diagram viewing with zoom and navigation
   - **Edit Mode**: Toggle to edit mode for direct editing
   - **External Editor**: "Edit in draw.io" button opens app.diagrams.net
   - **Download**: Download the diagram file
   - **Fullscreen**: Expand to fullscreen view
   - **Refresh**: Reload the diagram content

3. **File Compatibility**:
   - `.drawio` files - Native draw.io format
   - `.xml` files containing "drawio" in filename - Also recognized
   - Works with both S3 URLs and local file paths

### 🔗 **Integration Points**

This seamlessly integrates with:

1. **Existing File System**: Works with file tree, tabs, and panel management
2. **DrawioViewer Component**: Full-featured viewer with all capabilities
3. **File Upload System**: Recognizes files created via left panel or uploaded
4. **Tab Management**: Standard tab operations (close, switch, reorder)

### 🎨 **Visual Integration**

- **Tab Label**: Shows filename (e.g., "Project Flow.drawio")
- **Panel Content**: Full DrawioViewer with toolbar and controls
- **Responsive Design**: Adapts to panel size and screen dimensions
- **Theme Consistency**: Matches existing UI theme and styling

### 🚀 **Workflow Example**

1. **Create Diagram**: Use left panel "Add New" → "Draw.io Diagram"
2. **Enter Name**: Type "System Architecture" 
3. **File Created**: "System Architecture.drawio" appears in file tree with Network icon
4. **Open for Viewing**: Click the file in left panel
5. **Tab Opens**: New tab opens in middle panel showing DrawioViewer
6. **Full Interaction**: View, edit, download, or open in external editor

### 🛠 **Technical Details**

#### File URL Resolution:
```typescript
const fileUrl = file.s3_url || file.path;
```
- Prefers S3 URL for cloud-hosted files
- Falls back to local path for development/local files

#### Component Configuration:
```typescript
<DrawioViewer
  fileUrl={fileUrl}        // File location
  fileName={file.name}     // Display name
  isEmbedded={false}       // Full features enabled
/>
```

#### Type Safety:
- Full TypeScript integration
- Proper interface definitions
- Error handling for invalid files

### 🧪 **Testing Workflow**

1. Create a draw.io file via left panel
2. Verify file appears with Network icon
3. Click the file
4. Confirm new tab opens in middle panel
5. Test all viewer features (view/edit modes, fullscreen, download)
6. Verify external editor opens correctly

This completes the full integration of draw.io files into the workspace environment, providing a seamless experience from file creation through viewing and editing!
