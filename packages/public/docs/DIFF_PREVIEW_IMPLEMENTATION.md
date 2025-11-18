# Custom Diff Preview Implementation

## Overview
This is a completely custom implementation of diff/track changes functionality for the Tiptap document editor. **It does not rely on any paid Tiptap features** and uses only open-source tools and custom code.

## Components

### 1. Custom Tiptap Extensions (`/src/extensions/TrackChanges.ts`)
- **Insertion Mark**: Custom mark for highlighting added text
  - Renders as `<span class="diff-insertion" data-diff="insertion">`
  - Green background color (#bbf7d0)
  - Parses both `<ins>` tags and our custom spans
  
- **Deletion Mark**: Custom mark for highlighting deleted text
  - Renders as `<span class="diff-deletion" data-diff="deletion">`
  - Red background with strikethrough (#fecaca)
  - Parses both `<del>` tags and our custom spans

### 2. HTML Diff Utility (`/src/utils/htmlDiff.ts`)
Custom diff algorithm using the open-source `diff` package:

- **`createHtmlDiff()`**: Basic word-level diff
- **`createStructuredHtmlDiff()`**: Advanced diff that preserves document structure AND formatting
  - Extracts elements with their HTML structure preserved (h1, h2, p, etc.)
  - Performs element-by-element comparison
  - **Preserves block-level formatting** (headers show as headers with diff highlights)
  - **Preserves inline formatting** (bold, italic, underline, code, etc.)
  - Shows word-level changes within modified elements
  - Handles added/removed elements
  - Intelligently decides when to show side-by-side vs. inline changes

### 3. Custom CSS Styling (`/src/styles/DiffPreview.css`)
Visual styling for diff highlighting:
- Green background for insertions
- Red background with strikethrough for deletions
- Dark mode support
- Works with both custom spans and standard HTML tags
- **Formatting preservation rules**:
  - Headers (h1-h6) maintain their size and weight even with diff highlights
  - Bold, italic, underline, and code formatting show through diff marks
  - List structure preserved within diff marks
  - Ensures all formatting is visible while showing changes

### 4. Preview Mode State Management (`/src/contexts/TiptapAIContext.tsx`)
Added preview mode functionality:
- `previewMode`: Boolean flag
- `previewContent`: Stores original and new content
- `acceptPreview()`: Applies changes
- `rejectPreview()`: Restores original content

### 5. Enhanced DocxAITool (`/src/components/DocxAITool.tsx`)
User interface with three actions:
- **"Preview in document"**: Shows diff directly in editor
- **"Show/Hide details"**: Toggle technical details
- **"Accept all"**: Apply changes
- **"Reject"**: Dismiss and restore original

### 6. Smart Handler (`/src/components/RightPanel/handlers/handle-docx-ai-response.ts`)
Handles preview and apply modes:
- Detects `preview: true` flag in payload
- Stores original content when previewing
- Generates diff HTML and displays it
- Restores content on rejection
- Shows contextual notifications

## How It Works

### Preview Flow:
1. AI suggests changes → "Changes suggested" card appears
2. User clicks "Preview in document"
3. Handler receives payload with `preview: true`
4. Original content is stored
5. Diff is generated using `createStructuredHtmlDiff()`
6. Diff HTML is displayed in editor with:
   - 🟢 Green highlights for additions
   - 🔴 Red highlights with strikethrough for deletions
7. User reviews changes in context
8. User clicks "Accept all" or "Reject"

### Apply Flow:
1. User clicks "Accept all"
2. Handler receives payload with `preview: false`
3. Clean HTML is applied to editor
4. Success message shown

### Reject Flow:
1. User clicks "Reject"
2. Event `docx-ai-response-reject` is dispatched
3. Handler restores original content
4. Info message shown

## Key Features

✅ **100% Open Source**: No paid Tiptap features required
✅ **Custom Extensions**: Built with Tiptap's free extension API
✅ **Word-Level Diffing**: Uses open-source `diff` package
✅ **Structure Preservation**: Maintains paragraphs and all formatting
✅ **Format-Aware Diffs**: Headers, bold, italic, etc. display correctly in diff view
✅ **Visual Feedback**: Clear color-coded highlights that work with formatting
✅ **Undo Support**: Original content can always be restored
✅ **Dark Mode**: Proper styling for both light and dark themes
✅ **Smart Diffing**: Detects formatting changes and handles them intelligently

## Dependencies
- `diff` (^5.x.x): Open-source text diffing library
- Tiptap core: Open-source editor framework

## Technical Notes

### Why Custom Marks?
Tiptap's track changes feature is paid-only. We created our own marks using the free extension API that anyone can use.

### Diff Algorithm
We use the `diff` package's `diffWords()` function which:
- Splits text into words (not characters)
- Identifies added, removed, and unchanged segments
- Works efficiently even with large documents

### HTML Safety
All text is properly escaped using `escapeHtml()` to prevent XSS vulnerabilities.

## Future Enhancements
- Character-level diffing for small changes
- Side-by-side comparison view
- Individual change acceptance/rejection
- Change tracking with author information
- Timestamp tracking for changes

