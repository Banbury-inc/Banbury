import { ApiService } from "../apiService";
import axios from 'axios';

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime?: string
  createdTime?: string
  size?: string
  webViewLink?: string
  iconLink?: string
  thumbnailLink?: string
  parents?: string[]
  trashed?: boolean
  starred?: boolean
}

export interface DriveFileListResponse {
  files?: DriveFile[]
  nextPageToken?: string
  error?: string
}

export default class Drive {
  constructor(api: ApiService) {}

  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * List files from Google Drive
   */
  static async listFiles(params?: {
    pageSize?: number
    pageToken?: string
    q?: string
    orderBy?: string
    fields?: string
  }): Promise<DriveFileListResponse> {
    const query: Record<string, any> = {}
    if (params?.pageSize) query.pageSize = params.pageSize
    if (params?.pageToken) query.pageToken = params.pageToken
    if (params?.q) query.q = params.q
    if (params?.orderBy) query.orderBy = params.orderBy
    if (params?.fields) query.fields = params.fields

    const url = new URL(`${ApiService.baseURL}/authentication/drive/list_files/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get<DriveFileListResponse>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * Get a specific file's metadata
   */
  static async getFile(fileId: string, fields?: string): Promise<DriveFile> {
    const query: Record<string, any> = {}
    if (fields) query.fields = fields

    const url = new URL(`${ApiService.baseURL}/authentication/drive/files/${encodeURIComponent(fileId)}/`)
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, String(v)))

    const resp = await axios.get<DriveFile>(url.toString(), {
      headers: this.withAuthHeaders()
    })
    return resp.data
  }

  /**
   * Download a file from Google Drive
   */
  static async downloadFile(fileId: string): Promise<Blob> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/drive/files/${encodeURIComponent(fileId)}/download/`,
      { 
        headers: this.withAuthHeaders(),
        responseType: 'blob'
      }
    )
    return resp.data
  }

  /**
   * Get file as blob with proper authentication
   */
  static async getFileBlob(fileId: string): Promise<Blob> {
    return this.downloadFile(fileId)
  }

  /**
   * Export Google Workspace file to a specific format
   */
  static async exportFile(fileId: string, mimeType: string): Promise<Blob> {
    const resp = await axios.get(
      `${ApiService.baseURL}/authentication/drive/files/${encodeURIComponent(fileId)}/export/`,
      {
        params: { mimeType },
        headers: this.withAuthHeaders(),
        responseType: 'blob'
      }
    )
    return resp.data
  }

  /**
   * Export Google Docs to DOCX format
   */
  static async exportDocAsDocx(fileId: string): Promise<Blob> {
    return this.exportFile(fileId, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  }

  /**
   * Export Google Sheets to XLSX format
   */
  static async exportSheetAsXlsx(fileId: string): Promise<Blob> {
    return this.exportFile(fileId, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  /**
   * Export Google Slides to PPTX format
   */
  static async exportSlidesAsPptx(fileId: string): Promise<Blob> {
    return this.exportFile(fileId, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
  }

  /**
   * Update a file in Google Drive
   * For Google Workspace files, the content will be converted to the appropriate format
   */
  static async updateFile(fileId: string, file: File | Blob, filename?: string): Promise<DriveFile> {
    const formData = new FormData()
    
    // If it's a Blob without a name, wrap it in a File
    if (file instanceof Blob && !(file instanceof File)) {
      const fileWithName = new File([file], filename || 'file', { type: file.type })
      formData.append('file', fileWithName)
    } else {
      formData.append('file', file)
    }
    
    const resp = await axios.post(
      `${ApiService.baseURL}/authentication/drive/files/${encodeURIComponent(fileId)}/update/`,
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
   * Search files in Google Drive
   */
  static async searchFiles(query: string, pageSize: number = 20): Promise<DriveFileListResponse> {
    return this.listFiles({
      q: query,
      pageSize,
      orderBy: 'modifiedTime desc'
    })
  }

  /**
   * List starred files
   */
  static async listStarredFiles(pageSize: number = 20): Promise<DriveFileListResponse> {
    return this.listFiles({
      q: 'starred = true and trashed = false',
      pageSize,
      orderBy: 'modifiedTime desc'
    })
  }

  /**
   * List recent files
   */
  static async listRecentFiles(pageSize: number = 20): Promise<DriveFileListResponse> {
    return this.listFiles({
      q: 'trashed = false',
      pageSize,
      orderBy: 'modifiedTime desc'
    })
  }

  /**
   * List files in a specific folder
   */
  static async listFilesInFolder(folderId: string, pageSize: number = 100): Promise<DriveFileListResponse> {
    return this.listFiles({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize,
      orderBy: 'folder,name'
    })
  }

  /**
   * List root-level files (files in "My Drive")
   */
  static async listRootFiles(pageSize: number = 100, pageToken?: string): Promise<DriveFileListResponse> {
    return this.listFiles({
      q: `'root' in parents and trashed = false`,
      pageSize,
      pageToken,
      orderBy: 'folder,name'
    })
  }

  /**
   * Get folder metadata and its contents
   */
  static async getFolderWithContents(folderId: string): Promise<{
    folder: DriveFile
    contents: DriveFileListResponse
  }> {
    const [folder, contents] = await Promise.all([
      this.getFile(folderId),
      this.listFilesInFolder(folderId)
    ])
    return { folder, contents }
  }

  /**
   * List all files with parent information for building tree structure
   */
  static async listAllFilesWithParents(pageSize: number = 1000): Promise<DriveFileListResponse> {
    return this.listFiles({
      q: 'trashed = false',
      pageSize,
      orderBy: 'folder,name',
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, createdTime, size, webViewLink, iconLink, thumbnailLink, parents, starred, trashed)'
    })
  }
}

