# TldrawViewer onSaveComplete Prop Fix

## 🚨 **Error:**
```
Unhandled Runtime Error
ReferenceError: onSaveComplete is not defined
Source: src/components/TldrawViewer.tsx (148:15) @ onSaveComplete
```

## 🔍 **Root Cause:**
The `onSaveComplete` callback was being used in the `handleSave` function's dependency array but was not defined as a prop in the component interface.

## 🔧 **Fix Applied:**

### **1. Added to Interface:**
```typescript
interface TldrawViewerProps {
  fileUrl: string;
  fileName: string;
  fileId?: string;
  isEmbedded?: boolean;
  onSaveComplete?: () => void; // ✅ Added this line
  className?: string;
}
```

### **2. Added to Component Props:**
```typescript
export const TldrawViewer: React.FC<TldrawViewerProps> = ({
  fileUrl,
  fileName,
  fileId,
  isEmbedded = false,
  onSaveComplete, // ✅ Added this line
  className
}) => {
```

## ✅ **Result:**
- The `onSaveComplete` prop is now properly typed and accessible
- The component can accept an optional callback for save completion
- The dependency array in `handleSave` now correctly references the prop
- No more runtime errors when the component is used

## 🎯 **Usage:**
```typescript
// Optional usage with callback
<TldrawViewer
  fileUrl={fileUrl}
  fileName={fileName}
  fileId={fileId}
  onSaveComplete={() => console.log('Saved!')}
/>

// Works without callback too
<TldrawViewer
  fileUrl={fileUrl}
  fileName={fileName}
  fileId={fileId}
/>
```

The TldrawViewer component is now properly typed and error-free! 🎨✨
