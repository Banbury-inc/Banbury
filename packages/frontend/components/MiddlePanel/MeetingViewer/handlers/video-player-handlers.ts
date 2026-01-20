import { RefObject } from "react"

export function toggleVideoPlayPause(
  videoRef: RefObject<HTMLVideoElement>,
  isPlaying: boolean
): void {
  if (!videoRef.current) return
  if (isPlaying) {
    videoRef.current.pause()
  } else {
    videoRef.current.play()
  }
}

export function handleVideoSeek(
  videoRef: RefObject<HTMLVideoElement>,
  value: number[],
  setVideoCurrentTime: (time: number) => void
): void {
  if (!videoRef.current) return
  const newTime = value[0]
  videoRef.current.currentTime = newTime
  setVideoCurrentTime(newTime)
}

export function handleVideoVolumeChange(
  videoRef: RefObject<HTMLVideoElement>,
  value: number[],
  setVideoVolume: (volume: number) => void,
  setIsVideoMuted: (muted: boolean) => void
): void {
  if (!videoRef.current) return
  const newVolume = value[0]
  videoRef.current.volume = newVolume
  setVideoVolume(newVolume)
  setIsVideoMuted(newVolume === 0)
}

export function toggleVideoMute(
  videoRef: RefObject<HTMLVideoElement>,
  isVideoMuted: boolean,
  setIsVideoMuted: (muted: boolean) => void
): void {
  if (!videoRef.current) return
  const newMuted = !isVideoMuted
  videoRef.current.muted = newMuted
  setIsVideoMuted(newMuted)
}

export function handleTranscriptSegmentClick(
  videoRef: RefObject<HTMLVideoElement>,
  startTime: number,
  setVideoCurrentTime: (time: number) => void
): void {
  if (videoRef.current) {
    videoRef.current.currentTime = startTime
    setVideoCurrentTime(startTime)
  }
}
