import { Editor } from '@tiptap/react'
import { useState, useEffect } from 'react'
import { Image as ImageIcon, Search, FileImage, Link as LinkIcon } from 'lucide-react'
import { Button } from '../../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../../../ui/dropdown-menu'
import { insertImageFromBackendFile } from '../../../handlers/editorImage'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { ApiService } from 'backend/api/apiService'

interface ImageButtonProps {
  editor: Editor
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageButton({ editor, isOpen, onOpenChange }: ImageButtonProps) {
  const [imageQuery, setImageQuery] = useState('')
  const [imageResults, setImageResults] = useState<Array<{
    file_id: string
    file_name: string
    file_path: string
    file_size: number
    date_modified: string
    device_name: string
    s3_url: string
  }>>([])
  const [isImageSearching, setIsImageSearching] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setImageQuery('')
      setImageResults([])
      setIsImageSearching(false)
      return
    }

    const t = setTimeout(async () => {
      const q = imageQuery.trim()
      if (!q) {
        setImageResults([])
        return
      }
      setIsImageSearching(true)
      try {
        const res = await ApiService.searchS3Files(q)
        if (res.result === 'success') setImageResults(res.files || [])
        else setImageResults([])
      } catch {
        setImageResults([])
      } finally {
        setIsImageSearching(false)
      }
    }, 300)

    return () => clearTimeout(t)
  }, [imageQuery, isOpen])

  const handleS3FileSelect = (file: FileSystemItem) => {
    const fileId = (file.file_id || (file as any).file_id) as string | undefined
    const fileName = file.name
    if (fileId && fileName) {
      insertImageFromBackendFile({ editor, fileId, fileName })
      onOpenChange(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          title="Add Image"
        >
          <ImageIcon size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96 p-0 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-700/50 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ImageIcon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Insert Image</h3>
              <p className="text-xs text-zinc-400">Search your files or enter a URL</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800/80 text-white placeholder-zinc-400 border border-zinc-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {isImageSearching && (
            <div className="px-4 py-6 text-center">
              <div className="inline-flex items-center gap-2 text-zinc-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm">Searching files...</span>
              </div>
            </div>
          )}
          
          {!isImageSearching && imageQuery.trim() && imageResults.length === 0 && (
            <div className="px-4 py-6 text-center">
              <div className="text-zinc-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files found</p>
                <p className="text-xs text-zinc-500 mt-1">Try a different search term</p>
              </div>
            </div>
          )}
          
          {!isImageSearching && imageResults.length > 0 && (
            <div className="px-2 pb-2">
              <div className="px-2 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Found {imageResults.length} result{imageResults.length !== 1 ? 's' : ''}
              </div>
              {imageResults.map((r) => (
                <button
                  key={r.file_id}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-zinc-800/60 hover:border-zinc-600/50 border border-transparent transition-all duration-200 group"
                  onClick={() => {
                    handleS3FileSelect({
                      id: r.file_id,
                      file_id: r.file_id,
                      name: r.file_name,
                      type: 'file',
                      path: r.file_path,
                      size: r.file_size,
                      modified: new Date(r.date_modified),
                      s3_url: r.s3_url,
                    })
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-zinc-700/50 group-hover:bg-zinc-600/50 transition-colors duration-200">
                      <FileImage className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white group-hover:text-blue-100 transition-colors duration-200 truncate">
                        {r.file_name}
                      </div>
                      <div className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200 truncate mt-0.5">
                        {r.file_path}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">
                          {Math.round(r.file_size / 1024)} KB
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(r.date_modified).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-700/50 bg-gradient-to-r from-zinc-800/30 to-zinc-700/30">
          <button
            onClick={() => {
              const url = window.prompt('Enter image URL:')
              if (url) editor.chain().focus().setImage({ src: url }).run()
              onOpenChange(false)
            }}
            className="w-full px-3 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg border border-zinc-600/50 hover:border-zinc-500/50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            Insert from URL
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
