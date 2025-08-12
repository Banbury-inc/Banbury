import type { NextApiRequest, NextApiResponse } from "next";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { reactAgent } from "../../../src/lib/langraph/agent";

// Types following athena-intelligence patterns
type AssistantUiMessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: any; argsText?: string; result?: any }
  | { type: "file-attachment"; fileId: string; fileName: string; filePath: string; fileData?: string; mimeType?: string };

type AssistantUiMessage = {
  role: "system" | "user" | "assistant";
  content: AssistantUiMessagePart[];
};

// Simple DOCX text extraction function (copied from existing implementation)
function extractTextFromDocx(buffer: Buffer, fileName: string): string {
  try {
    const content = buffer.toString('binary');
    const xmlMatches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    
    if (xmlMatches) {
      const extractedText = xmlMatches
        .map(match => {
          const textMatch = match.match(/<w:t[^>]*>(.*?)<\/w:t>/);
          return textMatch ? textMatch[1] : '';
        })
        .filter(text => text.trim().length > 0)
        .join(' ');
      
      if (extractedText.trim().length > 0) {
        return `Document: ${fileName}\n\nExtracted Content:\n${extractedText}`;
      }
    }
    
    const simpleText = content.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    const meaningfulText = simpleText.length > 100 ? simpleText.substring(0, 2000) : '';
    
    if (meaningfulText) {
      return `Document: ${fileName}\n\nPartial Content:\n${meaningfulText}`;
    }
    
    return `Document: ${fileName}\n\nThis DOCX file was attached but text extraction was not successful. The document contains ${buffer.length} bytes of data. Please ask the user to provide the key content or specific information from this document.`;
    
  } catch (error) {
    return `Document: ${fileName}\n\nThis DOCX file could not be processed for text extraction. Please ask the user to provide the text content or key information from this document.`;
  }
}

function toLangChainMessages(messages: AssistantUiMessage[]): BaseMessage[] {
  const lc: BaseMessage[] = [];
  
  for (const msg of messages) {
    if (msg.role === "system") {
      const text = msg.content.filter((p) => p.type === "text").map((p: any) => p.text).join("\n\n");
      if (text) lc.push(new SystemMessage(text));
      continue;
    }
    
    if (msg.role === "user") {
      const textParts = msg.content.filter((p) => p.type === "text").map((p: any) => p.text);
      const fileAttachments = msg.content.filter((p) => p.type === "file-attachment") as any[];
      
      let userContent = textParts.join("\n\n");
      
      // Create Anthropic-compatible message with attachments
      if (fileAttachments.length > 0) {
        const anthropicContent: any[] = [];
        
        // Add text content first
        if (userContent) {
          anthropicContent.push({ type: "text", text: userContent });
        }
        
        // Add file attachments in Anthropic format
        for (const fa of fileAttachments) {
          if (fa.fileData && fa.mimeType) {
            // Normalize MIME type for Anthropic compatibility
            let anthropicMimeType = fa.mimeType;
            
            // Handle generic octet-stream based on file extension
            if (fa.mimeType === 'application/octet-stream' && fa.fileName) {
              const ext = fa.fileName.split('.').pop()?.toLowerCase();
              const mimeMap: Record<string, string> = {
                'pdf': 'application/pdf',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'txt': 'text/plain',
                'csv': 'text/csv',
                'html': 'text/html',
                'md': 'text/markdown',
                'json': 'application/json',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp'
              };
              anthropicMimeType = mimeMap[ext || ''] || fa.mimeType;
            }
            
            // Special handling for Office documents - convert to text/plain
            const officeDocumentTypes = [
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            
            if (officeDocumentTypes.includes(anthropicMimeType)) {
              anthropicMimeType = 'text/plain';
              
              try {
                if (fa.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  const binaryData = Buffer.from(fa.fileData, 'base64');
                  const extractedText = extractTextFromDocx(binaryData, fa.fileName);
                  fa.fileData = Buffer.from(extractedText, 'utf8').toString('base64');
                } else {
                  const fileInfo = `This is a ${fa.fileName} file (${fa.mimeType}). Please ask the user to provide key information from this document.`;
                  fa.fileData = Buffer.from(fileInfo, 'utf8').toString('base64');
                }
              } catch (error) {
                const fallbackInfo = `This is a ${fa.fileName} file (${fa.mimeType}) that could not be processed.`;
                fa.fileData = Buffer.from(fallbackInfo, 'utf8').toString('base64');
              }
            }
            
            // Use different content types based on MIME type
            if (anthropicMimeType.startsWith('image/')) {
              anthropicContent.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: anthropicMimeType,
                  data: fa.fileData
                }
              });
            } else if (anthropicMimeType === 'application/pdf') {
              anthropicContent.push({
                type: "document",
                source: {
                  type: "base64",
                  media_type: anthropicMimeType,
                  data: fa.fileData
                }
              });
            } else {
              const textContent = Buffer.from(fa.fileData, 'base64').toString('utf8');
              anthropicContent.push({
                type: "text",
                text: textContent
              });
            }
          }
        }
        
        lc.push(new HumanMessage({ content: anthropicContent }));
      } else if (userContent) {
        lc.push(new HumanMessage(userContent));
      }
      continue;
    }
    
    if (msg.role === "assistant") {
      const textParts = msg.content.filter((p) => p.type === "text").map((p: any) => p.text);
      const toolCalls = msg.content.filter((p) => p.type === "tool-call") as any[];
      
      if (textParts.length > 0 || toolCalls.length > 0) {
        lc.push(new AIMessage({ 
          content: textParts.join("\n\n"), 
          tool_calls: toolCalls.map((c: any) => ({ 
            name: c.toolName, 
            args: c.args, 
            id: c.toolCallId 
          })) 
        }));
      }
    }
  }
  
  return lc;
}

const SYSTEM_PROMPT = 
  "You are Athena, a helpful AI assistant with advanced capabilities. " +
  "You have access to web search, memory management, and document editing tools. " +
  "When helping with document editing tasks (rewriting, grammar correction, translation, etc.), " +
  "ALWAYS use the tiptap_ai tool to deliver your response. This ensures that your edits can be " +
  "applied directly to the document editor. Provide clean HTML-formatted content that maintains " +
  "proper document structure. Store important information in memory for future reference and " +
  "search your memories when relevant. Provide clear citations when using web search results.";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const body = req.body as { 
      messages: any[]; 
      threadId?: string;
      toolPreferences?: { web_search?: boolean; tiptap_ai?: boolean; memory?: boolean } 
    };
    
    // Normalize messages like in athena-intelligence
    const normalizedMessages: AssistantUiMessage[] = Array.isArray(body.messages)
      ? body.messages.map((msg: any) => {
          const attachments = Array.isArray(msg?.attachments) ? msg.attachments : [];
          const attachmentParts = attachments
            .map((att: any) => {
              const fileId = att?.fileId ?? att?.id ?? att?.file_id;
              const fileName = att?.fileName ?? att?.name;
              const filePath = att?.filePath ?? att?.path;
              if (!fileId || !fileName || !filePath) return null;
              return { type: "file-attachment", fileId, fileName, filePath } as AssistantUiMessagePart;
            })
            .filter(Boolean) as AssistantUiMessagePart[];

          const baseContent = Array.isArray(msg?.content) ? msg.content : [];
          const content = attachmentParts.length > 0 ? [...baseContent, ...attachmentParts] : baseContent;
          const { attachments: _omit, ...rest } = msg || {};
          return { ...(rest as AssistantUiMessage), content };
        })
      : (body.messages as AssistantUiMessage[]);

    // Pre-download files from S3 (same logic as existing implementation)
    const token = req.headers.authorization?.replace('Bearer ', '');
    const messagesWithFileData: AssistantUiMessage[] = await (async () => {
      if (!Array.isArray(normalizedMessages)) return normalizedMessages;
      const out: AssistantUiMessage[] = [];
      for (const m of normalizedMessages) {
        const parts = Array.isArray(m?.content) ? [...m.content] : [];
        for (let i = 0; i < parts.length; i++) {
          const p: any = parts[i];
          if (p?.type === 'file-attachment' && p?.fileId) {
            if (p?.fileData) {
              // File already downloaded
            } else if (token) {
              try {
                const apiUrl = 'http://www.api.dev.banbury.io';
                const downloadUrl = `${apiUrl}/files/download_s3_file/${encodeURIComponent(p.fileId)}/`;
                
                const resp = await fetch(downloadUrl, {
                  method: 'GET',
                  headers: { Authorization: `Bearer ${token}` },
                });
                
                if (resp.ok) {
                  const arrayBuffer = await resp.arrayBuffer();
                  const contentType = resp.headers.get('content-type') || 'application/octet-stream';
                  const base64Data = Buffer.from(arrayBuffer).toString('base64');
                  parts[i] = { ...p, fileData: base64Data, mimeType: contentType } as any;
                } else {
                  // Failed to download file
                }
              } catch (error) {
                // Exception downloading file
                parts.splice(i, 1);
                i--;
              }
            }
          }
        }
        out.push({ ...m, content: parts } as AssistantUiMessage);
      }
      return out;
    })();

    // Convert to LangChain messages
    const lcMessages = toLangChainMessages(messagesWithFileData);
    
    // Only add system message if not already present
    let allMessages = lcMessages;
    const hasSystemMessage = lcMessages.length > 0 && lcMessages[0]._getType() === "system";
    
    if (!hasSystemMessage) {
      const systemMessage = new SystemMessage(SYSTEM_PROMPT);
      allMessages = [systemMessage, ...lcMessages];
    }
    
    // Start assistant message
    send({ type: "message-start", role: "assistant" });

    // Prefer the prebuilt React agent streaming to manage tool loops
    let finalResult: any = null;
    
    try {
      const stream = await reactAgent.stream({ messages: allMessages }, { streamMode: "values" });

      // Track how many messages we've already emitted to avoid missing or duplicating events
      let prevMessageCount = 0;
      // Track the cumulative text length to send only deltas
      let lastTextLength = 0;
      let cumulativeText = "";
      // Track tool execution status
      let currentToolExecution: any = null;
      // Track processed tool calls to avoid duplicates
      let processedToolCalls = new Set<string>();
      // Track the last AI message ID to reset text when switching messages
      let lastAiMessageId: any = null;

      for await (const chunk of stream) {
        finalResult = chunk;

        const messages = (chunk as any).messages || [];
        
        // Stream thinking/processing indicator and step progression
        if (chunk && typeof chunk === 'object' && 'messages' in chunk) {
          const stepNumber = messages.length;
          
          // Only send thinking/progression if we have new messages
          if (stepNumber > prevMessageCount) {
            send({ type: "thinking", message: `Processing step ${stepNumber}...` });
            
            // For step progression, we can't know total steps in advance with LangGraph
            // So we'll just show current step and indicate it's ongoing
            send({ type: "step-progression", step: stepNumber, totalSteps: stepNumber + 1 });
          }
        }

        const newMessages = messages.slice(prevMessageCount);
        prevMessageCount = messages.length;

        for (const m of newMessages) {
          const type = m?._getType?.();
          if (type === "ai") {
            // Reset text tracking when we encounter a new AI message
            const currentAiMessageId = m.id || m;
            if (currentAiMessageId !== lastAiMessageId) {
              lastTextLength = 0;
              cumulativeText = "";
              lastAiMessageId = currentAiMessageId;
            }
            const toolCalls = (m as any).tool_calls || (m as any).additional_kwargs?.tool_calls || [];
            const content: any = (m as any).content;
            const fullText = typeof content === "string"
              ? content
              : Array.isArray(content)
                ? content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
                : "";
            
            // Stream AI text content - only send deltas (new text)
            if (fullText && fullText.trim()) {
              const normalized = fullText.trim();
              if (normalized.length > lastTextLength) {
                // Only send the new part of the text
                const deltaText = normalized.slice(lastTextLength);
                if (deltaText) {
                  send({ type: "text-delta", text: deltaText });
                  lastTextLength = normalized.length;
                  cumulativeText = normalized;
                }
              }
            }

            // Stream tool calls (avoid duplicates)
            for (const toolCall of toolCalls) {
              if (!processedToolCalls.has(toolCall.id)) {
                processedToolCalls.add(toolCall.id);
                
                // Send tool call start event
                send({
                  type: "tool-call-start",
                  part: {
                    type: "tool-call",
                    toolCallId: toolCall.id,
                    toolName: toolCall.name,
                    args: toolCall.args,
                    argsText: JSON.stringify(toolCall.args, null, 2),
                  },
                });
                
                // Stream tool-specific status messages
                const toolStatusMessages: Record<string, string> = {
                  web_search: "Searching the web...",
                  tiptap_ai: "Processing document content...",
                  store_memory: "Storing information in memory...",
                  search_memory: "Searching memory..."
                };
                
                const statusMessage = toolStatusMessages[toolCall.name] || `Executing ${toolCall.name}...`;
                send({ type: "tool-status", tool: toolCall.name, message: statusMessage });
                
                // Track current tool execution
                currentToolExecution = toolCall;
              }
            }
          } else if (type === "tool") {
            const toolMessage = m as any;
            
            // Send tool execution completion event
            send({
              type: "tool-result",
              part: {
                type: "tool-result",
                toolCallId: toolMessage.tool_call_id,
                result: toolMessage.content,
                toolName: currentToolExecution?.name || "unknown",
              },
            });
            
            // Stream tool completion status
            if (currentToolExecution?.name) {
              const completionMessages: Record<string, string> = {
                web_search: "Web search completed",
                tiptap_ai: "Document processing completed",
                store_memory: "Memory stored successfully",
                search_memory: "Memory search completed"
              };
              
              const completionMessage = completionMessages[currentToolExecution.name] || `${currentToolExecution.name} completed`;
              send({ type: "tool-completion", tool: currentToolExecution.name, message: completionMessage });
            }
            
            // Clear current tool execution tracking
            currentToolExecution = null;
          }
        }
      }
      
    } catch (graphError) {
      // LangGraph execution error
      
      // Stream detailed error information
      const errorMessage = graphError instanceof Error ? graphError.message : "Graph execution failed";
      send({ type: "error", error: errorMessage });
      
      // Stream error details for debugging
      if (graphError instanceof Error && graphError.stack) {
        send({ type: "error-details", stack: graphError.stack });
      }
      
      res.end();
      return;
    }

    // Send completion with detailed status
    send({ type: "message-end", status: { type: "complete", reason: "stop" } });
    
    // Stream final summary
    const totalSteps = finalResult?.messages?.length || 0;
    const toolCalls = finalResult?.messages?.filter((m: any) => m._getType?.() === "tool") || [];
    const aiMessages = finalResult?.messages?.filter((m: any) => m._getType?.() === "ai") || [];
    const allToolNames = aiMessages.flatMap((m: any) => 
      (m.tool_calls || []).map((tc: any) => tc.name)
    );
    const uniqueTools = Array.from(new Set(allToolNames));
    
    send({ 
      type: "completion-summary", 
      totalSteps, 
      toolExecutions: toolCalls.length,
      toolsUsed: uniqueTools
    });
    
    // Update step progression to show completion
    if (totalSteps > 0) {
      send({ type: "step-progression", step: totalSteps, totalSteps });
    }
    
    send({ type: "done" });
    res.end();

  } catch (e: any) {
    let errorMessage = e?.message || "unknown error";
    
    // Parse Anthropic-specific errors
    if (typeof e?.message === 'string' && e.message.includes('image exceeds 5 MB maximum')) {
      try {
        const match = e.message.match(/"message":"([^"]+)"/);
        if (match && match[1]) {
          errorMessage = match[1].replace(/\\"/g, '"');
        }
      } catch (parseError) {
        errorMessage = "File size exceeds 5 MB maximum limit";
      }
    }

    send({ type: "error", error: errorMessage });
    res.end();
  }
}
