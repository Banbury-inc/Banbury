import type { CodeEditProposal, CodeEditOperation } from "../../../../assistant/ClaudeRuntimeProvider/types/codeEdit"

export interface CodeEditApplyEventDetail extends CodeEditProposal {
  preview?: boolean
}

export interface ApplyCodeEditProposalResult {
  success: boolean
  updatedContent: string
  appliedCount: number
  error?: string
}

/** Same message as batch apply when a snippet is missing or ambiguous. */
export const CODE_EDIT_SNIPPET_MISMATCH_ERROR =
  "Could not apply one or more snippets because the editor content no longer matches exactly. Regenerate the edit proposal and try again."

interface ApplyCodeEditProposalParams {
  currentContent: string
  proposal: CodeEditApplyEventDetail
}

/** Collapses \\r\\n, lone \\r, and \\n to a single \\n for comparison (AI snippets are usually \\n-only). */
function toNormalizedNewlines(s: string): string {
  let out = ""
  let i = 0
  while (i < s.length) {
    if (s[i] === "\r" && s[i + 1] === "\n") {
      out += "\n"
      i += 2
    } else if (s[i] === "\r" || s[i] === "\n") {
      out += "\n"
      i += 1
    } else {
      out += s[i]
      i += 1
    }
  }
  return out
}

/** `starts[k]` = byte offset in `content` where normalized character `k` begins; last entry = end of `content`. */
function normalizedIndexToOriginalStarts(content: string): number[] {
  const starts: number[] = []
  let i = 0
  while (i < content.length) {
    starts.push(i)
    if (content[i] === "\r" && content[i + 1] === "\n") i += 2
    else if (content[i] === "\r" || content[i] === "\n") i += 1
    else i += 1
  }
  starts.push(i)
  return starts
}

function applyExactSnippet(
  content: string,
  originalSnippet: string,
  replacementSnippet: string,
): string | null {
  const firstIndex = content.indexOf(originalSnippet)
  if (firstIndex === -1) return null
  const lastIndex = content.lastIndexOf(originalSnippet)
  if (firstIndex !== lastIndex) return null
  return `${content.slice(0, firstIndex)}${replacementSnippet}${content.slice(firstIndex + originalSnippet.length)}`
}

function applyNewlineFlexibleSnippet(
  content: string,
  originalSnippet: string,
  replacementSnippet: string,
): string | null {
  const starts = normalizedIndexToOriginalStarts(content)
  const normContent = toNormalizedNewlines(content)
  const normSnippet = toNormalizedNewlines(originalSnippet)
  if (!normSnippet.length) return null

  const firstNorm = normContent.indexOf(normSnippet)
  if (firstNorm === -1) return null
  const lastNorm = normContent.lastIndexOf(normSnippet)
  if (firstNorm !== lastNorm) return null

  const origStart = starts[firstNorm]
  const origEnd = starts[firstNorm + normSnippet.length]
  return `${content.slice(0, origStart)}${replacementSnippet}${content.slice(origEnd)}`
}

export function applySingleOperation(content: string, operation: CodeEditOperation): string | null {
  const originalSnippet = operation.originalSnippet ?? ""
  const replacementSnippet = operation.replacementSnippet ?? ""

  if (!originalSnippet) {
    return replacementSnippet + content
  }

  const exact = applyExactSnippet(content, originalSnippet, replacementSnippet)
  if (exact !== null) return exact

  return applyNewlineFlexibleSnippet(content, originalSnippet, replacementSnippet)
}

/**
 * One hunk for the IDE stepper. On failure, `updatedContent` is unchanged from `currentContent`.
 * Reject-hunk in the UI should discard the entire proposal, not only skip this operation.
 */
export function applySingleCodeEditOperation(params: {
  currentContent: string
  operation: CodeEditOperation
}): ApplyCodeEditProposalResult {
  const { currentContent, operation } = params
  const maybeUpdated = applySingleOperation(currentContent, operation)
  if (maybeUpdated === null)
    return {
      success: false,
      updatedContent: currentContent,
      appliedCount: 0,
      error: CODE_EDIT_SNIPPET_MISMATCH_ERROR,
    }
  return {
    success: true,
    updatedContent: maybeUpdated,
    appliedCount: 1,
  }
}

/**
 * Applies all operations in order. For accept-all from hunk `i`, slice: `edits: proposal.edits.slice(i)`.
 * Atomic batch: if operation k fails, the file stays at original content (no partial apply).
 * Per-hunk review: rejecting a hunk aborts the whole proposal.
 */
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
    if (maybeUpdated === null) {
      const suffix =
        appliedCount > 0
          ? ` Failed at edit ${appliedCount + 1} of ${proposal.edits.length}; no changes were applied.`
          : ""
      return {
        success: false,
        updatedContent: currentContent,
        appliedCount,
        error: CODE_EDIT_SNIPPET_MISMATCH_ERROR + suffix,
      }
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
