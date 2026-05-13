import { KeyboardEvent } from 'react'
import { MeetingSession } from '../../../../../../types/meeting-types'

interface StartMeetingRenameParams {
  meeting: MeetingSession
  setRenamingMeetingId: (meetingId: string) => void
  setRenameTitle: (title: string) => void
  getMeetingDisplayTitle: (meeting: MeetingSession) => string
}

interface SubmitMeetingRenameParams {
  meeting: MeetingSession
  renameTitle: string
  setRenamingMeetingId: (meetingId: string | null) => void
  setRenameTitle: (title: string) => void
  onMeetingRename?: (meeting: MeetingSession, title: string) => Promise<boolean> | boolean | void
}

interface CancelMeetingRenameParams {
  setRenamingMeetingId: (meetingId: string | null) => void
  setRenameTitle: (title: string) => void
}

interface MeetingRenameKeyDownParams extends SubmitMeetingRenameParams {
  event: KeyboardEvent<HTMLInputElement>
}

export function handleStartMeetingRename({
  meeting,
  setRenamingMeetingId,
  setRenameTitle,
  getMeetingDisplayTitle
}: StartMeetingRenameParams) {
  setRenamingMeetingId(meeting.id)
  setRenameTitle(getMeetingDisplayTitle(meeting))
}

export async function handleSubmitMeetingRename({
  meeting,
  renameTitle,
  setRenamingMeetingId,
  setRenameTitle,
  onMeetingRename
}: SubmitMeetingRenameParams) {
  const title = renameTitle.trim()
  if (!title) return

  const currentTitle = meeting.title || 'Untitled meeting'
  if (title === currentTitle) {
    setRenamingMeetingId(null)
    setRenameTitle('')
    return
  }

  const result = await onMeetingRename?.(meeting, title)
  if (result === false) return

  setRenamingMeetingId(null)
  setRenameTitle('')
}

export function handleCancelMeetingRename({
  setRenamingMeetingId,
  setRenameTitle
}: CancelMeetingRenameParams) {
  setRenamingMeetingId(null)
  setRenameTitle('')
}

export async function handleMeetingRenameKeyDown({
  event,
  meeting,
  renameTitle,
  setRenamingMeetingId,
  setRenameTitle,
  onMeetingRename
}: MeetingRenameKeyDownParams) {
  if (event.key === 'Enter') {
    event.preventDefault()
    await handleSubmitMeetingRename({
      meeting,
      renameTitle,
      setRenamingMeetingId,
      setRenameTitle,
      onMeetingRename
    })
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    handleCancelMeetingRename({ setRenamingMeetingId, setRenameTitle })
  }
}
