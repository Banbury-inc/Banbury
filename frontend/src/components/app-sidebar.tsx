import { ChevronDown, ChevronRight, File, Folder, RefreshCw } from "lucide-react"
import { useState, useEffect, useCallback } from 'react'
import { Button } from "./ui/button"
import { ApiService } from "../services/apiService"
import { buildFileTree, FileSystemItem, S3FileInfo } from "../utils/fileTreeUtils"

interface AppSidebarProps {
  currentView: 'dashboard' | 'workspaces'
  userInfo?: {
    username: string
    email?: string
  } | null
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
}

// File tree item component
interface FileTreeItemProps {
  item: FileSystemItem
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
  onFileSelect?: (file: FileSystemItem) => void
  selectedFile?: FileSystemItem | null
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

const isViewableFile = (fileName: string): boolean => {
  return isImageFile(fileName) || isPdfFile(fileName)
}

function FileTreeItem({ item, level, expandedItems, toggleExpanded, onFileSelect, selectedFile }: FileTreeItemProps) {
  const isExpanded = expandedItems.has(item.id)
  const hasChildren = item.children && item.children.length > 0
  const isSelected = selectedFile?.id === item.id
  
  const handleClick = () => {
    if (hasChildren) {
      toggleExpanded(item.id)
    } else if (item.type === 'file' && onFileSelect) {
      // For files, trigger the selection callback
      onFileSelect(item)
    }
  }
  
  return (
    <>
      <div className="w-full">
        <button
          onClick={handleClick}
          className={`w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-zinc-800 hover:text-white transition-colors ${
            isSelected ? 'bg-zinc-800 text-white' : 'text-zinc-300'
          }`}
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
          <span className="text-sm truncate">{item.name}</span>
        </button>
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
        />
      ))}
    </>
  )
}

export function AppSidebar({ currentView, userInfo, onFileSelect, selectedFile }: AppSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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

  const fetchUserFiles = useCallback(async () => {
    if (!userInfo?.username) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await ApiService.getUserFiles(userInfo.username)
      if (result.success) {
        const tree = buildFileTree(result.files)
        setFileSystem(tree)
      }
    } catch (err) {
      setError('Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }, [userInfo?.username])

  // Fetch files when component mounts or user changes
  useEffect(() => {
    fetchUserFiles()
  }, [fetchUserFiles])
  
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
          />
        ))}
      </div>
    </div>
  )
}
