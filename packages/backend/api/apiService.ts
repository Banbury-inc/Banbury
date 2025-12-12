import axios, { AxiosError } from 'axios';
import { AUTH_CONFIG } from '../authConfig';
import { CONFIG } from '../../frontend/config/config';
import Files from './files/files'
import Emails from './emails/emails'
import Calendar from './calendar/calendar'
import Knowledge from './knowledge/knowledge'
import Drive from './drive/drive'
import MeetingAgent from './meeting-agent/meeting-agent'
import Conversations from './conversations/conversations'
import Scopes from './scopes/scopes'
import Debug from './debug/debug'
import WebSearch from './web-search/web-search'
import Browserbase from './browserbase/browserbase'
import Tracking from './tracking/tracking'

// Configure axios defaults
axios.defaults.timeout = 30000; // 30 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service for centralized HTTP requests
export class ApiService {
  Files: Files
  Emails: Emails
  Calendar: Calendar
  Knowledge: Knowledge
  Drive: Drive
  MeetingAgent: MeetingAgent
  Conversations: Conversations
  Scopes: Scopes
  Debug: Debug
  WebSearch: WebSearch
  Browserbase: Browserbase
  Tracking: Tracking
  constructor() {
    this.Files = new Files(this)
    this.Emails = new Emails(this)
    this.Calendar = new Calendar(this)
    this.Knowledge = new Knowledge(this)
    this.Drive = new Drive(this)
    this.MeetingAgent = new MeetingAgent(this)
    this.Conversations = new Conversations(this)
    this.Scopes = new Scopes(this)
    this.Debug = new Debug(this)
    this.WebSearch = new WebSearch(this)
    this.Browserbase = new Browserbase(this)
    this.Tracking = new Tracking(this)
  }
  static baseURL = CONFIG.url;
  static Files = Files;
  static Emails = Emails;
  static Calendar = Calendar;
  static Knowledge = Knowledge;
  static Drive = Drive;
  static MeetingAgent = MeetingAgent;
  static Conversations = Conversations;
  static Scopes = Scopes;
  static Debug = Debug;
  static WebSearch = WebSearch;
  static Browserbase = Browserbase;
  static Tracking = Tracking;
  /**
   * Set global authorization token for all requests
   */
  static setAuthToken(token: string, username?: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        localStorage.setItem('authToken', token);
      }
      if (username) {
        localStorage.setItem('username', username);
      }
    }
  }

  /**
   * Clear authorization token
   */
  static clearAuthToken() {
    delete axios.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
    }
  }

  /**
   * Load existing token from localStorage
   */
  static loadAuthToken() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('authToken');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
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
   * Generic DELETE request
   */
  static async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.delete<T>(`${this.baseURL}${endpoint}`);
      return response.data;
    } catch (error) {
      this.handleError(error, `DELETE ${endpoint}`);
      throw error;
    }
  }

  /**
   * Generic PUT request
   */
  static async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await axios.put<T>(`${this.baseURL}${endpoint}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error, `PUT ${endpoint}`);
      throw error;
    }
  }

  /**
   * Authentication specific requests
   */
  static async login(username: string, password: string) {
    try {
      // Use the getuserinfo4 endpoint which handles authentication and token generation
      const response = await this.get<{
        result: string;
        token?: string;
        username?: string;
        message?: string;
      }>(`/authentication/getuserinfo4/${encodeURIComponent(username)}/${encodeURIComponent(password)}/`);

      if (response.result === 'success' && response.token) {
        // Set auth token globally
        this.setAuthToken(response.token, response.username || username);
        
        return {
          success: true,
          token: response.token,
          username: response.username || username,
          message: response.message || 'Login successful'
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
  static async handleOAuthCallback(code: string, scope?: string) {
    try {
      const redirectUri = typeof window !== 'undefined' ? AUTH_CONFIG.getRedirectUri() : '';
      const params = new URLSearchParams();
      params.set('code', code);
      if (redirectUri) params.set('redirect_uri', redirectUri);
      if (scope) params.set('scope', scope);
      const qs = `/authentication/auth/callback/?${params.toString()}`;

      const response = await this.get<{
        success: boolean;
        token?: string;
        user?: { username: string; email: string; picture?: any; first_name?: string; last_name?: string };
        error?: string;
        details?: any;
      }>(qs);

      if (response.success && response.token && response.user) {
        // Set auth token globally
        this.setAuthToken(response.token, response.user.username);
        // Store email and profile picture separately
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('userEmail', response.user.email);
          if (response.user.picture) {
            // Handle both base64 object and URL string formats
            if (typeof response.user.picture === 'object' && response.user.picture.data) {
              const pictureUrl = `data:${response.user.picture.content_type};base64,${response.user.picture.data}`;
              localStorage.setItem('userPicture', pictureUrl);
            } else if (typeof response.user.picture === 'string') {
              localStorage.setItem('userPicture', response.user.picture);
            }
          }
          if (response.user.first_name) {
            localStorage.setItem('userFirstName', response.user.first_name);
          }
          if (response.user.last_name) {
            localStorage.setItem('userLastName', response.user.last_name);
          }
        }
        
        return {
          success: true,
          token: response.token,
          user: response.user
        };
      } else {
        // Surface backend details to console to aid debugging
        if ((response as any)?.details) {
          // eslint-disable-next-line no-console
          console.error('OAuth exchange details:', (response as any).details);
        }
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
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('authToken');
        if (!token) {
          return false;
        }
      }

      // Try to make an authenticated request to test the token
      // Using the validate-token endpoint with proper headers
      const response = await this.get<{ valid: boolean; username?: string }>('/authentication/validate-token/');
      return response.valid;
    } catch (error) {
      // Do not aggressively clear token here; allow caller to decide next steps
      return false;
    }
  }

  /**
   * Attempt to refresh the current token
   */
  static async refreshToken(): Promise<boolean> {
    try {
      // Ensure Authorization header is set from stored token
      this.loadAuthToken();
      const response = await this.get<{ success: boolean; token?: string; username?: string }>(
        '/authentication/refresh-token/'
      );
      if (response.success && response.token) {
        this.setAuthToken(response.token, response.username);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Track page views (legacy method)
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
    }
  }

  /**
   * Track page views with enhanced data
   */
  static async trackPageViewEnhanced(trackingData: {
    path: string;
    ip_address: string;
    page_title?: string;
    referrer_source?: string;
    campaign_id?: string;
    content_type?: string;
    user_agent?: string;
  }) {
    try {
      await this.post('/authentication/add_site_visitor_info_enhanced/', {
        ...trackingData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Fallback to legacy tracking if enhanced endpoint fails
      try {
        await this.trackPageView(trackingData.path, trackingData.ip_address);
      } catch (fallbackError) {
        // Both enhanced and legacy page tracking failed
      }
    }
  }

  /**
   * Get site visitor analytics (legacy)
   */
  static async getSiteVisitorInfo(limit: number = 100, days: number = 30) {
    try {
      const response = await this.get(`/authentication/get_site_visitor_info/?limit=${limit}&days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch visitor data:', error);
      throw error;
    }
  }

  /**
   * Get enhanced site visitor analytics with referrer and campaign data
   */
  static async getSiteVisitorInfoEnhanced(limit: number = 100, days: number = 30) {
    try {
      const response = await this.get(`/authentication/get_site_visitor_info_enhanced/?limit=${limit}&days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch enhanced visitor data:', error);
      throw error;
    }
  }

  /**
   * Get paginated site visitor analytics with filtering support
   */
  static async getSiteVisitorInfoPaginated(params: {
    page?: number;
    page_size?: number;
    days?: number;
    location?: string;
    source?: string;
    campaign?: string;
    content_type?: string;
    ip_exclusions?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.page_size !== undefined) queryParams.append('page_size', params.page_size.toString());
      if (params.days !== undefined) queryParams.append('days', params.days.toString());
      if (params.location) queryParams.append('location', params.location);
      if (params.source) queryParams.append('source', params.source);
      if (params.campaign) queryParams.append('campaign', params.campaign);
      if (params.content_type) queryParams.append('content_type', params.content_type);
      if (params.ip_exclusions) queryParams.append('ip_exclusions', params.ip_exclusions);
      
      const response = await this.get(`/authentication/get_site_visitor_info_paginated/?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch paginated visitor data:', error);
      throw error;
    }
  }

  /**
   * Get login analytics
   */
  static async getLoginAnalytics(limit: number = 100, days: number = 30) {
    try {
      const response = await this.get(`/authentication/get_login_analytics/?limit=${limit}&days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch login analytics:', error);
      throw error;
    }
  }

  /**
   * Get Google scopes analytics
   */
  static async getGoogleScopesAnalytics() {
    try {
      const response = await this.get(`/authentication/get_google_scopes_analytics/`);
      return response;
    } catch (error) {
      console.error('Failed to fetch Google scopes analytics:', error);
      throw error;
    }
  }

  /**
   * Get file type analytics
   */
  static async getFileTypeAnalytics(days: number = 30, limit: number = 1000, excludedUsers: string[] = []) {
    try {
      const excludedUsersParam = excludedUsers.length > 0 ? `&excluded_users=${excludedUsers.join(',')}` : '';
      const response = await this.get(`/analytics/get_file_type_analytics/?days=${days}&limit=${limit}${excludedUsersParam}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch file type analytics:', error);
      throw error;
    }
  }

  /**
   * Get all conversations analytics (admin only)
   */
  static async getConversationsAnalytics(limit: number = 50, offset: number = 0, days: number = 30, userFilter: string = '') {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        days: days.toString()
      });
      
      if (userFilter) {
        params.append('username', userFilter);
      }
      
      const response = await this.get(`/conversations/admin/list/?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch conversations analytics:', error);
      throw error;
    }
  }

  /**
   * Get list of users with conversations (admin only)
   */
  static async getConversationUsers(days: number = 30) {
    try {
      const response = await this.get(`/conversations/admin/users/?days=${days}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch conversation users:', error);
      throw error;
    }
  }

  /**
   * Get a specific conversation by ID
   */
  static async getConversation(conversationId: string) {
    try {
      const response = await this.get(`/conversations/${conversationId}/`);
      return response;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      throw error;
    }
  }

  static async getConversationAdmin(conversationId: string) {
    try {
      const response = await this.get(`/conversations/admin/${conversationId}/`);
      return response;
    } catch (error) {
      console.error('Failed to fetch conversation (admin):', error);
      throw error;
    }
  }


  /**
   * Get partial file info for a specific folder path
   */
  static async getPartialFileInfo(username: string, folderPath: string, maxDepth: number = 4) {
    try {
      const response = await this.post<{
        files: Array<{
          file_name: string;
          file_size: number;
          file_type: string;
          file_path: string;
          date_uploaded: string;
          date_modified: string;
          date_accessed: string;
          kind: string;
          device_name: string;
          file_id?: string;
        }>;
      }>(`/files/getpartialfileinfo/${encodeURIComponent(username)}/`, {
        folder_path: folderPath,
        max_depth: maxDepth
      });
      
      return {
        success: true,
        files: response.files || []
      };
    } catch (error) {
      throw this.enhanceError(error, 'Failed to fetch partial file info');
    }
  }


  /**
   * Get presigned URL for a file without downloading the content
   * Useful for Recall AI videos and other files that should be streamed directly
   */
  static async getPresignedUrl(fileId: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseURL}/files/download_s3_file/${encodeURIComponent(fileId)}/`,
        responseType: 'json',
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization']
        }
      });
      
      // Check if it's a JSON response with a URL
      if (response.data && (response.data.url || response.data.download_url || response.data.presigned_url)) {
        const presignedUrl = response.data.url || response.data.download_url || response.data.presigned_url;
        
        return {
          success: true,
          url: presignedUrl
        };
      } else {
        return {
          success: false,
          error: 'No presigned URL found in response'
        };
      }
    } catch (error) {
      console.error('[getPresignedUrl] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get presigned URL'
      };
    }
  }

  /**
   * Get video stream URL for Recall AI videos
   * This uses the backend to proxy the video content to avoid CORS issues
   */
  static async getVideoStreamUrl(fileId: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // Use the existing downloadS3File method which handles the backend proxy
      const result = await Files.downloadS3File(fileId, 'video.mp4');
      
      if (result.success && result.url) {
        return {
          success: true,
          url: result.url
        };
      } else {
        console.error('[getVideoStreamUrl] Failed to get video stream from backend');
        return {
          success: false,
          error: 'Failed to get video stream from backend'
        };
      }
    } catch (error) {
      console.error('[getVideoStreamUrl] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video stream'
      };
    }
  }

  /**
   * Alias for backend download from S3 endpoint semantics. Prefer this in callers.
   */
  static async downloadFromS3(fileId: string, fileName: string) {
    return Files.downloadS3File(fileId, fileName)
  }

  /**
   * Alias for searching S3 files. Prefer this in callers.
   */
  static async searchS3Files(query: string) {
    return Files.searchS3Files(query)
  }





  /**
   * Helper method to get file extension from MIME type
   */
  static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'text/plain': '.txt',
      'text/html': '.html',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/json': '.json',
      'application/xml': '.xml',
      'application/pdf': '.pdf',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogv',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
    };
    
    return mimeToExt[mimeType] || '';
  }

  /**
   * Enhanced error handling
   */
  static enhanceError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;
      const responseData = axiosError.response?.data;
      
      let message = '';
      
      // Handle authentication-specific errors with user-friendly messages
      if (context === 'Login failed') {
        if (status === 404) {
          message = 'Authentication service is not available. Please try again later.';
        } else if (status === 401 || status === 403) {
          message = 'Invalid username or password. Please check your credentials and try again.';
        } else if (status === 500) {
          message = 'Server error occurred during login. Please try again later.';
        } else if (!status) {
          message = 'Unable to connect to the authentication server. Please check your internet connection.';
        }
      }
      
      // Fallback to generic error handling if no specific message was set
      if (!message) {
        message = `${context}: `;
        
        if (status) {
          message += `HTTP ${status}`;
          if (statusText) {
            message += ` (${statusText})`;
          }
        }
        
        if (responseData && typeof responseData === 'object') {
          if ('error' in responseData) {
            const errorResponse = responseData as { error: string };
            message += ` - ${errorResponse.error}`;
          } else if ('message' in responseData) {
            const errorResponse = responseData as { message: string };
            message += ` - ${errorResponse.message}`;
          }
        } else if (responseData && typeof responseData === 'string') {
          message += ` - ${responseData}`;
        } else if (axiosError.message) {
          message += ` - ${axiosError.message}`;
        }
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
   * Track dashboard visit
   */
  static async trackDashboardVisit() {
    try {
      const response = await this.post<{
        result: string;
        message: string;
        username: string;
        user_id: string;
      }>('/users/track_dashboard_visit/');
      return response;
    } catch (error) {
      this.handleError(error, 'Track dashboard visit');
      throw error;
    }
  }

  /**
   * Track workspace visit
   */
  static async trackWorkspaceVisit() {
    try {
      const response = await this.post<{
        result: string;
        message: string;
        username: string;
        user_id: string;
      }>('/users/track_workspace_visit/');
      return response;
    } catch (error) {
      this.handleError(error, 'Track workspace visit');
      throw error;
    }
  }

  /**
   * Generic error handler
   */
  static handleError(error: unknown, context: string) {
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

// Ensure Authorization header is always sent if token exists
axios.interceptors.request.use((config) => {
  const existingAuth = (config.headers || {})['Authorization'] as string | undefined;
  if (!existingAuth && typeof window !== 'undefined' && window.localStorage) {
    const token = localStorage.getItem('authToken');
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Attempt token refresh once on 401, then retry the original request
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const alreadyRetried = (originalRequest as any)._retry === true;
    const status = error.response?.status;

    if (status === 401 && !alreadyRetried) {
      (originalRequest as any)._retry = true;
      const refreshed = await ApiService.refreshToken();
      if (refreshed) {
        // Set updated Authorization header and retry
        if (typeof window !== 'undefined' && window.localStorage) {
          const token = localStorage.getItem('authToken');
          if (token) {
            (originalRequest.headers ||= {});
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
        }
        return axios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);