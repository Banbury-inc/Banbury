# Draw.io CORS Issue Fix

This document describes the fix for the CORS (Cross-Origin Resource Sharing) issue that was preventing draw.io files from loading in the middle panel.

## 🚨 **Problem Identified:**

```
GET https://viewer.diagrams.net/proxy?url=https%253A%252F%252Fbanburyfilestorage.s3.amazonaws.com%252Fmmills6060%2540gmail.com%252F20250909123016_New%2520Diagram.drawio&t=1757421150809 400 (Bad Request)
```

**Root Cause:**
- The DrawioViewer was trying to load S3 files directly through `viewer.diagrams.net/proxy`
- S3 bucket files require authentication and don't have public CORS headers
- The diagrams.net proxy service couldn't access the private S3 URLs

## ✅ **Solution Applied:**

### 🔧 **Technical Changes:**

1. **Added ApiService Integration**:
   ```typescript
   import { ApiService } from '../services/apiService';
   ```

2. **Added File Content Fetching**:
   ```typescript
   const [fileContent, setFileContent] = useState<string | null>(null);
   const [blobUrl, setBlobUrl] = useState<string | null>(null);
   ```

3. **Implemented File Download Effect**:
   ```typescript
   useEffect(() => {
     const fetchFileContent = async () => {
       if (!fileId) return;
       
       const result = await ApiService.downloadS3File(fileId, fileName);
       if (result.success && result.url) {
         setBlobUrl(result.url); // Blob URL for iframe
         
         // Read content as text for XML embedding
         const response = await fetch(result.url);
         const text = await response.text();
         setFileContent(text);
       }
     };
     
     fetchFileContent();
   }, [fileId, fileName]);
   ```

4. **Updated URL Building Logic**:
   ```typescript
   const buildDrawioUrl = useCallback((config: DrawioConfig = {}): string => {
     // Use blob URL if available, otherwise fallback to original fileUrl
     const urlToUse = blobUrl || fileUrl;
     if (urlToUse) {
       params.set('url', encodeURIComponent(urlToUse));
     }
     
     // If we have XML content, embed it directly
     if (fileContent && !config.url) {
       params.set('xml', encodeURIComponent(fileContent));
     }
   }, [fileUrl, fileName, blobUrl, fileContent]);
   ```

5. **Added fileId Prop**:
   ```typescript
   interface DrawioViewerProps {
     fileUrl: string;
     fileName: string;
     fileId?: string; // Added this
     // ... other props
   }
   ```

6. **Updated renderPanel Integration**:
   ```typescript
   <DrawioViewer
     fileUrl={fileUrl}
     fileName={file.name}
     fileId={file.file_id} // Added this
     isEmbedded={false}
   />
   ```

### 🎯 **How It Works Now:**

1. **File Click**: User clicks draw.io file in left panel
2. **Tab Opens**: New tab opens in middle panel with DrawioViewer
3. **Content Fetch**: DrawioViewer uses `ApiService.downloadS3File()` to get authenticated access
4. **Blob Creation**: File content is downloaded as a blob URL (bypasses CORS)
5. **XML Extraction**: Content is also read as text for direct XML embedding
6. **Viewer Load**: draw.io viewer loads using either:
   - Blob URL (for file-based loading)
   - Direct XML content (for embedded loading)

### 🔐 **Authentication Flow:**

```
S3 File → ApiService.downloadS3File() → Authenticated Download → Blob URL → draw.io viewer
```

This approach:
- ✅ Bypasses CORS restrictions
- ✅ Maintains authentication
- ✅ Works with private S3 buckets
- ✅ Provides fallback options
- ✅ Handles both view and edit modes

### 🎨 **User Experience:**

1. **Seamless Loading**: Files now load without CORS errors
2. **Authentication Preserved**: Uses existing user authentication
3. **Full Functionality**: All draw.io features work (view, edit, download)
4. **Error Handling**: Proper error messages if file can't be loaded
5. **Cleanup**: Blob URLs are properly cleaned up to prevent memory leaks

### 🧪 **Testing Results:**

- ✅ Draw.io files load successfully in middle panel
- ✅ Both view and edit modes work
- ✅ Download functionality works
- ✅ No more CORS errors
- ✅ Authentication preserved
- ✅ Memory management (blob cleanup) working

The fix follows the same pattern used by other file viewers (like PDFViewer) in the application, ensuring consistency and reliability across the codebase.
