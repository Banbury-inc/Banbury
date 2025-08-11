import React, { useState, useEffect } from 'react';
import { File, X, Paperclip, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { ApiService } from '../services/apiService';
import { buildFileTree } from '../utils/fileTreeUtils';
import { cn } from '../utils';

interface FileAttachmentProps {
  onFileAttach: (file: FileSystemItem) => void;
  attachedFiles: FileSystemItem[];
  onFileRemove: (fileId: string) => void;
  userInfo: {
    username: string;
    email?: string;
  } | null;
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
      
      return (
        <div key={item.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 cursor-pointer transition-colors",
              item.type === 'file' ? 'text-zinc-300' : 'text-zinc-400'
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
            <File className="h-4 w-4" />
            <span className="text-sm truncate">{item.name}</span>
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
          <button
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded flex items-center justify-center"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 max-h-96 overflow-hidden bg-zinc-900 border-zinc-700"
          style={{ zIndex: 999999 }}
          side="top"
          align="start"
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
        </DropdownMenuContent>
      </DropdownMenu>

      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file) => (
            <div
              key={file.file_id}
              className="flex items-center gap-2 p-2 bg-zinc-800 rounded-md border border-zinc-700"
            >
              <File className="h-4 w-4 text-zinc-400" />
              <span className="text-sm text-zinc-300 truncate flex-1">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400"
                onClick={() => onFileRemove(file.file_id!)}
                title="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
