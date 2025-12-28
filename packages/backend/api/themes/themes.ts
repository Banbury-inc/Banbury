import { ApiService } from '../apiService'

export default class Themes {
  constructor(private api: ApiService) {}

  /**
   * Fetch themes from external API
   * @param endpoint - Optional custom endpoint URL
   * @returns Array of themes
   */
  static async fetchThemes(endpoint?: string): Promise<any[]> {
    try {
      const url = endpoint || '/api/themes/'
      const response = await ApiService.get<any[]>(url)
      return response || []
    } catch (error) {
      console.error('Error fetching themes:', error)
      throw error
    }
  }

  /**
   * Fetch a specific theme by ID
   * @param themeId - Theme identifier
   * @param endpoint - Optional custom endpoint URL
   * @returns Theme object or null
   */
  static async fetchThemeById(themeId: string, endpoint?: string): Promise<any | null> {
    try {
      const url = endpoint || `/api/themes/${themeId}/`
      const response = await ApiService.get<any>(url)
      return response || null
    } catch (error) {
      console.error('Error fetching theme by ID:', error)
      return null
    }
  }

  /**
   * Search themes by query
   * @param query - Search query string
   * @param endpoint - Optional custom endpoint URL
   * @returns Array of matching themes
   */
  static async searchThemes(query: string, endpoint?: string): Promise<any[]> {
    try {
      const url = endpoint || '/api/themes/search/'
      const response = await ApiService.post<any[]>(url, { query })
      return response || []
    } catch (error) {
      console.error('Error searching themes:', error)
      return []
    }
  }

  /**
   * Get themes by category
   * @param category - Theme category
   * @param endpoint - Optional custom endpoint URL
   * @returns Array of themes in category
   */
  static async getThemesByCategory(category: string, endpoint?: string): Promise<any[]> {
    try {
      const url = endpoint || `/api/themes/category/${category}/`
      const response = await ApiService.get<any[]>(url)
      return response || []
    } catch (error) {
      console.error('Error fetching themes by category:', error)
      return []
    }
  }
}

