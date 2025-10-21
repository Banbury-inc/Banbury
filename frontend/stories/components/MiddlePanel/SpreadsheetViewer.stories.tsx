import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SpreadsheetViewer } from '../../../src/components/MiddlePanel/SpreadsheetViewer/SpreadsheetViewer'
import { TooltipProvider } from '../../../src/components/ui/tooltip'
import { ApiService } from '../../../src/services/apiService'
import { DriveService } from '../../../src/services/driveService'
import { mockDownloadS3File, mockUpdateS3File } from '../../mocks/api-service-mock'
import { mockExportSheetAsXlsx, mockUpdateFile } from '../../mocks/drive-service-mock'
import {
  MOCK_SPREADSHEET_FILE,
  MOCK_EMPTY_SPREADSHEET_FILE,
  MOCK_GOOGLE_SHEET_FILE
} from '../../mocks/file-fixtures'

function SpreadsheetViewerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="h-screen w-full bg-background">
        {children}
      </div>
    </TooltipProvider>
  )
}

const meta: Meta<typeof SpreadsheetViewer> = {
  title: 'MiddlePanel/SpreadsheetViewer',
  component: SpreadsheetViewer,
  decorators: [
    (Story: React.ComponentType) => {
      // Mock API services before component renders
      useEffect(() => {
        const originalDownloadS3File = ApiService.downloadS3File
        const originalDownloadFromS3 = ApiService.downloadFromS3
        const originalUpdateS3File = ApiService.updateS3File
        const originalExportSheetAsXlsx = DriveService.exportSheetAsXlsx
        const originalUpdateFile = DriveService.updateFile

        // Override with mocks
        ApiService.downloadS3File = mockDownloadS3File as any
        ApiService.downloadFromS3 = mockDownloadS3File as any
        ApiService.updateS3File = mockUpdateS3File as any
        DriveService.exportSheetAsXlsx = mockExportSheetAsXlsx as any
        DriveService.updateFile = mockUpdateFile as any

        return () => {
          // Restore originals on cleanup
          ApiService.downloadS3File = originalDownloadS3File
          ApiService.downloadFromS3 = originalDownloadFromS3
          ApiService.updateS3File = originalUpdateS3File
          DriveService.exportSheetAsXlsx = originalExportSheetAsXlsx
          DriveService.updateFile = originalUpdateFile
        }
      }, [])

      return (
        <SpreadsheetViewerWrapper>
          <Story />
        </SpreadsheetViewerWrapper>
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

type Story = StoryObj<typeof SpreadsheetViewer>

export const EmptySpreadsheet: Story = {
  name: '📊 Empty Spreadsheet',
  args: {
    file: MOCK_EMPTY_SPREADSHEET_FILE
  }
}

export const SpreadsheetWithData: Story = {
  name: '📈 Spreadsheet With Data (No Changes)',
  args: {
    file: MOCK_SPREADSHEET_FILE
  }
}

export const SpreadsheetWithPendingAIChanges: Story = {
  name: '✨ Spreadsheet With Pending AI Changes (Preview)',
  args: {
    file: MOCK_SPREADSHEET_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        // Wait for component to mount and load
        const timer = setTimeout(() => {
          // Dispatch AI response event with preview mode enabled
          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: true, // This enables highlighting of changed cells
                operations: [
                  {
                    type: 'setCell',
                    row: 1,
                    col: 1,
                    value: 1600
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 2,
                    value: 1900
                  },
                  {
                    type: 'setCell',
                    row: 2,
                    col: 1,
                    value: 2400
                  },
                  {
                    type: 'setCell',
                    row: 5,
                    col: 0,
                    value: 'TOTAL'
                  }
                ]
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const SpreadsheetWithAcceptedChanges: Story = {
  name: '✅ Spreadsheet With Accepted Changes',
  args: {
    file: MOCK_SPREADSHEET_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          // Dispatch AI response event WITHOUT preview mode
          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: false, // Changes applied without highlighting
                operations: [
                  {
                    type: 'setCell',
                    row: 1,
                    col: 1,
                    value: 1600
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 2,
                    value: 1900
                  },
                  {
                    type: 'setCell',
                    row: 2,
                    col: 1,
                    value: 2400
                  }
                ]
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const SpreadsheetWithFormulaChanges: Story = {
  name: '🔢 Formula Changes (Preview)',
  args: {
    file: {
      ...MOCK_SPREADSHEET_FILE,
      file_id: 'sheet-formulas',
      name: 'Sales_With_Formulas.xlsx'
    }
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: true,
                operations: [
                  {
                    type: 'setCell',
                    row: 0,
                    col: 5,
                    value: 'Average'
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 6,
                    value: '=AVERAGE(B2:E2)'
                  },
                  {
                    type: 'setCell',
                    row: 2,
                    col: 6,
                    value: '=AVERAGE(B3:E3)'
                  },
                  {
                    type: 'setCell',
                    row: 3,
                    col: 6,
                    value: '=AVERAGE(B4:E4)'
                  }
                ]
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const SpreadsheetWithMultipleOperations: Story = {
  name: '🔄 Multiple Operations (Insert, Update, Delete)',
  args: {
    file: MOCK_SPREADSHEET_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: true,
                operations: [
                  {
                    type: 'insertRows',
                    index: 1,
                    count: 1
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 0,
                    value: 'Widget X'
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 1,
                    value: 1000
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 2,
                    value: 1200
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 3,
                    value: 1400
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 4,
                    value: 1600
                  }
                ]
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const SpreadsheetWithRangeUpdate: Story = {
  name: '📋 Range Update Operation',
  args: {
    file: MOCK_SPREADSHEET_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: true,
                operations: [
                  {
                    type: 'setRange',
                    range: {
                      startRow: 1,
                      startCol: 1,
                      endRow: 2,
                      endCol: 4
                    },
                    values: [
                      [2000, 2200, 2400, 2600],
                      [3000, 3200, 3400, 3600]
                    ]
                  }
                ]
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const SpreadsheetWithCSVReplacement: Story = {
  name: '📄 Complete CSV Replacement',
  args: {
    file: MOCK_SPREADSHEET_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          const csvContent = `Category,January,February,March,Total
Marketing,15000,16000,17000,48000
Operations,25000,26000,27000,78000
Research,10000,11000,12000,33000
Total,50000,53000,56000,159000`

          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: true,
                csvContent
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

export const GoogleSpreadsheet: Story = {
  name: '☁️ Google Spreadsheet',
  args: {
    file: MOCK_GOOGLE_SHEET_FILE
  }
}

export const SpreadsheetWithColumnOperations: Story = {
  name: '➕ Insert/Delete Column Operations',
  args: {
    file: MOCK_SPREADSHEET_FILE
  },
  decorators: [
    (Story: React.ComponentType) => {
      useEffect(() => {
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('sheet-ai-response', {
              detail: {
                preview: true,
                operations: [
                  {
                    type: 'insertCols',
                    index: 5,
                    count: 1
                  },
                  {
                    type: 'setCell',
                    row: 0,
                    col: 5,
                    value: 'YTD Total'
                  },
                  {
                    type: 'setCell',
                    row: 1,
                    col: 5,
                    value: '=SUM(B2:E2)'
                  }
                ]
              }
            })
          )
        }, 2000)

        return () => clearTimeout(timer)
      }, [])

      return <Story />
    }
  ]
}

