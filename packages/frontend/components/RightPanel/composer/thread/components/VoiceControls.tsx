import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { TooltipIconButton } from "../../../tooltip-icon-button";
import type { FC } from "react";

export const VoiceControls: FC = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const extractMessageText = (el: HTMLElement | null) => {
    if (!el) return '';
    // Fallback: innerText of message root
    return (el.innerText || '').trim();
  };

  const handleSpeak = (e: React.MouseEvent) => {
    const synth = (typeof window !== 'undefined') ? window.speechSynthesis : null;
    if (!synth) return;
    if (synth.speaking) {
      synth.cancel();
    }
    const root = (e.currentTarget as HTMLElement).closest('[data-role="assistant"]') as HTMLElement | null;
    const text = extractMessageText(root);
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utter);
  };

  const handleStop = () => {
    const synth = (typeof window !== 'undefined') ? window.speechSynthesis : null;
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
  };

  const hasTts = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!hasTts) return null;

  return (
    <div className="flex items-center gap-1">
      {!isSpeaking ? (
        <TooltipIconButton tooltip="Play audio" onClick={handleSpeak}>
          <Volume2 />
        </TooltipIconButton>
      ) : (
        <TooltipIconButton tooltip="Stop audio" onClick={handleStop}>
          <VolumeX />
        </TooltipIconButton>
      )}
    </div>
  );
};
