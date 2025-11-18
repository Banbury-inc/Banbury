# Draw.io Embedded Editor Implementation

This document describes the implementation of the embedded draw.io editor directly in the middle panel, eliminating the need for external navigation.

## 🎯 **Solution Overview:**

Instead of using `app.diagrams.net` (which has CSP restrictions), we now use `embed.diagrams.net` which is specifically designed for iframe embedding without CSP issues.

## 🔧 **Technical Implementation:**

### 1. **Dual Mode System:**
```typescript
// Use viewer for view mode, embedded editor for edit mode
const iframeUrl = isEditMode 
  ? buildEditUrl()           // embed.diagrams.net for editing
  : buildDrawioUrl({ editable: false }); // viewer.diagrams.net for viewing
```

### 2. **Embedded Editor Configuration:**
```typescript
const buildEditUrl = useCallback((): string => {
  const baseUrl = 'https://embed.diagrams.net/';
  const params = new URLSearchParams();
  
  // Set embed-specific parameters
  params.set('embed', '1');        // Enable embed mode
  params.set('ui', 'atlas');       // Use atlas UI theme
  params.set('spin', '1');         // Show loading spinner
  params.set('proto', 'json');     // Use JSON for communication
  params.set('title', fileName);
  
  // Embed XML content directly
  if (fileContent) {
    params.set('xml', encodeURIComponent(fileContent));
  }
  
  return `${baseUrl}?${params.toString()}`;
}, [fileUrl, fileName, blobUrl, fileContent]);
```

### 3. **HTML5 Messaging API Integration:**
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    // Security: Only accept messages from draw.io domains
    if (!event.origin.includes('diagrams.net') && !event.origin.includes('draw.io')) {
      return;
    }

    const message = JSON.parse(event.data);
    
    switch (message.event) {
      case 'init':
        // Editor ready - send diagram data
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ action: 'load', xml: fileContent }), '*'
        );
        break;
      case 'save':
        // User clicked save - request export
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ action: 'export', format: 'xml' }), '*'
        );
        break;
      case 'export':
        // Receive updated diagram data
        const updatedContent = message.data;
        setFileContent(updatedContent);
        // TODO: Save to server
        break;
      case 'exit':
        // User wants to exit editor
        setIsEditMode(false);
        break;
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [fileContent, fileId]);
```

## 🎨 **User Experience:**

### **View Mode:**
- ✅ Read-only diagram viewing using `viewer.diagrams.net`
- ✅ Zoom, pan, and navigation controls
- ✅ Fast loading with direct XML embedding

### **Edit Mode:**
- ✅ Full draw.io editor embedded in middle panel
- ✅ Complete editing capabilities (shapes, text, connections, etc.)
- ✅ Professional draw.io interface within your app
- ✅ Two-way communication for loading and saving

### **Seamless Switching:**
```typescript
// Toggle between modes with single button click
const toggleMode = useCallback(() => {
  setIsEditMode(!isEditMode);
  setIsLoading(true);
}, [isEditMode]);
```

## 🔄 **Communication Flow:**

1. **Loading Diagram:**
   ```
   User clicks Edit → iframe loads embed.diagrams.net → 
   'init' message received → Send 'load' action with XML content
   ```

2. **Saving Changes:**
   ```
   User clicks Save in editor → 'save' message received → 
   Send 'export' action → Receive 'export' message with updated XML
   ```

3. **Exiting Editor:**
   ```
   User clicks Exit in editor → 'exit' message received → 
   Switch back to view mode
   ```

## 🛡️ **Security Features:**

- **Origin Validation**: Only accepts messages from trusted draw.io domains
- **Message Parsing**: Safe JSON parsing with error handling
- **Content Security**: Uses secure message passing instead of direct DOM access

## 📋 **UI Components:**

### **Mode Indicator:**
```typescript
<Badge variant={isEditMode ? 'default' : 'secondary'}>
  {isEditMode ? 'Edit Mode' : 'View Mode'}
</Badge>
```

### **Toggle Button:**
```typescript
<Button onClick={toggleMode} title={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}>
  {isEditMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
</Button>
```

## 🎯 **Key Advantages:**

1. **No External Navigation**: Users stay within your application
2. **No CSP Issues**: `embed.diagrams.net` is designed for embedding
3. **Full Functionality**: Complete draw.io editor features available
4. **Secure Communication**: Uses standard HTML5 messaging API
5. **Fast Performance**: Direct XML embedding, no URL fetching
6. **Professional UX**: Seamless mode switching with visual feedback

## 🧪 **Expected Behavior:**

1. **Click draw.io file** → Opens in view mode in middle panel
2. **Click edit button** → Switches to embedded editor in same panel
3. **Make changes** → Edit directly in professional draw.io interface
4. **Save changes** → Automatic handling via message API
5. **Exit editor** → Returns to view mode with updates

## 🔮 **Future Enhancements:**

- **Auto-save**: Implement periodic auto-saving during editing
- **Version History**: Track changes and allow version rollback
- **Collaborative Editing**: Multiple users editing simultaneously
- **Custom Toolbar**: Add application-specific tools to the editor

This implementation provides the best of both worlds: the familiarity and power of the full draw.io editor within the seamless experience of your application!
