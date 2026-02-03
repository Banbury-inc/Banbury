import { 
  Search,
  Folder,
  FolderOpen,
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Input } from '../../../common/ui/old-input'
import { Typography } from '../../../common/ui/typography'
import { cn } from '../../../../utils'
import { FileSystemItem } from '../../../../utils/fileTreeUtils'
import { buildFileTree } from '../../../../utils/fileTreeUtils'
import { getFileIcon } from './file-attachment-picker-utils'
import { useUserFiles } from '../../../../contexts/UserFilesContext'

interface FileAttachmentPickerProps {
  onFileAttach: (file: FileSystemItem) => void
  userInfo: {
    username: string
    email?: string
  } | null
  isOpen?: boolean
}

export const FileAttachmentPicker: React.FC<FileAttachmentPickerProps> = ({
  onFileAttach,
  userInfo,
  isOpen = false,
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
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer transition-colors duration-150 rounded-md",
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
      )
    })
  }

  return (
    <div className="w-80">
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
          <div className="flex flex-col items-center justify-center p-6 bg-popover">
            <FolderOpen className="h-10 w-10 mb-3 opacity-40 text-muted-foreground" strokeWidth={1.5} />
            <Typography variant="small" className="mb-1 font-medium text-foreground">
              No files yet
            </Typography>
            <Typography variant="muted" className="text-xs text-center">
              Upload files to attach them
            </Typography>
          </div>
        ) : (
          renderFileTree(fileSystem)
        )}
      </div>
    </div>
  )
}
