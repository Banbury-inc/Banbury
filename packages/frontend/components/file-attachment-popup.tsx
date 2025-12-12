import { File, Search, ChevronRight, Check } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Input } from './ui/old-input';
import { ApiService } from '../../backend/api/apiService';
import { cn } from '../utils';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { buildFileTree } from '../utils/fileTreeUtils';

interface FileAttachmentPopupProps {
  onFileSelect: (file: FileSystemItem & { fileData?: string; mimeType?: string }) => void;
  onClose: () => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
  position: { x: number; y: number };
}

export const FileAttachmentPopup: React.FC<FileAttachmentPopupProps> = ({
  onFileSelect,
  onClose,
  userInfo,
  position
}) => {
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [compressingFiles, setCompressingFiles] = useState<Set<string>>(new Set());
  const popupRef = useRef<HTMLDivElement>(null);

  const fetchUserFiles = async () => {
    if (!userInfo?.username) return;
    
    setLoading(true);
    try {
      const result = await ApiService.getUserFiles(userInfo.username);
      if (result.success) {
        const tree = buildFileTree(result.files);
        setFileSystem(tree);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const compressImage = async (blob: Blob, fileName: string, fileId: string, maxSizeBytes: number = 5 * 1024 * 1024): Promise<Blob> => {
    // If it's not an image or already under size limit, return as-is
    if (!blob.type.startsWith('image/') || blob.size <= maxSizeBytes) {
      return blob;
    }
    
    // Add to compressing state
    setCompressingFiles(prev => new Set([...Array.from(prev), fileId]));

    return new Promise<Blob>((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate compression ratio based on file size
        const compressionRatio = Math.sqrt(maxSizeBytes / blob.size);
        const newWidth = Math.floor(img.width * compressionRatio);
        const newHeight = Math.floor(img.height * compressionRatio);

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // Try different quality levels to get under size limit
        const tryCompress = (quality: number) => {
          canvas.toBlob((compressedBlob) => {
            if (compressedBlob) {
              if (compressedBlob.size <= maxSizeBytes || quality <= 0.1) {
                resolve(compressedBlob);
              } else {
                // Try lower quality
                tryCompress(quality - 0.1);
              }
            } else {
              resolve(blob); // Fallback to original
            }
          }, blob.type === 'image/png' ? 'image/jpeg' : blob.type, quality);
        };

        tryCompress(0.8); // Start with 80% quality
      };

      img.onerror = () => {
        // Remove from compressing state on error
        setCompressingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
        resolve(blob); // Fallback to original
      };
      img.src = URL.createObjectURL(blob);
    }).finally(() => {
      // Remove from compressing state when done
      setCompressingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    });
  };

  const downloadFileData = async (file: FileSystemItem): Promise<{ fileData: string; mimeType: string } | null> => {
    try {
      setDownloadingFiles(prev => new Set([...Array.from(prev), file.file_id || '']));
      
      const result = await ApiService.downloadS3File(file.file_id || '', file.name);
      
      if (result.success && result.blob) {
        // Compress image if needed (over 5MB)
        const originalSize = result.blob.size;
        const processedBlob = await compressImage(result.blob, file.name, file.file_id || '');
        
        // Convert blob to base64
        const arrayBuffer = await processedBlob.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...Array.from(new Uint8Array(arrayBuffer))));
        
        // Get MIME type from blob or infer from file extension
        // Use processed blob type if compression changed the format
        const mimeType = processedBlob.type || result.blob.type || getMimeTypeFromExtension(file.name);
        
        return {
          fileData: base64Data,
          mimeType
        };
        return { fileData: base64Data, mimeType };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to download file:', error);
      return null;
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.file_id || '');
        return newSet;
      });
    }
  };

  const getMimeTypeFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Comprehensive MIME type mapping for various file formats
    const mimeTypes: Record<string, string> = {
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'odt': 'application/vnd.oasis.opendocument.text',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      'rtf': 'application/rtf',
      
      // Text formats
      'txt': 'text/plain',
      'csv': 'text/csv',
      'tsv': 'text/tab-separated-values',
      'html': 'text/html',
      'htm': 'text/html',
      'xml': 'application/xml',
      'md': 'text/markdown',
      'markdown': 'text/markdown',
      'log': 'text/plain',
      'conf': 'text/plain',
      'cfg': 'text/plain',
      'ini': 'text/plain',
      'yaml': 'text/yaml',
      'yml': 'text/yaml',
      'toml': 'text/plain',
      
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      
      // Code files
      'js': 'text/javascript',
      'jsx': 'text/javascript',
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'cpp': 'text/x-c++src',
      'cc': 'text/x-c++src',
      'cxx': 'text/x-c++src',
      'c': 'text/x-csrc',
      'h': 'text/x-chdr',
      'hpp': 'text/x-c++hdr',
      'css': 'text/css',
      'scss': 'text/x-scss',
      'sass': 'text/x-sass',
      'less': 'text/css',
      'php': 'text/x-php',
      'rb': 'text/x-ruby',
      'go': 'text/x-go',
      'rs': 'text/x-rust',
      'swift': 'text/x-swift',
      'kt': 'text/x-kotlin',
      'scala': 'text/x-scala',
      'r': 'text/x-r',
      'sql': 'text/x-sql',
      'sh': 'text/x-shellscript',
      'bash': 'text/x-shellscript',
      'zsh': 'text/x-shellscript',
      'fish': 'text/x-shellscript',
      'ps1': 'text/x-powershell',
      'bat': 'text/x-msdos-batch',
      'cmd': 'text/x-msdos-batch',
      
      // Data formats
      'json': 'application/json',
      'jsonl': 'application/jsonlines',
      'ndjson': 'application/x-ndjson',
      'geojson': 'application/geo+json',
      
      // Archives (for reference, may not be directly readable)
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  };

  useEffect(() => {
    fetchUserFiles();
  }, [userInfo?.username]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filterFiles = (items: FileSystemItem[]): FileSystemItem[] => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.path.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterFiles(item.children);
        if (filteredChildren.length > 0) {
          return true;
        }
      }
      
      return matchesSearch && item.type === 'file';
    }).map(item => ({
      ...item,
      children: item.children ? filterFiles(item.children) : undefined
    }));
  };

  const renderFileTree = (items: FileSystemItem[], level: number = 0) => {
    const filteredItems = searchTerm ? filterFiles(items) : items;
    
    return filteredItems.map((item) => {
      const isExpanded = expandedItems.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedFile?.file_id === item.file_id;
      const isDownloading = downloadingFiles.has(item.file_id || '');
      const isCompressing = compressingFiles.has(item.file_id || '');
      
      return (
        <div key={item.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 cursor-pointer transition-colors",
              item.type === 'file' ? 'text-zinc-300' : 'text-zinc-400',
              isSelected && 'bg-zinc-700 text-white'
            )}
            style={{ paddingLeft: `${(level * 12) + 12}px` }}
            onClick={async () => {
              if (item.type === 'file') {
                setSelectedFile(item);
                
                // Download the file data immediately
                const fileData = await downloadFileData(item);
                
                if (fileData) {
                  // Pass the file with downloaded data
                  onFileSelect({
                    ...item,
                    fileData: fileData.fileData,
                    mimeType: fileData.mimeType
                  });
                } else {
                  // Fallback: pass file without data (will be downloaded on server)
                  onFileSelect(item);
                }
                
                onClose();
              } else if (hasChildren) {
                toggleExpanded(item.id);
              }
            }}
          >
            {hasChildren && (
              <ChevronRight 
                className={cn(
                  "h-3 w-3 transition-transform",
                  isExpanded && "rotate-90"
                )} 
              />
            )}
            {!hasChildren && <div className="w-3" />}
            <File className="h-4 w-4" />
            <span className="text-sm truncate flex-1">{item.name}</span>
            {isDownloading && (
              <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            {isCompressing && (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-orange-400">compressing</span>
              </div>
            )}
            {isSelected && !isDownloading && !isCompressing && <Check className="h-4 w-4 text-green-400" />}
          </div>
          {hasChildren && isExpanded && renderFileTree(item.children!, level + 1)}
        </div>
      );
    });
  };

  
  
  const popupContent = (
    <div
      ref={popupRef}
      className="fixed z-[99999] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="p-3 border-b border-zinc-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-600 text-white text-sm"
            autoFocus
          />
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-80">
        {loading ? (
          <div className="flex items-center justify-center p-4 text-zinc-400">
            Loading files...
          </div>
        ) : fileSystem.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-zinc-400">
            No files found
          </div>
        ) : (
          renderFileTree(fileSystem)
        )}
      </div>
    </div>
  );

  return createPortal(popupContent, document.body);
};
