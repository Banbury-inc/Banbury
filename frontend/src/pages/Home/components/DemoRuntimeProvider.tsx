import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react"
import { FC, PropsWithChildren, useEffect } from "react"

const assistantResponse = `Based on the Q3 Product Strategy Proposal document, here are the key points:

## Executive Summary
The strategy focuses on three core initiatives with a projected 45% year-over-year growth in the SMB segment.

## Key Initiatives

### 1. AI-Powered Content Generation
- **Timeline:** 6 weeks to launch
- **Investment:** $2.5M
- **Expected ROI:** 180% within the first year
- This will be a significant competitive advantage in the market

### 2. Enhanced User Onboarding
- Interactive tutorial system to reduce time-to-value by 60%
- Early testing shows 35% improvement in user activation rates
- Critical for reducing churn and improving user retention

### 3. Enterprise Security Suite
- SOC 2 Type II compliance
- Advanced SSO integration
- Comprehensive audit logging
- Positions the company competitively in the enterprise market

## Market Insights
- AI adoption in productivity tools increased by **230%** in the past year
- **78%** of surveyed users prefer all-in-one solutions
- Enterprise clients willing to pay a **40% premium** for advanced collaboration features

## Success Metrics
- Monthly Active Users Growth: **+25%**
- Customer Satisfaction Score: **8.5/10**
- Revenue Target: **$12.5M**

The strategy is well-positioned to capture market share while delivering exceptional value to customers, with clear pathways to profitability.`

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const DemoRuntimeProvider: FC<PropsWithChildren> = ({ children }) => {
  const adapter = {
    async *run(options: { messages: any[]; abortSignal?: AbortSignal }) {
      // Check if this is the initial query about the Q3 document
      const lastMessage = options.messages[options.messages.length - 1]
      const isInitialQuery = lastMessage?.content?.[0]?.text?.includes('Q3 Product Strategy')
      
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
        // Faster for short words, slightly slower for longer ones
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
      if (runtime?.thread?.append) {
        await runtime.thread.append({
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Can you summarize the key points from the Q3 Product Strategy document?'
            }
          ]
        })
      }
    }

    // Small delay to ensure runtime is fully initialized
    const timer = setTimeout(() => {
      sendInitialMessage()
    }, 500)

    return () => clearTimeout(timer)
  }, [runtime])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
