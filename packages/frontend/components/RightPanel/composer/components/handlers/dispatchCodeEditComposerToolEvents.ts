/**
 * Window events for code-edit tool card ↔ IDE. Apply path uses the same event as
 * handleCodeEditAIResponse; preview/focus uses a dedicated event for future IDE review UI.
 */

interface ComposerToolDetail {
  changeId: string
  preview: boolean
  args: Record<string, unknown>
}

export function dispatchCodeEditComposerPreview(detail: ComposerToolDetail): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("assistant-code-edit-focus-review", {
      detail: {
        ...detail.args,
        changeId: detail.changeId,
        preview: true,
      },
    })
  )
}

export function dispatchCodeEditComposerAccept(detail: ComposerToolDetail): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("code-edit-ai-response", {
      detail: {
        ...detail.args,
        preview: false,
        changeId: detail.changeId,
      },
    })
  )
}

export function dispatchCodeEditComposerReject(detail: { changeId: string; args: Record<string, unknown> }): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("assistant-code-edit-rejected", {
      detail: {
        changeId: detail.changeId,
        filePath: typeof detail.args.filePath === "string" ? detail.args.filePath : undefined,
      },
    })
  )
}
