import React, { useEffect, useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { TooltipProvider } from '@/components/common/ui/tooltip'
import { MeetingViewer } from 'frontend/components/MiddlePanel/MeetingViewer/MeetingViewer'
import { MeetingSession } from 'frontend/types/meeting-types'
import { installMeetingAgentMock } from '../../mocks/meeting-agent-service-mock'
import {
  MOCK_ACTIVE_MEETING,
  MOCK_COMPLETED_MEETING,
  MOCK_COMPLETED_MEETING_WITHOUT_RECORDING,
  MOCK_FAILED_MEETING,
  MOCK_PROCESSING_MEETING,
  MOCK_RECORDING_MEETING,
  MOCK_SCHEDULED_MEETING,
  MOCK_TRANSCRIBING_MEETING,
  cloneMeetingSession
} from '../../mocks/meeting-fixtures'

function MeetingViewerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="h-screen w-full bg-background text-foreground">
        {children}
      </div>
    </TooltipProvider>
  )
}

function useMeetingAgentStoryMock(meetings: MeetingSession[]) {
  const restoreRef = useRef<(() => void) | null>(null)

  if (!restoreRef.current) {
    restoreRef.current = installMeetingAgentMock({ meetings })
  }

  useEffect(() => {
    return () => {
      restoreRef.current?.()
      restoreRef.current = null
    }
  }, [])
}

function withMeetingAgentMock(meetings: MeetingSession[]) {
  function MeetingViewerMockDecorator(Story: React.ComponentType) {
    useMeetingAgentStoryMock(meetings)

    return <Story />
  }

  return MeetingViewerMockDecorator
}

const meta: Meta<typeof MeetingViewer> = {
  title: 'MiddlePanel/MeetingViewer',
  component: MeetingViewer,
  decorators: [
    (Story: React.ComponentType) => (
      <MeetingViewerWrapper>
        <Story />
      </MeetingViewerWrapper>
    )
  ],
  args: {
    onBack: fn(),
    onMeetingUpdated: fn()
  },
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
}

export default meta

type Story = StoryObj<typeof MeetingViewer>

export const ScheduledNoArtifacts: Story = {
  name: 'Scheduled: No Recording Or Transcript',
  args: {
    meeting: cloneMeetingSession(MOCK_SCHEDULED_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_SCHEDULED_MEETING])]
}

export const ActiveInProgress: Story = {
  name: 'Active: In Progress',
  args: {
    meeting: cloneMeetingSession(MOCK_ACTIVE_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_ACTIVE_MEETING])]
}

export const RecordingWithTranscript: Story = {
  name: 'Recording: Transcript Available',
  args: {
    meeting: cloneMeetingSession(MOCK_RECORDING_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_RECORDING_MEETING])]
}

export const TranscribingMeeting: Story = {
  name: 'Transcribing: Waiting For Artifacts',
  args: {
    meeting: cloneMeetingSession(MOCK_TRANSCRIBING_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_TRANSCRIBING_MEETING])]
}

export const ProcessingWithTranscript: Story = {
  name: 'Processing: Transcript Without Summary',
  args: {
    meeting: cloneMeetingSession(MOCK_PROCESSING_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_PROCESSING_MEETING])]
}

export const CompletedWithSummaryAndRecording: Story = {
  name: 'Completed: Summary Recording And Transcript',
  args: {
    meeting: cloneMeetingSession(MOCK_COMPLETED_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_COMPLETED_MEETING])]
}

export const CompletedNeedsRecordingUpload: Story = {
  name: 'Completed: Upload Recording Needed',
  args: {
    meeting: cloneMeetingSession(MOCK_COMPLETED_MEETING_WITHOUT_RECORDING)
  },
  decorators: [withMeetingAgentMock([MOCK_COMPLETED_MEETING_WITHOUT_RECORDING])]
}

export const FailedMeeting: Story = {
  name: 'Failed Meeting',
  args: {
    meeting: cloneMeetingSession(MOCK_FAILED_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_FAILED_MEETING])]
}
