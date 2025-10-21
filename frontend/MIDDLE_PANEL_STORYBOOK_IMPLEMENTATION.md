# Middle Panel Storybook Implementation

## Overview

This document describes the implementation of Storybook stories for the Middle Panel components (DocumentViewer and SpreadsheetViewer), showcasing different scenarios including AI-suggested changes in various states.

## What's Implemented

### ✨ **Mock Services and Fixtures**

Created a comprehensive mock system to simulate backend API calls without requiring a live server:

1. **File Fixtures** (`stories/mocks/file-fixtures.ts`)
   - Sample HTML content for documents (empty, basic, with changes, with accepted changes)
   - Sample CSV/spreadsheet data (empty, basic, with formulas)
   - Mock FileSystemItem objects for different file types
   - Helper functions to create blobs (HTML, DOCX, CSV, XLSX)

2. **API Service Mocks** (`stories/mocks/api-service-mock.ts`)
   - `mockDownloadS3File` - Returns mock document/spreadsheet data
   - `mockUpdateS3File` - Simulates saving files
   - Automatically determines file type and returns appropriate data
   - Realistic network delay simulation (500-800ms)

3. **Drive Service Mocks** (`stories/mocks/drive-service-mock.ts`)
   - `mockExportDocAsDocx` - Exports Google Docs as DOCX blobs
   - `mockExportSheetAsXlsx` - Exports Google Sheets as XLSX blobs
   - `mockUpdateFile` - Simulates updating Google Drive files

### 📄 **DocumentViewer Stories**

Location: `stories/components/MiddlePanel/DocumentViewer.stories.tsx`

**Stories Created:**

1. **Empty Document** - Fresh blank document
2. **Document With Content (No Changes)** - Document with initial content, no AI edits
3. **Document With Pending AI Changes** - Simulates AI suggestions using `document-ai-response` event
   - Replaces "DRAFT" with "Final"
   - Inserts budget section
   - Updates efficiency percentage
4. **Document With Accepted Changes** - Shows document after AI changes applied
5. **Multiple AI Suggestions** - Multiple simultaneous operations
6. **Full Content Replacement** - Complete document rewrite
7. **Insert Before/After Operations** - Text insertion operations
8. **Delete Text Operations** - Text removal operations
9. **Google Document** - Document from Google Drive

**AI Event Structure for Preview Mode (with red/green highlighting):**
```typescript
import { createStructuredHtmlDiff } from '../../../src/utils/htmlDiff'

const originalContent = '<p>Original document content</p>'
const newContent = '<p>Modified content with AI changes</p>'
const diffHtml = createStructuredHtmlDiff(originalContent, newContent)

window.dispatchEvent(new CustomEvent('document-ai-response', {
  detail: {
    htmlContent: diffHtml  // Contains <span class="diff-insertion"> and <span class="diff-deletion">
  }
}))
```

**AI Event Structure for Direct Application (no preview):**
```typescript
window.dispatchEvent(new CustomEvent('document-ai-response', {
  detail: {
    htmlContent: string,  // Full replacement
    operations: [         // Individual operations
      { type: 'replaceText', target, replacement, all?, caseSensitive? },
      { type: 'insertAfterText', target, html, occurrence? },
      { type: 'insertBeforeText', target, html, occurrence? },
      { type: 'deleteText', target, all?, caseSensitive? },
      { type: 'replaceBetween', from, to, html }
    ]
  }
}))
```

### 📊 **SpreadsheetViewer Stories**

Location: `stories/components/MiddlePanel/SpreadsheetViewer.stories.tsx`

**Stories Created:**

1. **Empty Spreadsheet** - Blank spreadsheet
2. **Spreadsheet With Data (No Changes)** - Spreadsheet with sample sales data
3. **Spreadsheet With Pending AI Changes** - Preview mode with highlighted cells
   - Updates multiple cell values
   - Shows yellow highlighting for changed cells
4. **Spreadsheet With Accepted Changes** - Changes applied without highlighting
5. **Formula Changes** - AI suggesting formula updates (AVERAGE functions)
6. **Multiple Operations** - Insert rows, update cells
7. **Range Update Operation** - Updates multiple cells at once
8. **Complete CSV Replacement** - Replaces entire spreadsheet data
9. **Google Spreadsheet** - Spreadsheet from Google Drive
10. **Column Operations** - Insert/delete columns with formulas

**AI Event Structure:**
```typescript
window.dispatchEvent(new CustomEvent('sheet-ai-response', {
  detail: {
    preview: boolean,  // true = highlight, false = apply
    operations: [
      { type: 'setCell', row, col, value },
      { type: 'setRange', range: {...}, values: [[...]] },
      { type: 'insertRows', index, count },
      { type: 'deleteRows', index, count },
      { type: 'insertCols', index, count },
      { type: 'deleteCols', index, count }
    ],
    csvContent: string  // Complete CSV replacement
  }
}))
```

## Key Features

### 🎯 **Preview vs Applied States**

**For Documents:**
- **Preview Mode**: Uses the `createStructuredHtmlDiff()` utility to create track changes markup:
  - **Green highlighting** (`diff-insertion` class): Shows added text with light green background
  - **Red highlighting with strikethrough** (`diff-deletion` class): Shows removed text with red background
  - Similar to Microsoft Word's "Track Changes" feature
  - Allows users to review changes before accepting/rejecting
- **Applied Mode**: Changes are directly applied without any markup
- CSS styling defined in `src/styles/DiffPreview.css`

**For Spreadsheets:**
- **Preview Mode** (`preview: true`): Changed cells are highlighted in yellow
- **Applied Mode** (`preview: false`): Changes are applied without highlighting
- This demonstrates the accept/reject workflow

### 🔄 **Realistic Workflow Simulation**

All stories include:
- Service method mocking using React decorators
- Automatic cleanup to restore original methods
- Realistic loading delays
- Proper provider wrapping (TooltipProvider, TiptapAIProvider)
- Console logging for debugging

### 🎨 **User-Friendly Story Names**

Stories use emoji prefixes for easy visual scanning:
- 📄 📝 = Document states
- 📊 📈 = Spreadsheet states
- ✨ = Pending AI changes
- ✅ = Accepted changes
- 🔄 = Multiple operations
- ☁️ = Google Drive files

## Technical Implementation

### Decorator Pattern

Each story uses a decorator to:
1. Mock API services before component mounts
2. Restore original services on cleanup
3. Wrap component with required providers
4. Dispatch AI events after appropriate delays

Example:
```typescript
decorators: [
  (Story: React.ComponentType) => {
    useEffect(() => {
      // Store originals
      const originalMethod = ApiService.downloadS3File
      
      // Apply mock
      ApiService.downloadS3File = mockDownloadS3File as any
      
      // Cleanup
      return () => {
        ApiService.downloadS3File = originalMethod
      }
    }, [])
    
    return <Wrapper><Story /></Wrapper>
  }
]
```

### Event Timing

AI events are dispatched after delays (1.5-2 seconds) to simulate:
1. Component mounting
2. Document/spreadsheet loading
3. AI processing time
4. Realistic user experience

### Type Safety

All mocks maintain the same type signatures as the real services:
- `ApiService.downloadS3File` returns `Promise<DownloadResult>`
- `DriveService.exportDocAsDocx` returns `Promise<Blob>`
- Full TypeScript support with proper interfaces

## File Structure

```
frontend/
├── stories/
│   ├── mocks/
│   │   ├── index.ts                    # Re-exports all mocks
│   │   ├── file-fixtures.ts            # Sample data and helpers
│   │   ├── api-service-mock.ts         # S3 API mocks
│   │   └── drive-service-mock.ts       # Drive API mocks
│   └── components/
│       └── MiddlePanel/
│           ├── README.md               # Documentation
│           ├── DocumentViewer.stories.tsx
│           └── SpreadsheetViewer.stories.tsx
```

## Usage

### Running Storybook

```bash
npm run storybook
```

Navigate to:
- **MiddlePanel > DocumentViewer** for document stories
- **MiddlePanel > SpreadsheetViewer** for spreadsheet stories

### Testing Scenarios

1. **No Changes**: View documents/spreadsheets with content but no AI edits
2. **Pending Changes**: See AI suggestions before acceptance (highlighted in spreadsheets)
3. **Accepted Changes**: View final state after AI changes applied
4. **Complex Operations**: Test multiple simultaneous changes

### Interactive Controls

Use Storybook's Controls panel to:
- Modify user info
- Trigger save callbacks
- Switch between different file objects

## Benefits

### For Development

- ✅ Test components without backend server
- ✅ Rapidly iterate on UI/UX
- ✅ Visual regression testing capability
- ✅ Debug AI integration without API calls
- ✅ Demonstrate features to stakeholders

### For Testing

- ✅ Consistent test data across environments
- ✅ Reproducible scenarios
- ✅ Edge case coverage
- ✅ No external dependencies
- ✅ Fast feedback loop

### For Documentation

- ✅ Living documentation of components
- ✅ Visual examples of all states
- ✅ Interactive exploration
- ✅ Onboarding new developers
- ✅ Feature demonstrations

## Future Enhancements

Possible additions:
- Interactive accept/reject buttons within stories
- Keyboard shortcuts for triggering AI events
- Side-by-side before/after comparisons
- Performance profiling stories
- Accessibility testing scenarios
- Mobile responsive views
- Error state stories
- Loading state variations

## Maintenance

When updating the real components:
1. Update corresponding stories to match new features
2. Add new mock data in `file-fixtures.ts` as needed
3. Update mock services if API signatures change
4. Keep README documentation synchronized

## Conclusion

This implementation provides a comprehensive Storybook setup for the Middle Panel components, enabling efficient development, testing, and demonstration of document and spreadsheet editing features, particularly the AI-assisted editing workflows with change tracking and preview capabilities.

