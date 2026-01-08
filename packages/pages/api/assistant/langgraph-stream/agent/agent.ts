import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createAgent, todoListMiddleware } from "langchain";
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

// Define our agent state
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
  
  // Map deprecated or unsupported Google model names to supported ones
  if (provider === "google") {
    const modelMappings: Record<string, string> = {
      "gemini-pro": "gemini-2.0-flash-exp", // Map deprecated gemini-pro to gemini-2.0-flash-exp
      "gemini-1.5-pro": "gemini-2.0-flash-exp", // Map gemini-1.5-pro to gemini-2.0-flash-exp (not available in v1beta)
      "gemini-1.5-flash": "gemini-2.0-flash-exp", // Map gemini-1.5-flash to gemini-2.0-flash-exp (not available in v1beta)
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
    invocationKwargs: { top_p: undefined }, // Override to prevent -1 being sent to newer models
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

export function createReactAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  
  // Build model identifier string for createAgent
  // Format: "provider:model-id"
  let modelString: string
  if (provider === "openai") {
    modelString = `openai:${modelId}`
  } else if (provider === "google") {
    modelString = `google-genai:${modelId}`
  } else {
    modelString = `anthropic:${modelId}`
  }
  
  // Note: System prompt will be provided dynamically via the prompt parameter
  // when invoking the agent, not here in the agent creation.
  // The middleware will append its todo-related guidance to that base prompt.
  return createAgent({
    model: modelString,
    tools,
    middleware: [
      todoListMiddleware({
        systemPrompt: `ONLY use the write_todos tool for COMPLEX tasks that genuinely require multiple distinct steps (3+) and would benefit from explicit progress tracking.

DO NOT use this tool for:
- Simple, single-step tasks
- Tasks that can be completed in one or two actions  
- Straightforward requests that don't need breakdown

DO use this tool when:
- The task is complex and has 3+ distinct, independent steps
- Progress tracking would help manage a lengthy workflow
- The task involves multiple phases that could fail independently
- Breaking down the work would improve organization and clarity

Remember: Writing todos takes time and tokens. Use it when truly helpful for complex many-step problems, not for simple few-step requests.`,
      }),
    ],
  })
}

/**
 * Document-specialized tools for document creation/editing requests.
 * This is a constrained toolset focused on document operations.
 */
const documentTools = [
  // Core document creation/editing tools
  createFileTool,
  pptxAiTool,
  pptxParseOutlineTool, // Parse attached PPTX files to understand structure before editing
  sheetAiTool,
  docxAiTool,
  tldrawAiTool,
  // Code execution tools for advanced document generation
  writeWorkspaceFileTool, // Write scripts and data files to workspace
  executeScriptTool, // Run Node.js scripts to generate documents (e.g., complex data processing)
  // Supporting tools that may be needed for document tasks
  webSearchTool, // For research when creating documents
  searchFilesTool, // To find existing files to reference
  downloadFromUrlTool, // To download images/assets for documents
  generateImageTool, // To generate images for documents
  createFolderTool, // To organize created documents
  getCurrentDateTimeTool, // For date-aware documents
]

/**
 * Creates a document-specialized React agent with a constrained toolset.
 * Used when detectDocumentRequest() returns true.
 */
export function createDocumentAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  return createReactAgent({ llm, tools: documentTools })
}

/**
 * Planning mode tools - Minimal read-only research tools + plan file creation.
 * 
 * In planning mode, the agent can ONLY:
 * 1. Research using file search and memory
 * 2. Create plan files (.plan.md) using the dedicated create_plan tool
 * 
 * NO other write/edit tools are available. This ensures the planning agent
 * cannot modify files, execute code, or perform any actions beyond research
 * and plan creation.
 */
const planningTools = [
  // Plan file creation - ONLY tool that can create files (restricted to .plan.md)
  createPlanTool,
  // Read-only research tools (minimal set)
  searchFilesTool, // Search existing files to understand codebase
  searchMemoryTool, // Search memory for relevant past context
]

/**
 * Creates a planning-only React agent with read-only tools.
 * Used when plan_mode is true - agent can only research and create plans.
 */
export function createPlanningAgentForProvider(provider: ModelProvider) {
  const modelId = resolveModelId()
  const llm = createChatModel(provider, modelId)
  return createReactAgent({ llm, tools: planningTools })
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
            "\n\nIMPORTANT: When using docx_ai, sheet_ai, pptx_ai, or tldraw_ai tools, you MUST include the actual file name in the documentName/sheetName/presentationName/canvasName parameter. For example, if the user has attached 'Report.docx', use documentName: 'Report.docx' in your tool call. For presentations, use presentationName with the .pptx file name." +
            "\n\nFor IMAGE files: When adding images to presentations using pptx_ai, use the driveFileId or s3FileId shown in brackets above. For example, if you see an image with [driveFileId: \"abc123\"], use { type: 'addImage', element: { x: 10, y: 10, width: 40, height: 30, driveFileId: \"abc123\" } }. For S3 images, include both s3FileId and s3FileName: { type: 'addImage', element: { x: 10, y: 10, width: 40, height: 30, s3FileId: \"xyz789\", s3FileName: \"photo.jpg\" } }. For web images (http/https URLs), use imageUrl."
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

