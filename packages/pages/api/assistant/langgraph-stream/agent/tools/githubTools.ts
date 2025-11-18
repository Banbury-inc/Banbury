import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

// GitHub tools (proxy to Banbury API). Respects user toolPreferences via server context
export const githubListReposTool = tool(
  async (input: { visibility?: 'all' | 'public' | 'private'; sort?: 'created' | 'updated' | 'pushed' | 'full_name'; perPage?: number; page?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      visibility: input.visibility || 'all',
      sort: input.sort || 'updated',
      per_page: String(Math.min(input.perPage || 30, 100)),
      page: String(input.page || 1)
    })

    const url = `${apiBase}/authentication/github/repos/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, repositories: data.repositories || [] })
  },
  {
    name: "github_list_repos",
    description: "List GitHub repositories for the authenticated user. Returns repository name, description, language, stars, and other metadata.",
    schema: z.object({
      visibility: z.enum(['all', 'public', 'private']).optional().describe("Filter by repository visibility (default: all)"),
      sort: z.enum(['created', 'updated', 'pushed', 'full_name']).optional().describe("Sort repositories by (default: updated)"),
      perPage: z.number().optional().describe("Results per page (default 30, max 100)"),
      page: z.number().optional().describe("Page number for pagination (default 1)")
    })
  }
)

export const githubGetRepoTool = tool(
  async (input: { owner: string; repo: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/github/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, repository: data })
  },
  {
    name: "github_get_repo",
    description: "Get detailed information about a specific GitHub repository including description, languages, stars, forks, and more.",
    schema: z.object({
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name")
    })
  }
)

export const githubListIssuesTool = tool(
  async (input: { owner: string; repo: string; state?: 'open' | 'closed' | 'all'; perPage?: number; page?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      state: input.state || 'open',
      per_page: String(Math.min(input.perPage || 30, 100)),
      page: String(input.page || 1)
    })

    const url = `${apiBase}/authentication/github/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/issues/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, issues: data.issues || [] })
  },
  {
    name: "github_list_issues",
    description: "List issues for a GitHub repository. Returns issue title, number, state, labels, and assignees.",
    schema: z.object({
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      state: z.enum(['open', 'closed', 'all']).optional().describe("Filter by issue state (default: open)"),
      perPage: z.number().optional().describe("Results per page (default 30, max 100)"),
      page: z.number().optional().describe("Page number for pagination (default 1)")
    })
  }
)

export const githubCreateIssueTool = tool(
  async (input: { owner: string; repo: string; title: string; body?: string; labels?: string[]; assignees?: string[] }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const url = `${apiBase}/authentication/github/issues/create/`
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        owner: input.owner,
        repo: input.repo,
        title: input.title,
        body: input.body || '',
        labels: input.labels || [],
        assignees: input.assignees || []
      })
    })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, issue: data, message: 'Issue created successfully' })
  },
  {
    name: "github_create_issue",
    description: "Create a new issue in a GitHub repository. Returns the created issue with its number and URL.",
    schema: z.object({
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      title: z.string().describe("Issue title"),
      body: z.string().optional().describe("Issue description/body (supports Markdown)"),
      labels: z.array(z.string()).optional().describe("Array of label names to apply"),
      assignees: z.array(z.string()).optional().describe("Array of GitHub usernames to assign")
    })
  }
)

export const githubListPullRequestsTool = tool(
  async (input: { owner: string; repo: string; state?: 'open' | 'closed' | 'all'; perPage?: number; page?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      state: input.state || 'open',
      per_page: String(Math.min(input.perPage || 30, 100)),
      page: String(input.page || 1)
    })

    const url = `${apiBase}/authentication/github/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/pulls/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ success: true, pull_requests: data.pull_requests || [] })
  },
  {
    name: "github_list_pull_requests",
    description: "List pull requests for a GitHub repository. Returns PR title, number, state, branch information, and author.",
    schema: z.object({
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      state: z.enum(['open', 'closed', 'all']).optional().describe("Filter by PR state (default: open)"),
      perPage: z.number().optional().describe("Results per page (default 30, max 100)"),
      page: z.number().optional().describe("Page number for pagination (default 1)")
    })
  }
)

export const githubGetFileContentsTool = tool(
  async (input: { owner: string; repo: string; path: string; ref?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      path: input.path,
      ref: input.ref || 'main'
    })

    const url = `${apiBase}/authentication/github/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/contents/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    
    // Decode base64 content if present
    let decodedContent = null
    if (data.content && data.encoding === 'base64') {
      try {
        decodedContent = Buffer.from(data.content, 'base64').toString('utf-8')
      } catch (e) {
        decodedContent = data.content
      }
    }
    
    return JSON.stringify({ 
      success: true, 
      file: {
        name: data.name,
        path: data.path,
        size: data.size,
        content: decodedContent || data.content,
        sha: data.sha,
        url: data.html_url
      }
    })
  },
  {
    name: "github_get_file_contents",
    description: "Get the contents of a file from a GitHub repository. Returns the file content decoded from base64.",
    schema: z.object({
      owner: z.string().describe("Repository owner (username or organization)"),
      repo: z.string().describe("Repository name"),
      path: z.string().describe("Path to the file in the repository (e.g., 'src/index.js')"),
      ref: z.string().optional().describe("Branch, tag, or commit SHA (default: main)")
    })
  }
)

export const githubSearchCodeTool = tool(
  async (input: { query: string; perPage?: number; page?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { github?: boolean }
    if (prefs.github === false) {
      return JSON.stringify({ success: false, error: "GitHub access is disabled by user preference" })
    }

    const apiBase = CONFIG.url
    const token = getServerContextValue<string>("authToken")
    if (!token) {
      throw new Error("Missing auth token in server context")
    }

    const params = new URLSearchParams({
      q: input.query,
      per_page: String(Math.min(input.perPage || 30, 100)),
      page: String(input.page || 1)
    })

    const url = `${apiBase}/authentication/github/search/code/?${params.toString()}`
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` })
    }
    const data = await resp.json()
    return JSON.stringify({ 
      success: true, 
      total_count: data.total_count || 0,
      items: data.items || [],
      message: `Found ${data.total_count || 0} code results`
    })
  },
  {
    name: "github_search_code",
    description: "Search for code across GitHub repositories. Use GitHub search syntax like 'user:username language:python' or 'repo:owner/repo function'.",
    schema: z.object({
      query: z.string().describe("Search query using GitHub code search syntax (e.g., 'addClass user:octocat', 'repo:owner/repo TODO')"),
      perPage: z.number().optional().describe("Results per page (default 30, max 100)"),
      page: z.number().optional().describe("Page number for pagination (default 1)")
    })
  }
)

