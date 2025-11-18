import { ApiService } from '../../../backend/api/apiService'

export interface VisitorData {
  _id: string
  ip_address: string
  path: string
  page_title: string
  referrer_source?: string
  campaign_id?: string
  content_type: string
  user_agent: string
  city: string
  region: string
  country: string
  time: string
  client_timestamp?: string
  tracking_version: string
}

export interface PaginationInfo {
  current_page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface VisitorFilters {
  location: string
  source: string
  campaign: string
  content_type: string
  ip_exclusions: string
  days: number
}

export interface PaginatedVisitorResponse {
  visitors: VisitorData[]
  pagination: PaginationInfo
  filters: VisitorFilters
}

export interface LoadVisitorsParams {
  page?: number
  pageSize?: number
  days?: number
  location?: string
  source?: string
  campaign?: string
  contentType?: string
  ipExclusions?: string
}

export async function loadPaginatedVisitors(params: LoadVisitorsParams = {}): Promise<PaginatedVisitorResponse> {
  try {
    const response = await ApiService.getSiteVisitorInfoPaginated({
      page: params.page || 1,
      page_size: params.pageSize || 100,
      days: params.days || 30,
      location: params.location,
      source: params.source,
      campaign: params.campaign,
      content_type: params.contentType,
      ip_exclusions: params.ipExclusions
    })
    
    return response as PaginatedVisitorResponse
  } catch (error) {
    console.error('Failed to load paginated visitors:', error)
    throw error
  }
}

export function getNextPage(currentPage: number, totalPages: number): number {
  return Math.min(currentPage + 1, totalPages)
}

export function getPreviousPage(currentPage: number): number {
  return Math.max(currentPage - 1, 1)
}

export function canGoNext(currentPage: number, totalPages: number): boolean {
  return currentPage < totalPages
}

export function canGoPrev(currentPage: number): boolean {
  return currentPage > 1
}

export function getPageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  const pages: number[] = []
  const halfVisible = Math.floor(maxVisible / 2)
  
  let startPage = Math.max(1, currentPage - halfVisible)
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)
  
  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
}
