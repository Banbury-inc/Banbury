import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { DocumentViewer } from '../../../src/components/MiddlePanel/DocumentViewer/DocumentViewer'
import { TiptapAIProvider } from '../../../src/contexts/TiptapAIContext'
import { TooltipProvider } from '../../../src/components/ui/tooltip'
import { ApiService } from '../../../src/services/apiService'
import { DriveService } from '../../../src/services/driveService'
import { createStructuredHtmlDiff } from '../../../src/utils/htmlDiff'
import { mockDownloadS3File, mockUpdateS3File } from '../../mocks/api-service-mock'
import { mockExportDocAsDocx, mockUpdateFile } from '../../mocks/drive-service-mock'
import {
  MOCK_DOCUMENT_FILE,
  MOCK_EMPTY_DOCUMENT_FILE,
  MOCK_GOOGLE_DOC_FILE,
  BASIC_DOCUMENT_HTML
} from '../../mocks/file-fixtures'
import '../../../src/styles/DiffPreview.css'

function DocumentViewerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <TiptapAIProvider>
        <div className="h-screen w-full bg-background">
          {children}
        </div>
      </TiptapAIProvider>
    </TooltipProvider>
  )
}

const meta: Meta<typeof DocumentViewer> = {
  title: 'MiddlePanel/DocumentViewer',
  component: DocumentViewer,
  decorators: [
    (Story: React.ComponentType) => {
      // Mock API services before component renders
      useEffect(() => {
        const originalDownloadS3File = ApiService.downloadS3File
        const originalDownloadFromS3 = ApiService.downloadFromS3
        const originalUpdateS3File = ApiService.updateS3File
        const originalExportDocAsDocx = DriveService.exportDocAsDocx
        const originalUpdateFile = DriveService.updateFile

        // Override with mocks
        ApiService.downloadS3File = mockDownloadS3File as any
        ApiService.downloadFromS3 = mockDownloadS3File as any
        ApiService.updateS3File = mockUpdateS3File as any
        DriveService.exportDocAsDocx = mockExportDocAsDocx as any
        DriveService.updateFile = mockUpdateFile as any

        return () => {
          // Restore originals on cleanup
          ApiService.downloadS3File = originalDownloadS3File
          ApiService.downloadFromS3 = originalDownloadFromS3
          ApiService.updateS3File = originalUpdateS3File
          DriveService.exportDocAsDocx = originalExportDocAsDocx
          DriveService.updateFile = originalUpdateFile
        }
      }, [])

      return (
        <DocumentViewerWrapper>
          <Story />
        </DocumentViewerWrapper>
      )
    }
  ],
  args: {
    userInfo: {
      username: 'testuser',
      email: 'test@example.com'
    },
    onSaveComplete: () => console.log('Save completed')
  },
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
}

export default meta

type Story = StoryObj<typeof DocumentViewer>

export const EmptyDocument: Story = {
  name: '📄 Empty Document',
  args: {
    file: MOCK_EMPTY_DOCUMENT_FILE
  }
}

export const DocumentWithContent: Story = {
  name: '📝 Document With Content (No Changes)',
  args: {
    file: MOCK_DOCUMENT_FILE
  }
}

export const DocumentWithPendingAIChanges: Story = {
  name: '✨ Document With Pending AI Changes (Preview Mode)',
  args: {
    file: MOCK_DOCUMENT_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        // Wait for component to mount and load
        const timer = setTimeout(() => {
          // Create the "new" content with changes applied
          const originalContent = BASIC_DOCUMENT_HTML
          const newContent = `<h1>Project Proposal - Final</h1>
<p>This document outlines the key objectives and milestones for the upcoming project.</p>
<h2>Overview</h2>
<p>The project aims to improve customer satisfaction and streamline operations.</p>
<h2>Objectives</h2>
<ul>
  <li>Increase efficiency by 30%</li>
  <li>Reduce costs by 15%</li>
  <li>Improve customer satisfaction scores</li>
</ul>
<h2>Timeline</h2>
<p>The project is scheduled to begin in Q1 2024 and complete by Q3 2024.</p>
<h2>Budget</h2>
<p>Total budget: $500,000 allocated across all phases.</p>`

          // Create diff HTML with red/green highlighting
          const diffHtml = createStructuredHtmlDiff(originalContent, newContent)
          
          // Dispatch AI response event with diff HTML
          window.dispatchEvent(
            new CustomEvent('document-ai-response', {
              detail: {
                htmlContent: diffHtml
              }
            })
          )
        }, 1500)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const DocumentWithAcceptedChanges: Story = {
  name: '✅ Document With Accepted Changes',
  args: {
    file: {
      ...MOCK_DOCUMENT_FILE,
      file_id: 'doc-accepted',
      name: 'Project_Proposal_Final.docx'
    }
  }
}

export const DocumentWithMultipleAISuggestions: Story = {
  name: '🔄 Document With Multiple AI Suggestions (Preview)',
  args: {
    file: MOCK_DOCUMENT_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          const originalContent = BASIC_DOCUMENT_HTML
          const newContent = `<h1>Project Proposal</h1>
<p>This comprehensive document outlines the key objectives and milestones for the upcoming strategic initiative.</p>
<h2>Overview</h2>
<p>The project aims to significantly improve customer satisfaction and streamline operational processes.</p>
<h2>Objectives</h2>
<p>These objectives align with our company-wide strategic goals:</p>
<ul>
  <li>Increase operational efficiency by 30%</li>
  <li>Reduce operational costs by 20%</li>
  <li>Improve customer satisfaction scores</li>
  <li>Implement new automation tools</li>
</ul>
<h2>Timeline</h2>
<p>The project is scheduled to begin in Q1 2024 and complete by Q3 2024.</p>`

          const diffHtml = createStructuredHtmlDiff(originalContent, newContent)
          
          window.dispatchEvent(
            new CustomEvent('document-ai-response', {
              detail: {
                htmlContent: diffHtml
              }
            })
          )
        }, 1500)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const GoogleDocument: Story = {
  name: '☁️ Google Document',
  args: {
    file: MOCK_GOOGLE_DOC_FILE
  }
}

export const DocumentWithContentReplacement: Story = {
  name: '🔄 Full Content Replacement',
  args: {
    file: MOCK_DOCUMENT_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('document-ai-response', {
              detail: {
                htmlContent: '<h1>Completely New Content</h1><p>This is an entirely new document generated by AI.</p><ul><li>New point 1</li><li>New point 2</li><li>New point 3</li></ul>'
              }
            })
          )
        }, 1500)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const DocumentWithInsertOperations: Story = {
  name: '➕ Preview: Text Insertions (Green Highlighting)',
  args: {
    file: MOCK_DOCUMENT_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          const originalContent = BASIC_DOCUMENT_HTML
          const newContent = `<h1>Project Proposal</h1>
<p><em>Last updated: January 2024</em></p>
<p>This document outlines the key objectives and milestones for the upcoming project.</p>
<h2>Overview</h2>
<p>The project aims to improve customer satisfaction and streamline operations.</p>
<h2>Objectives</h2>
<ul>
  <li>Increase efficiency by 25%</li>
  <li>Reduce costs by 15%</li>
  <li>Improve customer satisfaction scores</li>
</ul>
<h2>Timeline</h2>
<p>The project is scheduled to begin in Q1 2024 and complete by Q3 2024.</p>
<h3>Phase 1: Planning</h3>
<p>Detailed planning phase with stakeholder engagement.</p>
<h3>Phase 2: Implementation</h3>
<p>Core implementation across all departments.</p>`

          const diffHtml = createStructuredHtmlDiff(originalContent, newContent)
          
          window.dispatchEvent(
            new CustomEvent('document-ai-response', {
              detail: {
                htmlContent: diffHtml
              }
            })
          )
        }, 1500)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const DocumentWithDeleteOperations: Story = {
  name: '🗑️ Preview: Text Deletions (Red Highlighting)',
  args: {
    file: MOCK_DOCUMENT_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          const originalContent = BASIC_DOCUMENT_HTML
          const newContent = `<h1>Project Proposal</h1>
<p>This document outlines the key objectives for the project.</p>
<h2>Overview</h2>
<p>The project aims to improve customer satisfaction.</p>
<h2>Objectives</h2>
<ul>
  <li>Increase efficiency</li>
  <li>Reduce costs</li>
</ul>
<h2>Timeline</h2>
<p>The project is scheduled to begin in Q1 2024.</p>`

          const diffHtml = createStructuredHtmlDiff(originalContent, newContent)
          
          window.dispatchEvent(
            new CustomEvent('document-ai-response', {
              detail: {
                htmlContent: diffHtml
              }
            })
          )
        }, 1500)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

