import React, { useEffect, useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { TooltipProvider } from '@/components/common/ui/tooltip'
import { MeetingsTab } from 'frontend/components/LeftPanel/components/MeetingsTab/MeetingsTab'
import { MeetingSession } from 'frontend/types/meeting-types'
import { installMeetingAgentMock } from '../../mocks/meeting-agent-service-mock'
import {
  MOCK_ACTIVE_MEETING,
  MOCK_COMPLETED_MEETING,
  MOCK_FAILED_MEETING,
  MOCK_MEETING_SESSIONS,
  MOCK_RECORDING_MEETING,
  cloneMeetingSession
} from '../../mocks/meeting-fixtures'

interface DesktopRecordingStatus {
  initialized: boolean
  permissions: {
    accessibility: boolean
    microphone: boolean
    screenCapture: boolean
  }
  recording: {
    isRecording: boolean
    windowId: string | null
    startTime: number | null
    platform: string | null
  }
  detectedMeetings: Array<{
    id: string
    platform: string
    title: string
  }>
  platformSupported: boolean
}

function MeetingsTabWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="h-screen w-80 bg-background text-foreground">
        {children}
      </div>
    </TooltipProvider>
  )
}

function installDesktopRecordingMock(isRecording = false) {
  const originalDesktopApp = (window as any).desktopApp
  const status: DesktopRecordingStatus = {
    initialized: true,
    permissions: {
      accessibility: true,
      microphone: true,
      screenCapture: true
    },
    recording: {
      isRecording,
      windowId: isRecording ? 'zoom-window-1' : null,
      startTime: isRecording ? Date.now() - 12 * 60 * 1000 : null,
      platform: isRecording ? 'zoom' : null
    },
    detectedMeetings: isRecording
      ? []
      : [
          {
            id: 'zoom-window-1',
            platform: 'zoom',
            title: 'Live Product Standup'
          }
        ],
    platformSupported: true
  }

  ;(window as any).desktopApp = {
    isDesktop: true,
    getPlatform: () => 'linux',
    desktopRecording: {
      getStatus: async () => status,
      requestPermissions: async () => status.permissions,
      startRecording: async () => ({ success: true }),
      stopRecording: async () => ({ success: true }),
      onMeetingDetected: () => () => {},
      onMeetingEnded: () => () => {},
      onRecordingStarted: () => () => {},
      onRecordingStopped: () => () => {},
      onPermissionUpdate: () => () => {},
      onError: () => () => {}
    }
  }

  return () => {
    if (originalDesktopApp) {
      ;(window as any).desktopApp = originalDesktopApp
      return
    }

    delete (window as any).desktopApp
  }
}

function useMeetingAgentStoryMock(meetings: MeetingSession[], isLoading = false) {
  const restoreRef = useRef<(() => void) | null>(null)

  if (!restoreRef.current) {
    restoreRef.current = installMeetingAgentMock({ meetings, isLoading })
  }

  useEffect(() => {
    return () => {
      restoreRef.current?.()
      restoreRef.current = null
    }
  }, [])
}

function useDesktopRecordingStoryMock(isRecording = false) {
  const restoreRef = useRef<(() => void) | null>(null)

  if (typeof window !== 'undefined' && !restoreRef.current) {
    restoreRef.current = installDesktopRecordingMock(isRecording)
  }

  useEffect(() => {
    return () => {
      restoreRef.current?.()
      restoreRef.current = null
    }
  }, [])
}

function withMeetingAgentMock(meetings: MeetingSession[], isLoading = false) {
  function MeetingsTabMockDecorator(Story: React.ComponentType) {
    useMeetingAgentStoryMock(meetings, isLoading)

    return <Story />
  }

  return MeetingsTabMockDecorator
}

function withDesktopRecordingMock(meetings: MeetingSession[], isRecording = false) {
  function DesktopRecordingMockDecorator(Story: React.ComponentType) {
    useMeetingAgentStoryMock(meetings)
    useDesktopRecordingStoryMock(isRecording)

    return <Story />
  }

  return DesktopRecordingMockDecorator
}

const meta: Meta<typeof MeetingsTab> = {
  title: 'Components/LeftPanel/MeetingsTab',
  component: MeetingsTab,
  decorators: [
    (Story: React.ComponentType) => (
      <MeetingsTabWrapper>
        <Story />
      </MeetingsTabWrapper>
    )
  ],
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
}

export default meta

type Story = StoryObj<typeof MeetingsTab>

export const MixedMeetings: Story = {
  name: 'Mixed Meetings',
  args: {
    selectedMeeting: cloneMeetingSession(MOCK_ACTIVE_MEETING)
  },
  decorators: [withMeetingAgentMock(MOCK_MEETING_SESSIONS)]
}

export const LoadingMeetings: Story = {
  name: 'Loading Meetings',
  decorators: [withMeetingAgentMock([], true)]
}

export const EmptyMeetings: Story = {
  name: 'Empty Meetings',
  decorators: [withMeetingAgentMock([])]
}

export const ActiveInProgress: Story = {
  name: 'Active In Progress',
  args: {
    selectedMeeting: cloneMeetingSession(MOCK_ACTIVE_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_ACTIVE_MEETING])]
}

export const RecordingInProgress: Story = {
  name: 'Recording In Progress',
  args: {
    selectedMeeting: cloneMeetingSession(MOCK_RECORDING_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_RECORDING_MEETING])]
}

export const CompletedWithArtifacts: Story = {
  name: 'Completed With Recording And Transcript',
  args: {
    selectedMeeting: cloneMeetingSession(MOCK_COMPLETED_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_COMPLETED_MEETING])]
}

export const FailedMeeting: Story = {
  name: 'Failed Meeting',
  args: {
    selectedMeeting: cloneMeetingSession(MOCK_FAILED_MEETING)
  },
  decorators: [withMeetingAgentMock([MOCK_FAILED_MEETING])]
}

export const DesktopRecordingReady: Story = {
  name: 'Desktop Recording Ready',
  decorators: [withDesktopRecordingMock([MOCK_ACTIVE_MEETING])]
}

export const DesktopRecordingInProgress: Story = {
  name: 'Desktop Recording In Progress',
  decorators: [withDesktopRecordingMock([MOCK_RECORDING_MEETING], true)]
}
