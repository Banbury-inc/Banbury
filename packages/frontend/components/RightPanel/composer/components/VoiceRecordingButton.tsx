import { Mic, MicOff } from "lucide-react"
import { Button } from "../../../common/ui/button"
import type { FC } from "react"

interface VoiceRecordingButtonProps {
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  isVisible: boolean
  isMeasuring: boolean
}

export const VoiceRecordingButton: FC<VoiceRecordingButtonProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  isVisible,
  isMeasuring,
}) => {
  if (!isMeasuring && !isVisible) {
    return null
  }

  return (
    <Button
      variant="primary"
      size="xs"
      className={`h-7 w-7 flex-shrink-0 ${
        isRecording
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : ""
      }`}
      onClick={isRecording ? onStopRecording : onStartRecording}
      title={isRecording ? "Stop recording" : "Start voice input"}
      aria-label={isRecording ? "Stop recording" : "Start voice input"}
      disabled={!(typeof window !== 'undefined' && (((window as any).SpeechRecognition) || ((window as any).webkitSpeechRecognition)))}
    >
      {isRecording ? <MicOff height={16} width={16} strokeWidth={1} /> : <Mic height={16} width={16} strokeWidth={1} />}
    </Button>
  )
}
