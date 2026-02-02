import * as AssistantUI from "@assistant-ui/react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import BanburyLogo from "../../../../../assets/images/New_Logo.png";
import { Typography } from "../../../../ui/typography";
import { Kbd, KbdGroup } from "../../../../ui/kbd";
import {
  getStoredKeybinds,
  getActiveKey,
  parseKeyString,
  type KeybindsState,
} from "../../../../modals/settings-tabs/handlers/keybindHandlers";
import type { FC } from "react";

// Destructure Assistant UI primitives from namespace import to avoid named import type issues
const { ThreadPrimitive } = AssistantUI as any;

export const ThreadWelcome: FC = () => {
  const [isMac, setIsMac] = useState(false);
  const [keybinds, setKeybinds] = useState<KeybindsState>(getStoredKeybinds);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    }
  }, []);

  // Listen for keybind updates
  useEffect(() => {
    function handleKeybindsUpdate() {
      setKeybinds(getStoredKeybinds())
    }
    
    window.addEventListener('keybinds-updated', handleKeybindsUpdate)
    return () => window.removeEventListener('keybinds-updated', handleKeybindsUpdate)
  }, []);

  // Get active keys for each keybind
  const newAgentKey = parseKeyString(getActiveKey(keybinds.newAgent))
  const searchKey = parseKeyString(getActiveKey(keybinds.searchFiles))
  const togglePanelKey = parseKeyString(getActiveKey(keybinds.toggleFileSidebar))

  return (
    <ThreadPrimitive.Empty>
      <div className="mx-auto flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col px-[var(--thread-padding-x)]">
        <div className="flex w-full flex-grow flex-col items-center justify-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <Image 
              src={BanburyLogo} 
              alt="Banbury" 
              className="opacity-20 dark:opacity-15"
              width={160}
              height={160}
              priority
            />
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <Typography variant="muted">New Agent:</Typography>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  {newAgentKey.shift && (
                    <>
                      <Typography variant="muted" asChild><span>+</span></Typography>
                      <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
                    </>
                  )}
                  <Typography variant="muted" asChild><span>+</span></Typography>
                  <Kbd>{newAgentKey.key.toUpperCase()}</Kbd>
                </KbdGroup>
              </div>
              <div className="flex items-center gap-3">
                <Typography variant="muted">Search:</Typography>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  {searchKey.shift && (
                    <>
                      <Typography variant="muted" asChild><span>+</span></Typography>
                      <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
                    </>
                  )}
                  <Typography variant="muted" asChild><span>+</span></Typography>
                  <Kbd>{searchKey.key.toUpperCase()}</Kbd>
                </KbdGroup>
              </div>
              <div className="flex items-center gap-3">
                <Typography variant="muted">Toggle Left Panel:</Typography>
                <KbdGroup>
                  <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                  {togglePanelKey.shift && (
                    <>
                      <Typography variant="muted" asChild><span>+</span></Typography>
                      <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
                    </>
                  )}
                  <Typography variant="muted" asChild><span>+</span></Typography>
                  <Kbd>{togglePanelKey.key.toUpperCase()}</Kbd>
                </KbdGroup>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
