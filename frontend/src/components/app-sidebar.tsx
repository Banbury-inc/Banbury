import { Home, FolderOpen, LogOut, ChevronDown, ChevronRight, File, Folder, RefreshCw } from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "./ui/sidebar"
import { Button } from "./ui/button"
import { ApiService } from "../services/apiService"
import { buildFileTree, FileSystemItem, S3FileInfo } from "../utils/fileTreeUtils"

interface AppSidebarProps {
  currentView: 'dashboard' | 'workspaces'
  onLogout: () => void
  userInfo?: {
    username: string
    email?: string
  } | null
}

// File tree item component
interface FileTreeItemProps {
  item: FileSystemItem
  level: number
  expandedItems: Set<string>
  toggleExpanded: (id: string) => void
}

function FileTreeItem({ item, level, expandedItems, toggleExpanded }: FileTreeItemProps) {
  const isExpanded = expandedItems.has(item.id)
  const hasChildren = item.children && item.children.length > 0
  
  const handleClick = () => {
    if (hasChildren) {
      toggleExpanded(item.id)
    }
  }
  
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild
          className={`cursor-pointer hover:bg-black hover:text-white`}
          style={{ paddingLeft: `${(level * 12) + 12}px` }}
        >
          <button
            onClick={handleClick}
            className="w-full flex items-center gap-2 text-left"
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
            <span className="text-sm">{item.name}</span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {hasChildren && isExpanded && item.children?.map((child) => (
        <FileTreeItem
          key={child.id}
          item={child}
          level={level + 1}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </>
  )
}

export function AppSidebar({ currentView, onLogout, userInfo }: AppSidebarProps) {
  const navigate = useNavigate()
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
    <Sidebar className="bg-black border-l border-white">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            Files
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={fetchUserFiles}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && !fileSystem.length && (
                <SidebarMenuItem>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading files...
                  </div>
                </SidebarMenuItem>
              )}
              
              {error && (
                <SidebarMenuItem>
                  <div className="px-3 py-2 text-sm text-red-500">
                    {error}
                  </div>
                </SidebarMenuItem>
              )}
              
              {!loading && !error && fileSystem.length === 0 && (
                <SidebarMenuItem>
                  <div className="px-3 py-2 text-sm text-sidebar-foreground/70">
                    No files found
                  </div>
                </SidebarMenuItem>
              )}
              
              {fileSystem.map((item) => (
                <FileTreeItem
                  key={item.id}
                  item={item}
                  level={0}
                  expandedItems={expandedItems}
                  toggleExpanded={toggleExpanded}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="space-y-2">
          {userInfo && (
            <div className="text-xs text-white truncate">
              {userInfo.email || userInfo.username}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start gap-2 text-white hover:bg-black hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
