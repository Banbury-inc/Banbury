import { CONFIG } from '../../../frontend/config/config';
import { ApiService } from "../apiService";

/**
 * Debug service to test API endpoint availability
 */
export default class Debug {
  /**
   * Test if authentication endpoints are available
   */
  static async testAuthEndpoints() {
  }

  /**
   * Test basic API connectivity
   */
  static async testApiConnectivity() {
    try {
      // Try multiple endpoints to test connectivity
      const endpoints = [
        '', // Root
        '/health/', // Health check if available
        '/authentication/login/', // Known authentication endpoint
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          
          if (response.status < 500) { // Accept any non-server-error response as connectivity
            return {
              available: true,
              status: response.status,
              statusText: response.statusText,
              endpoint: endpoint || 'root'
            };
          }
        } catch (endpointError) {
          continue;
        }
      }
      
      throw new Error('All connectivity tests failed');
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive API information
   */
  static async getApiInfo() {
    
    const connectivity = await this.testApiConnectivity();
    const authEndpoints = await this.testAuthEndpoints();
    
    const info = {
      baseUrl: CONFIG.url,
      connectivity,
      authEndpoints,
      timestamp: new Date().toISOString()
    };

    return info;
  }
}

// Auto-run diagnostics in development
if (process.env.NODE_ENV === 'development') {
  // Run diagnostics after a short delay to avoid blocking app startup
  setTimeout(() => {
    Debug.getApiInfo();
  }, 2000);
}

