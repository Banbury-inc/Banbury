const fetchMock = jest.fn()

jest.mock("@langchain/core/tools", () => ({
  tool: (fn: (...args: any[]) => any) => ({
    invoke: (args: any) => fn(args),
  }),
}))

import { getCurrentDateTimeTool } from "../../pages/api/assistant/langgraph-stream/agent/tools/getCurrentDateTimeTool"

describe("get current date time tool", () => {
  const originalTz = process.env.TZ
  let dateStringSpy: jest.SpyInstance<string, [locales?: string | string[], options?: Intl.DateTimeFormatOptions]>
  let timeStringSpy: jest.SpyInstance<string, [locales?: string | string[], options?: Intl.DateTimeFormatOptions]>
  let intlSpy: jest.SpyInstance<Intl.DateTimeFormat, [locales?: string | string[], options?: Intl.DateTimeFormatOptions]>

  beforeAll(() => {
    process.env.TZ = "UTC"
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterAll(() => {
    process.env.TZ = originalTz
  })

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2024-05-15T12:34:56Z"))

    dateStringSpy = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("Wednesday, May 15, 2024")

    timeStringSpy = jest
      .spyOn(Date.prototype, "toLocaleTimeString")
      .mockReturnValue("08:34 AM")

    intlSpy = jest.spyOn(Intl, "DateTimeFormat").mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: "America/New_York" }),
    }) as unknown as Intl.DateTimeFormat)
  })

  afterEach(() => {
    dateStringSpy.mockRestore()
    timeStringSpy.mockRestore()
    intlSpy.mockRestore()
    jest.useRealTimers()
  })

  it("returns consistent date time data derived from the current clock", async () => {
    const response = await getCurrentDateTimeTool.invoke({})
    const parsed = JSON.parse(response)
    const now = new Date()
    const expectedDayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )

    expect(parsed).toEqual({
      currentDate: "Wednesday, May 15, 2024",
      currentTime: "08:34 AM",
      timezone: "America/New_York",
      isoString: "2024-05-15T12:34:56.000Z",
      formatted: "Wednesday, May 15, 2024 at 08:34 AM (America/New_York)",
      unixTimestamp: Math.floor(now.getTime() / 1000),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayOfWeek: now.getDay(),
      dayOfYear: expectedDayOfYear,
    })

    expect(dateStringSpy).toHaveBeenCalledWith("en-US", expect.objectContaining({ weekday: "long" }))
    expect(timeStringSpy).toHaveBeenCalledWith("en-US", expect.objectContaining({ hour: "2-digit" }))
  })
})


