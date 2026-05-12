import { ApiService } from "../apiService"
import axios from 'axios'

export interface DropboxFile {
  id: string
  name: string
  mimeType: string
  pathLower?: string
  pathDisplay?: string
  clientModified?: string
  serverModified?: string
  size?: number
  webUrl?: string
  folder?: { childCount?: number }
  file?: { mimeType?: string }
  isDeleted?: boolean
}

export interface DropboxFileListResponse {
  value?: DropboxFile[]
  '@odata.nextLink'?: string
  error?: string
}

interface DropboxBackendListResponse {
  items?: DropboxFile[]
  cursor?: string
  hasMore?: boolean
  error?: string
}

export default class Dropbox {
  constructor(apiService?: ApiService) {
    void apiService
  }

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private static toListResponse(
    data: DropboxBackendListResponse,
    endpoint: string,
    limit: number
  ): DropboxFileListResponse {
    const transformedResponse: DropboxFileListResponse = {
      value: data.items || []
    }

    if (data.hasMore && data.cursor) {
      const nextUrl = new URL(`${ApiService.baseURL}${endpoint}`)
      nextUrl.searchParams.append('limit', String(limit))
      nextUrl.searchParams.append('cursor', data.cursor)
      transformedResponse['@odata.nextLink'] = nextUrl.toString()
    }

    return transformedResponse
  }

  static async listRootFiles(limit: number = 100, cursor?: string): Promise<DropboxFileListResponse> {
    const endpoint = '/authentication/dropbox/root/children/'
    const url = new URL(`${ApiService.baseURL}${endpoint}`)
    url.searchParams.append('limit', String(limit))
    if (cursor) url.searchParams.append('cursor', cursor)

    const resp = await axios.get<DropboxBackendListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })

    return this.toListResponse(resp.data, endpoint, limit)
  }

  static async listFolderChildren(folderId: string, limit: number = 100, cursor?: string): Promise<DropboxFileListResponse> {
    const endpoint = `/authentication/dropbox/items/${encodeURIComponent(folderId)}/children/`
    const url = new URL(`${ApiService.baseURL}${endpoint}`)
    url.searchParams.append('limit', String(limit))
    if (cursor) url.searchParams.append('cursor', cursor)

    const resp = await axios.get<DropboxBackendListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })

    return this.toListResponse(resp.data, endpoint, limit)
  }

  static async listFilesInFolder(folderId: string, limit: number = 100): Promise<DropboxFileListResponse> {
    return this.listFolderChildren(folderId, limit)
  }

  static async listRecentFiles(limit: number = 20): Promise<DropboxFileListResponse> {
    const url = new URL(`${ApiService.baseURL}/authentication/dropbox/recent/`)
    url.searchParams.append('limit', String(limit))

    const resp = await axios.get<DropboxBackendListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })

    return { value: resp.data.items || [] }
  }

  static async searchFiles(query: string, limit: number = 20): Promise<DropboxFileListResponse> {
    const url = new URL(`${ApiService.baseURL}/authentication/dropbox/search/`)
    url.searchParams.append('q', query)
    url.searchParams.append('limit', String(limit))

    const resp = await axios.get<DropboxBackendListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })

    return { value: resp.data.items || [] }
  }

  static async getFavorites(): Promise<DropboxFileListResponse> {
    const resp = await axios.get<DropboxBackendListResponse>(
      `${ApiService.baseURL}/authentication/dropbox/favorites/`,
      { headers: this.withAuthHeaders() }
    )

    return { value: resp.data.items || [] }
  }

  static async addFavorite(itemId: string): Promise<{ success: boolean }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/favorites/${encodeURIComponent(itemId)}/`,
      {},
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async removeFavorite(itemId: string): Promise<{ success: boolean }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/favorites/${encodeURIComponent(itemId)}/remove/`,
      {},
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getTrash(): Promise<DropboxFileListResponse> {
    const resp = await axios.get<DropboxBackendListResponse>(
      `${ApiService.baseURL}/authentication/dropbox/trash/`,
      { headers: this.withAuthHeaders() }
    )

    return { value: resp.data.items || [] }
  }

  static async getFile(itemId: string): Promise<DropboxFile> {
    const resp = await axios.get<DropboxFile>(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async downloadFile(itemId: string): Promise<Blob> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/download/`,
      {
        headers: this.withAuthHeaders(),
        responseType: 'blob'
      }
    )
    return resp.data
  }

  static async getFileBlob(itemId: string): Promise<Blob> {
    return this.downloadFile(itemId)
  }

  static async updateFile(itemId: string, file: File | Blob, filename?: string): Promise<DropboxFile> {
    const formData = new FormData()
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', new File([file], filename || 'file', { type: file.type }))
    } else {
      formData.append('file', file)
    }

    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/update/`,
      formData,
      {
        headers: {
          ...this.withAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return resp.data
  }

  static async uploadFile(file: File | Blob, filename: string, parentId?: string): Promise<DropboxFile> {
    const formData = new FormData()
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', new File([file], filename, { type: file.type }))
    } else {
      formData.append('file', file)
    }

    if (parentId) formData.append('parent_id', parentId)

    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/files/upload/`,
      formData,
      {
        headers: {
          ...this.withAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return resp.data
  }

  static async createFolder(parentId: string, name: string): Promise<DropboxFile> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/folders/create/`,
      { parent_id: parentId, name },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async renameOrMove(itemId: string, newName?: string, newParentId?: string): Promise<DropboxFile> {
    const resp = await axios.patch(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/rename_move/`,
      { name: newName, parent_id: newParentId },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async deleteItem(itemId: string): Promise<{ success: boolean }> {
    const resp = await axios.delete(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/delete/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async createShareLink(itemId: string, type: 'view' | 'edit' = 'view'): Promise<{ link: string }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/share_link/`,
      { type },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async inviteToShare(itemId: string, emails: string[], role: 'read' | 'write' = 'read', message?: string): Promise<{ success: boolean }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/invite/`,
      { emails, role, message },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getPermissions(itemId: string): Promise<{ permissions: any[] }> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/dropbox/items/${encodeURIComponent(itemId)}/permissions/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getStatus(): Promise<{ connected: boolean; accountEmail?: string; accountName?: string }> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/dropbox/status/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async initiateOAuth(callbackUrl: string): Promise<{ auth_url: string }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/initiate_oauth/`,
      { callback_url: callbackUrl },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async disconnect(): Promise<{ success: boolean }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/dropbox/disconnect/`,
      {},
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }
}
