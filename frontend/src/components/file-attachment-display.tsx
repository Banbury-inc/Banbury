import React, { useState } from 'react';
import { File, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from './ui/button';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { cn } from '../utils';

interface FileAttachmentDisplayProps {
  files: FileSystemItem[];
  onFileClick?: (file: FileSystemItem) => void;
}

export const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps> = ({
  files,
  onFileClick
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (files.length === 0) return null;

  return (
    <div className="space-y-1">
      {/* Dropdown header */}
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-700 p-0 rounded"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        )}
        <span className="text-sm text-zinc-300 font-medium">
          {files.length} File{files.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* File list */}
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {files.map((file) => (
            <div
              key={file.file_id}
              className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-700 rounded group"
            >
              <File className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <span className="text-sm text-zinc-300 truncate flex-1" title={file.name}>
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClick?.(file);
                }}
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
