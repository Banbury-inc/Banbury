import { 
  Search,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Input } from '../../../common/ui/old-input'
import { Typography } from '../../../common/ui/typography'
import { cn } from '../../../../utils'
import { buildFileTree } from '../../../../utils/fileTreeUtils'
import type { FileSystemItem } from '../../../../utils/fileTreeUtils'
import { getFileIcon } from './file-attachment-picker-utils'
import { useUserFiles } from '../../../../contexts/UserFilesContext'

interface FileAttachmentPickerProps {
  onFileAttach: (file: FileSystemItem) => void
}

export const FileAttachmentPicker: React.FC<FileAttachmentPickerProps> = ({
  onFileAttach,
}) => {
  const { files: userFiles, loading } = useUserFiles()
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Build file tree from context files
  useEffect(() => {
    if (userFiles.length > 0) {
      const tree = buildFileTree(userFiles)
      setFileSystem(tree)
    } else {
      setFileSystem([])
    }
  }, [userFiles])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const filterFiles = (items: FileSystemItem[]): FileSystemItem[] => {
    return items.filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.path.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterFiles(item.children)
        if (filteredChildren.length > 0) return true
      }
      
      return matchesSearch && item.type === 'file'
    }).map(item => ({
      ...item,
      children: item.children ? filterFiles(item.children) : undefined
    }))
  }

  const renderFileTree = (items: FileSystemItem[], level: number = 0) => {
    const filteredItems = searchTerm ? filterFiles(items) : items
    
    return filteredItems.map((item) => {
      const isExpanded = expandedItems.has(item.id)
      const hasChildren = item.children && item.children.length > 0
      
      // Get icon and color for files, use Folder icon for folders
      const fileIconData = item.type === 'file' ? getFileIcon(item.name) : { icon: Folder, color: 'text-yellow-400' }
      const FileIconComponent = fileIconData.icon
      
      return (
        <div key={item.id}>
          <button
            type="button"
            className={cn(
              "flex w-full min-w-0 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors duration-150 hover:bg-accent focus:bg-accent focus:outline-none",
              item.type === 'file' ? 'text-foreground' : 'text-muted-foreground'
            )}
            style={{ paddingLeft: `${(level * 12) + 12}px` }}
            onClick={() => {
              if (item.type === 'file') {
                onFileAttach(item)
              } else if (hasChildren) {
                toggleExpanded(item.id)
              }
            }}
          >
            {hasChildren && (
              <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </span>
            )}
            {!hasChildren && <div className="w-4 flex-shrink-0" />}
            <FileIconComponent className={cn("h-4 w-4 flex-shrink-0", fileIconData.color)} />
            <Typography variant="small" className="min-w-0 flex-1 truncate text-xs">
              {item.name}
            </Typography>
          </button>
          {hasChildren && isExpanded && renderFileTree(item.children!, level + 1)}
        </div>
      )
    })
  }

  let listContent = renderFileTree(fileSystem)
  if (loading) {
    listContent = (
      <div className="flex items-center justify-center bg-popover p-4">
        <Typography variant="muted">Loading files...</Typography>
      </div>
    )
  }

  if (!loading && fileSystem.length === 0) {
    listContent = (
      <div className="flex flex-col items-center justify-center bg-popover p-6">
        <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground opacity-40" strokeWidth={1.5} />
        <Typography variant="small" className="mb-1 font-medium text-foreground">
          No files yet
        </Typography>
        <Typography variant="muted" className="text-center text-xs">
          Upload files to attach them
        </Typography>
      </div>
    )
  }

  return (
    <div className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md bg-popover text-popover-foreground">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 border-border bg-muted pl-10 text-sm text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto bg-popover p-1">
        {listContent}
      </div>
    </div>
  )
}
