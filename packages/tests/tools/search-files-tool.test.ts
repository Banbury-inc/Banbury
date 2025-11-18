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

import { searchFilesTool } from "../../pages/api/assistant/langgraph-stream/agent/tools/searchFilesTool"

describe("search files tool", () => {
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

    await expect(searchFilesTool.invoke({ query: "financial report" })).rejects.toThrow("Missing auth token in server context")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("throws a descriptive error for backend failures", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-123"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "No files located" }),
    })

    await expect(searchFilesTool.invoke({ query: "project plan" })).rejects.toThrow(
      "Failed to search files: HTTP 404 - No files located"
    )

    expect(fetchMock).toHaveBeenCalledWith(
      `${CONFIG.url}/files/search_s3_files/`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer token-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "project plan" }),
      }
    )
  })

  it("returns structured data when the search succeeds", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-456"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: "success",
        total_results: 2,
        files: [
          { name: "plan.docx" },
          { name: "notes.docx" },
        ],
      }),
    })

    const response = await searchFilesTool.invoke({ query: "plan" })
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: true,
      files: [
        { name: "plan.docx" },
        { name: "notes.docx" },
      ],
      total_results: 2,
      query: "plan",
      message: 'Found 2 files matching "plan"',
    })
  })

  it("returns error details when the backend reports failure", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-789"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: "error",
        error: "Query too broad",
      }),
    })

    const response = await searchFilesTool.invoke({ query: "all" })
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: false,
      error: "Query too broad",
      query: "all",
    })
  })
})


