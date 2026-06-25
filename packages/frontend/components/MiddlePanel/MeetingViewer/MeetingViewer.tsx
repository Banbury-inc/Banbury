import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import type { Dispatch } from "react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { ChevronLeft } from "lucide-react"
import { useToast } from "../../common/ui/use-toast"
import { TranscriptionSegment } from "../../../types/meeting-types"
import { ApiService } from "../../../../backend/api/apiService"
import { handleGenerateAnthropicSummaryWithSave } from "./handlers/anthropicSummaryHandlers"
import { handleRegenerateSummary } from "./handlers/regenerateSummaryHandlers"
import { handleSaveEditedSummary } from "./handlers/saveEditedSummaryHandlers"
import { handleDownloadRecording } from "./handlers/handle-download-recording"
import { handleDownloadTranscription } from "./handlers/handle-download-transcription"
import { toggleVideoPlayPause, handleVideoSeek, handleVideoVolumeChange, toggleVideoMute, handleTranscriptSegmentClick, toggleFullscreen } from "./handlers/video-player-handlers"
import { fetchTranscriptFromUrl } from "./handlers/transcript-handlers"
import { findTranscriptSearchMatches, getTranscriptSearchIndex, scrollTranscriptMatchIntoView } from "./handlers/transcript-search-handlers"
import { toggleTranscriptPanel } from "./handlers/transcript-panel-handlers"
import { RecordingUploadDialog } from "../../../pages/MeetingAgent/components/RecordingUploadDialog"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../common/ui/resizable"
import { MeetingActionsBar } from "./components/MeetingActionsBar"
import { VideoPlayer } from "./components/VideoPlayer"
import { TranscriptPanel } from "./components/TranscriptPanel"
import { SummarySection } from "./components/SummarySection"
import { extractParticipantsFromSegments, getDisplayParticipantNames, getDuration } from "./utils/meeting-utils"
import { MeetingSummaryEditorRef } from "./MeetingSummaryEditor"

import { MeetingSession } from "../../../types/meeting-types"

interface MeetingViewerProps {
  meeting: MeetingSession
  onBack?(): void
  onMeetingUpdated?: Dispatch<MeetingSession>
}

export function MeetingViewer({ meeting, onMeetingUpdated }: MeetingViewerProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentMeeting, setCurrentMeeting] = useState<MeetingSession>(meeting)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoVolume, setVideoVolume] = useState(1)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([])
  const [transcriptionFullText, setTranscriptionFullText] = useState<string>('')
  const [isTranscriptionLoading, setIsTranscriptionLoading] = useState(false)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const [transcriptSearchQuery, setTranscriptSearchQuery] = useState('')
  const [activeTranscriptMatchIndex, setActiveTranscriptMatchIndex] = useState(-1)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryHtml, setSummaryHtml] = useState<string>('')
  const [isSavingSummary, setIsSavingSummary] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const summaryEditorRef = useRef<MeetingSummaryEditorRef>(null)
  const transcriptPanelRef = useRef<ImperativePanelHandle>(null)
  const [isTranscriptPanelCollapsed, setIsTranscriptPanelCollapsed] = useState(false)
  const hasVideo = !!(currentMeeting.recordingUrl || currentMeeting.recallBot?.videoUrl || videoStreamUrl)
  const hasTranscript = !!(
    transcriptionSegments.length > 0 ||
    transcriptionFullText ||
    currentMeeting.transcriptionText ||
    currentMeeting.transcriptionUrl ||
    currentMeeting.recallBot?.transcriptUrl
  )

  useEffect(() => {
    setCurrentMeeting(meeting)
  }, [meeting])
  
  useEffect(() => {
    const meetingSummary = currentMeeting.summary?.summary
    if (meetingSummary && meetingSummary.trim() !== '') {
      setSummaryHtml(meetingSummary)
      if (!isGeneratingSummary && !isSavingSummary) {
        setHasUnsavedChanges(false)
      }
    } else if (!isGeneratingSummary) {
      setSummaryHtml('')
      setHasUnsavedChanges(false)
    }
  }, [currentMeeting.summary?.summary, isGeneratingSummary, isSavingSummary])

  const extractedParticipants = useMemo(() => {
    return extractParticipantsFromSegments(transcriptionSegments)
  }, [transcriptionSegments])

  const displayParticipantNames = useMemo(() => {
    return getDisplayParticipantNames(currentMeeting.participants, extractedParticipants)
  }, [currentMeeting.participants, extractedParticipants])

  const transcriptSearchMatches = useMemo(() => {
    return findTranscriptSearchMatches({
      query: transcriptSearchQuery,
      segments: transcriptionSegments,
      fullText: transcriptionFullText || currentMeeting.transcriptionText || ''
    })
  }, [currentMeeting.transcriptionText, transcriptSearchQuery, transcriptionFullText, transcriptionSegments])

  useEffect(() => {
    if (!transcriptSearchQuery.trim()) {
      setActiveTranscriptMatchIndex(-1)
      return
    }

    if (transcriptSearchMatches.length === 0) {
      setActiveTranscriptMatchIndex(-1)
      return
    }

    if (activeTranscriptMatchIndex < 0 || activeTranscriptMatchIndex >= transcriptSearchMatches.length) {
      setActiveTranscriptMatchIndex(0)
    }
  }, [activeTranscriptMatchIndex, transcriptSearchMatches.length, transcriptSearchQuery])

  const onDownloadRecording = useCallback(async () => {
    setIsLoading(true)
    await handleDownloadRecording(
      currentMeeting as MeetingSession & { createdAt?: string | Date },
      () => {
        toast({
          title: 'Success',
          description: 'Recording download started'
        })
        setIsLoading(false)
      },
      (error) => {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        })
        setIsLoading(false)
      }
    )
  }, [currentMeeting, toast])

  const onDownloadTranscription = useCallback(async () => {
    setIsLoading(true)
    await handleDownloadTranscription(
      currentMeeting as MeetingSession & { createdAt?: string | Date },
      () => {
        toast({
          title: 'Success',
          description: 'Transcription downloaded'
        })
        setIsLoading(false)
      },
      (error) => {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        })
        setIsLoading(false)
      }
    )
  }, [currentMeeting, toast])


  const onToggleVideoPlayPause = useCallback(() => {
    toggleVideoPlayPause(videoRef, isVideoPlaying)
  }, [isVideoPlaying])

  const onVideoSeek = useCallback((value: number[]) => {
    handleVideoSeek(videoRef, value, setVideoCurrentTime)
  }, [])

  const onVideoVolumeChange = useCallback((value: number[]) => {
    handleVideoVolumeChange(videoRef, value, setVideoVolume, setIsVideoMuted)
  }, [])

  const onToggleVideoMute = useCallback(() => {
    toggleVideoMute(videoRef, isVideoMuted, setIsVideoMuted)
  }, [isVideoMuted])

  const onToggleFullscreen = useCallback(() => {
    toggleFullscreen(videoContainerRef)
  }, [])

  useEffect(() => {
    const videoUrl = currentMeeting.recordingUrl || currentMeeting.recallBot?.videoUrl
    if (!videoUrl) return

    const fetchStreamUrl = async () => {
      try {
        setIsVideoLoading(true)
        setVideoError(null)
        
        if (currentMeeting.recordingUrl) {
          setVideoStreamUrl(currentMeeting.recordingUrl)
          return
        }
        
        if (currentMeeting.recallBot?.videoUrl) {
          setVideoStreamUrl(currentMeeting.recallBot.videoUrl)
          return
        }
        
        const result = await ApiService.MeetingAgent.getVideoStreamUrl(currentMeeting.id)
        if (result.success && result.streamUrl) {
          setVideoStreamUrl(result.streamUrl)
        } else {
          setVideoStreamUrl(videoUrl)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to get stream URL:', error)
        setVideoError('Failed to load video stream')
        setVideoStreamUrl(videoUrl)
      } finally {
        setIsVideoLoading(false)
      }
    }

    fetchStreamUrl()
  }, [currentMeeting.id, currentMeeting.recordingUrl, currentMeeting.recallBot?.videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setVideoDuration(video.duration)
      setIsVideoLoading(false)
      setVideoError(null)
    }

    const handleTimeUpdate = () => {
      setVideoCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsVideoPlaying(true)
    const handlePause = () => setIsVideoPlaying(false)
    
    const handleError = () => {
      setVideoError('Failed to load video. The recording may not be available yet.')
      setIsVideoLoading(false)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
    }
  }, [videoStreamUrl])

  useEffect(() => {
    const transcriptUrl = currentMeeting.transcriptionUrl || currentMeeting.recallBot?.transcriptUrl
    if (!transcriptUrl) return

    setIsTranscriptionLoading(true)
    fetchTranscriptFromUrl(
      transcriptUrl,
      (segments, fullText) => {
        if (segments.length > 0) {
          setTranscriptionSegments(segments)
        }
        setTranscriptionFullText(fullText)
        setIsTranscriptionLoading(false)
      },
      () => {
        setIsTranscriptionLoading(false)
      }
    )
  }, [currentMeeting.transcriptionUrl, currentMeeting.recallBot?.transcriptUrl])

  useEffect(() => {
    if (currentMeeting.transcriptionText) {
      setTranscriptionFullText(currentMeeting.transcriptionText)
    }
  }, [currentMeeting.transcriptionText])

  const onTranscriptSegmentClick = useCallback((startTime: number) => {
    handleTranscriptSegmentClick(videoRef, startTime, setVideoCurrentTime)
  }, [])

  const onTranscriptSearchQueryChange = useCallback((query: string) => {
    setTranscriptSearchQuery(query)
    setActiveTranscriptMatchIndex(-1)
  }, [])

  const onTranscriptSearchNavigate = useCallback((direction: 'next' | 'previous') => {
    const nextIndex = getTranscriptSearchIndex(
      activeTranscriptMatchIndex,
      transcriptSearchMatches.length,
      direction
    )
    const nextMatch = transcriptSearchMatches[nextIndex]

    if (!nextMatch) return

    setActiveTranscriptMatchIndex(nextIndex)
    scrollTranscriptMatchIntoView(transcriptScrollRef, nextIndex)

    if (typeof nextMatch.startTime === 'number') {
      handleTranscriptSegmentClick(videoRef, nextMatch.startTime, setVideoCurrentTime)
    }
  }, [activeTranscriptMatchIndex, transcriptSearchMatches])

  useEffect(() => {
    if (activeTranscriptMatchIndex < 0) return
    scrollTranscriptMatchIntoView(transcriptScrollRef, activeTranscriptMatchIndex)
  }, [activeTranscriptMatchIndex])

  const onSaveSummary = useCallback(async () => {
    try {
      setIsSavingSummary(true)
      const editor = summaryEditorRef.current?.editor
      if (!editor) {
        toast({
          title: 'Error',
          description: 'Editor not ready. Please try again.',
          variant: 'destructive'
        })
        return
      }

      const htmlContent = editor.getHTML()

      await handleSaveEditedSummary(
        currentMeeting.id,
        htmlContent,
        currentMeeting.summary,
        undefined,
        (updatedMeeting) => {
          setCurrentMeeting(updatedMeeting)
          onMeetingUpdated?.(updatedMeeting)
          setSummaryHtml(updatedMeeting.summary?.summary || htmlContent)
          setHasUnsavedChanges(false)
          toast({
            title: 'Success',
            description: 'Summary saved successfully'
          })
        },
        (error) => {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          })
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save summary'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSavingSummary(false)
    }
  }, [currentMeeting, onMeetingUpdated, toast])

  const onRegenerateSummary = useCallback(async () => {
    try {
      setIsGeneratingSummary(true)
      setSummaryHtml('')
      setHasUnsavedChanges(false)
      const availableTranscription = currentMeeting.transcriptionText || transcriptionFullText
      const editor = summaryEditorRef.current?.editor ?? null

      await handleRegenerateSummary({
        sessionId: currentMeeting.id,
        transcriptionText: availableTranscription,
        editor,
        onSuccess: (updatedMeeting) => {
          setCurrentMeeting(updatedMeeting)
          onMeetingUpdated?.(updatedMeeting)
          setSummaryHtml(updatedMeeting.summary?.summary || '')
          setHasUnsavedChanges(false)
          toast({
            title: 'Success',
            description: 'Summary regenerated and saved successfully'
          })
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          })
        },
        onProgress: (html) => {
          setSummaryHtml(html)
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate summary'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [currentMeeting, transcriptionFullText, onMeetingUpdated, toast])

  const onGenerateSummary = useCallback(async () => {
    if (!currentMeeting.transcriptionText && !transcriptionFullText) {
      toast({
        title: 'Error',
        description: 'No transcription available. Please wait for transcription to complete.',
        variant: 'destructive'
      })
      return
    }

    const editor = summaryEditorRef.current?.editor
    if (!editor) {
      toast({
        title: 'Error',
        description: 'Editor not ready. Please try again.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsGeneratingSummary(true)
      setSummaryHtml('')
      const availableTranscription = currentMeeting.transcriptionText || transcriptionFullText

      await handleGenerateAnthropicSummaryWithSave(
        currentMeeting.id,
        availableTranscription,
        editor,
        (updatedMeeting) => {
          setCurrentMeeting(updatedMeeting)
          onMeetingUpdated?.(updatedMeeting)
          setSummaryHtml(updatedMeeting.summary?.summary || '')
          setHasUnsavedChanges(false)
          toast({
            title: 'Success',
            description: 'Summary generated successfully'
          })
        },
        (error) => {
          toast({
            title: 'Error',
            description: error,
            variant: 'destructive'
          })
        },
        (html) => {
          setSummaryHtml(html)
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [currentMeeting, transcriptionFullText, onMeetingUpdated, toast])

  const duration = getDuration(currentMeeting as MeetingSession & { createdAt?: string | Date })

  const onToggleTranscriptPanel = useCallback(() => {
    toggleTranscriptPanel(transcriptPanelRef)
  }, [])

  const mainColumnContent = (
    <>
      {hasVideo ? (
        <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
          <ResizablePanel defaultSize={45} minSize={35}>
            <VideoPlayer
              videoRef={videoRef}
              containerRef={videoContainerRef}
              videoStreamUrl={videoStreamUrl}
              isVideoLoading={isVideoLoading}
              isVideoPlaying={isVideoPlaying}
              videoError={videoError}
              videoCurrentTime={videoCurrentTime}
              videoDuration={videoDuration}
              videoVolume={videoVolume}
              isVideoMuted={isVideoMuted}
              onTogglePlayPause={onToggleVideoPlayPause}
              onVideoSeek={onVideoSeek}
              onVolumeChange={onVideoVolumeChange}
              onToggleMute={onToggleVideoMute}
              onToggleFullscreen={onToggleFullscreen}
              onLoadStart={() => setIsVideoLoading(true)}
              setVideoError={setVideoError}
              setIsVideoLoading={setIsVideoLoading}
            />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={55} minSize={35}>
            <SummarySection
              summaryEditorRef={summaryEditorRef}
              summaryHtml={summaryHtml}
              isGeneratingSummary={isGeneratingSummary}
              isSavingSummary={isSavingSummary}
              hasUnsavedChanges={hasUnsavedChanges}
              hasSummary={!!(currentMeeting.summary || summaryHtml)}
              hasTranscription={!!(currentMeeting.transcriptionText || transcriptionFullText)}
              meetingId={currentMeeting.id}
              onSave={onSaveSummary}
              onRegenerate={onRegenerateSummary}
              onGenerate={onGenerateSummary}
              onContentChange={() => {
                if (!isGeneratingSummary) setHasUnsavedChanges(true)
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <SummarySection
          summaryEditorRef={summaryEditorRef}
          summaryHtml={summaryHtml}
          isGeneratingSummary={isGeneratingSummary}
          isSavingSummary={isSavingSummary}
          hasUnsavedChanges={hasUnsavedChanges}
          hasSummary={!!(currentMeeting.summary || summaryHtml)}
          hasTranscription={!!(currentMeeting.transcriptionText || transcriptionFullText)}
          meetingId={currentMeeting.id}
          onSave={onSaveSummary}
          onRegenerate={onRegenerateSummary}
          onGenerate={onGenerateSummary}
          onContentChange={() => {
            if (!isGeneratingSummary) setHasUnsavedChanges(true)
          }}
        />
      )}
    </>
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <MeetingActionsBar
        meeting={currentMeeting}
        duration={duration}
        displayParticipantNames={displayParticipantNames}
        videoStreamUrl={videoStreamUrl}
        transcriptionFullText={transcriptionFullText}
        isLoading={isLoading}
        onDownloadRecording={onDownloadRecording}
        onDownloadTranscription={onDownloadTranscription}
        onUploadRecording={() => setIsUploadDialogOpen(true)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 lg:overflow-hidden">
        <div className="relative min-h-full w-full lg:h-full lg:min-h-0">
          {hasTranscript ? (
            <ResizablePanelGroup direction="horizontal" className="h-full w-full">
              <ResizablePanel defaultSize={72} minSize={45}>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  {mainColumnContent}
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel
                ref={transcriptPanelRef}
                defaultSize={28}
                minSize={20}
                maxSize={45}
                collapsible
                collapsedSize={0}
                onCollapse={() => setIsTranscriptPanelCollapsed(true)}
                onExpand={() => setIsTranscriptPanelCollapsed(false)}
              >
                <TranscriptPanel
                  transcriptScrollRef={transcriptScrollRef}
                  allSegments={transcriptionSegments}
                  transcriptionFullText={transcriptionFullText || currentMeeting.transcriptionText || ''}
                  isTranscriptionLoading={isTranscriptionLoading}
                  videoCurrentTime={videoCurrentTime}
                  searchQuery={transcriptSearchQuery}
                  searchMatches={transcriptSearchMatches}
                  activeSearchMatchIndex={activeTranscriptMatchIndex}
                  onSearchQueryChange={onTranscriptSearchQueryChange}
                  onSearchNavigate={onTranscriptSearchNavigate}
                  onSegmentClick={onTranscriptSegmentClick}
                  onToggleCollapse={onToggleTranscriptPanel}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex h-full min-h-0 min-w-0 flex-col">
              {mainColumnContent}
            </div>
          )}

          {isTranscriptPanelCollapsed && hasTranscript && (
            <button
              type="button"
              onClick={onToggleTranscriptPanel}
              className="absolute right-0 top-1/2 z-20 flex h-11 w-6 -translate-y-1/2 items-center justify-center rounded-l-full border border-border bg-background text-foreground shadow-soft transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Expand transcript panel"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <RecordingUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        sessionId={currentMeeting.id}
        sessionTitle={currentMeeting.title}
        onUploadComplete={() => {
          toast({
            title: 'Recording Uploaded',
            description: 'Your meeting recording has been saved successfully'
          })
          onMeetingUpdated?.(currentMeeting)
        }}
      />
    </div>
  )
}

