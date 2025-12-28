import { Theme, ThemeType } from '../types/slide-layouts'
import { curatedThemes } from '../themes/curated-themes'

export interface ThemeServiceConfig {
  apiEndpoint?: string
  cacheTimeout?: number // milliseconds
}

class ThemeService {
  private config: ThemeServiceConfig
  private cachedThemes: Theme[] | null = null
  private cacheTimestamp: number = 0
  private loadingPromise: Promise<Theme[]> | null = null

  constructor(config: ThemeServiceConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint,
      cacheTimeout: config.cacheTimeout || 5 * 60 * 1000, // 5 minutes default
    }
  }

  /**
   * Get all available themes (curated + API loaded)
   */
  async getThemes(): Promise<Theme[]> {
    // Return cached themes if still valid
    if (this.cachedThemes && Date.now() - this.cacheTimestamp < this.config.cacheTimeout!) {
      return this.cachedThemes
    }

    // If already loading, return the existing promise
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    // Start loading themes
    this.loadingPromise = this.loadThemes()
    const themes = await this.loadingPromise
    this.loadingPromise = null

    return themes
  }

  /**
   * Load themes from curated list and API
   */
  private async loadThemes(): Promise<Theme[]> {
    const allThemes: Theme[] = [...curatedThemes]

    // Load from API if endpoint is configured
    if (this.config.apiEndpoint) {
      try {
        const apiThemes = await this.fetchThemesFromAPI()
        allThemes.push(...apiThemes)
      } catch (error) {
        console.warn('Failed to load themes from API:', error)
        // Continue with curated themes only
      }
    }

    // Cache the results
    this.cachedThemes = allThemes
    this.cacheTimestamp = Date.now()

    return allThemes
  }

  /**
   * Fetch themes from external API
   */
  private async fetchThemesFromAPI(): Promise<Theme[]> {
    if (!this.config.apiEndpoint) {
      return []
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data as Theme[]
      }
      if (data.themes && Array.isArray(data.themes)) {
        return data.themes as Theme[]
      }
      if (data.data && Array.isArray(data.data)) {
        return data.data as Theme[]
      }

      return []
    } catch (error) {
      console.error('Error fetching themes from API:', error)
      throw error
    }
  }

  /**
   * Get a specific theme by ID
   */
  async getThemeById(id: ThemeType): Promise<Theme | undefined> {
    const themes = await this.getThemes()
    return themes.find(theme => theme.id === id)
  }

  /**
   * Get themes by category
   */
  async getThemesByCategory(category: string): Promise<Theme[]> {
    const themes = await this.getThemes()
    return themes.filter(theme => theme.metadata?.category === category)
  }

  /**
   * Search themes by tags or name
   */
  async searchThemes(query: string): Promise<Theme[]> {
    const themes = await this.getThemes()
    const lowerQuery = query.toLowerCase()
    
    return themes.filter(theme => {
      const nameMatch = theme.name.toLowerCase().includes(lowerQuery)
      const tagMatch = theme.metadata?.tags?.some(tag => 
        tag.toLowerCase().includes(lowerQuery)
      )
      const descMatch = theme.metadata?.description?.toLowerCase().includes(lowerQuery)
      
      return nameMatch || tagMatch || descMatch
    })
  }

  /**
   * Clear the theme cache
   */
  clearCache(): void {
    this.cachedThemes = null
    this.cacheTimestamp = 0
    this.loadingPromise = null
  }

  /**
   * Update API endpoint configuration
   */
  setApiEndpoint(endpoint: string | undefined): void {
    this.config.apiEndpoint = endpoint
    this.clearCache()
  }
}

// Export singleton instance
let themeServiceInstance: ThemeService | null = null

export function getThemeService(config?: ThemeServiceConfig): ThemeService {
  if (!themeServiceInstance) {
    themeServiceInstance = new ThemeService(config)
  }
  return themeServiceInstance
}

export default ThemeService

