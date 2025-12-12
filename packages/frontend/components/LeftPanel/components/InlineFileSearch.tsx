import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, File, FileImage, FileVideo, FileAudio, FileText, FileSpreadsheet, FileBarChart, FileCode, FileArchive, FileJson, FileCog, FileType, Mail } from 'lucide-react';
import { ApiService } from '../../../../backend/api/apiService';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { useToast } from '../../ui/use-toast';
import { Input } from '../../ui/old-input';

interface InlineFileSearchProps {
  onFileSelect: (file: FileSystemItem) => void;
  onEmailSelect?: (email: EmailResult) => void;
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

interface EmailResult {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: any;
  internalDate?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
}

// File type detection functions (copied from app-sidebar.tsx)
const getFileExtension = (fileName: string): string => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return extension
}

const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico']
  const extension = getFileExtension(fileName)
  return imageExtensions.includes(extension)
}

const isVideoFile = (fileName: string): boolean => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv']
  const extension = getFileExtension(fileName)
  return videoExtensions.includes(extension)
}

const isAudioFile = (fileName: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au']
  const extension = getFileExtension(fileName)
  return audioExtensions.includes(extension)
}

const isPdfFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.pdf'
}

const isDocumentFile = (fileName: string): boolean => {
  const documentExtensions = ['.docx', '.doc', '.rtf', '.odt', '.txt', '.md', '.markdown']
  const extension = getFileExtension(fileName)
  return documentExtensions.includes(extension)
}

const isSpreadsheetFile = (fileName: string): boolean => {
  const spreadsheetExtensions = ['.xlsx', '.xls', '.csv', '.ods', '.tsv']
  const extension = getFileExtension(fileName)
  return spreadsheetExtensions.includes(extension)
}

const isPresentationFile = (fileName: string): boolean => {
  const presentationExtensions = ['.pptx', '.ppt', '.odp']
  const extension = getFileExtension(fileName)
  return presentationExtensions.includes(extension)
}

const isCodeFile = (fileName: string): boolean => {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
    '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh', '.fish',
    '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd', '.coffee', '.litcoffee', '.iced'
  ]
  const extension = getFileExtension(fileName)
  return codeExtensions.includes(extension)
}

const isArchiveFile = (fileName: string): boolean => {
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.lzma', '.cab', '.iso', '.dmg', '.pkg']
  const extension = getFileExtension(fileName)
  return archiveExtensions.includes(extension)
}

const isDataFile = (fileName: string): boolean => {
  const dataExtensions = ['.json', '.xml', '.csv', '.tsv', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log', '.sql', '.db', '.sqlite', '.sqlite3']
  const extension = getFileExtension(fileName)
  return dataExtensions.includes(extension)
}

const isExecutableFile = (fileName: string): boolean => {
  const executableExtensions = ['.exe', '.msi', '.app', '.dmg', '.deb', '.rpm', '.pkg', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.jar', '.war', '.ear']
  const extension = getFileExtension(fileName)
  return executableExtensions.includes(extension)
}

const isFontFile = (fileName: string): boolean => {
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot', '.svg']
  const extension = getFileExtension(fileName)
  return fontExtensions.includes(extension)
}

const is3DFile = (fileName: string): boolean => {
  const threeDExtensions = ['.obj', '.fbx', '.dae', '.3ds', '.blend', '.max', '.ma', '.mb', '.c4d', '.stl', '.ply', '.wrl', '.x3d']
  const extension = getFileExtension(fileName)
  return threeDExtensions.includes(extension)
}

const isVectorFile = (fileName: string): boolean => {
  const vectorExtensions = ['.svg', '.ai', '.eps', '.pdf', '.cdr', '.wmf', '.emf', '.dxf', '.dwg']
  const extension = getFileExtension(fileName)
  return vectorExtensions.includes(extension)
}

// Function to extract email subject from Gmail API response
const extractEmailSubject = (email: EmailResult): string => {
  // If we have a subject field from the full message details, use it
  if (email.subject) {
    return email.subject;
  }
  
  // Extract subject from Gmail API payload headers
  if (email.payload && email.payload.headers) {
    const subjectHeader = email.payload.headers.find((header: any) => 
      header.name && header.name.toLowerCase() === 'subject'
    );
    if (subjectHeader && subjectHeader.value) {
      return subjectHeader.value;
    }
  }
  
  // If we have a snippet, try to extract subject from it
  if (email.snippet) {
    // Gmail often includes the subject at the beginning of the snippet
    // Look for common patterns like "Subject: " or just use the first part
    const snippet = email.snippet;
    
    // Try to extract subject from common patterns
    if (snippet.includes('Subject:')) {
      const subjectMatch = snippet.match(/Subject:\s*([^\n\r]+)/i);
      if (subjectMatch) {
        return subjectMatch[1].trim();
      }
    }
    
    // Look for "Re:" or "Fwd:" patterns which often indicate the start of a subject
    if (snippet.match(/^(Re:|Fwd:|FW:|RE:|FW:)/i)) {
      const subjectMatch = snippet.match(/^(Re:|Fwd:|FW:|RE:|FW:)\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        return subjectMatch[0].trim();
      }
    }
    
    // If no clear subject pattern, use the first part of the snippet
    // (Gmail usually puts the subject first, before any email content)
    const firstLine = snippet.split('\n')[0];
    if (firstLine && firstLine.length > 0) {
      // Limit the length to avoid showing too much content
      const truncated = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
      return truncated.trim();
    }
  }
  
  // Fallback to snippet or default text
  return email.snippet || 'Email';
};

// Function to extract email sender from Gmail API response
const extractEmailSender = (email: EmailResult): string | null => {
  // If we have a from field from the full message details, use it
  if (email.from) {
    return email.from;
  }
  
  // Extract sender from Gmail API payload headers
  if (email.payload && email.payload.headers) {
    const fromHeader = email.payload.headers.find((header: any) => 
      header.name && header.name.toLowerCase() === 'from'
    );
    if (fromHeader && fromHeader.value) {
      return fromHeader.value;
    }
  }
  
  // If we have a snippet, try to extract sender from it
  if (email.snippet) {
    const snippet = email.snippet;
    if (snippet.includes('From:')) {
      const fromMatch = snippet.match(/From:\s*([^\n\r]+)/i);
      if (fromMatch) {
        return fromMatch[1].trim();
      }
    }
  }
  
  return null;
};

// Function to get the appropriate icon component and color for a file type
const getFileIcon = (fileName: string): { icon: any, color: string } => {
  if (isImageFile(fileName)) return { icon: FileImage, color: 'text-green-400' }
  if (isVideoFile(fileName)) return { icon: FileVideo, color: 'text-red-400' }
  if (isAudioFile(fileName)) return { icon: FileAudio, color: 'text-blue-400' }
  if (isPdfFile(fileName)) return { icon: FileText, color: 'text-red-400' }
  if (isDocumentFile(fileName)) return { icon: FileText, color: 'text-blue-500' }
  if (isSpreadsheetFile(fileName)) return { icon: FileSpreadsheet, color: 'text-green-500' }
  if (isPresentationFile(fileName)) return { icon: FileBarChart, color: 'text-orange-400' }
  if (isCodeFile(fileName)) return { icon: FileCode, color: 'text-yellow-400' }
  if (isArchiveFile(fileName)) return { icon: FileArchive, color: 'text-gray-400' }
  if (isDataFile(fileName)) return { icon: FileJson, color: 'text-indigo-400' }
  if (isExecutableFile(fileName)) return { icon: FileCog, color: 'text-red-500' }
  if (isFontFile(fileName)) return { icon: FileType, color: 'text-pink-400' }
  if (is3DFile(fileName)) return { icon: FileCog, color: 'text-cyan-400' }
  if (isVectorFile(fileName)) return { icon: FileImage, color: 'text-emerald-400' }
  
  // Default file icon
  return { icon: File, color: 'text-gray-400' }
}

const InlineFileSearch: React.FC<InlineFileSearchProps> = ({ onFileSelect, onEmailSelect }) => {
  const [query, setQuery] = useState('');
  const [fileResults, setFileResults] = useState<SearchResult[]>([]);
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  // Handle search with debouncing
  const searchFilesAndEmails = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFileResults([]);
      setEmailResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setLoadingEmails(true);
    setShowResults(true); // Show results immediately

    // Search files first and show results immediately
    try {
      const fileResponse = await ApiService.searchS3Files(searchQuery);
      
      if (fileResponse.result === 'success') {
        setFileResults(fileResponse.files || []);
      } else {
        setFileResults([]);
        console.error('File search failed:', fileResponse.error);
      }
    } catch (error) {
      setFileResults([]);
      console.error('File search error:', error);
    } finally {
      setLoading(false); // File search is done
    }

    // Search emails in parallel and update when ready
    ApiService.searchEmails(searchQuery)
      .then((emailResponse) => {
        if (emailResponse.messages) {
          setEmailResults(emailResponse.messages || []);
        } else {
          setEmailResults([]);
        }
      })
      .catch((error) => {
        setEmailResults([]);
        console.error('Email search failed:', error);
      })
      .finally(() => {
        setLoadingEmails(false); // Email search is done
      });
  }, [toast]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchFilesAndEmails(query);
      } else {
        setFileResults([]);
        setEmailResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchFilesAndEmails]);

  // Handle file selection
  const handleFileSelect = (result: SearchResult) => {
    const fileSystemItem: FileSystemItem = {
      id: result.file_id,
      file_id: result.file_id,
      name: result.file_name,
      path: result.file_path,
      type: 'file',
      size: result.file_size,
      modified: new Date(result.date_modified),
      s3_url: result.s3_url,
    };
    
    onFileSelect(fileSystemItem);
    setQuery('');
    setShowResults(false);
  };

  // Handle email selection
  const handleEmailSelect = (result: EmailResult) => {
    if (onEmailSelect) {
      onEmailSelect(result);
    }
    setQuery('');
    setShowResults(false);
  };

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.inline-search-container')) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  return (
    <div className="inline-search-container relative w-full">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="primary"
          placeholder="Search files..."
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setFileResults([]);
              setEmailResults([]);
              setLoading(false);
              setLoadingEmails(false);
              setShowResults(false);
            }}
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 dark:text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-700 rounded-md shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-zinc-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {!loading && !loadingEmails && fileResults.length === 0 && emailResults.length === 0 && query.trim() && (
            <div className="p-4 text-center text-zinc-400">
              No files or emails found matching &quot;{query}&quot;
            </div>
          )}

          {(fileResults.length > 0 || emailResults.length > 0 || loading) && (
            <div className="p-1">
              <div className="text-xs text-zinc-500 px-2 py-1">
                Found {fileResults.length + emailResults.length} result{(fileResults.length + emailResults.length) !== 1 ? 's' : ''}
                {fileResults.length > 0 && (
                  <span> ({fileResults.length} files</span>
                )}
                {loadingEmails && (
                  <span>{fileResults.length > 0 ? ', ' : ''}searching emails...</span>
                )}
                {!loadingEmails && emailResults.length > 0 && (
                  <span>{fileResults.length > 0 ? ', ' : ''}{emailResults.length} emails</span>
                )}
                {(fileResults.length > 0 || emailResults.length > 0) && (
                  <span>)</span>
                )}
              </div>
              
              {/* File Results */}
              {fileResults.length > 0 && (
                <>
                  {fileResults.length > 0 && emailResults.length > 0 && (
                    <div className="text-xs text-zinc-500 px-2 py-1 border-b border-zinc-700">
                      Files
                    </div>
                  )}
                  {fileResults.slice(0, 5).map((result) => {
                    const fileIconData = getFileIcon(result.file_name)
                    const FileIconComponent = fileIconData.icon
                    
                    return (
                      <button
                        key={result.file_id}
                        onClick={() => handleFileSelect(result)}
                        className="w-full px-2 py-1.5 text-left hover:bg-zinc-700 focus:bg-zinc-700 rounded-sm transition-colors group text-white"
                      >
                        <div className="flex items-center space-x-2">
                          <FileIconComponent className={`h-4 w-4 flex-shrink-0 ${fileIconData.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate group-hover:text-blue-400 transition-colors text-sm">
                              {result.file_name}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </>
              )}

              {/* Email Results */}
              {emailResults.length > 0 && (
                <>
                  {fileResults.length > 0 && emailResults.length > 0 && (
                    <div className="text-xs text-zinc-500 px-2 py-1 border-b border-zinc-700">
                      Emails
                    </div>
                  )}
                  {emailResults.slice(0, 5).map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleEmailSelect(result)}
                      className="w-full px-2 py-1.5 text-left hover:bg-zinc-700 focus:bg-zinc-700 rounded-sm transition-colors group text-white"
                    >
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 flex-shrink-0 text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate group-hover:text-blue-400 transition-colors text-sm">
                            {extractEmailSubject(result)}
                          </div>
                          {extractEmailSender(result) && (
                            <div className="text-zinc-400 text-xs truncate">
                              From: {extractEmailSender(result)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Email Loading Indicator */}
              {loadingEmails && emailResults.length === 0 && (
                <>
                  {fileResults.length > 0 && (
                    <div className="text-xs text-zinc-500 px-2 py-1 border-b border-zinc-700">
                      Emails
                    </div>
                  )}
                  <div className="px-2 py-1.5 text-zinc-400">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="text-sm">Searching emails...</span>
                    </div>
                  </div>
                </>
              )}

              {(fileResults.length > 5 || emailResults.length > 5) && (
                <div className="text-xs text-zinc-500 px-2 py-1 text-center">
                  ... and {(fileResults.length - 5) + (emailResults.length - 5)} more results
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineFileSearch;
