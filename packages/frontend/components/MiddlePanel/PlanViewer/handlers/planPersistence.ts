import type { Plan } from '../PlanViewer'

/**
 * Updates the agent assignment for a todo in the markdown.
 * Adds, updates, or removes the `(agent: ...)` annotation.
 * @param markdown - The full markdown content
 * @param todoId - The todo id to update
 * @param assigneeLabel - The new agent label, or undefined/null to remove assignment
 */
export function updateTodoAgentInMarkdown(
  markdown: string, 
  todoId: string, 
  assigneeLabel: string | undefined | null
): string {
  // Find the Todos section
  const todosSectionMatch = markdown.match(/##\s+To-?[Dd]os?\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (!todosSectionMatch) {
    console.warn('[planPersistence] No Todos section found in markdown')
    return markdown
  }

  const todosSectionStart = todosSectionMatch.index!
  const todosSectionContent = todosSectionMatch[0]

  // Build regex to find the specific todo by id
  // Matches the entire line: - [x/ ] id:<todoId> | description (possibly with annotations)
  const todoLineRegex = new RegExp(
    `^(- \\[[x\\s]\\] id:${escapeRegExp(todoId)} \\|[^\\n]*)$`,
    'gm'
  )

  const updatedTodosSection = todosSectionContent.replace(todoLineRegex, (match) => {
    // Remove existing agent annotation if present
    let updatedLine = match.replace(/\s*\(agent:[^)]+\)/, '')
    
    // Add new agent annotation if provided
    if (assigneeLabel) {
      updatedLine = `${updatedLine} (agent: ${assigneeLabel})`
    }
    
    return updatedLine
  })

  if (updatedTodosSection === todosSectionContent) {
    console.warn(`[planPersistence] Todo id:${todoId} not found in Todos section`)
    return markdown
  }

  // Replace the section in the original markdown
  return (
    markdown.slice(0, todosSectionStart) +
    updatedTodosSection +
    markdown.slice(todosSectionStart + todosSectionContent.length)
  )
}

/**
 * Marks a todo as completed in the markdown by updating its checkbox.
 * Only touches the ## Todos / ## To-Dos section.
 * Replaces `- [ ] id:<todoId> | ...` with `- [x] id:<todoId> | ...`
 */
export function markTodoCompletedInMarkdown(markdown: string, todoId: string): string {
  // Find the Todos section
  const todosSectionMatch = markdown.match(/##\s+To-?[Dd]os?\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (!todosSectionMatch) {
    console.warn('[planPersistence] No Todos section found in markdown')
    return markdown
  }

  const todosSectionStart = todosSectionMatch.index!
  const todosSectionContent = todosSectionMatch[0]

  // Build regex to find the specific todo by id
  // Matches: - [ ] id:<todoId> | description
  const todoLineRegex = new RegExp(
    `^(- \\[)( )(\\] id:${escapeRegExp(todoId)} \\|.*)$`,
    'gm'
  )

  const updatedTodosSection = todosSectionContent.replace(todoLineRegex, '$1x$3')

  if (updatedTodosSection === todosSectionContent) {
    console.warn(`[planPersistence] Todo id:${todoId} not found in Todos section`)
    return markdown
  }

  // Replace the section in the original markdown
  return (
    markdown.slice(0, todosSectionStart) +
    updatedTodosSection +
    markdown.slice(todosSectionStart + todosSectionContent.length)
  )
}

/**
 * Builds the content to persist based on file type
 */
export function buildPersistedPlanContent(
  fileName: string,
  markdown: string,
  plan: Plan
): { content: string; mimeType: string } {
  if (fileName.endsWith('.json')) {
    return {
      content: JSON.stringify(plan, null, 2),
      mimeType: 'application/json',
    }
  }

  return {
    content: markdown,
    mimeType: 'text/markdown',
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
