import type { MutableRefObject } from "react"
import type { CodeEditApplyEventDetail } from "./applyCodeEditProposal"
import { applyCodeEditProposal } from "./applyCodeEditProposal"

interface CreateCodeEditApplyHandlerParams {
  getCurrentContent: () => string
  currentFilePath: string
  setContent: (content: string) => void
  setIsModified: (isModified: boolean) => void
  setCodeEditStatus: (status: string | null) => void
  appliedChangeIdsRef: MutableRefObject<Set<string>>
}

export function createCodeEditApplyHandler({
  getCurrentContent,
  currentFilePath,
  setContent,
  setIsModified,
  setCodeEditStatus,
  appliedChangeIdsRef,
}: CreateCodeEditApplyHandlerParams) {
  return (event: Event) => {
    const detail = (event as CustomEvent<CodeEditApplyEventDetail>).detail
    if (!detail || detail.preview) return
    if (!detail.changeId || appliedChangeIdsRef.current.has(detail.changeId)) return

    const proposalPath = detail.filePath?.trim() || ""
    const proposalFileName = proposalPath.split("/").pop() || proposalPath
    const currentFileName = currentFilePath.split("/").pop() || currentFilePath
    const pathsMatch =
      proposalPath === currentFilePath ||
      (proposalFileName && currentFileName && proposalFileName === currentFileName)

    if (!pathsMatch) {
      setCodeEditStatus("This code edit proposal targets a different file than the one currently open.")
      return
    }

    const currentContent = getCurrentContent()
    const result = applyCodeEditProposal({
      currentContent,
      proposal: detail,
    })

    if (!result.success) {
      setCodeEditStatus(result.error || "Failed to apply code edit proposal.")
      return
    }

    appliedChangeIdsRef.current.add(detail.changeId)
    setContent(result.updatedContent)
    setIsModified(true)
    setCodeEditStatus(`Applied ${result.appliedCount} AI code edit${result.appliedCount === 1 ? "" : "s"}.`)
  }
}
