import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Search, X, FileText, FileImage, FileVideo, FileAudio, FileCode, FileSpreadsheet, FileArchive, FileJson, FileType, FileCheck, FileSearch, FileBarChart, FilePieChart, FileDigit, FileHeart, FileLock, FileMinus, FilePlus, FileQuestion, FileSignature, FileStack, FileSymlink, FileTerminal, FileWarning, FileCog, FileKey, FilePen, FileClock, FileDown, FileUp, FileVolume, FileVolume2, FileMusic, FilePlay, FileBarChart2 } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { useToast } from './ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './tiptap-ui-primitive/popover/popover';
import { Input } from './ui/old-input';

interface FileSearchPopoverProps {
  onFileSelect: (file: FileSystemItem) => void;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SearchResult {
  file_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  date_uploaded: string;
  date_modified: string;
  s3_url: string;
  device_name: string;
}

export const FileSearchPopover: React.FC<FileSearchPopoverProps> = ({ onFileSelect, children, open: controlledOpen, onOpenChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle search with debouncing
  const searchFiles = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.searchS3Files(searchQuery);
      if (response.result === 'success') {
        setResults(response.files || []);
      } else {
        setResults([]);
        toast({
          title: "Search failed",
          description: response.error || "Failed to search files",
          variant: "error",
        });
      }
    } catch (error) {
      setResults([]);
      toast({
        title: "Search error",
        description: error instanceof Error ? error.message : "An error occurred while searching",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchFiles(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchFiles]);

  // Handle file selection
  const handleFileSelect = (result: SearchResult) => {
    const fileSystemItem: FileSystemItem = {
      file_id: result.file_id,
      name: result.file_name,
      path: result.file_path,
      type: 'file',
      size: result.file_size,
      modified: result.date_modified,
      created: result.date_uploaded,
      device_name: result.device_name,
      s3_url: result.s3_url,
    };
    
    onFileSelect(fileSystemItem);
    handleOpenChange(false);
    setQuery('');
    setResults([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleOpenChange(false);
      setQuery('');
      setResults([]);
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
        return <FileImage className="h-4 w-4 text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
      case 'mkv':
        return <FileVideo className="h-4 w-4 text-orange-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <FileAudio className="h-4 w-4 text-pink-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileArchive className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-yellow-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'html':
      case 'css':
      case 'php':
      case 'rb':
      case 'go':
      case 'rs':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      default:
        return <FileType className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) onOpenChange(open)
    setIsOpen(open);
    if (!open) {
      setQuery('');
      setResults([]);
    }
  };

  // Let Radix handle ESC and outside interactions via Content handlers

  const effectiveOpen = controlledOpen ?? isOpen

  return (
    <Popover open={effectiveOpen} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align="start"
        onEscapeKeyDown={() => handleOpenChange(false)}
        onPointerDownOutside={() => handleOpenChange(false)}
        onInteractOutside={() => handleOpenChange(false)}
      >
        <div ref={popoverRef} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Search Header */}
          <div className="flex items-center p-4 border-b border-zinc-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <input
                ref={inputRef}
                type="text"
                // variant="ghost"
                placeholder="Search all files..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <PopoverPrimitive.Close asChild>
              <button
                aria-label="Close"
                className="ml-3 p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenChange(false)
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </PopoverPrimitive.Close>
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-zinc-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Searching...
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && (
              <div className="p-4 text-center text-zinc-400">
                No files found matching &quot;{query}&quot;
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-zinc-500 px-2 py-1">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                {results.map((result) => (
                  <button
                    key={result.file_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileSelect(result);
                    }}
                    className="w-full p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(result.file_name)}
                      <div className="flex-1 min-w-0">
                        <div className="text-zinc-900 dark:text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                          {result.file_name}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {result.file_path}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center space-x-2 mt-1">
                          <span>{formatFileSize(result.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(result.date_modified)}</span>
                          {result.device_name && (
                            <>
                              <span>•</span>
                              <span>{result.device_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && !query.trim() && (
              <div className="p-4 text-center text-zinc-400">
                <Search className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                <p>Start typing to search your files</p>
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="p-3 border-t border-zinc-700 text-xs text-zinc-500">
            <div className="flex items-center justify-between">
              <span>Search across all your S3 files</span>
              <span>Press Esc to close</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FileSearchPopover;
