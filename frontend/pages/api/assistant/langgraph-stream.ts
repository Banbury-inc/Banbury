import type { NextApiRequest, NextApiResponse } from "next";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { reactAgent } from "../../../src/lib/langraph/agent";
import { runWithServerContext } from "../../../src/lib/serverContext";

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

// Best-effort XLSX/XLS extraction to CSV-like text for LLM consumption
function extractTextFromXlsx(buffer: Buffer, fileName: string): string {
  try {
    // Lazy require to avoid hard dependency if module is missing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames: string[] = workbook.SheetNames || [];
    if (!sheetNames.length) {
      return `Spreadsheet: ${fileName}\n\n(No sheets found)`;
    }

    const maxSheets = 5; // limit number of sheets to include
    const maxChars = 150_000; // cap total characters to keep payload manageable
    let total = '';
    for (const sheetName of sheetNames.slice(0, maxSheets)) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      // Convert sheet to CSV
      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',', RS: '\n' });
      if (csv && csv.trim()) {
        const section = `Sheet: ${sheetName}\n${csv}\n\n`;
        if ((total.length + section.length) > maxChars) {
          total += section.slice(0, Math.max(0, maxChars - total.length));
          break;
        }
        total += section;
      }
      if (total.length >= maxChars) break;
    }

    if (!total.trim()) {
      return `Spreadsheet: ${fileName}\n\n(Parsed but no tabular content found)`;
    }
    return `Spreadsheet: ${fileName}\n\n${total}`;
  } catch (error) {
    return `Spreadsheet: ${fileName}\n\nThis spreadsheet could not be parsed. Please provide key details or export a CSV.`;
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
                'doc': 'application/msword',
                'txt': 'text/plain',
                'csv': 'text/csv',
                'html': 'text/html',
                'md': 'text/markdown',
                'json': 'application/json',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xls': 'application/vnd.ms-excel'
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
                } else if (
                  fa.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  fa.mimeType === 'application/vnd.ms-excel'
                ) {
                  const binaryData = Buffer.from(fa.fileData, 'base64');
                  const extractedText = extractTextFromXlsx(binaryData, fa.fileName);
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
        // Only include tool calls that have completed results to maintain proper message flow
        const completedToolCalls = toolCalls.filter((c: any) => c.result !== undefined);
        
        if (completedToolCalls.length > 0) {
          // For messages with tool calls, we need to maintain the proper sequence:
          // 1. Assistant message with tool_calls
          // 2. Tool result messages
          
          lc.push(new AIMessage({ 
            content: textParts.join("\n\n"), 
            tool_calls: completedToolCalls.map((c: any) => ({ 
              name: c.toolName, 
              args: c.args, 
              id: c.toolCallId 
            }))
          }));
          
          // Add tool result messages immediately after
          for (const toolCall of completedToolCalls) {
            lc.push(new ToolMessage({
              content: typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result),
              tool_call_id: toolCall.toolCallId
            }));
          }
        } else if (textParts.length > 0) {
          // If there are only text parts (no completed tool calls), just add the text message
          lc.push(new AIMessage({ 
            content: textParts.join("\n\n")
          }));
        }
      }
    }
  }
  
  return lc;
}

const SYSTEM_PROMPT = 
  "You are a helpful AI assistant with advanced capabilities. " +
  "You have access to web search, memory management, document editing, spreadsheet editing, file search, and (when enabled) Gmail tools. " +
  "Use Gmail tools like gmail_get_recent and gmail_search to retrieve message metadata when the user asks about their email. " +
  "When helping with document editing tasks (rewriting, grammar correction, translation, etc.), " +
  "ALWAYS use the tiptap_ai tool to deliver your response. This ensures that your edits can be " +
  "applied directly to the document editor. Provide clean HTML-formatted content that maintains " +
  "proper document structure. For spreadsheet editing tasks (cleaning data, transforming columns, applying formulas, inserting/deleting rows/columns), " +
  "ALWAYS use the sheet_ai tool and return structured operations (setCell, setRange, insertRows, deleteRows, insertCols, deleteCols) or a replacement csvContent. " +
  "To search for files in the user's cloud storage, use the search_files tool with a search query to find files by name. " +
  "Store important information in memory for future reference and search your memories when relevant. " +
  "Provide clear citations when using web search results.";

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };

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
      toolPreferences?: { web_search?: boolean; tiptap_ai?: boolean; memory?: boolean; gmail?: boolean };
      documentContext?: string;
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

    // Add document context to the last user message if provided
    if (body.documentContext && normalizedMessages.length > 0) {
      const lastMessage = normalizedMessages[normalizedMessages.length - 1];
      if (lastMessage.role === 'user') {
        // Get the text content from the last user message
        const textContent = lastMessage.content.find((part: any) => part.type === 'text')?.text || '';
        
        // Combine with document context
        const enhancedText = textContent + body.documentContext;
        
        // Update the content with the enhanced text
        const updatedContent = lastMessage.content.map((part: any) => 
          part.type === 'text' ? { ...part, text: enhancedText } : part
        );
        
        // If no text content found, add it
        if (!lastMessage.content.some((part: any) => part.type === 'text')) {
          updatedContent.unshift({ type: 'text', text: enhancedText });
        }
        
        // Update the last message
        normalizedMessages[normalizedMessages.length - 1] = {
          ...lastMessage,
          content: updatedContent
        };
      }
    }

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

    // Run the agent with server context so tools can access the auth token
    // Reuse the token defined earlier for file pre-downloads
    
    try {
      await runWithServerContext({ authToken: token, toolPreferences: body.toolPreferences || { gmail: true } }, async () => {
        // Use a custom streaming approach for character-by-character updates
        const stream = await reactAgent.stream({ messages: allMessages }, { streamMode: "values" });

      // Track how many messages we've already processed to avoid duplicates
      let prevMessageCount = allMessages.length;
      // Track processed content to avoid sending duplicate text
      let processedAiMessages = new Set<string>();
      // Track tool execution status
      let currentToolExecution: any = null;
      // Track processed tool calls to avoid duplicates
      let processedToolCalls = new Set<string>();
      // Track the current AI message being streamed
      let currentAiMessage: any = null;
      let currentTextContent = "";

        for await (const chunk of stream) {
        finalResult = chunk;

        const messages = (chunk as any).messages || [];
        
        // Stream thinking/processing indicator and step progression
        if (chunk && typeof chunk === 'object' && 'messages' in chunk) {
          const newMessageCount = messages.length - allMessages.length;
          
          // Only send thinking/progression if we have new messages beyond the input
          if (newMessageCount > 0) {
            send({ type: "thinking", message: `Processing step ${newMessageCount}...` });
            send({ type: "step-progression", step: newMessageCount, totalSteps: newMessageCount + 1 });
          }
        }

        // Only process messages that are NEW (beyond the input messages)
        const newMessages = messages.slice(allMessages.length);

        for (const m of newMessages) {
          const type = m?._getType?.();
          if (type === "ai") {
            const messageId = m.id || JSON.stringify(m);
            
            // Only process this AI message if we haven't seen it before
            if (!processedAiMessages.has(messageId)) {
              processedAiMessages.add(messageId);
              
              const toolCalls = (m as any).tool_calls || (m as any).additional_kwargs?.tool_calls || [];
              const content: any = (m as any).content;
              const fullText = typeof content === "string"
                ? content
                : Array.isArray(content)
                  ? content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
                  : "";
              
              // Stream the text character by character for better UX
              if (fullText && fullText.trim()) {
                const textToStream = fullText.trim();
                
                // Stream in small chunks (words or phrases) for more natural flow
                const words = textToStream.split(' ');
                let currentChunk = '';
                
                for (let i = 0; i < words.length; i++) {
                  const word = words[i];
                  const space = i < words.length - 1 ? ' ' : '';
                  const chunk = word + space;
                  
                  // Send the chunk immediately for real-time streaming
                  send({ type: "text-delta", text: chunk });
                  
                  // Small delay between chunks for natural reading pace
                  if (i < words.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 20)); // 20ms delay between words
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
                    sheet_ai: "Processing spreadsheet edits...",
                    store_memory: "Storing information in memory...",
                    search_memory: "Searching memory...",
                    create_file: "Creating file..."
                  };
                  
                  const statusMessage = (toolStatusMessages as any)[toolCall.name] ||
                    (toolCall.name.startsWith('gmail_') ? 'Accessing Gmail…' : `Executing ${toolCall.name}...`);
                  send({ type: "tool-status", tool: toolCall.name, message: statusMessage });
                  
                  // Track current tool execution
                  currentToolExecution = toolCall;
                }
              }
            }
          } else if (type === "tool") {
            const toolMessage = m as any;
            
            // Send tool execution completion event
            send({
              type: "tool-result",
              part: {
                type: "tool-result",
                toolCallId: toolMessage.tool_call_id || "",
                toolName: currentToolExecution?.name || "unknown",
                result: toolMessage.content,
              },
            });
            
            // Stream tool completion status
            if (currentToolExecution?.name) {
              const completionMessages: Record<string, string> = {
                web_search: "Web search completed",
                tiptap_ai: "Document processing completed",
                sheet_ai: "Spreadsheet edits ready",
                store_memory: "Memory stored successfully",
                search_memory: "Memory search completed",
                create_file: "File created successfully"
              };
              
              const completionMessage = (completionMessages as any)[currentToolExecution.name] ||
                (currentToolExecution.name.startsWith('gmail_') ? 'Gmail operation completed' : `${currentToolExecution.name} completed`);
              send({ type: "tool-completion", tool: currentToolExecution.name, message: completionMessage });
            }
            
            // Clear current tool execution tracking
            currentToolExecution = null;
          }
        }
      }
    });
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
