import { 
  File, 
  X, 
  Paperclip, 
  Search,
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  FileType,
  FileBarChart,
  FileCog,
  Network,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '../../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../../../ui/dropdown-menu';
import { Input } from '../../../ui/old-input';
import { Typography } from '../../../ui/typography';
import { ApiService } from '../../../../../backend/api/apiService';
import { cn } from '../../../../utils';
import { FileSystemItem } from '../../../../utils/fileTreeUtils';
import { buildFileTree } from '../../../../utils/fileTreeUtils';

interface FileAttachmentProps {
  onFileAttach: (file: FileSystemItem) => void;
  attachedFiles: FileSystemItem[];
  onFileRemove: (fileId: string) => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
}

// File type detection functions
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

const isDrawioFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.drawio' || (extension === '.xml' && fileName.toLowerCase().includes('drawio'))
}

const isTldrawFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.tldraw' || extension === '.tldr' || (extension === '.json' && fileName.toLowerCase().includes('tldraw'))
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

// Function to get the appropriate icon component and color for a file type
const getFileIcon = (fileName: string): { icon: any, color: string } => {
  if (isTldrawFile(fileName)) return { icon: Network, color: 'text-purple-400' }
  if (isDrawioFile(fileName)) return { icon: Network, color: 'text-blue-400' }
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



export const FileAttachment: React.FC<FileAttachmentProps> = ({
  onFileAttach,
  attachedFiles,
  onFileRemove,
  userInfo
}) => {
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchUserFiles = async () => {
    if (!userInfo?.username) return;
    
    setLoading(true);
    try {
      const result = await ApiService.Files.getUserFiles(userInfo.username);
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
      
      // Get icon and color for files, use Folder icon for folders
      const fileIconData = item.type === 'file' ? getFileIcon(item.name) : { icon: Folder, color: 'text-yellow-400' };
      const FileIconComponent = fileIconData.icon;
      
      return (
        <div key={item.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer transition-colors duration-150 rounded-md",
              item.type === 'file' ? 'text-foreground' : 'text-muted-foreground'
            )}
            style={{ paddingLeft: `${(level * 12) + 12}px` }}
            onClick={() => {
              if (item.type === 'file') {
                onFileAttach(item);
              } else if (hasChildren) {
                toggleExpanded(item.id);
              }
            }}
          >
            {hasChildren && (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {!hasChildren && <div className="w-4" />}
            <FileIconComponent className={cn("h-4 w-4 flex-shrink-0", fileIconData.color)} />
            <Typography variant="small" className="truncate">{item.name}</Typography>
          </div>
          {hasChildren && isExpanded && renderFileTree(item.children!, level + 1)}
        </div>
      );
    });
  };

  
  
  return (
    <div className="space-y-2">
      <DropdownMenu onOpenChange={(open) => {
        if (open) {
          fetchUserFiles();
        }
      }}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="primary"
            size="xs"
            className="h-7 w-7"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip height={16} width={16} strokeWidth={1} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 max-h-96 p-0 !bg-popover !text-popover-foreground !border-border"
          side="top"
          align="start"
        >
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-popover border-border text-sm"
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-80 bg-popover">
            {loading ? (
              <div className="flex items-center justify-center p-4 bg-popover">
                <Typography variant="muted">Loading files...</Typography>
              </div>
            ) : fileSystem.length === 0 ? (
              <div className="flex items-center justify-center p-4 bg-popover">
                <Typography variant="muted">No files found</Typography>
              </div>
            ) : (
              renderFileTree(fileSystem)
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file) => {
            const fileIconData = getFileIcon(file.name);
            const FileIconComponent = fileIconData.icon;
            
            return (
              <div
                key={file.file_id}
                className="flex items-center gap-2 p-2 bg-accent rounded-md border border-border"
              >
                <FileIconComponent className={cn("h-4 w-4 flex-shrink-0", fileIconData.color)} />
                <Typography variant="small" className="truncate flex-1">{file.name}</Typography>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
                  onClick={() => onFileRemove(file.file_id!)}
                  title="Remove file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
