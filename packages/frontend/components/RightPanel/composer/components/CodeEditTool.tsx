import React, { useMemo } from "react"
import { Code2 } from "lucide-react"
import { AIToolCard } from "./AIToolCard"
import type { AIToolCardConfig } from "./AIToolCard"
import type { CodeEditProposal, CodeEditToolResultEnvelope } from "../../../../assistant/ClaudeRuntimeProvider/types/codeEdit"

interface CodeEditToolProps {
  args?: {
    filePath?: string
    fileName?: string
    summary?: string
    edits?: Array<{ description?: string; originalSnippet?: string; replacementSnippet?: string }>
    confidence?: number
  }
  result?: unknown
}

function parseCodeEditProposal(result: unknown): CodeEditProposal | null {
  let parsed: CodeEditToolResultEnvelope | null = null

  if (typeof result === "string") {
    try {
      parsed = JSON.parse(result) as CodeEditToolResultEnvelope
    } catch {
      return null
    }
  } else if (result && typeof result === "object") {
    parsed = result as CodeEditToolResultEnvelope
  }

  if (!parsed?.success || !parsed.proposal) return null
  return parsed.proposal
}

export const CodeEditTool: React.FC<CodeEditToolProps> = ({ args, result }) => {
  const proposal = useMemo(() => parseCodeEditProposal(result), [result])
  const normalizedProposal = useMemo<CodeEditProposal | null>(() => {
    if (proposal) return proposal
    if (!args?.filePath || !args?.summary || !Array.isArray(args.edits) || args.edits.length === 0) return null

    return {
      changeId: "",
      filePath: args.filePath,
      fileName: args.fileName || null,
      summary: args.summary,
      edits: args.edits.map((edit) => ({
        description: edit.description,
        originalSnippet: edit.originalSnippet || "",
        replacementSnippet: edit.replacementSnippet || "",
      })),
      confidence: args.confidence,
    }
  }, [args, proposal])

  const hasContent = Boolean(normalizedProposal && normalizedProposal.edits.length > 0)

  const config: AIToolCardConfig = useMemo(
    () => ({
      icon: Code2,
      displayName: normalizedProposal?.fileName || normalizedProposal?.filePath || "Code edit proposal",
      changeType: "code-edit",
      subtitle: normalizedProposal
        ? `${normalizedProposal.summary} (${normalizedProposal.edits.length} edit${normalizedProposal.edits.length === 1 ? "" : "s"})`
        : undefined,
      customPreviewHandler: ({ args: eventArgs, changeId }) => {
        window.dispatchEvent(
          new CustomEvent("assistant-code-edit-proposed", {
            detail: { ...eventArgs, changeId, preview: true },
          })
        )
      },
      customAcceptHandler: ({ args: eventArgs, changeId }) => {
        window.dispatchEvent(
          new CustomEvent("assistant-code-edit-apply", {
            detail: { ...eventArgs, changeId, preview: false },
          })
        )
      },
      customRejectHandler: ({ args: eventArgs, changeId }) => {
        window.dispatchEvent(
          new CustomEvent("assistant-code-edit-reject", {
            detail: { ...eventArgs, changeId },
          })
        )
      },
    }),
    [normalizedProposal?.fileName, normalizedProposal?.filePath]
  )

  if (!normalizedProposal) return <AIToolCard config={config} args={{}} hasContent={false} />

  return <AIToolCard config={config} args={normalizedProposal} hasContent={hasContent} />
}

export default CodeEditTool
