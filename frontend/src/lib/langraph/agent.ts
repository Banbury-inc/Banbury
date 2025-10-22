import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { CONFIG } from "../../config/config";
import { getServerContextValue } from "../serverContext";

import type { BaseMessage } from "@langchain/core/messages";

// Import tools from separate files
import { webSearchTool } from "./tools/webSearchTool";
import { sheetAiTool } from "./tools/sheetAiTool";
import { docxAiTool } from "./tools/docxAiTool";
import { tldrawAiTool } from "./tools/tldrawAiTool";
import { generateImageTool } from "./tools/generateImageTool";
import { createMemoryTool } from "./tools/createMemoryTool";
import { searchMemoryTool } from "./tools/searchMemoryTool";
import { createFileTool } from "./tools/createFileTool";
import { downloadFromUrlTool } from "./tools/downloadFromUrlTool";
import { searchFilesTool } from "./tools/searchFilesTool";
import { getCurrentDateTimeTool } from "./tools/getCurrentDateTimeTool";
import {
  stagehandCreateSessionTool,
  stagehandGotoTool,
  stagehandObserveTool,
  stagehandActTool,
  stagehandExtractTool,
  stagehandCloseTool,
} from "./tools/stagehandTools";
import {
  gmailGetRecentTool,
  gmailSearchTool,
  gmailGetMessageTool,
  gmailSendMessageTool,
} from "./tools/gmailTools";
import {
  calendarListEventsTool,
  calendarGetEventTool,
  calendarCreateEventTool,
  calendarUpdateEventTool,
  calendarDeleteEventTool,
} from "./tools/calendarTools";
import {
  xApiGetUserInfoTool,
  xApiGetUserTweetsTool,
  xApiSearchTweetsTool,
  xApiGetTrendingTopicsTool,
  xApiPostTweetTool,
} from "./tools/xApiTools";

// Define our agent state
interface AgentState {
  messages: BaseMessage[];
  step: number;
  error?: string;
}

// Initialize the Anthropic model
const anthropicModel = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  apiKey: process.env.ANTHROPIC_API_KEY || "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",
  temperature: 0.2,
})

// Function to get current date/time context
function getCurrentDateTimeContext(): string {
  const now = new Date()
  
  // Format current date and time
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }
  
  const currentDate = now.toLocaleDateString('en-US', dateOptions)
  const currentTime = now.toLocaleTimeString('en-US', timeOptions)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isoString = now.toISOString()
  
  return `Current date and time: ${currentDate} at ${currentTime} (${timezone}). ISO timestamp: ${isoString}`
}

// Bind tools to the model and also prepare tools array for React agent
const tools = [
  webSearchTool,
  sheetAiTool,
  docxAiTool,
  tldrawAiTool,
  generateImageTool,
  createMemoryTool,
  searchMemoryTool,
  createFileTool,
  downloadFromUrlTool,
  searchFilesTool,
  getCurrentDateTimeTool,
  gmailGetRecentTool,
  gmailSearchTool,
  gmailGetMessageTool,
  gmailSendMessageTool,
  calendarListEventsTool,
  calendarGetEventTool,
  calendarCreateEventTool,
  calendarUpdateEventTool,
  calendarDeleteEventTool,
  xApiGetUserInfoTool,
  xApiGetUserTweetsTool,
  xApiSearchTweetsTool,
  xApiGetTrendingTopicsTool,
  xApiPostTweetTool,
  stagehandCreateSessionTool,
  stagehandGotoTool,
  stagehandObserveTool,
  stagehandActTool,
  stagehandExtractTool,
  stagehandCloseTool,
]
const modelWithTools = anthropicModel.bindTools(tools)

// React-style agent that handles tool-calling loops internally
export const reactAgent = createReactAgent({ llm: anthropicModel, tools })

// Define agent nodes following athena-intelligence patterns
async function agentNode(state: AgentState): Promise<AgentState> {
  try {
    // Only add system message if it's not already there
    let messages = state.messages
    
    // Check if first message is already a system message
    const hasSystemMessage = messages.length > 0 && messages[0]._getType() === "system"
    
    if (!hasSystemMessage) {
      // Get date/time context from server context if available, otherwise generate it
      let dateTimeContext = getServerContextValue<any>("dateTimeContext")
      if (!dateTimeContext) {
        dateTimeContext = getCurrentDateTimeContext()
      } else {
        dateTimeContext = `Current date and time: ${dateTimeContext.formatted}. ISO timestamp: ${dateTimeContext.isoString}`
      }
      
      // Get attached files information from the message context
      let attachedFilesContext = ""
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && Array.isArray(lastMessage.content)) {
        const fileAttachments = lastMessage.content.filter((part: any) => part.type === 'file-attachment')
        if (fileAttachments.length > 0) {
          attachedFilesContext = "\n\nCurrently attached files:\n" + 
            fileAttachments.map((file: any) => {
              const fileName = file.fileName || 'Unknown file'
              const fileType = fileName.toLowerCase().endsWith('.docx') ? 'DOCX document' :
                              fileName.toLowerCase().endsWith('.xlsx') ? 'Excel spreadsheet' :
                              fileName.toLowerCase().endsWith('.tldraw') ? 'Tldraw canvas' :
                              'file'
              return `- ${fileName} (${fileType})`
            }).join('\n') +
            "\n\nIMPORTANT: When using docx_ai, sheet_ai, or tldraw_ai tools, you MUST include the actual file name in the documentName/sheetName/canvasName parameter. For example, if the user has attached 'Report.docx', use documentName: 'Report.docx' in your tool call."
        }
      }
      
      const systemContent = `You are a helpful AI assistant. ${dateTimeContext}${attachedFilesContext}`
      messages = [
        new SystemMessage(systemContent),
        ...messages
      ]
    }

    const response = await modelWithTools.invoke(messages)
    
    return {
      ...state,
      messages: [...state.messages, response],
      step: state.step + 1
    }
  } catch (error: any) {
    return {
      ...state,
      error: error?.message || "Agent failed",
      step: state.step + 1
    }
  }
}

// Define the graph
const workflow = new StateGraph<AgentState>(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)

const app = workflow.compile()

// Main exported function
export async function invokeAgent(
  messages: BaseMessage[],
  config?: { authToken?: string; toolPreferences?: any; dateTimeContext?: any; webSearchDefaults?: any }
): Promise<BaseMessage[]> {
  try {
    const state = await app.invoke(
      { messages, step: 0 },
      config as any
    )
    return state.messages
  } catch (error: any) {
    throw new Error(error?.message || "Agent invocation failed")
  }
}

