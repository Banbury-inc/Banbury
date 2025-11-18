import * as AssistantUI from "@assistant-ui/react"
import { motion } from "framer-motion"
import { Mail } from "lucide-react"

import { FileAttachmentDisplay } from "../../components/file-attachment-display"
import { BranchPicker } from "./BranchPicker"

import type { FC } from "react"

// Destructure Assistant UI primitives from namespace import
const {
  MessagePrimitive,
  ActionBarPrimitive,
} = AssistantUI as any

const TextWithBreaks: FC<{ text?: string }> = ({ text = "" }) => (
  <div className="text-[0.875rem] leading-[1.55] whitespace-pre-wrap">
    {text}
  </div>
)

export const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div
        className="relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] pt-1 pb-0"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role="user"
      >
        <div className="col-start-1 row-start-1 relative">
          <div className="bg-muted text-foreground rounded-2xl px-4 py-2 break-words overflow-x-auto max-w-full">
              <MessagePrimitive.Content components={{ Text: TextWithBreaks }} />
              
              {/* Display attached files */}
              <MessagePrimitive.Attachments>
                {(attachments: any[]) => {
                  const fileAttachments = attachments.filter((att: any) => att.type === 'file')
                  const emailAttachments = attachments.filter((att: any) => att.type === 'email')
                  
                  return (
                    <div className="space-y-2">
                      {fileAttachments.length > 0 && (
                        <FileAttachmentDisplay 
                          files={fileAttachments.map((att: any) => ({
                            id: att.fileId,
                            file_id: att.fileId,
                            name: att.fileName,
                            path: att.filePath,
                            type: 'file'
                          }))}
                        />
                      )}
                      
                      {emailAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {emailAttachments.map((att: any) => (
                            <div
                              key={att.emailId}
                              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                              title={`From: ${att.from}\nSubject: ${att.subject}`}
                            >
                              <Mail className="h-4 w-4" strokeWidth={1} />
                              <span className="truncate max-w-32">{att.subject}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }}
              </MessagePrimitive.Attachments>
          </div>
          
          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <ActionBarPrimitive.Edit asChild>
              <button className="absolute inset-0 cursor-pointer bg-muted/10 hover:bg-muted/20 rounded-2xl transition-all duration-200 hover:ring-2 hover:ring-primary/20" />
            </ActionBarPrimitive.Edit>
          </ActionBarPrimitive.Root>
        </div>

        <BranchPicker className="col-start-1 row-start-2" />
      </motion.div>
    </MessagePrimitive.Root>
  )
}
