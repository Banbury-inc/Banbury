import type { CodeEditProposal } from "../../../../assistant/ClaudeRuntimeProvider/types/codeEdit"
import { applyCodeEditProposal, applySingleCodeEditOperation } from "./applyCodeEditProposal"

export interface IdeCodeEditReviewSession {
  proposal: CodeEditProposal
  baselineContent: string
  workingContent: string
  hunkIndex: number
}

export function computeReviewDiffModified(
  session: IdeCodeEditReviewSession,
): { modified: string; error: string | null } {
  const { workingContent, hunkIndex, proposal } = session
  if (hunkIndex >= proposal.edits.length) return { modified: workingContent, error: null }
  const result = applySingleCodeEditOperation({
    currentContent: workingContent,
    operation: proposal.edits[hunkIndex],
  })
  if (!result.success) return { modified: workingContent, error: result.error }
  return { modified: result.updatedContent, error: null }
}

export function tryAcceptReviewHunk(session: IdeCodeEditReviewSession):
  | { ok: true; nextWorking: string; nextIndex: number; finished: boolean }
  | { ok: false; error: string } {
  const { workingContent, hunkIndex, proposal } = session
  if (hunkIndex >= proposal.edits.length) return { ok: false, error: "No pending hunk to accept." }
  const result = applySingleCodeEditOperation({
    currentContent: workingContent,
    operation: proposal.edits[hunkIndex],
  })
  if (!result.success) return { ok: false, error: result.error }
  const nextIndex = hunkIndex + 1
  return {
    ok: true,
    nextWorking: result.updatedContent,
    nextIndex,
    finished: nextIndex >= proposal.edits.length,
  }
}

export function tryAcceptAllRemainingReviewHunks(
  session: IdeCodeEditReviewSession,
): ReturnType<typeof applyCodeEditProposal> {
  const remaining = session.proposal.edits.slice(session.hunkIndex)
  return applyCodeEditProposal({
    currentContent: session.workingContent,
    proposal: { ...session.proposal, edits: remaining },
  })
}
