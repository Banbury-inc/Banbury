import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { CONFIG } from "../../../../../frontend/config/config";
import { getServerContextValue } from "../../../../../frontend/assistant/langraph/serverContext";
import type { BaseMessage } from "@langchain/core/messages";
// Import tools from separate files
import { webSearchTool } from "./tools/webSearchTool";
import { sheetAiTool } from "./tools/sheetAiTool";
import { docxAiTool } from "./tools/docxAiTool";
import { tldrawAiTool } from "./tools/tldrawAiTool";
import { pptxAiTool } from "./tools/pptxAiTool";
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
  gmailCreateDraftTool,
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
import {
  slackListChannelsTool,
  slackSendMessageTool,
  slackGetChannelHistoryTool,
  slackGetThreadRepliesTool,
  slackSearchMessagesTool,
  slackGetUserInfoTool,
  slackSetChannelTopicTool,
  slackAddReactionTool,
} from "./tools/slackTools";
import {
  githubListReposTool,
  githubGetRepoTool,
  githubListIssuesTool,
  githubCreateIssueTool,
  githubListPullRequestsTool,
  githubGetFileContentsTool,
  githubSearchCodeTool,
} from "./tools/githubTools";

// Define our agent state
interface AgentState {
  messages: BaseMessage[];
  step: number;
  error?: string;
}

type ModelProvider = "anthropic" | "openai"

function getDefaultModelForProvider(provider: ModelProvider): string {
  return provider === "openai" ? "gpt-4o-mini" : "claude-sonnet-4-20250514"
}

function createChatModel(provider: ModelProvider, modelId?: string) {
  const actualModelId = modelId || getDefaultModelForProvider(provider)
  
  if (provider === "openai") {
    return new ChatOpenAI({
      model: actualModelId,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    })
  }

  return new ChatAnthropic({
    model: actualModelId,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.2,
  })
}

function resolveModelProvider(): ModelProvider {
  const prefs = getServerContextValue<any>("toolPreferences")
  return prefs?.model_provider === "openai" ? "openai" : "anthropic"
}

function resolveModelId(): string | undefined {
  const prefs = getServerContextValue<any>("toolPreferences")
  return prefs?.model_id
}

export function createReactAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  return createReactAgent({ llm, tools })
}

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
  pptxAiTool,
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
  gmailCreateDraftTool,
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
  slackListChannelsTool,
  slackSendMessageTool,
  slackGetChannelHistoryTool,
  slackGetThreadRepliesTool,
  slackSearchMessagesTool,
  slackGetUserInfoTool,
  slackSetChannelTopicTool,
  slackAddReactionTool,
  githubListReposTool,
  githubGetRepoTool,
  githubListIssuesTool,
  githubCreateIssueTool,
  githubListPullRequestsTool,
  githubGetFileContentsTool,
  githubSearchCodeTool,
  stagehandCreateSessionTool,
  stagehandGotoTool,
  stagehandObserveTool,
  stagehandActTool,
  stagehandExtractTool,
  stagehandCloseTool,
]
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
                              fileName.toLowerCase().endsWith('.pptx') ? 'PowerPoint presentation' :
                              fileName.toLowerCase().endsWith('.tldraw') ? 'Tldraw canvas' :
                              'file'
              return `- ${fileName} (${fileType})`
            }).join('\n') +
            "\n\nIMPORTANT: When using docx_ai, sheet_ai, pptx_ai, or tldraw_ai tools, you MUST include the actual file name in the documentName/sheetName/presentationName/canvasName parameter. For example, if the user has attached 'Report.docx', use documentName: 'Report.docx' in your tool call. For presentations, use presentationName with the .pptx file name."
        }
      }
      
      const systemContent = `You are a helpful AI assistant. ${dateTimeContext}${attachedFilesContext}`
      messages = [
        new SystemMessage(systemContent),
        ...messages
      ]
    }

    const provider = resolveModelProvider()
    const llm = createChatModel(provider)
    const modelWithTools = llm.bindTools(tools)
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

