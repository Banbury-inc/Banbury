/**
 * Subagent Types and Configuration
 * 
 * Defines the contract for multi-agent workflows where a main agent can spawn
 * multiple specialized subagents in parallel. Each subagent role has:
 * - A dedicated system prompt with role-specific instructions
 * - A tool allowlist (sandboxed capabilities)
 * - Output format constraints
 * 
 * Following the LangChain Multi-agent / Subagents + Skills patterns:
 * https://docs.langchain.com/oss/javascript/langchain/multi-agent
 */

import { z } from "zod"

// ============================================================================
// Subagent Roles
// ============================================================================

/**
 * Available subagent roles with their capabilities:
 * - researcher: Web search, summarization, citations (read-only)
 * - codebase: Search files/memory, analyze code (read-only)
 * - planner: Create plans, research (read-only + plan creation)
 * - coder: Full tools including file creation/editing (write-capable)
 * - reviewer: Read-only analysis, critique, risk assessment
 */
export const SUBAGENT_ROLES = ["researcher", "codebase", "planner", "coder", "reviewer"] as const
export type SubagentRole = typeof SUBAGENT_ROLES[number]

/**
 * Roles that have write capabilities (can modify files/state)
 * Only ONE write-capable role can be spawned per spawn_subagents call
 */
export const WRITE_CAPABLE_ROLES: SubagentRole[] = ["coder"]

// ============================================================================
// Input/Output Schemas
// ============================================================================

/**
 * Single subagent specification
 */
export const SubagentSpecSchema = z.object({
  id: z.string().describe("Unique identifier for this subagent (e.g., 'research-1', 'code-impl')"),
  role: z.enum(SUBAGENT_ROLES).describe("The specialized role this subagent should take"),
  goal: z.string().describe("What this subagent should accomplish - be specific and actionable"),
  context: z.string().optional().describe("Optional additional context, inputs, or constraints for this subagent"),
})

export type SubagentSpec = z.infer<typeof SubagentSpecSchema>

/**
 * Options for subagent execution
 */
export const SubagentOptionsSchema = z.object({
  maxConcurrency: z.number().int().min(1).max(6).optional()
    .describe("Maximum number of subagents to run in parallel (default: 4, max: 6)"),
  timeoutMs: z.number().int().min(10000).max(300000).optional()
    .describe("Per-subagent timeout in milliseconds (default: 120000 = 2 minutes)"),
  recursionLimit: z.number().int().min(1).max(100).optional()
    .describe("Maximum tool call iterations per subagent (default: 25)"),
})

export type SubagentOptions = z.infer<typeof SubagentOptionsSchema>

/**
 * Full input schema for spawn_subagents tool
 */
export const SpawnSubagentsInputSchema = z.object({
  subagents: z.array(SubagentSpecSchema).min(1).max(6)
    .describe("List of subagents to spawn (1-6 subagents)"),
  options: SubagentOptionsSchema.optional()
    .describe("Optional execution options"),
})

export type SpawnSubagentsInput = z.infer<typeof SpawnSubagentsInputSchema>

/**
 * Single subagent result
 */
export interface SubagentResult {
  id: string
  role: SubagentRole
  status: "completed" | "failed" | "timeout"
  summary: string
  citations?: string[]
  error?: string
  durationMs: number
  toolsUsed?: string[]
}

/**
 * Full output from spawn_subagents
 */
export interface SpawnSubagentsOutput {
  results: SubagentResult[]
  totalDurationMs: number
  completedCount: number
  failedCount: number
}

// ============================================================================
// Role Configurations
// ============================================================================

/**
 * Tool allowlists per role
 * Maps role to array of tool names that role can use
 */
export const ROLE_TOOL_ALLOWLISTS: Record<SubagentRole, string[]> = {
  researcher: [
    "web_search",
    "get_current_date_time",
  ],
  codebase: [
    "search_files",
    "search_memory",
    "get_current_date_time",
    "onedrive_status",
    "onedrive_list_root",
    "onedrive_list_folder",
    "onedrive_search",
    "onedrive_get_item",
    "onedrive_download_file",
    "onedrive_get_permissions",
  ],
  planner: [
    "search_files",
    "search_memory",
    "web_search",
    "get_current_date_time",
    "onedrive_status",
    "onedrive_list_root",
    "onedrive_list_folder",
    "onedrive_search",
    "onedrive_get_item",
    "onedrive_download_file",
    "onedrive_get_permissions",
  ],
  coder: [
    // Full tool access for implementation
    "web_search",
    "search_files",
    "search_memory",
    "create_file",
    "create_folder",
    "write_workspace_file",
    "execute_script",
    "download_from_url",
    "generate_image",
    "get_current_date_time",
    // Document tools
    "docx_ai",
    "sheet_ai",
    "pptx_ai",
    "tldraw_ai",
    // OneDrive read/write tools
    "onedrive_status",
    "onedrive_list_root",
    "onedrive_list_folder",
    "onedrive_search",
    "onedrive_get_item",
    "onedrive_download_file",
    "onedrive_upload_text_file",
    "onedrive_update_text_file",
    "onedrive_create_folder",
    "onedrive_rename_move",
    "onedrive_delete_item",
    "onedrive_create_share_link",
    "onedrive_invite",
    "onedrive_get_permissions",
  ],
  reviewer: [
    "search_files",
    "search_memory",
    "web_search",
    "get_current_date_time",
    "onedrive_status",
    "onedrive_list_root",
    "onedrive_list_folder",
    "onedrive_search",
    "onedrive_get_item",
    "onedrive_download_file",
    "onedrive_get_permissions",
  ],
}

/**
 * System prompts per role
 * Each prompt defines the role's behavior, constraints, and output format
 */
export const ROLE_SYSTEM_PROMPTS: Record<SubagentRole, string> = {
  researcher: `You are a **Researcher Subagent** specialized in finding and synthesizing information from the web.

## Your Role
- Search the web for relevant, accurate, and up-to-date information
- Synthesize findings into clear, actionable summaries
- Always cite your sources with URLs

## Output Format
Provide your findings in this structure:
1. **Summary**: A concise overview of what you found (2-3 paragraphs max)
2. **Key Findings**: Bullet points of the most important information
3. **Citations**: List all sources with URLs

## Constraints
- You can ONLY search the web - no file operations or code execution
- Focus on factual, verifiable information
- If you cannot find information, say so clearly
- Do not make up information or sources`,

  codebase: `You are a **Codebase Analyst Subagent** specialized in understanding and analyzing code and files.

## Your Role
- Search and analyze files in the user's cloud storage
- Search memory for relevant past context and decisions
- Identify patterns, structures, and potential issues
- Provide insights about code organization and architecture

## Output Format
Provide your analysis in this structure:
1. **Summary**: Overview of what you found and analyzed
2. **Key Observations**: Important patterns, structures, or issues identified
3. **Relevant Files**: List files you examined with brief descriptions
4. **Recommendations**: Suggestions based on your analysis (if applicable)

## Constraints
- You are READ-ONLY - no file modifications allowed
- Focus on understanding and analysis, not implementation
- Be specific about file paths and code locations
- If you cannot find something, say so clearly`,

  planner: `You are a **Planner Subagent** specialized in creating detailed implementation plans.

## Your Role
- Research and understand the problem space
- Break down complex tasks into actionable steps
- Identify dependencies and potential blockers
- Create comprehensive implementation plans

## Output Format
Provide your plan in this structure:
1. **Overview**: What needs to be done and why
2. **Tasks**: Numbered list of specific, actionable tasks
3. **Dependencies**: Which tasks depend on others
4. **Risks**: Potential issues and mitigation strategies
5. **Estimated Effort**: Rough complexity assessment per task

## Constraints
- You can research but NOT create plan files (just provide the plan content)
- Focus on clarity and actionability
- Consider edge cases and error handling
- Plans should be specific enough for another agent to execute`,

  coder: `You are a **Coder Subagent** specialized in implementing code and creating files.

## Your Role
- Implement features, fixes, and improvements
- Create and modify files as needed
- Write clean, well-documented code
- Follow best practices and existing patterns

## Output Format
After completing your work, provide:
1. **Summary**: What you implemented and why
2. **Files Changed**: List of files created or modified
3. **Testing Notes**: How to verify your changes work
4. **Known Limitations**: Any caveats or future improvements needed

## Constraints
- Follow the existing code style and patterns
- Write meaningful comments for complex logic
- Handle errors gracefully
- If you're unsure about something, note it in your summary`,

  reviewer: `You are a **Reviewer Subagent** specialized in code review and quality assessment.

## Your Role
- Analyze code, plans, and implementations for quality
- Identify bugs, security issues, and potential problems
- Suggest improvements and best practices
- Assess completeness and correctness

## Output Format
Provide your review in this structure:
1. **Overall Assessment**: Pass/Needs Work/Fail with brief explanation
2. **Issues Found**: Categorized list (Critical, Major, Minor)
3. **Positive Observations**: What's done well
4. **Recommendations**: Specific suggestions for improvement
5. **Questions**: Anything unclear that needs clarification

## Constraints
- You are READ-ONLY - identify issues but don't fix them
- Be constructive and specific in feedback
- Prioritize issues by severity
- Consider security, performance, and maintainability`,
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates that only one write-capable role is specified
 */
export function validateWriteIsolation(subagents: SubagentSpec[]): { valid: boolean; error?: string } {
  const writeRoles = subagents.filter(s => WRITE_CAPABLE_ROLES.includes(s.role))
  if (writeRoles.length > 1) {
    return {
      valid: false,
      error: `Only one write-capable role allowed per spawn. Found ${writeRoles.length} write-capable roles: ${writeRoles.map(s => `${s.id} (${s.role})`).join(", ")}. Write-capable roles: ${WRITE_CAPABLE_ROLES.join(", ")}`
    }
  }
  return { valid: true }
}

/**
 * Validates subagent IDs are unique
 */
export function validateUniqueIds(subagents: SubagentSpec[]): { valid: boolean; error?: string } {
  const ids = subagents.map(s => s.id)
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Duplicate subagent IDs found: ${[...new Set(duplicates)].join(", ")}`
    }
  }
  return { valid: true }
}

/**
 * Full validation of spawn_subagents input
 */
export function validateSpawnInput(input: SpawnSubagentsInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const writeCheck = validateWriteIsolation(input.subagents)
  if (!writeCheck.valid && writeCheck.error) errors.push(writeCheck.error)
  
  const idCheck = validateUniqueIds(input.subagents)
  if (!idCheck.valid && idCheck.error) errors.push(idCheck.error)
  
  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Default Options
// ============================================================================

export const DEFAULT_SUBAGENT_OPTIONS: Required<SubagentOptions> = {
  maxConcurrency: 4,
  timeoutMs: 120000, // 2 minutes
  recursionLimit: 25, // Increased from 10 to allow more complex tool chains
}
