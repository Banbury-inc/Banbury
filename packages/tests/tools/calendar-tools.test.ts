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

import { calendarListEventsTool } from "../../pages/api/assistant/langgraph-stream/agent/tools/calendarTools"

describe("calendar tools", () => {
  beforeAll(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  beforeEach(() => {
    fetchMock.mockReset()
    getServerContextValueMock.mockReset()
  })

  it("returns an informative message when calendar access is disabled", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { calendar: false }
      return undefined
    })

    const response = await calendarListEventsTool.invoke({})
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: false,
      error: "Calendar access is disabled by user preference",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("throws when the auth token is absent", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return {}
      if (key === "authToken") return undefined
      return undefined
    })

    await expect(calendarListEventsTool.invoke({})).rejects.toThrow("Missing auth token in server context")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("propagates HTTP errors from the Banbury API", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return {}
      if (key === "authToken") return "token-123"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
    })

    const response = await calendarListEventsTool.invoke({ calendarId: "team", maxResults: 5 })
    const parsed = JSON.parse(response)

    expect(parsed.success).toBe(false)
    expect(parsed.error).toBe("HTTP 502: Bad Gateway")
    expect(fetchMock).toHaveBeenCalledWith(
      `${CONFIG.url}/authentication/calendar/events/?calendarId=team&maxResults=5`,
      {
        method: "GET",
        headers: { Authorization: "Bearer token-123" },
      }
    )
  })

  it("returns the backend payload on success", async () => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return {}
      if (key === "authToken") return "token-789"
      return undefined
    })

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "event-1" }] }),
    })

    const response = await calendarListEventsTool.invoke({
      calendarId: "primary",
      query: "planning",
      singleEvents: true,
    })
    const parsed = JSON.parse(response)

    expect(parsed.success).toBe(true)
    expect(parsed.items).toEqual([{ id: "event-1" }])
    expect(fetchMock).toHaveBeenCalledWith(
      `${CONFIG.url}/authentication/calendar/events/?calendarId=primary&q=planning&singleEvents=true`,
      {
        method: "GET",
        headers: { Authorization: "Bearer token-789" },
      }
    )
  })
})


