import { CONFIG } from "../../frontend/config/config"

const fetchMock = jest.fn()
const getServerContextValueMock = jest.fn()

jest.mock("@langchain/core/tools", () => ({
  tool: (fn: (...args: any[]) => any) => ({
    invoke: (args: any) => fn(args),
  }),
}))

jest.mock("../../frontend/assistant/langraph/serverContext", () => ({
  getServerContextValue: (key: string) => getServerContextValueMock(key),
}))

import {
  githubCreateIssueTool,
  githubGetFileContentsTool,
  githubGetRepoTool,
  githubListIssuesTool,
  githubListPullRequestsTool,
  githubListReposTool,
  githubSearchCodeTool,
} from "../../pages/api/assistant/langgraph-stream/agent/tools/githubTools"

interface ToolCase<TInput extends Record<string, unknown>> {
  title: string
  tool: { invoke: (args: TInput) => Promise<string> }
  args: TInput
  expectedUrl: string
  expectedInit: RequestInit
  responseJson: Record<string, unknown>
  expectedResult: Record<string, unknown>
}

describe("github tools", () => {
  beforeAll(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  beforeEach(() => {
    fetchMock.mockReset()
    getServerContextValueMock.mockReset()
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { github: true }
      if (key === "authToken") return "token-github"
      return undefined
    })
  })

  const successCases: ToolCase<any>[] = [
    {
      title: "lists repositories for the authenticated user",
      tool: githubListReposTool,
      args: { visibility: "public", sort: "updated", perPage: 5, page: 2 },
      expectedUrl: `${CONFIG.url}/authentication/github/repos/?visibility=public&sort=updated&per_page=5&page=2`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-github" },
      },
      responseJson: { repositories: [{ name: "banbury" }] },
      expectedResult: { success: true, repositories: [{ name: "banbury" }] },
    },
    {
      title: "gets repository details",
      tool: githubGetRepoTool,
      args: { owner: "banbury", repo: "website" },
      expectedUrl: `${CONFIG.url}/authentication/github/repos/banbury/website/`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-github" },
      },
      responseJson: { name: "website", private: false },
      expectedResult: { success: true, repository: { name: "website", private: false } },
    },
    {
      title: "lists issues with pagination controls",
      tool: githubListIssuesTool,
      args: { owner: "banbury", repo: "website", state: "all", perPage: 10, page: 3 },
      expectedUrl: `${CONFIG.url}/authentication/github/repos/banbury/website/issues/?state=all&per_page=10&page=3`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-github" },
      },
      responseJson: { issues: [{ number: 99 }] },
      expectedResult: { success: true, issues: [{ number: 99 }] },
    },
    {
      title: "creates an issue with optional fields",
      tool: githubCreateIssueTool,
      args: {
        owner: "banbury",
        repo: "website",
        title: "Bug",
        body: "It broke",
        labels: ["bug"],
        assignees: ["alice"],
      },
      expectedUrl: `${CONFIG.url}/authentication/github/issues/create/`,
      expectedInit: {
        method: "POST",
        headers: {
          Authorization: "Bearer token-github",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: "banbury",
          repo: "website",
          title: "Bug",
          body: "It broke",
          labels: ["bug"],
          assignees: ["alice"],
        }),
      },
      responseJson: { number: 101, html_url: "https://github.com/banbury/website/issues/101" },
      expectedResult: {
        success: true,
        issue: { number: 101, html_url: "https://github.com/banbury/website/issues/101" },
        message: "Issue created successfully",
      },
    },
    {
      title: "lists pull requests",
      tool: githubListPullRequestsTool,
      args: { owner: "banbury", repo: "website", state: "closed", perPage: 2, page: 1 },
      expectedUrl: `${CONFIG.url}/authentication/github/repos/banbury/website/pulls/?state=closed&per_page=2&page=1`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-github" },
      },
      responseJson: { pull_requests: [{ number: 5 }] },
      expectedResult: { success: true, pull_requests: [{ number: 5 }] },
    },
    {
      title: "fetches and decodes file contents",
      tool: githubGetFileContentsTool,
      args: { owner: "banbury", repo: "website", path: "README.md", ref: "main" },
      expectedUrl: `${CONFIG.url}/authentication/github/repos/banbury/website/contents/?path=README.md&ref=main`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-github" },
      },
      responseJson: {
        name: "README.md",
        path: "README.md",
        size: 12,
        content: Buffer.from("Hello").toString("base64"),
        encoding: "base64",
        sha: "sha-1",
        html_url: "https://github.com/banbury/website/blob/main/README.md",
      },
      expectedResult: {
        success: true,
        file: {
          name: "README.md",
          path: "README.md",
          size: 12,
          content: "Hello",
          sha: "sha-1",
          url: "https://github.com/banbury/website/blob/main/README.md",
        },
      },
    },
    {
      title: "searches code across repositories",
      tool: githubSearchCodeTool,
      args: { query: "function user:banbury", perPage: 20, page: 4 },
      expectedUrl: `${CONFIG.url}/authentication/github/search/code/?q=function+user%3Abanbury&per_page=20&page=4`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-github" },
      },
      responseJson: {
        total_count: 2,
        items: [{ name: "index.ts" }, { name: "auth.ts" }],
      },
      expectedResult: {
        success: true,
        total_count: 2,
        items: [{ name: "index.ts" }, { name: "auth.ts" }],
        message: "Found 2 code results",
      },
    },
  ]

  it.each(successCases)("successfully %s", async ({ tool, args, expectedUrl, expectedInit, responseJson, expectedResult }) => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => responseJson,
    })

    const response = await tool.invoke(args)
    const parsed = JSON.parse(response)

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expectedInit)
    expect(parsed).toEqual(expectedResult)
  })

  it.each([
    ["githubListReposTool", githubListReposTool, {}],
    ["githubGetRepoTool", githubGetRepoTool, { owner: "banbury", repo: "website" }],
    ["githubListIssuesTool", githubListIssuesTool, { owner: "banbury", repo: "website" }],
    ["githubCreateIssueTool", githubCreateIssueTool, { owner: "banbury", repo: "website", title: "Bug" }],
    ["githubListPullRequestsTool", githubListPullRequestsTool, { owner: "banbury", repo: "website" }],
    ["githubGetFileContentsTool", githubGetFileContentsTool, { owner: "banbury", repo: "website", path: "README.md" }],
    ["githubSearchCodeTool", githubSearchCodeTool, { query: "readme" }],
  ])("returns preference-disabled message for %s", async (_label, tool, args) => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { github: false }
      if (key === "authToken") return "token-github"
      return undefined
    })

    const response = await tool.invoke(args as any)
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: false,
      error: "GitHub access is disabled by user preference",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ["githubListReposTool", githubListReposTool, {}],
    ["githubGetRepoTool", githubGetRepoTool, { owner: "banbury", repo: "website" }],
    ["githubListIssuesTool", githubListIssuesTool, { owner: "banbury", repo: "website" }],
    ["githubCreateIssueTool", githubCreateIssueTool, { owner: "banbury", repo: "website", title: "Bug" }],
    ["githubListPullRequestsTool", githubListPullRequestsTool, { owner: "banbury", repo: "website" }],
    ["githubGetFileContentsTool", githubGetFileContentsTool, { owner: "banbury", repo: "website", path: "README.md" }],
    ["githubSearchCodeTool", githubSearchCodeTool, { query: "readme" }],
  ])("throws when auth token is missing for %s", async (_label, tool, args) => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { github: true }
      return undefined
    })

    await expect(tool.invoke(args as any)).rejects.toThrow("Missing auth token in server context")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("propagates http errors in tool responses", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    })

    const response = await githubListReposTool.invoke({})
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: false,
      error: "HTTP 429: Too Many Requests",
    })
  })
})


