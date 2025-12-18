"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import { Search, X, Share2, Loader2, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import Files from "backend/api/files/files"

interface User {
  username: string
  first_name?: string
  last_name?: string
  email?: string
}

interface ShareFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    id: string
    name: string
    type: "s3" | "drive"
  } | null
  onShareSuccess?: () => void
}

export function ShareFileDialog({
  open,
  onOpenChange,
  file,
  onShareSuccess,
}: ShareFileDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const result = await Files.searchUsers(query)
      if (result.success) {
        // Filter out already selected users
        const filtered = result.users.filter(
          (user) => !selectedUsers.some((s) => s.username === user.username)
        )
        setSearchResults(filtered)
      }
    } catch (err) {
      console.error("Failed to search users:", err)
      setError("Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }, [selectedUsers])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setError(null)
    setSuccessMessage(null)

    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  const handleSelectUser = (user: User) => {
    setSelectedUsers((prev) => [...prev, user])
    setSearchResults((prev) => prev.filter((u) => u.username !== user.username))
    setSearchQuery("")
  }

  const handleRemoveUser = (username: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.username !== username))
  }

  const handleShare = async () => {
    if (!file || selectedUsers.length === 0) return

    setIsSharing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const recipients = selectedUsers.map((u) => ({
        username: u.username,
        email: u.email,
      }))

      if (file.type === "s3") {
        const result = await Files.shareS3File(file.id, recipients, "edit")
        if (result.success) {
          setSuccessMessage(result.message)
          setSelectedUsers([])
          onShareSuccess?.()
          setTimeout(() => onOpenChange(false), 1500)
        }
      } else if (file.type === "drive") {
        const result = await Files.shareDriveFile(file.id, recipients, "edit")
        setSuccessMessage(result.message)
        setSelectedUsers([])
        onShareSuccess?.()
        setTimeout(() => onOpenChange(false), 1500)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to share file"
      setError(message)
    } finally {
      setIsSharing(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSearchQuery("")
      setSearchResults([])
      setSelectedUsers([])
      setError(null)
      setSuccessMessage(null)
    }
    onOpenChange(newOpen)
  }

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }
    return user.username
  }

  // Fix: Clean up body pointer-events when dialog closes (Radix animation cleanup bug)
  React.useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }, 350);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{file.name}"
          </DialogTitle>
          <DialogDescription>
            Search for users to share this file with. They will receive edit access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username, name, or email..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-md border bg-popover">
              {searchResults.map((user) => (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                      {user.email && ` • ${user.email}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Sharing with ({selectedUsers.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm"
                  >
                    <span className="text-primary font-medium">
                      {getUserDisplayName(user)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.username)}
                      className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Success message */}
          {successMessage && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {successMessage}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isSharing}
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

