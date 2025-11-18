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
  slackAddReactionTool,
  slackGetChannelHistoryTool,
  slackGetThreadRepliesTool,
  slackGetUserInfoTool,
  slackListChannelsTool,
  slackSearchMessagesTool,
  slackSendMessageTool,
  slackSetChannelTopicTool,
} from "../../pages/api/assistant/langgraph-stream/agent/tools/slackTools"

interface SlackCase<TInput extends Record<string, unknown>> {
  title: string
  tool: { invoke: (args: TInput) => Promise<string> }
  args: TInput
  expectedUrl: string
  expectedInit: RequestInit
  responseJson: Record<string, unknown>
  expectedResult: Record<string, unknown>
}

describe("slack tools", () => {
  beforeAll(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  beforeEach(() => {
    fetchMock.mockReset()
    getServerContextValueMock.mockReset()
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { slack: true }
      if (key === "authToken") return "token-slack"
      return undefined
    })
  })

  const successCases: SlackCase<any>[] = [
    {
      title: "lists available channels",
      tool: slackListChannelsTool,
      args: {},
      expectedUrl: `${CONFIG.url}/authentication/slack/channels/`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-slack" },
      },
      responseJson: { channels: [{ id: "C1" }] },
      expectedResult: { success: true, channels: [{ id: "C1" }] },
    },
    {
      title: "sends a message with optional thread",
      tool: slackSendMessageTool,
      args: { channel: "C1", text: "Hello team", threadTs: "123.456" },
      expectedUrl: `${CONFIG.url}/authentication/slack/send_message/`,
      expectedInit: {
        method: "POST",
        headers: {
          Authorization: "Bearer token-slack",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "C1",
          text: "Hello team",
          thread_ts: "123.456",
        }),
      },
      responseJson: { ok: true, ts: "123.789" },
      expectedResult: { success: true, message: { ok: true, ts: "123.789" } },
    },
    {
      title: "fetches channel history with range filters",
      tool: slackGetChannelHistoryTool,
      args: { channel: "C1", limit: 5, oldest: "100", latest: "200" },
      expectedUrl: `${CONFIG.url}/authentication/slack/channel_history/?channel=C1&limit=5&oldest=100&latest=200`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-slack" },
      },
      responseJson: { messages: [{ text: "hello" }] },
      expectedResult: { success: true, messages: [{ text: "hello" }] },
    },
    {
      title: "retrieves thread replies",
      tool: slackGetThreadRepliesTool,
      args: { channel: "C1", threadTs: "111.222", limit: 3 },
      expectedUrl: `${CONFIG.url}/authentication/slack/thread_replies/?channel=C1&thread_ts=111.222&limit=3`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-slack" },
      },
      responseJson: { messages: [{ text: "reply" }] },
      expectedResult: { success: true, messages: [{ text: "reply" }] },
    },
    {
      title: "searches messages",
      tool: slackSearchMessagesTool,
      args: { query: "deploy", count: 10, sort: "score" },
      expectedUrl: `${CONFIG.url}/authentication/slack/search/?query=deploy&count=10&sort=score`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-slack" },
      },
      responseJson: { messages: [{ text: "deploying" }], total: 1 },
      expectedResult: { success: true, messages: [{ text: "deploying" }], total: 1 },
    },
    {
      title: "fetches user info",
      tool: slackGetUserInfoTool,
      args: { userId: "U1" },
      expectedUrl: `${CONFIG.url}/authentication/slack/user_info/?user_id=U1`,
      expectedInit: {
        method: "GET",
        headers: { Authorization: "Bearer token-slack" },
      },
      responseJson: { user: { name: "Alice" } },
      expectedResult: { success: true, user: { name: "Alice" } },
    },
    {
      title: "updates channel topic",
      tool: slackSetChannelTopicTool,
      args: { channel: "C1", topic: "Announcements" },
      expectedUrl: `${CONFIG.url}/authentication/slack/set_channel_topic/`,
      expectedInit: {
        method: "POST",
        headers: {
          Authorization: "Bearer token-slack",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: "C1", topic: "Announcements" }),
      },
      responseJson: { ok: true },
      expectedResult: { success: true, result: { ok: true } },
    },
    {
      title: "adds a reaction to a message",
      tool: slackAddReactionTool,
      args: { channel: "C1", timestamp: "123.456", name: "thumbsup" },
      expectedUrl: `${CONFIG.url}/authentication/slack/add_reaction/`,
      expectedInit: {
        method: "POST",
        headers: {
          Authorization: "Bearer token-slack",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: "C1", timestamp: "123.456", name: "thumbsup" }),
      },
      responseJson: { ok: true },
      expectedResult: { success: true, result: { ok: true } },
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
    ["slackListChannelsTool", slackListChannelsTool, {}],
    ["slackSendMessageTool", slackSendMessageTool, { channel: "C1", text: "hi" }],
    ["slackGetChannelHistoryTool", slackGetChannelHistoryTool, { channel: "C1" }],
    ["slackGetThreadRepliesTool", slackGetThreadRepliesTool, { channel: "C1", threadTs: "1" }],
    ["slackSearchMessagesTool", slackSearchMessagesTool, { query: "test" }],
    ["slackGetUserInfoTool", slackGetUserInfoTool, { userId: "U1" }],
    ["slackSetChannelTopicTool", slackSetChannelTopicTool, { channel: "C1", topic: "news" }],
    ["slackAddReactionTool", slackAddReactionTool, { channel: "C1", timestamp: "1", name: "eyes" }],
  ])("returns preference-disabled message for %s", async (_label, tool, args) => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { slack: false }
      if (key === "authToken") return "token-slack"
      return undefined
    })

    const response = await tool.invoke(args as any)
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: false,
      error: "Slack access is disabled by user preference",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ["slackListChannelsTool", slackListChannelsTool, {}],
    ["slackSendMessageTool", slackSendMessageTool, { channel: "C1", text: "hi" }],
    ["slackGetChannelHistoryTool", slackGetChannelHistoryTool, { channel: "C1" }],
    ["slackGetThreadRepliesTool", slackGetThreadRepliesTool, { channel: "C1", threadTs: "1" }],
    ["slackSearchMessagesTool", slackSearchMessagesTool, { query: "test" }],
    ["slackGetUserInfoTool", slackGetUserInfoTool, { userId: "U1" }],
    ["slackSetChannelTopicTool", slackSetChannelTopicTool, { channel: "C1", topic: "news" }],
    ["slackAddReactionTool", slackAddReactionTool, { channel: "C1", timestamp: "1", name: "eyes" }],
  ])("throws when auth token missing for %s", async (_label, tool, args) => {
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "toolPreferences") return { slack: true }
      return undefined
    })

    await expect(tool.invoke(args as any)).rejects.toThrow("Missing auth token in server context")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("propagates http errors on list channels", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    })

    const response = await slackListChannelsTool.invoke({})
    const parsed = JSON.parse(response)

    expect(parsed).toEqual({
      success: false,
      error: "HTTP 500: Server Error",
    })
  })
})


