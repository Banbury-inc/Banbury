import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { createHash } from "crypto"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

interface CodeEditOperation {
  description?: string
  originalSnippet: string
  replacementSnippet: string
}

function buildChangeId(filePath: string, summary: string, edits: CodeEditOperation[]): string {
  const payload = JSON.stringify({
    filePath,
    summary,
    edits: edits.map((edit) => ({
      description: edit.description || "",
      originalSnippet: edit.originalSnippet,
      replacementSnippet: edit.replacementSnippet,
    })),
  })

  const digest = createHash("sha256").update(payload).digest("hex").slice(0, 16)
  return `code-edit-${digest}`
}

export const codeEditOpenFileTool = tool(
  async (input: {
    filePath?: string
    summary: string
    edits: CodeEditOperation[]
    confidence?: number
  }) => {
    const currentCodeFile = getServerContextValue<{ filePath?: string; fileName?: string }>("currentCodeFile")
    const openFilePath = currentCodeFile?.filePath || ""

    if (!openFilePath) {
      throw new Error(
        "No open code file context is available. Ask the user to open a code file in the editor, then retry."
      )
    }

    const requestedFilePath = typeof input.filePath === "string" && input.filePath.trim().length > 0
      ? input.filePath.trim()
      : openFilePath
    const requestedFileName = requestedFilePath.split("/").pop() || ""
    const openFileName = openFilePath.split("/").pop() || ""
    const isSameFile = requestedFilePath === openFilePath || (requestedFileName && requestedFileName === openFileName)

    if (!isSameFile) {
      throw new Error(
        `This tool can only target the currently open file. Requested: "${requestedFilePath}", open file: "${openFilePath}".`
      )
    }

    if (!Array.isArray(input.edits) || input.edits.length === 0) {
      throw new Error("At least one edit is required.")
    }

    const normalizedEdits = input.edits.map((edit, index) => {
      const originalSnippet = typeof edit.originalSnippet === "string" ? edit.originalSnippet : ""
      const replacementSnippet = typeof edit.replacementSnippet === "string" ? edit.replacementSnippet : ""
      const description = typeof edit.description === "string" ? edit.description : `Edit ${index + 1}`

      if (replacementSnippet === "" && originalSnippet === "") {
        throw new Error(`Edit ${index + 1} must have either originalSnippet or replacementSnippet.`)
      }

      return {
        description,
        originalSnippet,
        replacementSnippet,
      }
    })

    const confidence = typeof input.confidence === "number" ? Math.max(0, Math.min(1, input.confidence)) : 0.7
    const changeId = buildChangeId(openFilePath, input.summary, normalizedEdits)

    return JSON.stringify({
      success: true,
      type: "code-edit-proposal",
      proposal: {
        changeId,
        filePath: openFilePath,
        fileName: currentCodeFile?.fileName || null,
        summary: input.summary,
        edits: normalizedEdits,
        confidence,
      },
    })
  },
  {
    name: "code_edit_open_file",
    description:
      "Primary tool for editing the user's open source code file in the IDE (TypeScript, JavaScript, Python, etc.). " +
      "Use exact snippet replacements (originalSnippet -> replacementSnippet). " +
      "Do not use docx_ai for code files — docx_ai is only for Word .docx documents. " +
      "Never use this tool for creating, deleting, renaming, or editing other files.",
    schema: z.object({
      filePath: z
        .string()
        .optional()
        .describe("Exact path of the currently open code file. Must match the active editor file path."),
      summary: z
        .string()
        .describe("A concise explanation of what the proposed code change does."),
      edits: z
        .array(
          z.object({
            description: z.string().optional().describe("Short reason for this edit."),
            originalSnippet: z
              .string()
              .describe("Exact existing code snippet to replace. Must match file contents."),
            replacementSnippet: z
              .string()
              .describe("Replacement code for originalSnippet."),
          })
        )
        .min(1)
        .describe("Ordered snippet replacement operations for the open file."),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Model confidence from 0 to 1."),
    }),
  }
)
