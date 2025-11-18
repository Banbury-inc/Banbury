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

import { searchMemoryTool } from "../../pages/api/assistant/langgraph-stream/agent/tools/searchMemoryTool"

describe("search memory tool", () => {
  let logSpy: jest.SpyInstance

  beforeAll(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  beforeEach(() => {
    fetchMock.mockReset()
    getServerContextValueMock.mockReset()
    logSpy = jest.spyOn(console, "log").mockImplementation()
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it("throws when auth token is missing", async () => {
    getServerContextValueMock.mockReturnValue(undefined)

    await expect(
      searchMemoryTool.invoke({ query: "project vision" })
    ).rejects.toThrow("Missing auth token in server context")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("throws a descriptive error when backend request fails", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-xyz"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({ error: "Internal failure" }),
    })

    await expect(
      searchMemoryTool.invoke({ query: "meeting notes", maxResults: 5, sessionId: "custom-session" })
    ).rejects.toThrow("Failed to search memories: HTTP 500 - Internal failure")

    expect(fetchMock).toHaveBeenCalledWith(
      `${CONFIG.url}/conversations/memory/enhanced/search/?query=meeting+notes&scope=nodes&reranker=cross_encoder&limit=5&use_zep=true&session_id=custom-session`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer token-xyz",
          "Content-Type": "application/json",
        },
      }
    )
  })

  it("returns formatted results when memories are found", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-abc"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        used_strategy: "zep_only",
        used_user_id: "user123",
        zep_facts: [
          { fact: "Project Alpha launch is July", confidence: 0.82 },
        ],
        zep_entities: [
          { name: "Project Alpha", type: "project", summary: "Flagship initiative" },
        ],
        count: 2,
      }),
    })

    const response = await searchMemoryTool.invoke({ query: "Project Alpha" })

    expect(response).toContain("Memory search results (Zep)")
    expect(response).toContain("Strategy: zep_only, user: user123")
    expect(response).toContain("1. Project Alpha launch is July (confidence: 0.82)")
    expect(response).toContain("Zep Entities:")
    expect(response).toContain("Summary: Flagship initiative")

    expect(fetchMock).toHaveBeenCalledWith(
      `${CONFIG.url}/conversations/memory/enhanced/search/?query=Project+Alpha&scope=nodes&reranker=cross_encoder&limit=10&use_zep=true&session_id=assistant_ui`,
      expect.any(Object)
    )
  })

  it("returns a friendly message when no memories match", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-abc"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        zep_facts: [],
        zep_entities: [],
        count: 0,
      }),
    })

    const response = await searchMemoryTool.invoke({ query: "nonexistent topic" })

    expect(response).toBe("No relevant memories found for the given query.")
  })
})


