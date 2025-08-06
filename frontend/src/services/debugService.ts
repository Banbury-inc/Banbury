import { CONFIG } from '../config/config';

/**
 * Debug service to test API endpoint availability
 */
export class DebugService {
  /**
   * Test if authentication endpoints are available
   */
  static async testAuthEndpoints() {
    const baseUrl = CONFIG.url;
    const endpoints = [
      '/authentication/google/',
      '/authentication/login_api/',
      '/authentication/validate-token/',
      '/authentication/auth/callback/'
    ];

    console.log(`🔍 Testing authentication endpoints at: ${baseUrl}`);
    
    const results: Record<string, { status: number; available: boolean; error?: string }> = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        results[endpoint] = {
          status: response.status,
          available: response.status !== 404,
        };

        console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      } catch (error) {
        results[endpoint] = {
          status: 0,
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        console.log(`❌ ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Test basic API connectivity
   */
  static async testApiConnectivity() {
    const baseUrl = CONFIG.url;
    
    try {
      console.log(`🔍 Testing API connectivity to: ${baseUrl}`);
      
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

          console.log(`📡 API Response for ${endpoint || 'root'}: ${response.status} ${response.statusText}`);
          
          if (response.status < 500) { // Accept any non-server-error response as connectivity
            return {
              available: true,
              status: response.status,
              statusText: response.statusText,
              endpoint: endpoint || 'root'
            };
          }
        } catch (endpointError) {
          console.log(`⚠️ Endpoint ${endpoint || 'root'} failed: ${endpointError instanceof Error ? endpointError.message : 'Unknown error'}`);
          continue;
        }
      }
      
      throw new Error('All connectivity tests failed');
    } catch (error) {
      console.log(`❌ API Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
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
    console.log('🚀 Starting API diagnostics...');
    
    const connectivity = await this.testApiConnectivity();
    const authEndpoints = await this.testAuthEndpoints();
    
    const info = {
      baseUrl: CONFIG.url,
      connectivity,
      authEndpoints,
      timestamp: new Date().toISOString()
    };

    console.log('📋 API Diagnostics Complete:', info);
    return info;
  }
}

// Auto-run diagnostics in development
if (process.env.NODE_ENV === 'development') {
  // Run diagnostics after a short delay to avoid blocking app startup
  setTimeout(() => {
    DebugService.getApiInfo();
  }, 2000);
}