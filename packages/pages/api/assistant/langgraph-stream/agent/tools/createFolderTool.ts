import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// Create folder tool
export const createFolderTool = tool(
  async (input: { folderPath?: string; folderName: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    // Validate folder name
    const folderName = input.folderName?.trim()
    if (!folderName || folderName.length === 0) {
      throw new Error("Folder name is required and cannot be empty")
    }

    // Handle folder path - default to empty string for root
    const folderPath = input.folderPath?.trim() || ""
    
    // Calculate full folder path
    const fullFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName
    const markerFileName = '.folder_marker'
    const markerFilePath = `${fullFolderPath}/${markerFileName}`

    // Create a small marker file to represent the folder
    const markerContent = new Blob([''], { type: 'text/plain' })
    
    const formData = new FormData()
    formData.append('file', markerContent, markerFileName)
    formData.append('device_name', 'web-editor')
    formData.append('file_path', markerFilePath)
    formData.append('file_parent', fullFolderPath)

    const response = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      let message = `HTTP ${response.status}`
      try {
        const data = await response.json()
        if (data?.error) message += ` - ${data.error}`
      } catch {}
      throw new Error(`Failed to create folder: ${message}`)
    }

    const data = await response.json()
    
    if (data.result === 'success') {
      return JSON.stringify({
        success: true,
        folderPath: fullFolderPath,
        message: `Folder "${folderName}" created successfully${folderPath ? ` in ${folderPath}` : ' in root directory'}`
      })
    } else {
      return JSON.stringify({
        success: false,
        error: data.error || 'Failed to create folder',
        folderName,
        folderPath: fullFolderPath
      })
    }
  },
  {
    name: "create_folder",
    description: "Create a new folder in the user's cloud workspace. Use this to organize files, create directory structures, or set up project folders. The folder will be created in the specified parent directory, or in the root directory if no parent path is provided.",
    schema: z.object({
      folderPath: z.string().optional().describe("The parent directory path where the folder should be created. Leave empty or omit to create in the root directory. Example: 'projects' or 'documents/2024'"),
      folderName: z.string().describe("The name of the folder to create. Must be a non-empty string.")
    })
  }
)

