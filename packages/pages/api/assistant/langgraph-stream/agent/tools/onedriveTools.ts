import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CONFIG } from "../../../../../../frontend/config/config"
import { getServerContextValue } from "../../../../../../frontend/assistant/langraph/serverContext"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT"

const MAX_SIMPLE_UPLOAD_BYTES = 4 * 1024 * 1024
const DEFAULT_TEXT_DOWNLOAD_LIMIT = 200_000
const MAX_TEXT_DOWNLOAD_LIMIT = 500_000

interface OneDriveToolPreferences {
  onedrive?: boolean
}

interface OneDriveToolContext {
  apiBase: string
  headers: Record<string, string>
}

function getOneDriveToolContext(): OneDriveToolContext | { error: string } {
  const prefs = (getServerContextValue<any>("toolPreferences") || {}) as OneDriveToolPreferences
  if (prefs.onedrive === false) return { error: "OneDrive access is disabled by user preference" }

  const token = getServerContextValue<string>("authToken")
  if (!token) throw new Error("Missing auth token in server context")

  return {
    apiBase: CONFIG.url,
    headers: { Authorization: `Bearer ${token}` },
  }
}

async function readBackendResponse(resp: Response) {
  const contentType = resp.headers.get("content-type") || ""
  const data = contentType.includes("application/json")
    ? await resp.json().catch(() => ({}))
    : await resp.text().catch(() => "")

  if (!resp.ok) {
    const message = typeof data === "object" && data !== null
      ? (data as any).error || (data as any).message
      : data

    return {
      success: false,
      error: message || `HTTP ${resp.status}: ${resp.statusText}`,
    }
  }

  if (typeof data === "object" && data !== null) return { success: true, ...data }
  return { success: true, data }
}

async function callOneDriveBackend(method: HttpMethod, endpoint: string, body?: unknown) {
  const context = getOneDriveToolContext()
  if ("error" in context) return { success: false, error: context.error }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  const isRawBody = body instanceof Uint8Array || typeof body === "string"

  const resp = await fetch(`${context.apiBase}${endpoint}`, {
    method,
    headers: {
      ...context.headers,
      ...(!isFormData && !isRawBody && method !== "GET" && method !== "DELETE"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(isRawBody ? { "Content-Type": "text/plain; charset=utf-8" } : {}),
    },
    ...(body !== undefined
      ? { body: isFormData || isRawBody ? body as BodyInit : JSON.stringify(body) }
      : {}),
  })

  return readBackendResponse(resp)
}

function appendPaginationParams(params: URLSearchParams, input: { pageSize?: number; skipToken?: string; orderBy?: string }) {
  if (typeof input.pageSize === "number") params.set("top", String(Math.min(input.pageSize, 100)))
  if (input.skipToken) params.set("skipToken", input.skipToken)
  if (input.orderBy) params.set("orderBy", input.orderBy)
}

function buildQueryString(params: URLSearchParams) {
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength
}

function ensureSimpleUploadSize(content: string) {
  const byteLength = getUtf8ByteLength(content)
  if (byteLength <= MAX_SIMPLE_UPLOAD_BYTES) return null

  return {
    success: false,
    error: "OneDrive simple uploads are limited to 4 MB. Shorten the content or use an upload session flow.",
    byteLength,
    maxBytes: MAX_SIMPLE_UPLOAD_BYTES,
  }
}

export const onedriveStatusTool = tool(
  async () => {
    const result = await callOneDriveBackend("GET", "/authentication/onedrive/status/")
    return JSON.stringify(result)
  },
  {
    name: "onedrive_status",
    description: "Check whether OneDrive is connected and return account details for the connected Microsoft account.",
    schema: z.object({}),
  }
)

export const onedriveListRootTool = tool(
  async (input: { pageSize?: number; skipToken?: string; orderBy?: string }) => {
    const params = new URLSearchParams()
    appendPaginationParams(params, input)

    const result = await callOneDriveBackend(
      "GET",
      `/authentication/onedrive/root/children/${buildQueryString(params)}`
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_list_root",
    description: "List files and folders in the connected user's OneDrive root with optional pagination.",
    schema: z.object({
      pageSize: z.number().optional().describe("Maximum items to return, capped at 100"),
      skipToken: z.string().optional().describe("Pagination token from a previous list response"),
      orderBy: z.string().optional().describe("Optional backend-supported ordering such as 'name asc'"),
    }),
  }
)

export const onedriveListFolderTool = tool(
  async (input: { itemId: string; pageSize?: number; skipToken?: string; orderBy?: string }) => {
    const params = new URLSearchParams()
    appendPaginationParams(params, input)

    const result = await callOneDriveBackend(
      "GET",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/children/${buildQueryString(params)}`
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_list_folder",
    description: "List files and folders inside a OneDrive folder by item ID.",
    schema: z.object({
      itemId: z.string().describe("OneDrive folder item ID"),
      pageSize: z.number().optional().describe("Maximum items to return, capped at 100"),
      skipToken: z.string().optional().describe("Pagination token from a previous list response"),
      orderBy: z.string().optional().describe("Optional backend-supported ordering such as 'name asc'"),
    }),
  }
)

export const onedriveSearchTool = tool(
  async (input: { query: string; pageSize?: number }) => {
    const params = new URLSearchParams()
    params.set("q", input.query)
    if (typeof input.pageSize === "number") params.set("top", String(Math.min(input.pageSize, 100)))

    const result = await callOneDriveBackend(
      "GET",
      `/authentication/onedrive/search/${buildQueryString(params)}`
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_search",
    description: "Search files and folders in the connected user's OneDrive.",
    schema: z.object({
      query: z.string().describe("Search query text"),
      pageSize: z.number().optional().describe("Maximum results to return, capped at 100"),
    }),
  }
)

export const onedriveGetItemTool = tool(
  async (input: { itemId: string }) => {
    const result = await callOneDriveBackend(
      "GET",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/`
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_get_item",
    description: "Get metadata for a OneDrive file or folder by item ID.",
    schema: z.object({
      itemId: z.string().describe("OneDrive item ID"),
    }),
  }
)

export const onedriveDownloadFileTool = tool(
  async (input: { itemId: string; maxCharacters?: number }) => {
    const context = getOneDriveToolContext()
    if ("error" in context) return JSON.stringify({ success: false, error: context.error })

    const resp = await fetch(
      `${context.apiBase}/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/download/`,
      { method: "GET", headers: context.headers }
    )

    if (!resp.ok) return JSON.stringify(await readBackendResponse(resp))

    const contentType = resp.headers.get("content-type") || "application/octet-stream"
    const contentDisposition = resp.headers.get("content-disposition") || ""
    const maxCharacters = Math.min(input.maxCharacters || DEFAULT_TEXT_DOWNLOAD_LIMIT, MAX_TEXT_DOWNLOAD_LIMIT)
    const content = await resp.text()
    const isTruncated = content.length > maxCharacters

    return JSON.stringify({
      success: true,
      content: isTruncated ? content.slice(0, maxCharacters) : content,
      contentType,
      contentDisposition,
      truncated: isTruncated,
      originalCharacters: content.length,
      maxCharacters,
    })
  },
  {
    name: "onedrive_download_file",
    description: "Download and read a OneDrive text-like file by item ID with a conservative character limit.",
    schema: z.object({
      itemId: z.string().describe("OneDrive file item ID"),
      maxCharacters: z.number().optional().describe("Maximum characters to return, capped at 500000"),
    }),
  }
)

export const onedriveUploadTextFileTool = tool(
  async (input: { filename: string; content: string; parentId?: string; mimeType?: string }) => {
    const sizeError = ensureSimpleUploadSize(input.content)
    if (sizeError) return JSON.stringify(sizeError)

    const formData = new FormData()
    const blob = new Blob([input.content], { type: input.mimeType || "text/plain;charset=utf-8" })
    formData.append("file", blob, input.filename)
    if (input.parentId) formData.append("parent_id", input.parentId)

    const result = await callOneDriveBackend("POST", "/authentication/onedrive/files/upload/", formData)
    return JSON.stringify(result)
  },
  {
    name: "onedrive_upload_text_file",
    description: "Create a small text, markdown, JSON, or code file in OneDrive. Content must be 4 MB or smaller.",
    schema: z.object({
      filename: z.string().describe("File name to create, including extension"),
      content: z.string().describe("Text content to upload"),
      parentId: z.string().optional().describe("Destination folder item ID; omit for root"),
      mimeType: z.string().optional().describe("Optional MIME type, defaults to text/plain"),
    }),
  }
)

export const onedriveUpdateTextFileTool = tool(
  async (input: { itemId: string; content: string }) => {
    const sizeError = ensureSimpleUploadSize(input.content)
    if (sizeError) return JSON.stringify(sizeError)

    const result = await callOneDriveBackend(
      "PUT",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/update/`,
      input.content
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_update_text_file",
    description: "Overwrite an existing OneDrive file with text content. Content must be 4 MB or smaller.",
    schema: z.object({
      itemId: z.string().describe("OneDrive file item ID to overwrite"),
      content: z.string().describe("New text content"),
    }),
  }
)

export const onedriveCreateFolderTool = tool(
  async (input: { name: string; parentId?: string }) => {
    const result = await callOneDriveBackend("POST", "/authentication/onedrive/folders/create/", {
      name: input.name,
      parent_id: input.parentId || "root",
    })

    return JSON.stringify(result)
  },
  {
    name: "onedrive_create_folder",
    description: "Create a folder in OneDrive root or inside another folder.",
    schema: z.object({
      name: z.string().describe("Folder name"),
      parentId: z.string().optional().describe("Parent folder item ID; omit for root"),
    }),
  }
)

export const onedriveRenameMoveTool = tool(
  async (input: { itemId: string; name?: string; parentId?: string }) => {
    const result = await callOneDriveBackend(
      "PATCH",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/rename_move/`,
      {
        name: input.name,
        parent_id: input.parentId,
      }
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_rename_move",
    description: "Rename a OneDrive item, move it to another folder, or do both.",
    schema: z.object({
      itemId: z.string().describe("OneDrive item ID to rename or move"),
      name: z.string().optional().describe("New item name"),
      parentId: z.string().optional().describe("Destination parent folder item ID"),
    }),
  }
)

export const onedriveDeleteItemTool = tool(
  async (input: { itemId: string }) => {
    const result = await callOneDriveBackend(
      "DELETE",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/delete/`
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_delete_item",
    description: "Delete a OneDrive item by item ID. The backend moves it to the recycle bin.",
    schema: z.object({
      itemId: z.string().describe("OneDrive item ID to delete"),
    }),
  }
)

export const onedriveCreateShareLinkTool = tool(
  async (input: { itemId: string; type?: "view" | "edit"; scope?: "anonymous" | "organization" }) => {
    const result = await callOneDriveBackend(
      "POST",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/share_link/`,
      {
        type: input.type || "view",
        scope: input.scope || "anonymous",
      }
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_create_share_link",
    description: "Create a OneDrive sharing link for a file or folder.",
    schema: z.object({
      itemId: z.string().describe("OneDrive item ID to share"),
      type: z.enum(["view", "edit"]).optional().describe("Link permission type, defaults to view"),
      scope: z.enum(["anonymous", "organization"]).optional().describe("Link scope, defaults to anonymous"),
    }),
  }
)

export const onedriveInviteTool = tool(
  async (input: { itemId: string; emails: string[]; roles?: Array<"read" | "write">; message?: string }) => {
    const result = await callOneDriveBackend(
      "POST",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/invite/`,
      {
        recipients: input.emails.map(email => ({ email })),
        roles: input.roles?.length ? input.roles : ["read"],
        message: input.message,
      }
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_invite",
    description: "Invite users by email to access a OneDrive item.",
    schema: z.object({
      itemId: z.string().describe("OneDrive item ID to share"),
      emails: z.array(z.string().email()).min(1).describe("Recipient email addresses"),
      roles: z.array(z.enum(["read", "write"])).optional().describe("Permission roles, defaults to read"),
      message: z.string().optional().describe("Optional invitation message"),
    }),
  }
)

export const onedriveGetPermissionsTool = tool(
  async (input: { itemId: string }) => {
    const result = await callOneDriveBackend(
      "GET",
      `/authentication/onedrive/items/${encodeURIComponent(input.itemId)}/permissions/`
    )

    return JSON.stringify(result)
  },
  {
    name: "onedrive_get_permissions",
    description: "List sharing permissions for a OneDrive file or folder.",
    schema: z.object({
      itemId: z.string().describe("OneDrive item ID"),
    }),
  }
)
