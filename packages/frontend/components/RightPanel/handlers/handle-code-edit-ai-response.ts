/**
 * Handler for code edit AI tool responses.
 * Mirrors the document editing pattern: IDE registers itself, handler finds and applies.
 */

import type { CodeEditProposal } from "../../../assistant/ClaudeRuntimeProvider/types/codeEdit"
import { applyCodeEditProposal } from "../../MiddlePanel/CodeViewer/handlers/applyCodeEditProposal"

export interface CodeEditorApi {
  filePath: string
  getContent: () => string
  setContent: (content: string) => void
  setIsModified: (modified: boolean) => void
  setStatus: (status: string | null) => void
  appliedChangeIds: Set<string>
}

const codeEditorRegistry: CodeEditorApi[] = []

export function registerCodeEditor(api: CodeEditorApi): void {
  if (typeof window === "undefined") return
  unregisterCodeEditor(api.filePath)
  codeEditorRegistry.push(api)
}

export function unregisterCodeEditor(filePath: string): void {
  const idx = codeEditorRegistry.findIndex((e) => e.filePath === filePath)
  if (idx >= 0) codeEditorRegistry.splice(idx, 1)
}

function findMatchingCodeEditor(proposalFilePath: string): CodeEditorApi | null {
  const proposalFileName = proposalFilePath.split("/").pop() || proposalFilePath
  for (let i = codeEditorRegistry.length - 1; i >= 0; i--) {
    const api = codeEditorRegistry[i]
    const editorFileName = api.filePath.split("/").pop() || api.filePath
    if (
      api.filePath === proposalFilePath ||
      (proposalFileName && editorFileName && proposalFileName === editorFileName)
    ) {
      return api
    }
  }
  return null
}

export function handleCodeEditAIResponse(payload: CodeEditProposal): void {
  if (!payload?.filePath || !payload?.edits?.length) return

  const api = findMatchingCodeEditor(payload.filePath)
  if (!api) {
    return
  }

  if (!payload.changeId || api.appliedChangeIds.has(payload.changeId)) return
  if (payload.preview) return

  const currentContent = api.getContent()
  const result = applyCodeEditProposal({
    currentContent,
    proposal: payload,
  })

  if (!result.success) {
    api.setStatus(result.error || "Failed to apply code edit proposal.")
    return
  }

  api.appliedChangeIds.add(payload.changeId)
  api.setContent(result.updatedContent)
  api.setIsModified(true)
  api.setStatus(
    `Applied ${result.appliedCount} AI code edit${result.appliedCount === 1 ? "" : "s"}.`
  )
}
