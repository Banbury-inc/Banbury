import { 
  X, 
  Paperclip, 
} from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '../../../common/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../../../common/ui/dropdown-menu'
import { Typography } from '../../../common/ui/typography'
import { cn } from '../../../../utils'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'
import { FileAttachmentPicker } from './file-attachment-picker'
import { getFileIcon } from './file-attachment-picker-utils'

interface FileAttachmentProps {
  onFileAttach: (file: FileSystemItem) => void
  attachedFiles: FileSystemItem[]
  onFileRemove: (fileId: string) => void
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  onFileAttach,
  attachedFiles,
  onFileRemove
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
          className="p-0 !bg-popover !text-popover-foreground !border-border"
          side="top"
          align="start"
        >
          <FileAttachmentPicker
            onFileAttach={(file) => {
              onFileAttach(file)
              setIsOpen(false)
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          {attachedFiles.map((file) => {
            const fileIconData = getFileIcon(file.name)
            const FileIconComponent = fileIconData.icon
            
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
            )
          })}
        </div>
      )}
    </div>
  )
}
