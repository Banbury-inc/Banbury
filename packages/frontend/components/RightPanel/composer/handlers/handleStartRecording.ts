import type { RefObject, Dispatch, SetStateAction } from "react"

interface StartRecordingParams {
  recognitionRef: RefObject<any>
  inputRef: RefObject<HTMLTextAreaElement | null>
  setHasText: Dispatch<SetStateAction<boolean>>
  setIsRecording: Dispatch<SetStateAction<boolean>>
}

function getRecognition(recognitionRef: RefObject<any>) {
  const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognitionImpl) return null
  if (!recognitionRef.current) {
    const rec = new SpeechRecognitionImpl()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec
  }
  return recognitionRef.current
}

export function startRecording({
  recognitionRef,
  inputRef,
  setHasText,
  setIsRecording,
}: StartRecordingParams) {
  const rec = getRecognition(recognitionRef)
  if (!rec) return
  let finalTranscript = ''
  rec.onresult = (event: any) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interim += transcript
      }
    }
    const text = (finalTranscript || interim).trim()
    const input = inputRef.current
    if (input) {
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
    try {
      window.dispatchEvent(new CustomEvent('composer-set-text', { detail: { text } }))
    } catch {}
    setHasText(Boolean(text.length))
  }
  rec.onend = () => {
    setIsRecording(false)
  }
  rec.start()
  setIsRecording(true)
}
