"use client"

import * as React from "react"
import { FileText, FileImage, FileVideo, FileAudio, FileCode, FileSpreadsheet, FileArchive, FileJson, FileType } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import { ApiService } from "../../backend/api/apiService"
import { FileSystemItem } from "../utils/fileTreeUtils"

interface FileSearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (file: FileSystemItem) => void
}

interface SearchResult {
  file_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  date_uploaded: string
  date_modified: string
  s3_url: string
  device_name: string
}

function getFileIcon(fileName: string) {
  const extension = fileName.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-500" />
    case 'doc':
    case 'docx':
      return <FileText className="h-4 w-4 text-blue-500" />
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className="h-4 w-4 text-green-500" />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return <FileImage className="h-4 w-4 text-purple-500" />
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
    case 'mkv':
      return <FileVideo className="h-4 w-4 text-orange-500" />
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <FileAudio className="h-4 w-4 text-pink-500" />
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <FileArchive className="h-4 w-4 text-yellow-500" />
    case 'json':
      return <FileJson className="h-4 w-4 text-yellow-500" />
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'html':
    case 'css':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
      return <FileCode className="h-4 w-4 text-blue-500" />
    default:
      return <FileType className="h-4 w-4 text-gray-500" />
  }
}

export function FileSearchCommand({ open, onOpenChange, onFileSelect }: FileSearchCommandProps) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)

  const searchFiles = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // Call the backend endpoint /files/search_s3_files/ to search for files
      const response = await ApiService.searchS3Files(searchQuery)
      
      // Backend returns: { result: "success", files: [...], query: "...", total_results: N }
      if (response && response.result === 'success') {
        const files = response.files || []
        setResults(files)
      } else {
        // Handle error response from backend
        setResults([])
      }
    } catch (error) {
      // Handle network or API errors
      console.error('Error searching files:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchFiles(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchFiles])

  const handleFileSelect = React.useCallback((result: SearchResult) => {
    const fileSystemItem: FileSystemItem = {
      file_id: result.file_id,
      name: result.file_name,
      path: result.file_path,
      type: 'file',
      size: result.file_size,
      modified: result.date_modified,
      created: result.date_uploaded,
      device_name: result.device_name,
      s3_url: result.s3_url,
    }
    
    onFileSelect(fileSystemItem)
    onOpenChange(false)
    setQuery("")
    setResults([])
  }, [onFileSelect, onOpenChange])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
    }
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search files..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <CommandEmpty>Searching...</CommandEmpty>
        )}
        {!loading && query.trim() && results.length === 0 && (
          <CommandEmpty>No files found.</CommandEmpty>
        )}
        {!loading && results.length > 0 && (
          <CommandGroup heading="Files">
            {results.map((result) => (
              <CommandItem
                key={result.file_id}
                value={`${result.file_name} ${result.file_path}`}
                onSelect={() => handleFileSelect(result)}
              >
                {getFileIcon(result.file_name)}
                <span className="ml-2">{result.file_name}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">
                  {result.file_path}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!loading && !query.trim() && (
          <CommandEmpty>Start typing to search files...</CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  )
}

