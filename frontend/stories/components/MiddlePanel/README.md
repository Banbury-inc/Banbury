# Middle Panel Storybook Stories

This directory contains Storybook stories for the Middle Panel components, specifically the DocumentViewer and SpreadsheetViewer.

## Overview

These stories showcase different scenarios for viewing and editing documents and spreadsheets, including AI-suggested changes in various states (preview, accepted, rejected).

## Components

### DocumentViewer Stories

Located in `DocumentViewer.stories.tsx`, these stories demonstrate:

- **Empty Document** - A fresh, blank document
- **Document With Content (No Changes)** - Document with initial content, no pending AI edits
- **Document With Pending AI Changes** - Shows AI suggestions that can be accepted/rejected
- **Document With Accepted Changes** - Document after AI changes have been applied
- **Multiple AI Suggestions** - Multiple simultaneous AI suggestions
- **Full Content Replacement** - Complete document rewrite by AI
- **Insert/Delete Operations** - Various text manipulation operations
- **Google Document** - Document loaded from Google Drive

### SpreadsheetViewer Stories

Located in `SpreadsheetViewer.stories.tsx`, these stories demonstrate:

- **Empty Spreadsheet** - A blank spreadsheet with minimal data
- **Spreadsheet With Data (No Changes)** - Spreadsheet with sample data, no pending changes
- **Spreadsheet With Pending AI Changes** - Shows highlighted cells with AI suggestions (preview mode)
- **Spreadsheet With Accepted Changes** - Spreadsheet after AI changes applied (no highlights)
- **Formula Changes** - AI suggesting formula updates
- **Multiple Operations** - Insert rows, update cells, delete columns
- **Range Update** - Updating a range of cells at once
- **CSV Replacement** - Complete spreadsheet data replacement
- **Google Spreadsheet** - Spreadsheet loaded from Google Drive

## How It Works

### Mock Services

All stories use mock API and Drive services to simulate backend responses without making real network calls. The mocks are located in `stories/mocks/`:

- `api-service-mock.ts` - Mocks ApiService methods for S3 file operations
- `drive-service-mock.ts` - Mocks DriveService methods for Google Drive operations
- `file-fixtures.ts` - Contains sample file data and content

### AI Change Events

The stories simulate AI suggestions using custom events:

#### Document AI Events

For **preview mode** (showing red/green track changes):

```typescript
import { createStructuredHtmlDiff } from '../../../src/utils/htmlDiff'

const originalContent = '<p>Original text</p>'
const newContent = '<p>Modified text with changes</p>'
const diffHtml = createStructuredHtmlDiff(originalContent, newContent)

window.dispatchEvent(new CustomEvent('document-ai-response', {
  detail: {
    htmlContent: diffHtml  // Contains insertion/deletion markup
  }
}))
```

This creates HTML with:
- `<span class="diff-insertion">` for additions (green background)
- `<span class="diff-deletion">` for deletions (red background, strikethrough)

For **direct application** (no preview):

```typescript
window.dispatchEvent(new CustomEvent('document-ai-response', {
  detail: {
    htmlContent: string,  // Full HTML content replacement
    operations: [         // Or individual operations
      { type: 'replaceText', target: string, replacement: string },
      { type: 'insertAfterText', target: string, html: string },
      { type: 'insertBeforeText', target: string, html: string },
      { type: 'deleteText', target: string, all: boolean }
    ]
  }
}))
```

#### Spreadsheet AI Events

```typescript
window.dispatchEvent(new CustomEvent('sheet-ai-response', {
  detail: {
    preview: true,  // true = highlight changes, false = apply directly
    operations: [
      { type: 'setCell', row: number, col: number, value: any },
      { type: 'setRange', range: {...}, values: [[...]] },
      { type: 'insertRows', index: number, count: number },
      { type: 'deleteRows', index: number, count: number },
      { type: 'insertCols', index: number, count: number },
      { type: 'deleteCols', index: number, count: number }
    ],
    csvContent: string  // Or complete CSV replacement
  }
}))
```

### Preview vs Applied Changes

**For Documents:**
- **Preview Mode**: Uses `createStructuredHtmlDiff()` to show track changes with:
  - Green highlighting (`diff-insertion` class) for added text
  - Red highlighting with strikethrough (`diff-deletion` class) for removed text
  - Similar to Microsoft Word's track changes feature
- **Applied Mode**: Changes are directly applied without markup
- This demonstrates the accept/reject workflow before final application

**For Spreadsheets:**
- **Preview Mode** (`preview: true`): Changed cells are highlighted in yellow
- **Applied Mode** (`preview: false`): Changes are applied without highlighting
- This demonstrates the accept/reject workflow

## Running the Stories

1. Start Storybook:
   ```bash
   npm run storybook
   ```

2. Navigate to:
   - **MiddlePanel > DocumentViewer** for document stories
   - **MiddlePanel > SpreadsheetViewer** for spreadsheet stories

3. Use the Controls panel to interact with story parameters

## Testing AI Interactions

The stories automatically trigger AI events after a delay (1.5-2 seconds) to simulate the AI assistant responding to user requests. Watch for:

- Highlighted changes in spreadsheets (yellow background)
- Updated content in documents
- Toast notifications on save operations

## Adding New Stories

To add a new story:

1. Import the necessary fixtures from `stories/mocks/`
2. Create a new story object with appropriate args
3. Add a decorator with `useEffect` to dispatch custom events if simulating AI changes
4. Use the mock services to provide data without backend calls

Example:

```typescript
export const MyNewStory: Story = {
  name: 'My New Scenario',
  args: {
    file: MOCK_DOCUMENT_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('document-ai-response', {
            detail: { /* your AI operations */ }
          }))
        }, 1500)
        return () => clearTimeout(timer)
      }, [])
      return <Story />
    }
  ]
}
```

## Notes

- Mock services automatically restore original implementations on cleanup
- All stories are wrapped with required providers (TooltipProvider, TiptapAIProvider)
- File loading is simulated with realistic delays (500-800ms)
- The stories use the same components as the production app, ensuring accurate representation

