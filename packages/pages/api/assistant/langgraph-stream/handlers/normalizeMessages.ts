import type { AssistantUiMessage, AssistantUiMessagePart } from "../types"

interface NormalizeMessagesParams {
  messages: any[]
}

export function normalizeMessages({ messages }: NormalizeMessagesParams): AssistantUiMessage[] {
  if (!Array.isArray(messages)) return messages as AssistantUiMessage[]
  
  return messages.map((msg: any) => {
    const attachments = Array.isArray(msg?.attachments) ? msg.attachments : []
    const attachmentParts = attachments
      .map((att: any) => {
        const fileId = att?.fileId ?? att?.id ?? att?.file_id
        const fileName = att?.fileName ?? att?.name
        const filePath = att?.filePath ?? att?.path
        if (!fileId || !fileName || !filePath) return null
        return { type: "file-attachment", fileId, fileName, filePath } as AssistantUiMessagePart
      })
      .filter(Boolean) as AssistantUiMessagePart[]

    const baseContent = Array.isArray(msg?.content) ? msg.content : []
    const content = attachmentParts.length > 0 ? [...baseContent, ...attachmentParts] : baseContent
    const { attachments: _omit, ...rest } = msg || {}
    return { ...(rest as AssistantUiMessage), content }
  })
}

