import { CONFIG } from "../../frontend/config/config"

const fetchMock = jest.fn()
const getServerContextValueMock = jest.fn()

class MockBlob {
  size: number
  type: string
  parts: Array<string | ArrayBuffer | Uint8Array>

  constructor(parts: Array<string | ArrayBuffer | Uint8Array>, options?: { type?: string }) {
    this.parts = parts
    this.type = options?.type || ""
    this.size = parts.reduce((total, part) => {
      if (typeof part === "string") return total + Buffer.byteLength(part)
      if (part instanceof ArrayBuffer) return total + part.byteLength
      if (part instanceof Uint8Array) return total + part.byteLength
      return total
    }, 0)
  }
}

class MockFormData {
  private entries = new Map<string, any>()

  append(key: string, value: any, filename?: string) {
    if (filename) {
      this.entries.set(key, { value, filename })
      return
    }
    this.entries.set(key, value)
  }

  get(key: string) {
    return this.entries.get(key)
  }
}

jest.mock("@langchain/core/tools", () => ({
  tool: (fn: (...args: any[]) => any) => ({
    invoke: (args: any) => fn(args),
  }),
}))

jest.mock("../../frontend/assistant/langraph/serverContext", () => ({
  getServerContextValue: (key: string) => getServerContextValueMock(key),
}))

import { downloadFromUrlTool } from "../../pages/api/assistant/langgraph-stream/agent/tools/downloadFromUrlTool"

describe("download from url tool", () => {
  let logSpy: jest.SpyInstance

  beforeAll(() => {
    // @ts-expect-error override for tests
    globalThis.fetch = fetchMock as unknown as typeof fetch
    // @ts-expect-error override for tests
    globalThis.Blob = MockBlob
    // @ts-expect-error override for tests
    globalThis.FormData = MockFormData as unknown as typeof FormData
  })

  beforeEach(() => {
    fetchMock.mockReset()
    getServerContextValueMock.mockReset()
    getServerContextValueMock.mockImplementation((key: string) => {
      if (key === "authToken") return "token-download"
      return undefined
    })
    logSpy = jest.spyOn(console, "log").mockImplementation()
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it("throws when auth token missing", async () => {
    getServerContextValueMock.mockReturnValue(undefined)

    await expect(
      downloadFromUrlTool.invoke({ url: "https://example.com/file.txt" })
    ).rejects.toThrow("Missing auth token in server context")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("downloads file and uploads to banbury storage", async () => {
    const downloadBlob = new MockBlob(["file-data"], { type: "text/plain" })
    const downloadResponse = {
      ok: true,
      headers: {
        get: (key: string) => {
          if (key === "content-type") return "text/plain"
          if (key === "content-length") return "9"
          return null
        },
      },
      blob: async () => downloadBlob,
    }
    const uploadResponse = {
      ok: true,
      json: async () => ({
        result: "success",
        file_url: "https://banbury/files/file.txt",
        file_info: { id: "123" },
      }),
    }

    fetchMock.mockResolvedValueOnce(downloadResponse as any)
    fetchMock.mockResolvedValueOnce(uploadResponse as any)

    const response = await downloadFromUrlTool.invoke({ url: "https://example.com/file.txt" })
    const parsed = JSON.parse(response)

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://example.com/file.txt")

    const secondCall = fetchMock.mock.calls[1]
    expect(secondCall[0]).toBe(`${CONFIG.url}/files/upload_to_s3/`)
    const options = secondCall[1] as RequestInit
    expect(options.method).toBe("POST")
    expect(options.headers).toEqual({ Authorization: "Bearer token-download" })

    const formData = options.body as unknown as MockFormData
    const fileEntry = formData.get("file")
    expect(fileEntry.filename).toBe("file.txt")
    expect(fileEntry.value).toBe(downloadBlob)
    expect(formData.get("file_path")).toBe("uploads")
    expect(formData.get("file_parent")).toBe("uploads")
    expect(formData.get("device_name")).toBe("web-editor")

    expect(parsed).toEqual({
      result: "success",
      file_url: "https://banbury/files/file.txt",
      file_info: { id: "123", source_url: "https://example.com/file.txt", file_size: 9 },
      message: "File downloaded from URL and uploaded successfully",
    })
  })

  it("derives filename from content type when url lacks extension", async () => {
    const downloadBlob = new MockBlob(["data"], { type: "application/pdf" })
    const downloadResponse = {
      ok: true,
      headers: {
        get: (key: string) => {
          if (key === "content-type") return "application/pdf"
          return null
        },
      },
      blob: async () => downloadBlob,
    }
    const uploadResponse = {
      ok: true,
      json: async () => ({ result: "success", file_info: {} }),
    }

    fetchMock.mockResolvedValueOnce(downloadResponse as any)
    fetchMock.mockResolvedValueOnce(uploadResponse as any)

    await downloadFromUrlTool.invoke({ url: "https://example.com/download" })

    const options = fetchMock.mock.calls[1][1] as RequestInit
    const formData = options.body as unknown as MockFormData
    const fileEntry = formData.get("file")
    expect(fileEntry.filename).toBe("downloaded_file.pdf")
  })

  it("throws when download fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    await expect(
      downloadFromUrlTool.invoke({ url: "https://example.com/missing.txt" })
    ).rejects.toThrow("Failed to download file: HTTP 404 Not Found")
  })

  it("throws when upload fails", async () => {
    const downloadBlob = new MockBlob(["file-data"], { type: "text/plain" })
    const downloadResponse = {
      ok: true,
      headers: {
        get: () => "text/plain",
      },
      blob: async () => downloadBlob,
    }

    fetchMock.mockResolvedValueOnce(downloadResponse as any)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal" }),
    })

    await expect(
      downloadFromUrlTool.invoke({ url: "https://example.com/file.txt" })
    ).rejects.toThrow("Failed to upload downloaded file: HTTP 500 - Internal")
  })
})


