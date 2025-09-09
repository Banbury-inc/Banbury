import { File, ChevronDown, ChevronRight, X, Mail, Network, Eye } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from './ui/button';
import { cn } from '../utils';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { isDrawioFile } from './MiddlePanel/CanvasViewer/handlers/drawio-viewer-handlers';

interface FileAttachmentDisplayProps {
  files: FileSystemItem[];
  emails?: any[];
  onFileClick?: (file: FileSystemItem) => void;
  onEmailClick?: (emailId: string) => void;
  onFileView?: (file: FileSystemItem) => void;
}

export const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps> = ({
  files,
  emails = [],
  onFileClick,
  onEmailClick,
  onFileView
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const fileCount = files.length;
  const emailCount = emails.length;
  const totalCount = fileCount + emailCount;

  if (totalCount === 0) return null;

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
          {totalCount} Attachment{totalCount > 1 ? 's' : ''}
          {fileCount > 0 && emailCount > 0 && (
            <span className="text-zinc-500 ml-1">({fileCount} file{fileCount>1?'s':''}, {emailCount} email{emailCount>1?'s':''})</span>
          )}
        </span>
      </div>

      {/* File list */}
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {files.map((file) => {
            const isDiagram = isDrawioFile(file.name);
            return (
              <div
                key={file.file_id}
                className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-700 rounded group"
              >
                {isDiagram ? (
                  <Network className="h-4 w-4 text-blue-400 flex-shrink-0" />
                ) : (
                  <File className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                )}
                <span className="text-sm text-zinc-300 truncate flex-1" title={file.name}>
                  {file.name}
                </span>
                
                {/* Action buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isDiagram && onFileView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-zinc-400 hover:text-blue-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileView(file);
                      }}
                      title="View diagram"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-zinc-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileClick?.(file);
                    }}
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {emails.map((email: any) => {
            const headers = email?.payload?.headers || [];
            const subject = headers.find((h: any) => h?.name?.toLowerCase() === 'subject')?.value || email?.subject || 'No Subject';
            const from = headers.find((h: any) => h?.name?.toLowerCase() === 'from')?.value || email?.from || '';
            return (
              <div
                key={email.id}
                className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-700 rounded group"
              >
                <Mail className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                <span className="text-sm text-zinc-300 truncate flex-1" title={`${subject}${from ? ' — ' + from : ''}`}>
                  {subject}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmailClick?.(email.id);
                  }}
                  title="Remove email"
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
