import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { CONFIG } from "../../../../../frontend/config/config";
import { getServerContextValue } from "../../../../../frontend/assistant/langraph/serverContext";
import type { BaseMessage } from "@langchain/core/messages";
// Import tools from separate files
import { webSearchTool } from "./tools/webSearchTool";
import { tavilyExtractTool } from "./tools/tavilyExtractTool";
import { tavilyCrawlTool } from "./tools/tavilyCrawlTool";
import { tavilyMapTool } from "./tools/tavilyMapTool";
import { tavilyResearchTool } from "./tools/tavilyResearchTool";
import { tavilyGetResearchTool } from "./tools/tavilyGetResearchTool";
import { tavilyUsageTool } from "./tools/tavilyUsageTool";
import { sheetAiTool } from "./tools/sheetAiTool";
import { docxAiTool } from "./tools/docxAiTool";
import { tldrawAiTool } from "./tools/tldrawAiTool";
import {
  createPresentationTool,
  createSlideTool,
  addTextTool,
  addShapeTool,
  addImageTool,
  addChartTool,
  addTableTool,
  downloadAndAddImageTool,
  setSlideBackgroundTool,
  useTemplateTool,
  extractInventoryTool,
  rearrangeSlidesTool,
  replaceTextTool,
  evaluatePresentationTool,
} from "./tools/pptxTools";
import { generateImageTool } from "./tools/generateImageTool";
import { generateVideoTool } from "./tools/generateVideoTool";
import { createMemoryTool } from "./tools/createMemoryTool";
import { searchMemoryTool } from "./tools/searchMemoryTool";
import { createFileTool } from "./tools/createFileTool";
import { createFolderTool } from "./tools/createFolderTool";
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
  gmailLabelEmailTool,
} from "./tools/gmailTools";
import {
  calendarListEventsTool,
  calendarGetEventTool,
  calendarCreateEventTool,
  calendarUpdateEventTool,
  calendarDeleteEventTool,
} from "./tools/calendarTools";
import {
  msCalendarListCalendarsTool,
  msCalendarListEventsTool,
  msCalendarGetEventTool,
  msCalendarCreateEventTool,
  msCalendarUpdateEventTool,
  msCalendarDeleteEventTool,
} from "./tools/microsoftCalendarTools";
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
import { pptxParseOutlineTool } from "./tools/pptxParseOutlineTool";
import { writeWorkspaceFileTool } from "./tools/writeWorkspaceFileTool";
import { executeScriptTool } from "./tools/executeScriptTool";
import { createPlanTool } from "./tools/createPlanTool";
import { spawnSubagentsTool } from "./tools/spawnSubagentsTool";
import { codeEditOpenFileTool } from "./tools/codeEditOpenFileTool";

interface AgentState {
  messages: BaseMessage[];
  step: number;
  error?: string;
}

type ModelProvider = "anthropic" | "openai" | "google"

function getDefaultModelForProvider(provider: ModelProvider): string {
  if (provider === "openai") return "gpt-4o-mini";
  if (provider === "google") return "gemini-2.0-flash-exp";
  return "claude-sonnet-4-20250514";
}

function createChatModel(provider: ModelProvider, modelId?: string) {
  let actualModelId = modelId || getDefaultModelForProvider(provider)
  
  if (provider === "google") {
    const modelMappings: Record<string, string> = {
      "gemini-pro": "gemini-2.0-flash-exp",
      "gemini-1.5-pro": "gemini-2.0-flash-exp",
      "gemini-1.5-flash": "gemini-2.0-flash-exp",
    }
    actualModelId = modelMappings[actualModelId] || actualModelId
  }
  
  if (provider === "openai") {
    return new ChatOpenAI({
      model: actualModelId,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    })
  }

  if (provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: actualModelId,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    })
  }

  return new ChatAnthropic({
    model: actualModelId,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.2,
    invocationKwargs: { top_p: undefined },
  })
}

function resolveModelProvider(): ModelProvider {
  const prefs = getServerContextValue<any>("toolPreferences")
  if (prefs?.model_provider === "openai") return "openai";
  if (prefs?.model_provider === "google") return "google";
  return "anthropic";
}

function resolveModelId(): string | undefined {
  const prefs = getServerContextValue<any>("toolPreferences")
  return prefs?.model_id
}

export interface CreateReactAgentForProviderOptions {
  /** Tool names to omit from the bound tool list (e.g. hide docx_ai when the IDE has a code file focused). */
  excludeToolNames?: string[]
}

function filterToolsByName<T extends { name: string }>(
  toolList: T[],
  excludeToolNames?: string[]
): T[] {
  if (!excludeToolNames?.length) return toolList
  const exclude = new Set(excludeToolNames)
  return toolList.filter((t) => !exclude.has(t.name))
}

export function createReactAgentForProvider(
  provider: ModelProvider,
  options?: CreateReactAgentForProviderOptions
) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  const chosenTools = filterToolsByName(tools, options?.excludeToolNames)
  return createReactAgent({ llm, tools: chosenTools })
}

/**
 * Document-specialized tools for document creation/editing requests.
 * This is a constrained toolset focused on document operations.
 */
const documentTools = [
  createFileTool,
  createPresentationTool,
  createSlideTool,
  addTextTool,
  addShapeTool,
  addImageTool,
  addChartTool,
  addTableTool,
  downloadAndAddImageTool,
  setSlideBackgroundTool,
  useTemplateTool,
  extractInventoryTool,
  rearrangeSlidesTool,
  replaceTextTool,
  evaluatePresentationTool,
  pptxParseOutlineTool,
  sheetAiTool,
  docxAiTool,
  tldrawAiTool,
  webSearchTool,
  tavilyExtractTool,
  searchFilesTool,
  downloadFromUrlTool,
  generateImageTool,
  createFolderTool,
  getCurrentDateTimeTool,
]

export function createDocumentAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  return createReactAgent({ llm, tools: documentTools })
}

const planningTools = [
  createPlanTool,
  searchFilesTool,
  searchMemoryTool,
  getCurrentDateTimeTool,
  // Email reading tools
  gmailGetRecentTool,
  gmailSearchTool,
  gmailGetMessageTool,
  gmailLabelEmailTool,
  // Calendar reading tools
  calendarListEventsTool,
  calendarGetEventTool,
  msCalendarListCalendarsTool,
  msCalendarListEventsTool,
  msCalendarGetEventTool,
]

const askingTools = [
  webSearchTool,
  tavilyExtractTool,
  tavilyCrawlTool,
  tavilyMapTool,
  tavilyResearchTool,
  tavilyGetResearchTool,
  searchFilesTool,
  searchMemoryTool,
  getCurrentDateTimeTool,
]

export function createPlanningAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  return createReactAgent({ llm, tools: planningTools })
}

export function createAskAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  return createReactAgent({ llm, tools: askingTools })
}

function getCurrentDateTimeContext(): string {
  const now = new Date()
  
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

const tools = [
  webSearchTool,
  tavilyExtractTool,
  tavilyCrawlTool,
  tavilyMapTool,
  tavilyResearchTool,
  tavilyGetResearchTool,
  tavilyUsageTool,
  sheetAiTool,
  docxAiTool,
  tldrawAiTool,
  createPresentationTool,
  createSlideTool,
  addTextTool,
  addShapeTool,
  addImageTool,
  addChartTool,
  addTableTool,
  downloadAndAddImageTool,
  setSlideBackgroundTool,
  useTemplateTool,
  extractInventoryTool,
  rearrangeSlidesTool,
  replaceTextTool,
  evaluatePresentationTool,
  generateImageTool,
  generateVideoTool,
  createMemoryTool,
  searchMemoryTool,
  createFileTool,
  createFolderTool,
  downloadFromUrlTool,
  searchFilesTool,
  getCurrentDateTimeTool,
  writeWorkspaceFileTool,
  executeScriptTool,
  codeEditOpenFileTool,
  gmailGetRecentTool,
  gmailSearchTool,
  gmailGetMessageTool,
  gmailSendMessageTool,
  gmailCreateDraftTool,
  gmailLabelEmailTool,
  calendarListEventsTool,
  calendarGetEventTool,
  calendarCreateEventTool,
  calendarUpdateEventTool,
  calendarDeleteEventTool,
  msCalendarListCalendarsTool,
  msCalendarListEventsTool,
  msCalendarGetEventTool,
  msCalendarCreateEventTool,
  msCalendarUpdateEventTool,
  msCalendarDeleteEventTool,
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
  spawnSubagentsTool,
]
async function agentNode(state: AgentState): Promise<AgentState> {
  try {
    let messages = state.messages
    
    const hasSystemMessage = messages.length > 0 && messages[0]._getType() === "system"


    if (!hasSystemMessage) {
      let dateTimeContext = getServerContextValue<any>("dateTimeContext")
      if (!dateTimeContext) {
        dateTimeContext = getCurrentDateTimeContext()
      } else {
        dateTimeContext = `Current date and time: ${dateTimeContext.formatted}. ISO timestamp: ${dateTimeContext.isoString}`
      }
      
      let attachedFilesContext = ""
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && Array.isArray(lastMessage.content)) {
        const fileAttachments = lastMessage.content.filter((part: any) => part.type === 'file-attachment')
        if (fileAttachments.length > 0) {
          attachedFilesContext = "\n\nCurrently attached files:\n" + 
            fileAttachments.map((file: any) => {
              const fileName = file.fileName || 'Unknown file'
              const fileId = file.fileId || ''
              const filePath = file.filePath || ''
              const isDrive = filePath.startsWith('drive://')
              
              const fileType = fileName.toLowerCase().endsWith('.docx') ? 'DOCX document' :
                              fileName.toLowerCase().endsWith('.xlsx') ? 'Excel spreadsheet' :
                              fileName.toLowerCase().endsWith('.pptx') ? 'PowerPoint presentation' :
                              fileName.toLowerCase().endsWith('.tldraw') ? 'Tldraw canvas' :
                              fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' :
                              'file'
              
              let fileInfo = `- ${fileName} (${fileType})`
              if (fileType === 'image' && fileId) {
                if (isDrive) {
                  fileInfo += ` [driveFileId: "${fileId}"]`
                } else {
                  fileInfo += ` [s3FileId: "${fileId}", s3FileName: "${fileName}"]`
                }
              }
              return fileInfo
            }).join('\n') +
            "\n\nIMPORTANT: docx_ai applies only to .docx attachments; never use it for source code or generic files. When using docx_ai, sheet_ai, pptx_ai, or tldraw_ai tools, you MUST include the actual file name in the documentName/sheetName/presentationName/canvasName parameter. For example, if the user has attached 'Report.docx', use documentName: 'Report.docx' in your tool call. For presentations, use presentationName with the .pptx file name." +
            "\n\nFor IMAGE files: When adding images to presentations using pptx_ai, use the driveFileId or s3FileId shown in brackets above. For example, if you see an image with [driveFileId: \"abc123\"], use { type: 'addImage', element: { x: 10, y: 10, width: 40, height: 30, driveFileId: \"abc123\" } }. For S3 images, include both s3FileId and s3FileName: { type: 'addImage', element: { x: 10, y: 10, width: 40, height: 30, s3FileId: \"xyz789\", s3FileName: \"photo.jpg\" } }. For web images (http/https URLs), use imageUrl."
        }
      }
      
      const systemContent = `You are a helpful AI assistant. ${dateTimeContext}${attachedFilesContext}`
      messages = [
        new SystemMessage(systemContent),
        ...messages
      ]

      console.log('messages after system message', messages)
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

const workflow = new StateGraph<AgentState>(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)

const app = workflow.compile()

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

