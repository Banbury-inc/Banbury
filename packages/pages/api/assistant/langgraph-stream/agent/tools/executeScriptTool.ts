import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { spawn } from 'child_process'
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"
import { getCurrentWorkspaceDir } from "./writeWorkspaceFileTool"

// File extensions that should be auto-uploaded after script execution
const UPLOADABLE_EXTENSIONS = ['.pptx', '.docx', '.xlsx', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg']

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileInfo: any
}

/**
 * Upload a file to S3
 */
async function uploadFileToS3(filePath: string, token: string): Promise<UploadedFile | null> {
  const apiBase = CONFIG.url
  const fileName = path.basename(filePath)
  
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const blob = new Blob([fileBuffer])
    
    const formData = new FormData()
    formData.append('file', blob, fileName)
    formData.append('device_name', 'web-editor')
    formData.append('file_path', `generated/${fileName}`)
    formData.append('file_parent', 'generated')

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!resp.ok) {
      console.error(`Failed to upload ${fileName}: HTTP ${resp.status}`)
      return null
    }

    const data = await resp.json()
    return {
      fileName,
      fileUrl: data?.file_url,
      fileInfo: data?.file_info
    }
  } catch (err) {
    console.error(`Error uploading ${fileName}:`, err)
    return null
  }
}

/**
 * Find all uploadable files in a directory (recursively)
 */
function findUploadableFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      
      if (entry.isDirectory()) {
        files.push(...findUploadableFiles(fullPath, baseDir))
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (UPLOADABLE_EXTENSIONS.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch {
    // Ignore errors reading directory
  }
  
  return files
}

/**
 * Get files that existed before script execution
 */
function getExistingFiles(dir: string): Set<string> {
  const files = new Set<string>()
  
  try {
    const allFiles = findUploadableFiles(dir)
    allFiles.forEach(f => files.add(f))
  } catch {
    // Ignore errors
  }
  
  return files
}


/**
 * Execute a Node.js script in the workspace
 */
async function runScript(
  scriptPath: string,
  workspaceDir: string,
  timeout: number = 120000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const stdout: string[] = []
    const stderr: string[] = []
    
    // Prepare the module paths - include workspace and the pptx tools directory
    const pptxToolsDir = path.resolve(__dirname, 'pptx')
    
    // Find node_modules directories by walking up from current directory
    const findNodeModulesPaths = (): string[] => {
      const paths: string[] = []
      let currentDir = __dirname
      while (currentDir !== path.dirname(currentDir)) {
        const nodeModulesPath = path.join(currentDir, 'node_modules')
        if (fs.existsSync(nodeModulesPath)) {
          paths.push(nodeModulesPath)
        }
        currentDir = path.dirname(currentDir)
      }
      return paths
    }
    
    const modulePaths = [
      workspaceDir,
      path.join(workspaceDir, 'node_modules'),
      pptxToolsDir,
      ...findNodeModulesPaths()
    ].filter(p => fs.existsSync(p))
    
    const proc = spawn('node', [scriptPath], {
      cwd: workspaceDir,
      env: {
        ...process.env,
        NODE_PATH: modulePaths.join(path.delimiter),
        WORKSPACE_DIR: workspaceDir,
      },
      timeout,
    })
    
    proc.stdout.on('data', (data) => {
      const output = data.toString()
      stdout.push(output)
    })
    
    proc.stderr.on('data', (data) => {
      const error = data.toString()
      stderr.push(error)
    })
    
    proc.on('close', (code) => {
      resolve({
        stdout: stdout.join(''),
        stderr: stderr.join(''),
        exitCode: code ?? 1
      })
    })
    
    proc.on('error', (err) => {
      resolve({
        stdout: stdout.join(''),
        stderr: `Process error: ${err.message}\n${stderr.join('')}`,
        exitCode: 1
      })
    })
  })
}

/**
 * Execute a Node.js script in the workspace with auto-upload of generated files.
 */
export const executeScriptTool = tool(
  async (input: { script: string; scriptFileName?: string; timeout?: number }) => {
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }
    
    const workspaceDir = getCurrentWorkspaceDir()
    const scriptFileName = input.scriptFileName || `script-${Date.now()}.js`
    const scriptPath = path.join(workspaceDir, scriptFileName)
    
    // Write the script to the workspace
    fs.writeFileSync(scriptPath, input.script, 'utf8')
    
    // Get files that exist before execution
    const filesBefore = getExistingFiles(workspaceDir)
    
    // Execute the script
    const timeout = input.timeout || 120000 // 2 minutes default
    const result = await runScript(scriptPath, workspaceDir, timeout)
    
    // Find new files created by the script
    const filesAfter = findUploadableFiles(workspaceDir)
    const newFiles = filesAfter.filter(f => !filesBefore.has(f))
    
    // Upload new files to S3
    const uploadedFiles: UploadedFile[] = []
    for (const filePath of newFiles) {
      const uploaded = await uploadFileToS3(filePath, token)
      if (uploaded) {
        uploadedFiles.push(uploaded)
      }
    }
    
    return JSON.stringify({
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      workspaceDir,
      uploadedFiles,
      message: result.exitCode === 0
        ? `Script executed successfully. ${uploadedFiles.length} file(s) uploaded.`
        : `Script failed with exit code ${result.exitCode}`
    })
  },
  {
    name: 'execute_script',
    description: `Execute a Node.js script in the workspace. The script runs with full Node.js capabilities and can:
- Import installed packages (docx, exceljs, etc.)
- Read/write files in the workspace (use process.env.WORKSPACE_DIR)
- Generate output files (DOCX, XLSX, images, etc.)

IMPORTANT: Do NOT use this tool for PowerPoint presentations. Use pptx_ai instead.

Any generated files (.docx, .xlsx, .pdf, .png, .jpg, etc.) are automatically uploaded to the user's cloud storage.`,
    schema: z.object({
      script: z.string().describe("The Node.js script code to execute"),
      scriptFileName: z.string().optional().describe("Optional filename for the script (default: auto-generated)"),
      timeout: z.number().optional().describe("Execution timeout in milliseconds (default: 120000 = 2 minutes)"),
    }),
  }
)
