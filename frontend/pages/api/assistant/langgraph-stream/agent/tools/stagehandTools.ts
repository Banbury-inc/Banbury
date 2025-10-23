import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { getServerContextValue } from "../../../../../../src/assistant/langraph/serverContext"

// Global toggle helper: "Browser" tool (controls both Browserbase and Stagehand)
function isBrowserToolEnabled(): boolean {
  const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { browser?: boolean }
  // Default OFF unless explicitly enabled
  return prefs.browser === true
}

// Stagehand session management
let currentStagehandSessionId: string | null = null

function getStagehandSessionId(): string | null {
  return currentStagehandSessionId
}

function setStagehandSessionId(id: string | null) {
  currentStagehandSessionId = id
}

export const stagehandCreateSessionTool = tool(
  async (input: { startUrl?: string; modelName?: string }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." })
    }
    try {
      if (typeof window !== 'undefined') {
        return JSON.stringify({ success: false, error: 'Stagehand can only be created server-side' })
      }
      const { createStagehandSession } = await import('../../../../../../src/pages/api/stagehand/_manager')
      const created = await createStagehandSession({ startUrl: input.startUrl, modelName: input.modelName })
      setStagehandSessionId(created.id)
      
      return JSON.stringify({ 
        success: true, 
        sessionId: created.id, 
        viewerUrl: created.viewerUrl,
        title: created.title || `Web Browser`
      })
    } catch (e: any) {
      return JSON.stringify({ success: false, error: e?.message || 'Failed to create Stagehand session' })
    }
  },
  {
    name: 'stagehand_create_session',
    description: 'Create a Stagehand session backed by Browserbase',
    schema: z.object({
      startUrl: z.string().optional(),
      modelName: z.string().optional()
    })
  }
)

export const stagehandGotoTool = tool(
  async (input: { url: string }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." })
    }
    const sessionId = getStagehandSessionId()
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' })
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand navigation must run server-side' })
    }
    const { getStagehandSession } = await import('../../../../../../src/pages/api/stagehand/_manager')
    const instance = getStagehandSession(sessionId)
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' })
    await instance.page.goto(input.url)
    const title = await instance.page.title()
    const url = instance.page.url()
    return JSON.stringify({ success: true, title, url })
  },
  {
    name: 'stagehand_goto',
    description: 'Navigate the Stagehand-controlled browser to a URL',
    schema: z.object({ url: z.string() })
  }
)

export const stagehandObserveTool = tool(
  async (input: { instruction: string }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." })
    }
    const sessionId = getStagehandSessionId()
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' })
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand observe must run server-side' })
    }
    const { getStagehandSession } = await import('../../../../../../src/pages/api/stagehand/_manager')
    const instance = getStagehandSession(sessionId)
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' })
    const suggestions = await instance.page.observe(input.instruction)
    return JSON.stringify({ success: true, suggestions })
  },
  {
    name: 'stagehand_observe',
    description: 'Ask Stagehand to suggest actions for an instruction',
    schema: z.object({ instruction: z.string() })
  }
)

export const stagehandActTool = tool(
  async (input: { suggestion: any }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." })
    }
    const sessionId = getStagehandSessionId()
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' })
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand act must run server-side' })
    }
    const { getStagehandSession } = await import('../../../../../../src/pages/api/stagehand/_manager')
    const instance = getStagehandSession(sessionId)
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' })
    await instance.page.act(input.suggestion)
    const title = await instance.page.title()
    const url = instance.page.url()
    return JSON.stringify({ success: true, title, url })
  },
  {
    name: 'stagehand_act',
    description: 'Perform a Stagehand suggestion',
    schema: z.object({ suggestion: z.any() })
  }
)

export const stagehandExtractTool = tool(
  async (input: { instruction: string; schema: Record<string, string> }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." })
    }
    const sessionId = getStagehandSessionId()
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' })
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand extract must run server-side' })
    }
    const { getStagehandSession } = await import('../../../../../../src/pages/api/stagehand/_manager')
    const instance = getStagehandSession(sessionId)
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' })
    const built = z.object(Object.fromEntries(Object.keys(input.schema || {}).map((k) => [k, z.string()])) as Record<string, z.ZodTypeAny>)
    const result = await instance.page.extract({ instruction: input.instruction, schema: built })
    return JSON.stringify({ success: true, result })
  },
  {
    name: 'stagehand_extract',
    description: 'Extract structured data via Stagehand using a simple field map',
    schema: z.object({ instruction: z.string(), schema: z.record(z.string()) })
  }
)

export const stagehandCloseTool = tool(
  async () => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." })
    }
    const sessionId = getStagehandSessionId()
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' })
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand close must run server-side' })
    }
    const { closeStagehandSession } = await import('../../../../../../src/pages/api/stagehand/_manager')
    const ok = await closeStagehandSession(sessionId)
    if (ok) setStagehandSessionId(null)
    return JSON.stringify({ success: ok })
  },
  {
    name: 'stagehand_close',
    description: 'Close the Stagehand session',
    schema: z.object({})
  }
)

