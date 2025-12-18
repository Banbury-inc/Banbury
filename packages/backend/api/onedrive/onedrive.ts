import { ApiService } from "../apiService"
import axios from 'axios'

export interface OneDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedDateTime?: string
  createdDateTime?: string
  size?: number
  webUrl?: string
  parentReference?: {
    id?: string
    path?: string
  }
  folder?: { childCount?: number }
  file?: { mimeType?: string }
}

export interface OneDriveFileListResponse {
  value?: OneDriveFile[]
  '@odata.nextLink'?: string
  error?: string
}

export default class OneDrive {
  constructor(_api: ApiService) {}

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * List files from OneDrive root
   */
  static async listRootFiles(pageSize: number = 100): Promise<OneDriveFileListResponse> {
    const url = new URL(`${ApiService.baseURL}/authentication/onedrive/root/children/`)
    url.searchParams.append('pageSize', String(pageSize))

    const resp = await axios.get<OneDriveFileListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * List children of a specific folder
   */
  static async listFolderChildren(folderId: string, pageSize: number = 100): Promise<OneDriveFileListResponse> {
    const url = new URL(`${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(folderId)}/children/`)
    url.searchParams.append('pageSize', String(pageSize))

    const resp = await axios.get<OneDriveFileListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * Get recent files
   */
  static async listRecentFiles(pageSize: number = 20): Promise<OneDriveFileListResponse> {
    const url = new URL(`${ApiService.baseURL}/authentication/onedrive/recent/`)
    url.searchParams.append('pageSize', String(pageSize))

    const resp = await axios.get<OneDriveFileListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * Search files
   */
  static async searchFiles(query: string, pageSize: number = 20): Promise<OneDriveFileListResponse> {
    const url = new URL(`${ApiService.baseURL}/authentication/onedrive/search/`)
    url.searchParams.append('q', query)
    url.searchParams.append('pageSize', String(pageSize))

    const resp = await axios.get<OneDriveFileListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * Get a specific file's metadata
   */
  static async getFile(itemId: string): Promise<OneDriveFile> {
    const resp = await axios.get<OneDriveFile>(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Download a file from OneDrive (returns blob)
   */
  static async downloadFile(itemId: string): Promise<Blob> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/download/`,
      { 
        headers: this.withAuthHeaders(),
        responseType: 'blob'
      }
    )
    return resp.data
  }

  /**
   * Get file as blob with proper authentication (alias for downloadFile)
   */
  static async getFileBlob(itemId: string): Promise<Blob> {
    return this.downloadFile(itemId)
  }

  /**
   * Update a file in OneDrive (overwrite content)
   */
  static async updateFile(itemId: string, file: File | Blob, filename?: string): Promise<OneDriveFile> {
    const formData = new FormData()
    
    if (file instanceof Blob && !(file instanceof File)) {
      const fileWithName = new File([file], filename || 'file', { type: file.type })
      formData.append('file', fileWithName)
    } else {
      formData.append('file', file)
    }
    
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/update/`,
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

  /**
   * Create a folder
   */
  static async createFolder(parentId: string, name: string): Promise<OneDriveFile> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/onedrive/folders/create/`,
      { parent_id: parentId, name },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Rename or move an item
   */
  static async renameOrMove(itemId: string, newName?: string, newParentId?: string): Promise<OneDriveFile> {
    const resp = await axios.patch(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/rename_move/`,
      { name: newName, parent_id: newParentId },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Delete an item
   */
  static async deleteItem(itemId: string): Promise<{ success: boolean }> {
    const resp = await axios.delete(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/delete/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Create a sharing link for an item
   */
  static async createShareLink(itemId: string, type: 'view' | 'edit' = 'view'): Promise<{ link: string }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/share_link/`,
      { type },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Invite users to share an item
   */
  static async inviteToShare(itemId: string, emails: string[], role: 'read' | 'write' = 'read', message?: string): Promise<{ success: boolean }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/invite/`,
      { emails, role, message },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Get permissions for an item
   */
  static async getPermissions(itemId: string): Promise<{ permissions: any[] }> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/onedrive/items/${encodeURIComponent(itemId)}/permissions/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Get OneDrive connection status
   */
  static async getStatus(): Promise<{ connected: boolean; accountEmail?: string; accountName?: string }> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/onedrive/status/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Initiate OneDrive OAuth flow
   */
  static async initiateOAuth(callbackUrl: string): Promise<{ auth_url: string }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/onedrive/initiate_oauth/`,
      { callback_url: callbackUrl },
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  /**
   * Disconnect OneDrive
   */
  static async disconnect(): Promise<{ success: boolean }> {
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/onedrive/disconnect/`,
      {},
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }
}
