import { MeetingSession, TranscriptionSegment } from "../../../../types/meeting-types"

export function getDuration(meeting: MeetingSession & { createdAt?: string | Date }): number {
  // If duration is provided in seconds, return it
  if (meeting.duration) {
    return meeting.duration
  }

  // Calculate duration from startTime and endTime
  if (meeting.endTime && meeting.startTime) {
    const duration = new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()
    return Math.round(duration / 1000) // Return in seconds
  }

  // If startTime is null, use createdAt from the meeting object as start time
  if (meeting.endTime && meeting.createdAt) {
    const startTime = new Date(meeting.createdAt)
    const endTime = new Date(meeting.endTime)
    const duration = endTime.getTime() - startTime.getTime()
    return Math.round(duration / 1000) // Return in seconds
  }

  // For active/recording meetings, calculate from startTime or createdAt
  if (meeting.status === 'active' || meeting.status === 'recording') {
    const startTime = meeting.startTime
      ? new Date(meeting.startTime)
      : (meeting.createdAt ? new Date(meeting.createdAt) : null)

    if (startTime) {
      const duration = Date.now() - startTime.getTime()
      return Math.round(duration / 1000) // Return in seconds
    }
  }

  return 0
}

export function getStatusVariant(status: MeetingSession['status']) {
  switch (status) {
    case 'active':
      return 'default'
    case 'recording':
      return 'destructive'
    case 'completed':
      return 'secondary'
    case 'failed':
      return 'destructive'
    case 'processing':
      return 'outline'
    default:
      return 'outline'
  }
}

export function extractParticipantsFromSegments(segments: TranscriptionSegment[]): Array<{ id: string; name: string }> {
  const participantsMap = new Map<string, { id: string; name: string }>()

  segments.forEach((segment) => {
    if (segment.speakerId && segment.speakerName) {
      // Use speakerId as the key to ensure uniqueness
      if (!participantsMap.has(segment.speakerId)) {
        participantsMap.set(segment.speakerId, {
          id: segment.speakerId,
          name: segment.speakerName
        })
      }
    }
  })

  return Array.from(participantsMap.values())
}

export function getDisplayParticipantNames(
  meetingParticipants: MeetingSession['participants'],
  extractedParticipants: Array<{ id: string; name: string }>
): Array<{ id: string; name: string }> {
  if (meetingParticipants.length > 0) {
    // Meeting participants are MeetingParticipant[]
    return meetingParticipants.map((participant, index) => ({
      id: participant.id || String(index),
      name: participant.name || participant.email || 'Unknown'
    }))
  } else {
    // Extracted participants are { id: string; name: string }[]
    return extractedParticipants.map((participant, index) => ({
      id: participant.id || String(index),
      name: participant.name || 'Unknown'
    }))
  }
}
