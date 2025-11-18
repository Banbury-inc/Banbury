# Middle Panel Storybook - Track Changes Fix

## Issue

The DocumentViewer stories were not showing red/green highlighting for pending AI changes. The stories were dispatching operations that directly modified the content instead of creating diff markup with track changes.

## Root Cause

The document editor uses custom Tiptap extensions (`Insertion` and `Deletion`) to display track changes:
- `Insertion` - Shows added text with green background (`diff-insertion` class)
- `Deletion` - Shows removed text with red background and strikethrough (`diff-deletion` class)

However, the stories were using operation-based events that directly apply changes instead of creating diff HTML.

## Solution

Updated the DocumentViewer stories to properly simulate preview mode with track changes:

### 1. Added Required Imports

```typescript
import { createStructuredHtmlDiff } from '../../../src/utils/htmlDiff'
import '../../../src/styles/DiffPreview.css'
```

### 2. Changed Event Dispatch Pattern

**Before (incorrect):**
```typescript
window.dispatchEvent(new CustomEvent('document-ai-response', {
  detail: {
    operations: [
      { type: 'replaceText', target: '25%', replacement: '30%' }
    ]
  }
}))
```

**After (correct):**
```typescript
const originalContent = BASIC_DOCUMENT_HTML
const newContent = `<h1>Modified content...</h1>`
const diffHtml = createStructuredHtmlDiff(originalContent, newContent)

window.dispatchEvent(new CustomEvent('document-ai-response', {
  detail: {
    htmlContent: diffHtml  // Contains insertion/deletion markup
  }
}))
```

### 3. Updated Story Names

Made it clearer which stories show preview mode:
- ✨ Document With Pending AI Changes **(Preview Mode)**
- 🔄 Document With Multiple AI Suggestions **(Preview)**
- ➕ Preview: Text Insertions **(Green Highlighting)**
- 🗑️ Preview: Text Deletions **(Red Highlighting)**

## How It Works

### The `createStructuredHtmlDiff()` Function

Located in `src/utils/htmlDiff.ts`, this function:

1. Compares two HTML strings (original vs. new)
2. Uses the `diff` library to compute word-level differences
3. Wraps changes in special spans:
   - `<span class="diff-insertion" data-diff="insertion">added text</span>`
   - `<span class="diff-deletion" data-diff="deletion">removed text</span>`
4. Preserves document structure (paragraphs, headings, lists)

### The TrackChanges Extensions

Located in `src/extensions/TrackChanges.ts`:

```typescript
export const Insertion = Mark.create({
  name: 'insertion',
  // Renders as: <span class="diff-insertion" data-diff="insertion">
})

export const Deletion = Mark.create({
  name: 'deletion',
  // Renders as: <span class="diff-deletion" data-diff="deletion">
})
```

These are registered in the AITiptapEditor component.

### The CSS Styling

Located in `src/styles/DiffPreview.css`:

```css
.diff-insertion {
  background-color: #bbf7d0 !important; /* green-200 */
  padding: 2px 0;
  border-radius: 2px;
}

.diff-deletion {
  background-color: #fecaca !important; /* red-200 */
  text-decoration: line-through;
  padding: 2px 0;
  border-radius: 2px;
}
```

With dark mode support using rgba colors.

## Files Modified

1. `/stories/components/MiddlePanel/DocumentViewer.stories.tsx`
   - Added imports for `createStructuredHtmlDiff` and CSS
   - Updated "Pending AI Changes" stories to use diff HTML
   - Renamed stories to clarify preview mode

2. `/stories/components/MiddlePanel/README.md`
   - Updated documentation to explain preview mode
   - Added examples of using `createStructuredHtmlDiff`

3. `/MIDDLE_PANEL_STORYBOOK_IMPLEMENTATION.md`
   - Updated to document the track changes feature
   - Added explanation of preview vs applied modes

## Testing

Run Storybook and navigate to **MiddlePanel > DocumentViewer**:

```bash
npm run storybook
```

Check these stories:
- ✨ **Document With Pending AI Changes (Preview Mode)** - Shows mixed insertions and deletions
- ➕ **Preview: Text Insertions (Green Highlighting)** - Shows only additions
- 🗑️ **Preview: Text Deletions (Red Highlighting)** - Shows only deletions
- 🔄 **Document With Multiple AI Suggestions (Preview)** - Shows complex changes

You should see:
- **Green highlighted text** for additions (no strikethrough)
- **Red highlighted text with strikethrough** for deletions
- Both working together for replacements (delete old, insert new)

## Benefits

✅ **Accurate representation** of the production track changes feature  
✅ **Visual feedback** showing exactly what will change  
✅ **Better testing** of the accept/reject workflow  
✅ **Documentation** through visual examples  
✅ **Easier debugging** of diff-related issues  

## Related Files

- `/src/extensions/TrackChanges.ts` - Tiptap extensions for insertion/deletion
- `/src/utils/htmlDiff.ts` - Diff calculation and markup generation
- `/src/styles/DiffPreview.css` - Visual styling for track changes
- `/src/components/MiddlePanel/DocumentViewer/AITiptapEditor.tsx` - Editor with extensions
- `/src/components/RightPanel/handlers/handle-docx-ai-response.ts` - Production usage example

