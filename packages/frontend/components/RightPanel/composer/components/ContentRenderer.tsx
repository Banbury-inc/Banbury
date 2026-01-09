import React from "react"
import { MarkdownText } from "../../markdown-text"

/**
 * Custom content renderer for text parts
 * Note: Subagent content is now rendered inside SubagentTool component
 */
export function ContentRenderer() {
  return <MarkdownText />
}

export default ContentRenderer
