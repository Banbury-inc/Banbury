import { ApiService } from "../apiService";
import axios, { AxiosError } from 'axios';

export default class Files {
    constructor(api: ApiService) {}

  /**
   * Get user's S3 cloud files
   */
  static async getUserFiles(username: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      // The backend extracts username from token, so we don't need to pass it in URL
      const response = await ApiService.get<{
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
      throw ApiService.enhanceError(error, 'Failed to fetch user files');
    }
  }

  /**
   * Delete a folder by deleting all files within the folder path
   */
  static async deleteFolder(folderPath: string, username: string): Promise<{
    success: boolean;
    deleted: number;
    failed: number;
    message: string;
  }> {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();

      const userFilesResult = await Files.getUserFiles(username);
      if (!userFilesResult.success) {
        throw new Error('Failed to fetch user files');
      }

      // Find all files that are in the folder path (including nested)
      const filesToDelete = userFilesResult.files.filter((file) => {
        const p = file.file_path;
        return p === folderPath || p.startsWith(folderPath + '/');
      });

      if (filesToDelete.length === 0) {
        return { success: true, deleted: 0, failed: 0, message: 'Folder was already empty' };
      }

      const results = await Promise.allSettled(
        filesToDelete
          .filter((f) => !!f.file_id)
          .map((f) => this.deleteS3File(f.file_id as string))
      );

      const deleted = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - deleted;

      return {
        success: failed === 0,
        deleted,
        failed,
        message: failed === 0
          ? `Deleted ${deleted} items from folder`
          : `Deleted ${deleted} items; ${failed} failed`
      };
    } catch (error) {
      console.error('deleteFolder error:', error);
      throw ApiService.enhanceError(error, 'Failed to delete folder');
    }
  }


  /**
   * Upload file to S3 (replacing existing file)
   */
  static async uploadToS3(file: File | Blob, fileName: string, deviceName: string = 'web-editor', filePath: string = '', fileParent: string = '') {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('device_name', deviceName);
      formData.append('file_path', filePath);
      formData.append('file_parent', fileParent);

      const response = await axios({
        method: 'post',
        url: `${ApiService.baseURL}/files/upload_to_s3/`,
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
      throw ApiService.enhanceError(error, 'Failed to upload file');
    }
  }


  /**
   * Upload a folder with all its contents to S3
   */
  static async uploadFolder(files: File[], folderName: string, deviceName: string = 'web-editor', parentPath: string = '') {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      const uploadPromises = files.map(async (file) => {
        // Calculate the relative path within the folder
        const relativePath = file.webkitRelativePath || file.name;
        const filePath = parentPath ? `${parentPath}/${folderName}/${relativePath}` : `${folderName}/${relativePath}`;
        const fileParent = parentPath ? `${parentPath}/${folderName}` : folderName;
        
        return this.uploadToS3(file, file.name, deviceName, filePath, fileParent);
      });

      const results = await Promise.all(uploadPromises);
      
      // Check if all uploads were successful
      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} files failed to upload`);
      }

      return {
        success: true,
        uploadedFiles: results.length,
        message: `Folder "${folderName}" uploaded successfully with ${results.length} files`
      };
    } catch (error) {
      console.error('uploadFolder error:', error);
      throw ApiService.enhanceError(error, 'Failed to upload folder');
    }
  }

  /**
   * Download a file from a URL and upload it to S3
   */
  static async downloadFromUrl(url: string, fileName?: string, filePath: string = '', fileParent: string = '', deviceName: string = 'web-editor') {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      console.log(`Downloading file from URL: ${url}`);
      
      // Download the file from the URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: HTTP ${response.status} ${response.statusText}`);
      }
      
      // Get file information
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentLength = response.headers.get('content-length');
      const fileSize = contentLength ? parseInt(contentLength) : 0;
      
      // Determine file name
      let finalFileName = fileName;
      if (!finalFileName) {
        // Try to extract filename from URL
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        if (pathname && pathname.includes('/')) {
          finalFileName = pathname.split('/').pop() || '';
          if (!finalFileName || !finalFileName.includes('.')) {
            // If no filename in URL, try to determine from content-type
            const extension = ApiService.getExtensionFromMimeType(contentType);
            finalFileName = `downloaded_file${extension}`;
          }
        } else {
          // Fallback filename
          const extension = ApiService.getExtensionFromMimeType(contentType);
          finalFileName = `downloaded_file${extension}`;
        }
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Upload the blob to S3 using the existing uploadToS3 method
      const result = await this.uploadToS3(blob, finalFileName, deviceName, filePath, fileParent);
      
      return {
        success: true,
        file_url: result.file_url,
        file_info: {
          ...result.file_info,
          source_url: url,
          file_size: fileSize
        },
        message: `File downloaded from URL and uploaded successfully`
      };
    } catch (error) {
      console.error('downloadFromUrl error:', error);
      throw ApiService.enhanceError(error, 'Failed to download file from URL');
    }
  }

  /**
   * Upload file content to S3 (if endpoint exists) and add metadata
   */
  static async uploadFile(username: string, file: File | Blob, fileName: string, filePath: string, fileType: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
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
      const metadataResponse = await ApiService.post(`/files/add_file/${username}/`, fileMetadata);
      
      return {
        success: true,
        message: 'File metadata added successfully',
        response: metadataResponse
      };
    } catch (error) {
      console.error('uploadFile error:', error);
      throw ApiService.enhanceError(error, 'Failed to upload file');
    }
  }

  /**
   * Delete S3 file
   */
  static async deleteS3File(fileId: string) {
    try {
      // Ensure token is loaded
    ApiService.loadAuthToken();
      
      const response = await axios({
        method: 'delete',
        url: `${ApiService.baseURL}/files/delete_s3_file/${encodeURIComponent(fileId)}/`,
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
      throw ApiService.enhanceError(error, 'Failed to delete file');
    }
  }

  /**
   * Rename S3 file by downloading, uploading with new name, and deleting old file
   */
  static async renameS3File(fileId: string, newFileName: string, currentFilePath: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
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
      throw ApiService.enhanceError(error, 'Failed to rename file');
    }
  }

  /**
   * Move S3 file to a new path by downloading, uploading to new location, and deleting old file
   */
  static async moveS3File(fileId: string, newFilePath: string, fileName: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
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
      throw ApiService.enhanceError(error, 'Failed to move file');
    }
  }

  /**
   * Update S3 file content and/or metadata
   */
  static async updateS3File(fileId: string, file?: File | Blob, fileName?: string, metadata?: Record<string, any>) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      let response;
      
      if (file) {
        // File update - use multipart form data
        const formData = new FormData();
        formData.append('file', file, fileName || 'updated_file');
        
        // Add metadata as form fields if provided
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
          });
        }

        // Use a fresh axios instance without global JSON Content-Type
        const multipartClient = axios.create()
        delete (multipartClient.defaults.headers.common as any)['Content-Type']
        response = await multipartClient.post(
          `${ApiService.baseURL}/files/update_s3_file/${encodeURIComponent(fileId)}/`,
          formData,
          {
            headers: {
              'Authorization': axios.defaults.headers.common['Authorization']
              // Do NOT set Content-Type; the browser will add the correct multipart boundary
            }
          }
        )
      } else {
        // Metadata-only update - use JSON
        const updateData: Record<string, any> = {};
        
        if (fileName) {
          updateData.file_name = fileName;
        }
        
        if (metadata) {
          Object.assign(updateData, metadata);
        }
        
        if (Object.keys(updateData).length === 0) {
          throw new Error('No update data provided');
        }

        response = await axios({
          method: 'put',
          url: `${ApiService.baseURL}/files/update_s3_file/${encodeURIComponent(fileId)}/`,
          data: updateData,
          headers: {
            'Authorization': axios.defaults.headers.common['Authorization'],
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.result === 'success') {
        return {
          success: true,
          message: response.data.message || 'File updated successfully',
          file_id: response.data.file_id,
          file_name: response.data.file_name,
          file_size: response.data.file_size,
          s3_key: response.data.s3_key
        };
      } else if (response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('Failed to update file');
      }
    } catch (error) {
      console.error('updateS3File error:', error);
      throw ApiService.enhanceError(error, 'Failed to update file');
    }
  }

  /**
   * Create a folder by uploading a marker file
   */
  static async createFolder(folderPath: string, folderName: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
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
        url: `${ApiService.baseURL}/files/upload_to_s3/`,
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
      throw ApiService.enhanceError(error, 'Failed to create folder');
    }
  }

  /**
   * Rename a folder by moving all files within it to a new folder path
   */
  static async renameFolder(oldFolderPath: string, newFolderName: string, username: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      // Get all files for the user to find files in the old folder
      const userFilesResult = await Files.getUserFiles(username);
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
      throw ApiService.enhanceError(error, 'Failed to rename folder');
    }
  }

  /**
   * Search S3 files by query
   */
  static async searchS3Files(query: string): Promise<any> {
    try {
      const response = await ApiService.post('/files/search_s3_files/', { query });
      return response;
    } catch (error) {
      ApiService.handleError(error, `Search S3 files with query: ${query}`);
      throw error;
    }
  }

  /**
   * Download S3 file content
   */
  static async downloadS3File(fileId: string, fileName: string) {
    try {
      // Ensure token is loaded
      ApiService.loadAuthToken();
      
      console.log('[downloadS3File] Downloading file:', fileId, 'fileName:', fileName);
      
      // Always request as blob first
      const response = await axios({
        method: 'get',
        url: `${ApiService.baseURL}/files/download_s3_file/${encodeURIComponent(fileId)}/`,
        responseType: 'blob', // Important for file downloads
        headers: {
          'Authorization': axios.defaults.headers.common['Authorization']
        }
      });
      
      // Check if this might be a JSON response with a presigned URL (for Recall AI files)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          const text = await response.data.text();
          const jsonData = JSON.parse(text);
          
          if (jsonData && (jsonData.url || jsonData.download_url || jsonData.presigned_url)) {
            const downloadUrl = jsonData.url || jsonData.download_url || jsonData.presigned_url;
            console.log('[downloadS3File] Got presigned URL, following redirect:', downloadUrl);
            
            // Download from the presigned URL using fetch to avoid axios interceptors
            console.log('[downloadS3File] Downloading from S3 URL:', downloadUrl);
            const realFileResponse = await fetch(downloadUrl, {
              method: 'GET',
              // Don't include any Authorization headers
            });
            
            if (!realFileResponse.ok) {
              throw new Error(`Failed to download from S3: ${realFileResponse.status} ${realFileResponse.statusText}`);
            }
            
            const realBlob = await realFileResponse.blob();
            console.log('[downloadS3File] Real file downloaded, size:', realBlob.size);
            
            const url = window.URL.createObjectURL(realBlob);
            return {
              success: true,
              blob: realBlob,
              url,
              fileName
            };
          }
        } catch (jsonError) {
          console.log('[downloadS3File] Failed to parse as JSON, treating as blob:', jsonError);
        }
      }
      
      // Preserve server-provided content-type for correct handling (e.g., XLSX)
      const incomingBlob = response.data as Blob;
      console.log('[downloadS3File] Blob size:', incomingBlob.size, 'type:', incomingBlob.type);
      
      const serverType = contentType || '';
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
      throw ApiService.enhanceError(error, 'Failed to download file');
    }
  }
}