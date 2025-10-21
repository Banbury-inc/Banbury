# Draw.io CSP (Content Security Policy) Fix

This document describes the fix for the Content Security Policy issue that was preventing the draw.io editor from loading in iframes.

## 🚨 **Problem Identified:**

```
Refused to frame 'https://app.diagrams.net/' because an ancestor violates the following Content Security Policy directive: "frame-ancestors 'self' https://teams.microsoft.com https://*.cloud.microsoft".
```

**Root Cause:**
- `app.diagrams.net` (editor) has strict CSP `frame-ancestors` policy
- It only allows embedding from specific Microsoft domains
- Our application domain is not in the allowlist
- `viewer.diagrams.net` works in iframes, but `app.diagrams.net` doesn't

## ✅ **Solution Applied:**

### 🔧 **Strategy Change:**

Instead of trying to embed the editor in an iframe, we now:
1. **Viewer in iframe**: Use `viewer.diagrams.net` for read-only viewing
2. **Editor in new tab**: Open `app.diagrams.net` in a new browser tab for editing

### 📝 **Code Changes:**

1. **Removed Edit Mode State**:
   ```typescript
   // Removed: const [isEditMode, setIsEditMode] = useState(false);
   // Now always in view mode within iframe
   ```

2. **Updated Toggle Function**:
   ```typescript
   // OLD: Toggle between view/edit modes in iframe
   const toggleMode = () => setIsEditMode(!isEditMode);

   // NEW: Open editor in new tab
   const openEditor = useCallback(() => {
     window.open(buildEditUrl(), '_blank');
   }, [buildEditUrl]);
   ```

3. **Simplified Iframe URL**:
   ```typescript
   // OLD: Switch between viewer and editor URLs
   const iframeUrl = isEditMode ? buildEditUrl() : buildDrawioUrl({ editable: false });

   // NEW: Always use viewer URL
   const iframeUrl = buildDrawioUrl({ editable: false });
   ```

4. **Updated UI Labels**:
   ```typescript
   // Always show "View Mode" badge
   <Badge variant="secondary">View Mode</Badge>

   // Updated button tooltip
   <Button title="Open in draw.io editor (new tab)">
     <Edit3 className="h-4 w-4" />
   </Button>
   ```

### 🎯 **How It Works Now:**

1. **Viewing**: 
   - Draw.io files display in iframe using `viewer.diagrams.net`
   - XML content embedded directly (no CORS issues)
   - Full viewing features (zoom, navigate, etc.)

2. **Editing**:
   - Click edit button opens `app.diagrams.net` in new browser tab
   - XML content passed as parameter for editing
   - User can edit and save in the new tab
   - Downloads/saves work normally in the external editor

### 🔗 **URL Examples:**

**Viewer (iframe):**
```
https://viewer.diagrams.net/?highlight=0000ff&edit=_blank&layers=1&nav=1&title=diagram.drawio&xml=[ENCODED_XML]
```

**Editor (new tab):**
```
https://app.diagrams.net/?xml=[ENCODED_XML]&title=diagram.drawio
```

### 🎨 **User Experience:**

1. **Seamless Viewing**: 
   - Files open immediately in middle panel
   - No CSP errors or loading issues
   - Full navigation and zoom controls

2. **External Editing**:
   - Edit button opens professional draw.io editor
   - Full editing capabilities in dedicated tab
   - User can save changes and download
   - Familiar draw.io interface

3. **Clear UI**:
   - "View Mode" badge indicates current state
   - Edit button clearly labeled as opening new tab
   - No confusing mode switches

### 🛡️ **Security Benefits:**

- ✅ **Respects CSP policies** - No iframe violations
- ✅ **Secure content delivery** - XML embedded directly
- ✅ **Proper authentication** - Uses existing API service
- ✅ **No CORS issues** - Content fetched securely

### 🧪 **Testing Results:**

- ✅ **No CSP errors** - Iframe loads successfully
- ✅ **Viewing works** - Diagrams display properly
- ✅ **Editing works** - Opens in new tab without issues
- ✅ **Download works** - File downloads function properly
- ✅ **All features preserved** - Nothing lost in transition

### 📋 **Advantages of This Approach:**

1. **Reliability**: No CSP conflicts or iframe restrictions
2. **Performance**: Faster loading with direct XML embedding
3. **User Experience**: Professional editing environment in dedicated tab
4. **Maintainability**: Simpler codebase without mode switching
5. **Future-proof**: Works regardless of CSP policy changes

This solution provides the best of both worlds - seamless viewing integrated into the application and full-featured editing in the professional draw.io environment!
