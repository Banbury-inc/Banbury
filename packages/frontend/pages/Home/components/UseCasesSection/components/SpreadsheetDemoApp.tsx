import React, { useState, useEffect, useRef, FC, PropsWithChildren } from 'react'
import CSVEditor from '../../../../../components/MiddlePanel/SpreadsheetViewer/CSVEditor'
import { Thread } from '../../../../../components/RightPanel/composer/thread/thread'
import { FileSystemItem } from '../../../../../utils/fileTreeUtils'
import { TooltipProvider } from '../../../../../components/ui/tooltip'
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react"

// Mock spreadsheet data - Quarterly Sales Report
const mockSpreadsheetData = `Product,Q1 Sales,Q2 Sales,Q3 Sales,Q4 Sales,Total
Widget A,12500,14200,13800,15600,56100
Widget B,8900,9100,10200,11300,39500
Widget C,21000,19500,22100,23400,86000
Service Plan,5600,6200,7100,8000,26900
Premium Support,7200,7800,8500,9100,32600
Enterprise License,45000,48000,51000,54000,198000
Training Services,3200,3800,4100,4500,15600
Consultation,8500,9200,9800,10500,38000
Custom Development,15000,16500,18000,19500,69000
Maintenance Contract,6700,7100,7600,8000,29400`

const mockUserInfo = {
  username: 'demo_user',
  email: 'demo@example.com',
}

const mockSpreadsheetFile: FileSystemItem = {
  id: 'spreadsheet-demo',
  name: 'quarterly-sales-report.csv',
  type: 'file',
  path: '/documents/quarterly-sales-report.csv',
  size: 1024,
  modified: new Date(),
}


// AI response for spreadsheet analysis
const assistantResponse = `I'll help you analyze the quarterly sales data. Here are the key insights:

## Top Performers
- **Enterprise License**: $198,000 total sales (highest revenue)
- **Widget C**: $86,000 total sales
- **Custom Development**: $69,000 total sales

## Growth Trends
- Most products show consistent growth from Q1 to Q4
- Widget A increased by **25%** from Q1 ($12,500) to Q4 ($15,600)
- Premium Support grew **26%** from Q1 to Q4

## Recommendations
1. **Focus on Enterprise Licenses** - These are your biggest revenue driver
2. **Analyze Widget B** - It shows the slowest growth, may need marketing attention
3. **Average Sales**: I can add a new column to calculate average quarterly sales per product

Would you like me to:
- Create visualizations of this data?
- Add formulas to calculate growth rates?
- Apply conditional formatting to highlight top performers?`

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SpreadsheetDemoRuntimeProvider: FC<PropsWithChildren> = ({ children }) => {
  const adapter = {
    async *run(options: { messages: any[]; abortSignal?: AbortSignal }) {
      console.log('[SpreadsheetDemo] Adapter run called with messages:', options.messages.length)
      
      // Check if this is the initial query
      const lastMessage = options.messages[options.messages.length - 1]
      const messageText = lastMessage?.content?.[0]?.text
      const isInitialQuery = messageText?.includes('quarterly sales')
      
      console.log('[SpreadsheetDemo] Last message text:', messageText)
      console.log('[SpreadsheetDemo] Is initial query:', isInitialQuery)
      
      if (!isInitialQuery) {
        // For any other messages, return a simple demo response
        yield {
          content: [{ type: 'text', text: 'This is a demo. To use Banbury Agent, sign up for free.' }],
          status: { type: 'complete' as const, reason: 'stop' as const }
        }
        return
      }

      // Stream the response word by word for the initial query
      let currentText = ''
      const words = assistantResponse.split(' ')
      
      for (let i = 0; i < words.length; i++) {
        if (options.abortSignal?.aborted) break
        
        currentText += (i === 0 ? '' : ' ') + words[i]
        
        yield {
          content: [{ type: 'text', text: currentText }],
          status: { type: 'running' as const }
        }
        
        // Vary the delay slightly to make it feel more natural
        const wordLength = words[i].length
        const baseDelay = 40
        const delayMs = baseDelay + (wordLength > 8 ? 15 : 0)
        
        await delay(delayMs)
      }
      
      // Final yield with complete status
      yield {
        content: [{ type: 'text', text: currentText }],
        status: { type: 'complete' as const, reason: 'stop' as const }
      }
    },
  }

  const runtime = useLocalRuntime(adapter as any)

  useEffect(() => {
    // Send the initial message when the component mounts
    const sendInitialMessage = async () => {
      console.log('[SpreadsheetDemo] Runtime state:', {
        hasRuntime: !!runtime,
        hasThread: !!runtime?.thread,
        hasAppend: !!runtime?.thread?.append,
        messageCount: runtime?.messages?.length || 0
      })
      
      if (runtime?.thread?.append) {
        try {
          await runtime.thread.append({
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Can you analyze the quarterly sales data and provide insights on top performers and growth trends?'
              }
            ]
          })
          console.log('[SpreadsheetDemo] Initial message sent successfully')
          
          // Check messages after sending
          setTimeout(() => {
            console.log('[SpreadsheetDemo] Messages after send:', runtime?.messages?.length || 0)
          }, 1000)
        } catch (error) {
          console.error('[SpreadsheetDemo] Error sending initial message:', error)
        }
      } else {
        console.warn('[SpreadsheetDemo] Runtime or thread.append not available yet')
        // Retry after a short delay
        setTimeout(sendInitialMessage, 500)
      }
    }

    // Small delay to ensure runtime is fully initialized
    const timer = setTimeout(() => {
      sendInitialMessage()
    }, 300)

    return () => clearTimeout(timer)
  }, [runtime])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}

function SpreadsheetDemoApp() {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(true)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    // Create a blob from the CSV data
    const blob = new Blob([mockSpreadsheetData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    urlRef.current = url
    setDocumentBlob(blob)
    setDocumentUrl(url)
    setLoading(false)

    // Cleanup function
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full h-[600px] flex justify-start overflow-x-clip overflow-y-hidden rounded-md border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-500">Loading spreadsheet...</p>
        </div>
      </div>
    )
  }

  return (
    <SpreadsheetDemoRuntimeProvider>
      <TooltipProvider>
        <div className="w-[1000px] h-[600px] flex flex-nowrap justify-start overflow-x-clip overflow-y-hidden rounded-md border border-zinc-200 dark:border-zinc-700 shadow-2xl bg-white dark:bg-zinc-900">
            {documentUrl && documentBlob ? (
              <div className="w-[600px]">
              <CSVEditor
                src={documentUrl}
                fileName="quarterly-sales-report.csv"
                srcBlob={documentBlob}
                onError={() => {}}
                onLoad={() => {}}
                onContentChange={() => {}}
                saving={false}
                canSave={false}
              />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-zinc-500">No spreadsheet to display</p>
              </div>
            )}

          {/* AI Chat Panel - Thread Component */}
            <Thread 
              userInfo={mockUserInfo}
              selectedFile={mockSpreadsheetFile}
              selectedEmail={null}
              onEmailSelect={() => {}}
            />
        <div className="w-[200px] h-full flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 overflow-hidden">
          
        </div>
        </div>
      </TooltipProvider>
    </SpreadsheetDemoRuntimeProvider>
  )
}

export default SpreadsheetDemoApp
