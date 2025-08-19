import axios, { AxiosError } from 'axios';

import { AUTH_CONFIG } from './authConfig';
import { CONFIG } from '../config/config';

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// API service for centralized HTTP requests
export class ApiService {
  private static baseURL = CONFIG.url;

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
        user?: { username: string; email: string };
        error?: string;
        details?: any;
      }>(qs);

      if (response.success && response.token && response.user) {
        // Set auth token globally
        this.setAuthToken(response.token, response.user.username);
        // Store email separately
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('userEmail', response.user.email);
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
   * Get user's S3 cloud files
   */
  static async getUserFiles(username: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // The backend extracts username from token, so we don't need to pass it in URL
      const response = await this.get<{
        result?: string;
        files?: Array<{
          file_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          date_uploaded: string;
          date_modified: string;
          s3_url: string;
          device_name: string;
        }>;
        error?: string;
        status_code?: number;
      }>(`/files/get_s3_files/`);

      // console.log('S3 Files API Response:', response);

      // Handle both possible response formats from the backend
      if (response.result === 'success' && response.files) {
        return {
          success: true,
          files: response.files
        };
      } else if (response.files && Array.isArray(response.files)) {
        return {
          success: true,
          files: response.files
        };
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        console.error('Unexpected API response format:', response);
        throw new Error('Failed to fetch user files - unexpected response format');
      }
    } catch (error) {
      console.error('getUserFiles error:', error);
      throw this.enhanceError(error, 'Failed to fetch user files');
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
   * Download S3 file content
   */
  static async downloadS3File(fileId: string, fileName: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseURL}/files/download_s3_file/${encodeURIComponent(fileId)}/`,
        responseType: 'blob', // Important for file downloads
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization']
        }
      });

      // Preserve server-provided content-type for correct handling (e.g., XLSX)
      const incomingBlob = response.data as Blob;
      const serverType = (response.headers && (response.headers['content-type'] || (response.headers as any).get?.('content-type'))) || '';
      const type = (incomingBlob && (incomingBlob as any).type) || serverType || 'application/octet-stream';
      const blob = (incomingBlob && (incomingBlob as any).type)
        ? incomingBlob
        : new Blob([incomingBlob], { type });
      const url = window.URL.createObjectURL(blob);
      
      return {
        success: true,
        blob,
        url,
        fileName
      };
    } catch (error) {
      console.error('downloadS3File error:', error);
      throw this.enhanceError(error, 'Failed to download file');
    }
  }

  /**
   * Upload file content to S3 (if endpoint exists) and add metadata
   */
  static async uploadFile(username: string, file: File | Blob, fileName: string, filePath: string, fileType: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // First, create file metadata
      const fileMetadata = {
        file_type: fileType,
        file_name: fileName,
        file_path: filePath,
        date_uploaded: new Date().toISOString(),
        date_modified: new Date().toISOString(),
        file_size: file.size,
        file_priority: 1,
        file_parent: filePath.split('/').slice(0, -1).join('/') || 'root',
        original_device: 'web-upload',
        kind: file instanceof File ? 'file' : 'document'
      };

      // Add file metadata to database
      const metadataResponse = await this.post(`/files/add_file/${username}/`, fileMetadata);
      
      return {
        success: true,
        message: 'File metadata added successfully',
        response: metadataResponse
      };
    } catch (error) {
      console.error('uploadFile error:', error);
      throw this.enhanceError(error, 'Failed to upload file');
    }
  }

  /**
   * Delete S3 file
   */
  static async deleteS3File(fileId: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      const response = await axios({
        method: 'delete',
        url: `${this.baseURL}/files/delete_s3_file/${encodeURIComponent(fileId)}/`,
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization']
        }
      });

      if (response.data.result === 'success') {
        return {
          success: true,
          message: response.data.message || 'File deleted successfully'
        };
      } else if (response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('deleteS3File error:', error);
      throw this.enhanceError(error, 'Failed to delete file');
    }
  }

  /**
   * Rename S3 file by downloading, uploading with new name, and deleting old file
   */
  static async renameS3File(fileId: string, newFileName: string, currentFilePath: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // Step 1: Download the current file content
      const downloadResult = await this.downloadS3File(fileId, newFileName);
      
      // Step 2: Calculate new file path with the new name
      const pathParts = currentFilePath.split('/');
      pathParts[pathParts.length - 1] = newFileName; // Replace the filename part
      const newFilePath = pathParts.join('/');
      
      // Step 3: Upload the file with the new name
      const uploadResult = await this.uploadToS3(
        downloadResult.blob,
        newFileName,
        'web-editor',
        newFilePath,
        pathParts.slice(0, -1).join('/') || 'root'
      );
      
      // Step 4: Delete the old file
      await this.deleteS3File(fileId);
      
      return {
        success: true,
        message: 'File renamed successfully',
        file_info: uploadResult.file_info,
        new_file_url: uploadResult.file_url
      };
    } catch (error) {
      console.error('renameS3File error:', error);
      throw this.enhanceError(error, 'Failed to rename file');
    }
  }

  /**
   * Move S3 file to a new path by downloading, uploading to new location, and deleting old file
   */
  static async moveS3File(fileId: string, newFilePath: string, fileName: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // Step 1: Download the file content
      const downloadResult = await this.downloadS3File(fileId, fileName);
      
      // Step 2: Upload to new location
      const uploadResult = await this.uploadToS3(
        downloadResult.blob,
        fileName,
        'web-editor',
        newFilePath,
        newFilePath.split('/').slice(0, -1).join('/') || 'root'
      );
      
      // Step 3: Delete the old file
      await this.deleteS3File(fileId);
      
      return {
        success: true,
        message: 'File moved successfully',
        file_info: uploadResult.file_info,
        new_file_url: uploadResult.file_url
      };
    } catch (error) {
      console.error('moveS3File error:', error);
      throw this.enhanceError(error, 'Failed to move file');
    }
  }

  /**
   * Create a folder by uploading a marker file
   */
  static async createFolder(folderPath: string, folderName: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // Create a small marker file to represent the folder
      const markerContent = new Blob([''], { type: 'text/plain' });
      const markerFileName = '.folder_marker';
      const fullFolderPath = folderPath ? `${folderPath}/${folderName}` : folderName;
      const markerFilePath = `${fullFolderPath}/${markerFileName}`;
      
      const formData = new FormData();
      formData.append('file', markerContent, markerFileName);
      formData.append('device_name', 'web-editor');
      formData.append('file_path', markerFilePath);
      formData.append('file_parent', fullFolderPath);

      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/files/upload_to_s3/`,
        data: formData,
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization'],
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.result === 'success') {
        return {
          success: true,
          folderPath: fullFolderPath,
          message: 'Folder created successfully'
        };
      } else if (response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error) {
      console.error('createFolder error:', error);
      throw this.enhanceError(error, 'Failed to create folder');
    }
  }

  /**
   * Rename a folder by moving all files within it to a new folder path
   */
  static async renameFolder(oldFolderPath: string, newFolderName: string, username: string) {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      // Get all files for the user to find files in the old folder
      const userFilesResult = await this.getUserFiles(username);
      if (!userFilesResult.success) {
        throw new Error('Failed to fetch user files');
      }
      
      // Find all files that are in the old folder path
      const filesToMove = userFilesResult.files.filter(file => {
        const filePath = file.file_path;
        return filePath.startsWith(oldFolderPath + '/') || filePath === oldFolderPath;
      });
      
      if (filesToMove.length === 0) {
        throw new Error('No files found in the specified folder');
      }
      
      // Calculate the new folder path
      const parentPath = oldFolderPath.split('/').slice(0, -1).join('/');
      const newFolderPath = parentPath ? `${parentPath}/${newFolderName}` : newFolderName;
      
      // Move each file to the new folder path
      const movedFiles = [];
      for (const file of filesToMove) {
        if (!file.file_id) continue;
        
        // Calculate new file path
        const relativePath = file.file_path.substring(oldFolderPath.length);
        const newFilePath = newFolderPath + relativePath;
        
        // Move the file
        const moveResult = await this.moveS3File(file.file_id, newFilePath, file.file_name);
        movedFiles.push(moveResult);
      }
      
      return {
        success: true,
        message: `Folder renamed successfully. Moved ${movedFiles.length} files.`,
        movedFiles,
        oldPath: oldFolderPath,
        newPath: newFolderPath
      };
    } catch (error) {
      console.error('renameFolder error:', error);
      throw this.enhanceError(error, 'Failed to rename folder');
    }
  }

  /**
   * Upload file to S3 (replacing existing file)
   */
  static async uploadToS3(file: File | Blob, fileName: string, deviceName: string = 'web-editor', filePath: string = '', fileParent: string = '') {
    try {
      // Ensure token is loaded
      this.loadAuthToken();
      
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('device_name', deviceName);
      formData.append('file_path', filePath);
      formData.append('file_parent', fileParent);

      const response = await axios({
        method: 'post',
        url: `${this.baseURL}/files/upload_to_s3/`,
        data: formData,
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization'],
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.result === 'success') {
        return {
          success: true,
          file_url: response.data.file_url,
          file_info: response.data.file_info,
          message: 'File uploaded successfully'
        };
      } else if (response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Failed to upload file');
      }
    } catch (error) {
      console.error('uploadToS3 error:', error);
      throw this.enhanceError(error, 'Failed to upload file');
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

// Ensure Authorization header is always sent if token exists
axios.interceptors.request.use((config) => {
  const existingAuth = (config.headers || {})['Authorization'] as string | undefined;
  if (!existingAuth && typeof window !== 'undefined' && window.localStorage) {
    const token = localStorage.getItem('authToken');
    if (token) {
      (config.headers ||= {});
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