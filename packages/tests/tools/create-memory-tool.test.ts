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

import { createMemoryTool } from "../../pages/api/assistant/langgraph-stream/agent/tools/createMemoryTool"

describe("create memory tool", () => {
  let logSpy: jest.SpyInstance

  beforeAll(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  beforeEach(() => {
    fetchMock.mockReset()
    getServerContextValueMock.mockReset()
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-memory"
      return undefined
    })
    logSpy = jest.spyOn(console, "log").mockImplementation()
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it("throws when auth token is missing", async () => {
    getServerContextValueMock.mockReturnValue(undefined)

    await expect(
      createMemoryTool.invoke({ content: "User prefers dark mode" })
    ).rejects.toThrow("Missing auth token in server context")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("stores memory with session defaults", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        zep: { stored_memory: true },
      }),
    })

    const response = await createMemoryTool.invoke({ content: "User prefers dark mode" })

    expect(fetchMock).toHaveBeenCalledWith(
      `${CONFIG.url}/conversations/memory/enhanced/store/`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer token-memory",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "User prefers dark mode",
          type: "text",
          session_id: "assistant_ui",
          use_zep: true,
        }),
      }
    )

    expect(response).toBe("Memory stored successfully in Zep and Mongo. session_id: assistant_ui")
  })

  it("throws descriptive error when backend rejects", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid payload" }),
    })

    await expect(
      createMemoryTool.invoke({ content: "invalid" })
    ).rejects.toThrow("Failed to store memory: HTTP 400 - Invalid payload")
  })
})


