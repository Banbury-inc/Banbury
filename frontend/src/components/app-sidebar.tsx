import { ChevronDown, ChevronRight, File, Folder, RefreshCw, Edit2, Trash2 } from "lucide-react"
import { useState, useEffect, useCallback } from 'react'
import { Button } from "./ui/button"
import { ApiService } from "../services/apiService"
import { buildFileTree, FileSystemItem, S3FileInfo } from "../utils/fileTreeUtils"
import * as ContextMenu from "@radix-ui/react-context-menu"

interface AppSidebarProps {
  currentView: 'dashboard' | 'workspaces'
  userInfo?: {
    username: string
    email?: string
  } | null
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onRefreshComplete?: () => void
  refreshTrigger?: number // Add a trigger prop to force refresh
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  onFileMoved?: (fileId: string, oldPath: string, newPath: string) => void
}

// Drag and drop state interfaces
interface DragState {
  isDragging: boolean
  draggedItem: FileSystemItem | null
  dragOverTarget: string | null
}

// File tree item component
interface FileTreeItemProps {
  item: FileSystemItem
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
  onFileDeleted?: (fileId: string) => void
  onFileRenamed?: (oldPath: string, newPath: string) => void
  dragState: DragState
  onDragStart: (item: FileSystemItem) => void
  onDragEnd: () => void
  onDragOver: (item: FileSystemItem) => void
  onDragLeave: () => void
  onDrop: (targetItem: FileSystemItem, draggedItem: FileSystemItem) => void
}

// Helper functions to check file types
const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return imageExtensions.includes(extension)
}

const isPdfFile = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return extension === '.pdf'
}

const isDocumentFile = (fileName: string): boolean => {
  const documentExtensions = ['.docx', '.doc']
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return documentExtensions.includes(extension)
}

const isViewableFile = (fileName: string): boolean => {
  return isImageFile(fileName) || isPdfFile(fileName) || isDocumentFile(fileName)
}

// File Context Menu Component
interface FileContextMenuProps {
  children: React.ReactNode
  onRename: () => void
  onDelete: () => void
}

function FileContextMenu({ children, onRename, onDelete }: FileContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="min-w-[160px] bg-zinc-800 rounded-md p-1 shadow-lg border border-zinc-700 z-50">
          <ContextMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-zinc-700 rounded cursor-pointer outline-none"
            onSelect={onRename}
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item 
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-400 hover:bg-zinc-700 rounded cursor-pointer outline-none"
            onSelect={onDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function FileTreeItem({ 
  item, 
  level, 
  expandedItems, 
  toggleExpanded, 
  onFileSelect, 
  selectedFile, 
  onFileDeleted, 
  onFileRenamed, 
  dragState, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onDragLeave, 
  onDrop 
}: FileTreeItemProps) {
  const isExpanded = expandedItems.has(item.id)
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedFile?.id === item.id
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(item.name)
  
  // Check if this item is being dragged or is a drop target
  const isDragged = dragState.draggedItem?.id === item.id
  const isDropTarget = dragState.dragOverTarget === item.id && item.type === 'folder'
  
  // Drag event handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (item.type === 'file' && item.file_id) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', item.id)
      onDragStart(item)
    } else {
      e.preventDefault()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (item.type === 'folder' && dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      onDragOver(item)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only trigger if we're leaving this element itself, not a child
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    onDragLeave()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (item.type === 'folder' && dragState.draggedItem && dragState.draggedItem.id !== item.id) {
      onDrop(item, dragState.draggedItem)
    }
  }
  
  const handleClick = () => {
    if (isRenaming) return; // Don't handle clicks while renaming
    
    console.log('Click detected on:', item.name, 'type:', item.type, 'hasChildren:', hasChildren);
    
    if (hasChildren) {
      console.log('Expanding/collapsing folder:', item.name);
      toggleExpanded(item.id)
    } else if (item.type === 'file' && onFileSelect) {
      // For files, trigger the selection callback
      console.log('File clicked:', item.name, item);
      onFileSelect(item)
    } else {
      console.log('Click conditions not met:', {
        type: item.type,
        hasOnFileSelect: !!onFileSelect
      });
    }
  }

  const handleRename = () => {
    setIsRenaming(true)
    setNewName(item.name)
  }

  const handleDelete = async () => {
    if (!item.file_id) return
    
    const confirmed = window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)
    if (!confirmed) return
    
    try {
      await ApiService.deleteS3File(item.file_id)
      onFileDeleted?.(item.file_id)
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const handleRenameSubmit = async () => {
    if (!item.file_id || newName.trim() === '' || newName === item.name) {
      setIsRenaming(false)
      return
    }
    
    try {
      await ApiService.renameS3File(item.file_id, newName.trim(), item.path)
      onFileRenamed?.(item.path, newName.trim())
      setIsRenaming(false)
    } catch (error) {
      alert('Failed to rename file. Please try again.')
      setIsRenaming(false)
      setNewName(item.name) // Reset name on error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewName(item.name)
    }
  }
  
  const buttonContent = (
    <button
      onClick={handleClick}
      draggable={item.type === 'file' && item.file_id ? true : false}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-zinc-800 hover:text-white transition-colors ${
        isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300'
      } ${isDragged ? 'opacity-50' : ''} ${isDropTarget ? 'bg-zinc-700 ring-2 ring-blue-500' : ''}`}
      style={{ paddingLeft: `${(level * 12) + 12}px` }}
    >
          {hasChildren && (
            isExpanded ? 
              <ChevronDown className="h-3 w-3" /> : 
              <ChevronRight className="h-3 w-3" />
          )}
          {!hasChildren && <div className="w-3" />}
          {item.type === 'folder' ? (
            <Folder className="h-4 w-4" />
          ) : (
            <File className="h-4 w-4" />
          )}
      {isRenaming ? (
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleKeyDown}
          className="text-sm bg-zinc-700 text-white px-1 py-0 rounded border-none outline-none flex-1"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm truncate">{item.name}</span>
      )}
    </button>
  )

  return (
    <>
      <div className="w-full">
        {item.type === 'file' && item.file_id ? (
          <FileContextMenu onRename={handleRename} onDelete={handleDelete}>
            {buttonContent}
          </FileContextMenu>
        ) : (
          buttonContent
        )}
      </div>
      
      {hasChildren && isExpanded && item.children?.map((child) => (
        <FileTreeItem
          key={child.id}
          item={child}
          level={level + 1}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          onFileDeleted={onFileDeleted}
          onFileRenamed={onFileRenamed}
          dragState={dragState}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      ))}
    </>
  )
}

export function AppSidebar({ currentView, userInfo, onFileSelect, selectedFile, onRefreshComplete, refreshTrigger, onFileDeleted, onFileRenamed, onFileMoved }: AppSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverTarget: null
  })
  
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
  
  // Drag and drop handlers
  const handleDragStart = (item: FileSystemItem) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOverTarget: null
    })
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverTarget: null
    })
  }

  const handleDragOver = (item: FileSystemItem) => {
    if (dragState.draggedItem && item.type === 'folder') {
      setDragState(prev => ({
        ...prev,
        dragOverTarget: item.id
      }))
    }
  }

  const handleDragLeave = () => {
    setDragState(prev => ({
      ...prev,
      dragOverTarget: null
    }))
  }

  const handleDrop = async (targetItem: FileSystemItem, draggedItem: FileSystemItem) => {
    if (!draggedItem.file_id || targetItem.type !== 'folder') return
    
    try {
      // Calculate new file path
      const newPath = `${targetItem.path}/${draggedItem.name}`
      
      // Call API to move the file (download, upload to new location, delete old)
      await ApiService.moveS3File(draggedItem.file_id, newPath, draggedItem.name)
      
      // Notify parent component about the move
      onFileMoved?.(draggedItem.file_id, draggedItem.path, newPath)
      
      // Refresh the file tree
      fetchUserFiles()
      
    } catch (error) {
      console.error('Failed to move file:', error)
      alert('Failed to move file. Please try again.')
    } finally {
      handleDragEnd()
    }
  }

  const fetchUserFiles = useCallback(async () => {
    if (!userInfo?.username) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching files for user:', userInfo.username);
      const result = await ApiService.getUserFiles(userInfo.username)
      console.log('Files fetch result:', result);
      
      if (result.success) {
        const tree = buildFileTree(result.files)
        console.log('Built file tree:', tree);
        setFileSystem(tree)
        // Call the refresh complete callback if provided
        onRefreshComplete?.()
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [userInfo?.username])

  // Fetch files when component mounts or user changes
  useEffect(() => {
    fetchUserFiles()
  }, [fetchUserFiles])

  // Fetch files when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchUserFiles()
    }
  }, [refreshTrigger, fetchUserFiles])
  
  return (
    <div className="h-full w-full bg-black border-r border-zinc-300 dark:border-zinc-600 flex flex-col relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-300 dark:border-zinc-600">
        <h2 className="text-white text-sm font-medium">Files</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          onClick={fetchUserFiles}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* File Tree Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && !fileSystem.length && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading files...
          </div>
        )}
        
        {error && (
          <div className="px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}
        
        {!loading && !error && fileSystem.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-400">
            No files found
          </div>
        )}
        
        {fileSystem.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            level={0}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            onFileDeleted={onFileDeleted}
            onFileRenamed={onFileRenamed}
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}

