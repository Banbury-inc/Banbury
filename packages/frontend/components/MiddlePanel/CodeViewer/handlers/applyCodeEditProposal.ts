import type { CodeEditProposal, CodeEditOperation } from "../../../../assistant/ClaudeRuntimeProvider/types/codeEdit"

export interface CodeEditApplyEventDetail extends CodeEditProposal {
  preview?: boolean
}

interface ApplyCodeEditProposalParams {
  currentContent: string
  proposal: CodeEditApplyEventDetail
}

interface ApplyCodeEditProposalResult {
  success: boolean
  updatedContent: string
  appliedCount: number
  error?: string
}

function applySingleOperation(content: string, operation: CodeEditOperation): string | null {
  const originalSnippet = operation.originalSnippet ?? ""
  const replacementSnippet = operation.replacementSnippet ?? ""

  if (!originalSnippet) {
    return replacementSnippet + content
  }

  const firstIndex = content.indexOf(originalSnippet)
  if (firstIndex === -1) return null

  const lastIndex = content.lastIndexOf(originalSnippet)
  if (firstIndex !== lastIndex) return null

  return `${content.slice(0, firstIndex)}${replacementSnippet}${content.slice(firstIndex + originalSnippet.length)}`
}

export function applyCodeEditProposal({
  currentContent,
  proposal,
}: ApplyCodeEditProposalParams): ApplyCodeEditProposalResult {
  if (!proposal?.edits?.length)
    return {
      success: false,
      updatedContent: currentContent,
      appliedCount: 0,
      error: "No proposed edits were provided.",
    }

  let nextContent = currentContent
  let appliedCount = 0

  for (const operation of proposal.edits) {
    const maybeUpdated = applySingleOperation(nextContent, operation)
    if (maybeUpdated === null)
      return {
        success: false,
        updatedContent: currentContent,
        appliedCount,
        error:
          "Could not apply one or more snippets because the editor content no longer matches exactly. Regenerate the edit proposal and try again.",
      }
    nextContent = maybeUpdated
    appliedCount += 1
  }

  return {
    success: true,
    updatedContent: nextContent,
    appliedCount,
  }
}
