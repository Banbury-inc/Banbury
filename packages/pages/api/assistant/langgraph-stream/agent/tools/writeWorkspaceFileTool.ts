import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as crypto from 'crypto'
import { serverContext } from "../../../../../../frontend/assistant/langraph/serverContext"

/**
 * Get or create a workspace directory for the current session.
 * The workspace persists across tool calls within the same request.
 */
function getWorkspaceDir(): string {
  const store = serverContext.getStore()
  
  // Check if we already have a workspace directory in the context
  if (store?.codeWorkspaceDir && fs.existsSync(store.codeWorkspaceDir)) {
    return store.codeWorkspaceDir
  }
  
  // Create a new workspace directory
  const sessionId = crypto.randomBytes(8).toString('hex')
  const workspaceDir = path.join(os.tmpdir(), `banbury-workspace-${sessionId}`)
  fs.mkdirSync(workspaceDir, { recursive: true })
  
  // Store in context if available
  if (store) {
    store.codeWorkspaceDir = workspaceDir
  }
  
  return workspaceDir
}

/**
 * Write a file to the code execution workspace.
 * Used to create HTML slides, JS scripts, and other files for code execution.
 */
export const writeWorkspaceFileTool = tool(
  async (input: { fileName: string; content: string; subdirectory?: string }) => {
    const workspaceDir = getWorkspaceDir()
    
    // Handle subdirectory if specified
    let targetDir = workspaceDir
    if (input.subdirectory) {
      targetDir = path.join(workspaceDir, input.subdirectory)
      fs.mkdirSync(targetDir, { recursive: true })
    }
    
    const filePath = path.join(targetDir, input.fileName)
    
    // Write the file
    fs.writeFileSync(filePath, input.content, 'utf8')
    
    return JSON.stringify({
      success: true,
      filePath: filePath,
      workspaceDir: workspaceDir,
      message: `File written to workspace: ${input.fileName}`
    })
  },
  {
    name: 'write_workspace_file',
    description: 'Write a file to the code execution workspace. Use this to create HTML slides, JavaScript scripts, and other files needed for code execution. Files persist within the current session and can be referenced by execute_script. For PowerPoint presentations, you can use this to create HTML slide files that will be processed by html2pptx in execute_script.',
    schema: z.object({
      fileName: z.string().describe("The file name (e.g., 'slide1.html', 'generate.js')"),
      content: z.string().describe("The file contents"),
      subdirectory: z.string().optional().describe("Optional subdirectory within workspace (e.g., 'slides')"),
    }),
  }
)

/**
 * Get the current workspace directory path (for internal use)
 */
export function getCurrentWorkspaceDir(): string {
  return getWorkspaceDir()
}
