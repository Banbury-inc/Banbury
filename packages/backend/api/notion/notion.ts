import axios from 'axios'
import { ApiService } from '../apiService'

export interface NotionWorkspace {
  id?: string
  name?: string
  icon?: string
}

export interface NotionConnectionStatus {
  connected: boolean
  workspace?: NotionWorkspace
  botId?: string
  connectedAt?: string
}

export interface NotionSearchResult {
  id: string
  object: 'page' | 'database' | 'data_source' | string
  title?: string
  url?: string
  archived?: boolean
  lastEditedTime?: string
}

export interface NotionPaginatedResponse<T> {
  results: T[]
  hasMore?: boolean
  nextCursor?: string | null
}

export interface NotionPage {
  id: string
  url?: string
  archived?: boolean
  properties?: Record<string, unknown>
  parent?: Record<string, unknown>
  createdTime?: string
  lastEditedTime?: string
}

export interface NotionBlock {
  id: string
  type: string
  hasChildren?: boolean
  archived?: boolean
  [key: string]: unknown
}

export interface NotionDataSource {
  id: string
  title?: string
  url?: string
  properties?: Record<string, unknown>
  parent?: Record<string, unknown>
}

export interface NotionTemplate {
  id: string
  name: string
  isDefault?: boolean
}

export interface NotionSearchParams {
  query?: string
  filter?: string
  limit?: number
  cursor?: string
}

export interface NotionQueryDataSourceParams {
  filter?: Record<string, unknown>
  sorts?: Array<Record<string, unknown>>
  pageSize?: number
  startCursor?: string
}

export interface CreateNotionPageParams {
  parent: Record<string, unknown>
  properties?: Record<string, unknown>
  children?: Array<Record<string, unknown>>
  icon?: Record<string, unknown>
  cover?: Record<string, unknown>
}

export interface CreateNotionPageFromTemplateParams {
  templateId: string
  parent?: Record<string, unknown>
  properties?: Record<string, unknown>
}

function appendOptionalParam(params: URLSearchParams, key: string, value?: string | number) {
  if (value === undefined || value === null || value === '') return
  params.append(key, String(value))
}

export default class Notion {
  private static withAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  static async getStatus(): Promise<NotionConnectionStatus> {
    const resp = await axios.get<NotionConnectionStatus>(
      `${ApiService.baseURL}/authentication/notion/status/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async search(params: NotionSearchParams = {}): Promise<NotionPaginatedResponse<NotionSearchResult>> {
    const searchParams = new URLSearchParams()
    appendOptionalParam(searchParams, 'query', params.query)
    appendOptionalParam(searchParams, 'filter', params.filter)
    appendOptionalParam(searchParams, 'limit', params.limit)
    appendOptionalParam(searchParams, 'cursor', params.cursor)

    const queryString = searchParams.toString()
    const endpoint = queryString
      ? `/authentication/notion/search/?${queryString}`
      : '/authentication/notion/search/'
    const resp = await axios.get<NotionPaginatedResponse<NotionSearchResult>>(
      `${ApiService.baseURL}${endpoint}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getPage(pageId: string): Promise<NotionPage> {
    const resp = await axios.get<NotionPage>(
      `${ApiService.baseURL}/authentication/notion/pages/${encodeURIComponent(pageId)}/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async getPageBlocks(pageId: string, pageSize = 100, cursor?: string): Promise<NotionPaginatedResponse<NotionBlock>> {
    const params = new URLSearchParams()
    appendOptionalParam(params, 'page_size', pageSize)
    appendOptionalParam(params, 'cursor', cursor)

    const resp = await axios.get<NotionPaginatedResponse<NotionBlock>>(
      `${ApiService.baseURL}/authentication/notion/pages/${encodeURIComponent(pageId)}/blocks/?${params.toString()}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async createPage(payload: CreateNotionPageParams): Promise<NotionPage> {
    const resp = await axios.post<NotionPage>(
      `${ApiService.baseURL}/authentication/notion/pages/`,
      payload,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async listDataSources(): Promise<NotionPaginatedResponse<NotionDataSource>> {
    const resp = await axios.get<NotionPaginatedResponse<NotionDataSource>>(
      `${ApiService.baseURL}/authentication/notion/data_sources/`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async queryDataSource(
    dataSourceId: string,
    payload: NotionQueryDataSourceParams = {}
  ): Promise<NotionPaginatedResponse<NotionPage>> {
    const resp = await axios.post<NotionPaginatedResponse<NotionPage>>(
      `${ApiService.baseURL}/authentication/notion/data_sources/${encodeURIComponent(dataSourceId)}/query/`,
      payload,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async listTemplates(
    dataSourceId: string,
    name?: string,
    pageSize = 100,
    cursor?: string
  ): Promise<NotionPaginatedResponse<NotionTemplate>> {
    const params = new URLSearchParams()
    appendOptionalParam(params, 'name', name)
    appendOptionalParam(params, 'page_size', pageSize)
    appendOptionalParam(params, 'start_cursor', cursor)

    const resp = await axios.get<NotionPaginatedResponse<NotionTemplate>>(
      `${ApiService.baseURL}/authentication/notion/data_sources/${encodeURIComponent(dataSourceId)}/templates/?${params.toString()}`,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }

  static async createPageFromTemplate(
    dataSourceId: string,
    payload: CreateNotionPageFromTemplateParams
  ): Promise<NotionPage> {
    const resp = await axios.post<NotionPage>(
      `${ApiService.baseURL}/authentication/notion/data_sources/${encodeURIComponent(dataSourceId)}/pages_from_template/`,
      payload,
      { headers: this.withAuthHeaders() }
    )
    return resp.data
  }
}
