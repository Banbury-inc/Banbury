/**
 * Handler for code edit AI tool responses.
 * Mirrors the document editing pattern: IDE registers itself, handler finds and applies.
 *
 * Editor matching uses normalized full paths only (no basename fallback) so edits never apply
 * to a different file that happens to share the same name.
 *
 * Duplicate `changeId`: same proposal is not applied twice; `appliedChangeIds` on the editor gates that.
 */

import type { CodeEditProposal } from "../../../assistant/ClaudeRuntimeProvider/types/codeEdit"
import { applyCodeEditProposal } from "../../MiddlePanel/CodeViewer/handlers/applyCodeEditProposal"
import { normalizeCodeWorkspacePath } from "./normalizeCodeWorkspacePath"

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
  const target = normalizeCodeWorkspacePath(proposalFilePath)
  if (!target) return null
  for (let i = codeEditorRegistry.length - 1; i >= 0; i--) {
    const api = codeEditorRegistry[i]
    if (normalizeCodeWorkspacePath(api.filePath) === target) return api
  }
  return null
}

const EDITOR_REGISTRATION_WAIT_MS = 4000
const EDITOR_RETRY_INTERVAL_MS = 100

function dispatchCodeEditFailed(detail: { reason: string; filePath: string }): void {
  if (typeof window === "undefined") return
  try {
    window.dispatchEvent(new CustomEvent("assistant-code-edit-failed", { detail }))
  } catch {
    // Ignore dispatch errors
  }
}

export function handleCodeEditAIResponse(payload: CodeEditProposal): void {
  if (!payload?.filePath || !payload?.edits?.length) return
  if (payload.preview) return

  const waitDeadline = Date.now() + EDITOR_REGISTRATION_WAIT_MS

  function attemptApply(): void {
    const api = findMatchingCodeEditor(payload.filePath)
    if (!api) {
      if (Date.now() >= waitDeadline) {
        const reason =
          codeEditorRegistry.length > 0 ? "wrong-target-file" : "no-matching-editor"
        dispatchCodeEditFailed({
          reason,
          filePath: payload.filePath,
        })
        return
      }
      window.setTimeout(attemptApply, EDITOR_RETRY_INTERVAL_MS)
      return
    }

    if (payload.changeId && api.appliedChangeIds.has(payload.changeId)) {
      api.setStatus("This AI code edit was already applied.")
      return
    }

    const currentContent = api.getContent()
    const result = applyCodeEditProposal({
      currentContent,
      proposal: payload,
    })

    if (!result.success) {
      api.setStatus(result.error || "Failed to apply code edit proposal.")
      return
    }

    if (payload.changeId) api.appliedChangeIds.add(payload.changeId)
    api.setContent(result.updatedContent)
    api.setIsModified(true)
    api.setStatus(
      `Applied ${result.appliedCount} AI code edit${result.appliedCount === 1 ? "" : "s"}.`
    )
  }

  attemptApply()
}

let codeEditResponseWindowListenerAttached = false

/** Single window listener so Thread and IDE do not both subscribe to the same event. */
export function ensureCodeEditAIResponseWindowListener(): void {
  if (typeof window === "undefined" || codeEditResponseWindowListenerAttached) return
  codeEditResponseWindowListenerAttached = true
  window.addEventListener("code-edit-ai-response", ((event: Event) => {
    const detail = (event as CustomEvent<CodeEditProposal & { preview?: boolean }>).detail
    handleCodeEditAIResponse(detail)
  }) as EventListener)
}
