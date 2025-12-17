"use client"

import * as React from "react"
import { FileText, FileImage, FileVideo, FileAudio, FileCode, FileSpreadsheet, FileArchive, FileJson, FileType, Mail, Calendar } from "lucide-react"
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
import { CalendarEvent } from "../../backend/api/calendar/calendar"
import {
  FileSearchResult,
  EmailSearchResult,
  searchFiles,
  searchEmails,
  searchCalendarEvents,
  toFileSystemItem,
  getEmailLabel,
  getCalendarLabel,
} from "./handlers/file-search-command-handlers"

interface FileSearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (file: FileSystemItem) => void
  onEmailSelect?: (email: EmailSearchResult) => void
  onCalendarEventSelect?: (event: CalendarEvent) => void
}

function getFileIcon(fileName: string) {
  const extension = fileName.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-destructive" />
    case 'doc':
    case 'docx':
      return <FileText className="h-4 w-4 text-primary" />
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className="h-4 w-4 text-chart-2" />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return <FileImage className="h-4 w-4 text-chart-5" />
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
    case 'mkv':
      return <FileVideo className="h-4 w-4 text-chart-4" />
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return <FileAudio className="h-4 w-4 text-chart-3" />
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <FileArchive className="h-4 w-4 text-chart-1" />
    case 'json':
      return <FileJson className="h-4 w-4 text-chart-1" />
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
      return <FileCode className="h-4 w-4 text-primary" />
    default:
      return <FileType className="h-4 w-4 text-muted-foreground" />
  }
}

export function FileSearchCommand({ 
  open, 
  onOpenChange, 
  onFileSelect,
  onEmailSelect,
  onCalendarEventSelect 
}: FileSearchCommandProps) {
  const [query, setQuery] = React.useState("")
  
  // File results
  const [fileResults, setFileResults] = React.useState<FileSearchResult[]>([])
  const [loadingFiles, setLoadingFiles] = React.useState(false)
  
  // Email results
  const [emailResults, setEmailResults] = React.useState<EmailSearchResult[]>([])
  const [loadingEmails, setLoadingEmails] = React.useState(false)
  
  // Calendar results
  const [calendarResults, setCalendarResults] = React.useState<CalendarEvent[]>([])
  const [loadingCalendar, setLoadingCalendar] = React.useState(false)
  
  // Feature availability
  const [isGmailEnabled, setIsGmailEnabled] = React.useState(false)
  const [isCalendarEnabled, setIsCalendarEnabled] = React.useState(false)

  // Check feature availability when dialog opens
  React.useEffect(() => {
    if (!open) return
    
    async function checkFeatures() {
      try {
        const [gmailAvailable, calendarAvailable] = await Promise.all([
          ApiService.Scopes.isFeatureAvailable('gmail'),
          ApiService.Scopes.isFeatureAvailable('calendar')
        ])
        setIsGmailEnabled(gmailAvailable)
        setIsCalendarEnabled(calendarAvailable)
      } catch (error) {
        console.error('Error checking feature availability:', error)
        setIsGmailEnabled(false)
        setIsCalendarEnabled(false)
      }
    }
    
    checkFeatures()
  }, [open])

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!query.trim()) {
        setFileResults([])
        setEmailResults([])
        setCalendarResults([])
        return
      }

      // Search files (always)
      setLoadingFiles(true)
      searchFiles(query).then(results => {
        setFileResults(results)
        setLoadingFiles(false)
      })

      // Search emails (if enabled)
      if (isGmailEnabled && onEmailSelect) {
        setLoadingEmails(true)
        searchEmails(query).then(results => {
          setEmailResults(results)
          setLoadingEmails(false)
        })
      }

      // Search calendar (if enabled)
      if (isCalendarEnabled && onCalendarEventSelect) {
        setLoadingCalendar(true)
        searchCalendarEvents(query).then(results => {
          setCalendarResults(results)
          setLoadingCalendar(false)
        })
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, isGmailEnabled, isCalendarEnabled, onEmailSelect, onCalendarEventSelect])

  const handleFileSelect = React.useCallback((result: FileSearchResult) => {
    onFileSelect(toFileSystemItem(result))
    onOpenChange(false)
    setQuery("")
    setFileResults([])
    setEmailResults([])
    setCalendarResults([])
  }, [onFileSelect, onOpenChange])

  const handleEmailSelect = React.useCallback((result: EmailSearchResult) => {
    if (onEmailSelect) {
      onEmailSelect(result)
      onOpenChange(false)
      setQuery("")
      setFileResults([])
      setEmailResults([])
      setCalendarResults([])
    }
  }, [onEmailSelect, onOpenChange])

  const handleCalendarSelect = React.useCallback((event: CalendarEvent) => {
    if (onCalendarEventSelect) {
      onCalendarEventSelect(event)
      onOpenChange(false)
      setQuery("")
      setFileResults([])
      setEmailResults([])
      setCalendarResults([])
    }
  }, [onCalendarEventSelect, onOpenChange])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setFileResults([])
      setEmailResults([])
      setCalendarResults([])
    }
  }, [open])

  const isLoading = loadingFiles || loadingEmails || loadingCalendar
  const hasResults = fileResults.length > 0 || emailResults.length > 0 || calendarResults.length > 0
  const showEmailSection = isGmailEnabled && onEmailSelect
  const showCalendarSection = isCalendarEnabled && onCalendarEventSelect

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && !hasResults && (
          <CommandEmpty>Searching...</CommandEmpty>
        )}
        {!isLoading && query.trim() && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        
        {/* File Results */}
        {fileResults.length > 0 && (
          <CommandGroup heading="Files">
            {fileResults.map((result) => (
              <CommandItem
                key={result.file_id}
                value={`file-${result.file_name} ${result.file_path}`}
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

        {/* Email Results */}
        {showEmailSection && emailResults.length > 0 && (
          <CommandGroup heading="Email">
            {emailResults.slice(0, 10).map((result) => {
              const { subject, from } = getEmailLabel(result)
              return (
                <CommandItem
                  key={result.id}
                  value={`email-${subject} ${from || ''}`}
                  onSelect={() => handleEmailSelect(result)}
                >
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="ml-2 truncate">{subject}</span>
                  {from && (
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[150px]">
                      {from}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Calendar Results */}
        {showCalendarSection && calendarResults.length > 0 && (
          <CommandGroup heading="Calendar">
            {calendarResults.slice(0, 10).map((event) => {
              const { summary, dateStr } = getCalendarLabel(event)
              return (
                <CommandItem
                  key={event.id}
                  value={`calendar-${summary} ${dateStr}`}
                  onSelect={() => handleCalendarSelect(event)}
                >
                  <Calendar className="h-4 w-4 text-chart-4" />
                  <span className="ml-2 truncate">{summary}</span>
                  {dateStr && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {dateStr}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Loading indicators for individual sections */}
        {loadingFiles && fileResults.length === 0 && query.trim() && (
          <CommandGroup heading="Files">
            <CommandItem disabled>
              <span className="text-muted-foreground">Searching files...</span>
            </CommandItem>
          </CommandGroup>
        )}
        {showEmailSection && loadingEmails && emailResults.length === 0 && query.trim() && (
          <CommandGroup heading="Email">
            <CommandItem disabled>
              <span className="text-muted-foreground">Searching emails...</span>
            </CommandItem>
          </CommandGroup>
        )}
        {showCalendarSection && loadingCalendar && calendarResults.length === 0 && query.trim() && (
          <CommandGroup heading="Calendar">
            <CommandItem disabled>
              <span className="text-muted-foreground">Searching calendar...</span>
            </CommandItem>
          </CommandGroup>
        )}

        {!isLoading && !query.trim() && (
          <CommandEmpty>Start typing to search...</CommandEmpty>
        )}
      </CommandList>
    </CommandDialog>
  )
}
