"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { Loader2, Search, Share2, UserPlus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../common/ui/dialog"
import { Button } from "../../../../common/ui/button"
import { Input } from "../../../../common/ui/input"
import Files from "../../../../../../backend/api/files/files"
import { MeetingSession } from "../../../../../types/meeting-types"
import { handleShareMeeting } from "../handlers/handleShareMeeting"

interface User {
  username: string
  first_name?: string
  last_name?: string
  email?: string
}

interface ShareMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting: MeetingSession | null
  onShareSuccess?: () => void
}

function getUserDisplayName(user: User) {
  if (user.first_name || user.last_name) return `${user.first_name || ""} ${user.last_name || ""}`.trim()
  return user.username
}

export function ShareMeetingDialog({
  open,
  onOpenChange,
  meeting,
  onShareSuccess,
}: ShareMeetingDialogProps) {
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
        const filteredUsers = result.users.filter(
          (user) => !selectedUsers.some((selectedUser) => selectedUser.username === user.username)
        )
        setSearchResults(filteredUsers)
      }
    } catch (err) {
      console.error("Failed to search users:", err)
      setError("Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }, [selectedUsers])

  function handleSearchInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    setSearchQuery(value)
    setError(null)
    setSuccessMessage(null)

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      void handleSearch(value)
    }, 300)
  }

  function handleSelectUser(user: User) {
    setSelectedUsers((currentUsers) => [...currentUsers, user])
    setSearchResults((currentUsers) => currentUsers.filter((currentUser) => currentUser.username !== user.username))
    setSearchQuery("")
  }

  function handleRemoveUser(username: string) {
    setSelectedUsers((currentUsers) => currentUsers.filter((user) => user.username !== username))
  }

  async function handleShare() {
    if (!meeting || selectedUsers.length === 0) return

    setIsSharing(true)
    setError(null)
    setSuccessMessage(null)

    await handleShareMeeting({
      meetingId: meeting.id,
      recipients: selectedUsers.map((user) => ({
        username: user.username,
        email: user.email,
      })),
      access: "edit",
      onSuccess: (message) => {
        setSuccessMessage(message)
        setSelectedUsers([])
        onShareSuccess?.()
        setTimeout(() => onOpenChange(false), 1500)
      },
      onError: setError,
    })

    setIsSharing(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearchQuery("")
      setSearchResults([])
      setSelectedUsers([])
      setError(null)
      setSuccessMessage(null)
    }
    onOpenChange(nextOpen)
  }

  React.useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        if (document.body.style.pointerEvents === "none") document.body.style.pointerEvents = ""
      }, 350)
      return () => clearTimeout(timeoutId)
    }
  }, [open])

  if (!meeting) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{meeting.title || "Untitled meeting"}"
          </DialogTitle>
          <DialogDescription>
            Search for users to share this meeting with. They will receive edit access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

          {error && <p className="text-sm text-destructive">{error}</p>}
          {successMessage && <p className="text-sm text-success">{successMessage}</p>}
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
