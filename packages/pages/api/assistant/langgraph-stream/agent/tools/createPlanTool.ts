import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

/**
 * Create Plan Tool - Markdown-only plan file creation for the planning agent.
 * 
 * This tool is separate from create_file and can ONLY create `.plan.md` files.
 * Used exclusively by the planning agent in plan mode.
 */
export const createPlanTool = tool(
  async (input: { fileName: string; filePath: string; content: string }) => {
    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")

    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    // Validate fileName ends with .plan.md
    const lowerName = (input.fileName || "").toLowerCase()
    if (!lowerName.endsWith(".plan.md")) {
      throw new Error(
        `Invalid file extension. The create_plan tool can ONLY create .plan.md files. ` +
        `Received: "${input.fileName}". Please use a fileName ending with ".plan.md" ` +
        `(e.g., "my-feature.plan.md").`
      )
    }

    // Validate filePath ends with .plan.md
    const lowerPath = (input.filePath || "").toLowerCase()
    if (!lowerPath.endsWith(".plan.md")) {
      throw new Error(
        `Invalid file path extension. The create_plan tool can ONLY create .plan.md files. ` +
        `Received filePath: "${input.filePath}". Please use a filePath ending with ".plan.md".`
      )
    }

    // Validate content is provided and non-empty
    const content = typeof input.content === "string" ? input.content.trim() : ""
    if (!content) {
      throw new Error(
        "Missing required argument: content. The create_plan tool requires a `content` parameter " +
        "with the full markdown plan. Please retry with all required arguments: fileName, filePath, and content."
      )
    }

    // Create the file as markdown
    const fileBlob = new Blob([content], { type: "text/markdown" })

    const formData = new FormData()
    formData.append("file", fileBlob, input.fileName)
    formData.append("device_name", "web-editor")
    formData.append("file_path", input.filePath)
    formData.append("file_parent", input.filePath.split("/").slice(0, -1).join("/") || "root")

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!resp.ok) {
      let message = `HTTP ${resp.status}`
      try {
        const data = await resp.json()
        if (data?.error) message += ` - ${data.error}`
      } catch {}
      throw new Error(`Failed to create plan file: ${message}`)
    }

    const data = await resp.json()
    return JSON.stringify({
      result: data?.result || "success",
      file_url: data?.file_url,
      file_info: data?.file_info,
      message: data?.message || "Plan file created successfully",
    })
  },
  {
    name: "create_plan",
    description:
      "Create a new implementation plan file in the user's cloud workspace. " +
      "This tool can ONLY create `.plan.md` files (Markdown plan documents). " +
      "Use this tool to save comprehensive implementation plans that can be executed later. " +
      "The plan should follow the standard plan format with Overview, Todos, and Notes sections.",
    schema: z.object({
      fileName: z
        .string()
        .describe("The plan file name. MUST end with '.plan.md' (e.g., 'add-authentication.plan.md')"),
      filePath: z
        .string()
        .describe("Full path including the file name (e.g., 'plans/add-authentication.plan.md')"),
      content: z
        .string()
        .describe("The full markdown plan content including frontmatter, overview, todos, and notes sections"),
    }),
  }
)
