import axios, { AxiosError } from 'axios';
import { CONFIG } from '../config/config';

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout

// API service for centralized HTTP requests
export class ApiService {
  private static baseURL = CONFIG.url;

  /**
   * Set global authorization token for all requests
   */
  static setAuthToken(token: string, username?: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Store in localStorage for persistence
    if (token) {
      localStorage.setItem('authToken', token);
    }
    if (username) {
      localStorage.setItem('username', username);
    }
  }

  /**
   * Clear authorization token
   */
  static clearAuthToken() {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
  }

  /**
   * Load existing token from localStorage
   */
  static loadAuthToken() {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Generic GET request
   */
  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.get<T>(`${this.baseURL}${endpoint}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `GET ${endpoint}`);
      throw error;
    }
  }

  /**
   * Generic POST request
   */
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await axios.post<T>(`${this.baseURL}${endpoint}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error, `POST ${endpoint}`);
      throw error;
    }
  }

  /**
   * Authentication specific requests
   */
  static async login(username: string, password: string) {
    try {
      // Use the combined getuserinfo4 endpoint which handles both validation and token generation
      // This matches the backend pattern where getuserinfo4 does the complete authentication
      const response = await this.get<{
        result: string;
        token?: string;
        username?: string;
        message?: string;
      }>(`/authentication/getuserinfo4/${username}/${password}/`);

      if (response.result === 'success' && response.token) {
        // Set auth token globally
        this.setAuthToken(response.token, response.username || username);
        
        return {
          success: true,
          token: response.token,
          username: response.username || username,
          message: response.message
        };
      } else {
        throw new Error(response.message || 'Invalid username or password');
      }
    } catch (error) {
      throw this.enhanceError(error, 'Login failed');
    }
  }

  /**
   * Google OAuth flow
   */
  static async initiateGoogleAuth(redirectUri: string) {
    try {
      const response = await this.get<{ 
        authUrl?: string; 
        error?: string;
      }>(`/authentication/google/?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.authUrl) {
        return { success: true, authUrl: response.authUrl };
      } else {
        throw new Error('Failed to initiate Google login - no auth URL returned');
      }
    } catch (error) {
      throw this.enhanceError(error, 'Google login initiation failed');
    }
  }

  /**
   * Handle OAuth callback
   */
  static async handleOAuthCallback(code: string) {
    try {
      const response = await this.get<{
        success: boolean;
        token?: string;
        user?: { username: string; email: string };
        error?: string;
      }>(`/authentication/auth/callback/?code=${code}`);

      if (response.success && response.token && response.user) {
        // Set auth token globally
        this.setAuthToken(response.token, response.user.username);
        // Store email separately
        localStorage.setItem('userEmail', response.user.email);
        
        return {
          success: true,
          token: response.token,
          user: response.user
        };
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      throw this.enhanceError(error, 'OAuth callback failed');
    }
  }

  /**
   * Validate current token
   */
  static async validateToken() {
    try {
      // Check if we have a token first
      const token = localStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      // Try to make an authenticated request to test the token
      // Using the validate-token endpoint with proper headers
      const response = await this.get<{ valid: boolean; username?: string }>('/authentication/validate-token/');
      return response.valid;
    } catch (error) {
      // Token validation failed - clear invalid token
      this.clearAuthToken();
      return false;
    }
  }

  /**
   * Track page views
   */
  static async trackPageView(path: string, ipAddress: string) {
    try {
      await this.post('/authentication/add_site_visitor_info/', {
        path,
        timestamp: new Date().toISOString(),
        ip_address: ipAddress
      });
    } catch (error) {
      // Silently fail for tracking - this is non-critical
      console.debug('Page tracking failed:', error);
    }
  }

  /**
   * Enhanced error handling
   */
  private static enhanceError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      const responseData = axiosError.response?.data;
      
      let message = `${context}: `;
      
      if (status) {
        message += `HTTP ${status}`;
        if (statusText) {
          message += ` (${statusText})`;
        }
      }
      
      if (responseData && typeof responseData === 'object' && 'error' in responseData) {
        const errorResponse = responseData as { error: string };
        message += ` - ${errorResponse.error}`;
      } else if (responseData && typeof responseData === 'string') {
        message += ` - ${responseData}`;
      } else if (axiosError.message) {
        message += ` - ${axiosError.message}`;
      }

      const enhancedError = new Error(message);
      (enhancedError as any).originalError = error;
      (enhancedError as any).status = status;
      return enhancedError;
    }
    
    if (error instanceof Error) {
      const enhancedError = new Error(`${context}: ${error.message}`);
      (enhancedError as any).originalError = error;
      return enhancedError;
    }
    
    return new Error(`${context}: Unknown error`);
  }

  /**
   * Generic error handler
   */
  private static handleError(error: unknown, context: string) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`API Error [${context}]:`, {
        message: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        url: axiosError.config?.url
      });
    } else {
      console.error(`API Error [${context}]:`, error);
    }
  }
}

// Load auth token on module initialization
ApiService.loadAuthToken();