import React, { useMemo } from "react"
import { Code2 } from "lucide-react"
import { AIToolCard } from "./AIToolCard"
import type { AIToolCardConfig } from "./AIToolCard"
import type { CodeEditProposal, CodeEditToolResultEnvelope } from "../../../../assistant/ClaudeRuntimeProvider/types/codeEdit"
import {
  dispatchCodeEditComposerAccept,
  dispatchCodeEditComposerPreview,
  dispatchCodeEditComposerReject,
} from "./handlers/dispatchCodeEditComposerToolEvents"

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

  const toolCardArgs = useMemo(
    () => (normalizedProposal ? { ...normalizedProposal, preview: false as const } : {}),
    [normalizedProposal]
  )

  const config: AIToolCardConfig = useMemo(
    () => ({
      icon: Code2,
      displayName: normalizedProposal?.fileName || normalizedProposal?.filePath || "Code edit proposal",
      changeType: "code-edit",
      eventPrefix: "code-edit-ai",
      customPreviewHandler: (detail) => dispatchCodeEditComposerPreview({ ...detail, args: detail.args as Record<string, unknown> }),
      customAcceptHandler: (detail) => dispatchCodeEditComposerAccept({ ...detail, args: detail.args as Record<string, unknown> }),
      customRejectHandler: (detail) => dispatchCodeEditComposerReject({ ...detail, args: detail.args as Record<string, unknown> }),
      subtitle: normalizedProposal
        ? `${normalizedProposal.summary} (${normalizedProposal.edits.length} edit${normalizedProposal.edits.length === 1 ? "" : "s"})`
        : undefined,
    }),
    [normalizedProposal]
  )

  if (!normalizedProposal) return <AIToolCard config={config} args={{}} hasContent={false} />

  return <AIToolCard config={config} args={toolCardArgs} hasContent={hasContent} />
}

export default CodeEditTool
