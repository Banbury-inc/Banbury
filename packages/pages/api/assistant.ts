import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

// Simple DOCX text extraction function
function extractTextFromDocx(buffer: Buffer, fileName: string): string {
  try {
    // DOCX files are ZIP archives containing XML files
    // We'll try a simple approach to extract text from the main document
    const content = buffer.toString('binary');
    
    // Look for XML content between tags
    const xmlMatches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    
    if (xmlMatches) {
      const extractedText = xmlMatches
        .map(match => {
          // Extract text content from w:t tags
          const textMatch = match.match(/<w:t[^>]*>(.*?)<\/w:t>/);
          return textMatch ? textMatch[1] : '';
        })
        .filter(text => text.trim().length > 0)
        .join(' ');
      
      if (extractedText.trim().length > 0) {
        return `Document: ${fileName}\n\nExtracted Content:\n${extractedText}`;
      }
    }
    
    // Fallback: simple text extraction
    const simpleText = content.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    const meaningfulText = simpleText.length > 100 ? simpleText.substring(0, 2000) : '';
    
    if (meaningfulText) {
      return `Document: ${fileName}\n\nPartial Content:\n${meaningfulText}`;
    }
    
    return `Document: ${fileName}\n\nThis DOCX file was attached but text extraction was not successful. The document contains ${buffer.length} bytes of data. Please ask the user to provide the key content or specific information from this document.`;
    
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return `Document: ${fileName}\n\nThis DOCX file could not be processed for text extraction. Please ask the user to provide the text content or key information from this document.`;
  }
}

type AssistantUiMessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: any; argsText?: string }
  | { type: "tool-result"; toolCallId: string; result: any }
  | { type: "file-attachment"; fileId: string; fileName: string; filePath: string; fileData?: string; mimeType?: string };

type AssistantUiMessage = {
  role: "system" | "user" | "assistant";
  content: AssistantUiMessagePart[];
};

const webSearch: any = tool(
  async (input: { query: string }) => {
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    try {
      const mod: any = await import("duck-duck-scrape");
      const search = mod.search || mod.default?.search || mod;
      const ddg: any = await search(input.query, { maxResults: 8 });
      const items: any[] = Array.isArray(ddg?.results) ? ddg.results : Array.isArray(ddg) ? ddg : [];
      for (const r of items) {
        const url = r.url || r.link || r.href;
        const title = r.title || r.name || r.text || "Result";
        const snippet = r.description || r.snippet || r.text || "";
        if (url && title) {
          results.push({ title, url, snippet });
        }
        if (results.length >= 5) break;
      }
    } catch {}

    if (results.length === 0) {
      const url = `https://duckduckgo.com/?q=${encodeURIComponent(input.query)}`;
      results.push({
        title: `Search Results for "${input.query}"`,
        url,
        snippet: `Click to view search results for "${input.query}" on DuckDuckGo.`,
      });
    }

    return JSON.stringify({ results, query: input.query });
  },
  {
    name: "web_search",
    description: "Search the web for real-time information.",
    schema: z.object({ query: z.string() }),
  } as any
);

const anthropicModel = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  apiKey: "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",
  temperature: 0.2,
});

const tools = [webSearch];
const modelWithTools = anthropicModel.bindTools(tools as any);

function toLangChainMessages(messages: AssistantUiMessage[]): any[] {
  const lc: any[] = [];

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
            // console.log(`📎 Processing attachment: ${fa.fileName}, Original MIME: ${fa.mimeType}`);
            
            // Normalize MIME type for Anthropic compatibility
            let anthropicMimeType = fa.mimeType;
            const fileExtension = fa.fileName?.split('.').pop()?.toLowerCase();
            // console.log(`🔍 File extension: ${fileExtension}`);
            
            // Handle generic octet-stream based on file extension
            if (fa.mimeType === 'application/octet-stream' && fa.fileName) {
              const ext = fa.fileName.split('.').pop()?.toLowerCase();
              const mimeMap: Record<string, string> = {
                // Documents
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'rtf': 'application/rtf',
                
                // Text formats
                'txt': 'text/plain',
                'csv': 'text/csv',
                'html': 'text/html',
                'htm': 'text/html',
                'xml': 'application/xml',
                'md': 'text/markdown',
                'markdown': 'text/markdown',
                'json': 'application/json',
                'yaml': 'text/yaml',
                'yml': 'text/yaml',
                
                // Images
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'webp': 'image/webp',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'svg': 'image/svg+xml',
                
                // Code files (as text for processing)
                'js': 'text/javascript',
                'ts': 'text/typescript',
                'py': 'text/x-python',
                'java': 'text/x-java-source',
                'cpp': 'text/x-c++src',
                'c': 'text/x-csrc',
                'h': 'text/x-chdr',
                'css': 'text/css',
                'php': 'text/x-php',
                'rb': 'text/x-ruby',
                
                // Canvas files
                'tldraw': 'application/json',
                'go': 'text/x-go',
                'rs': 'text/x-rust',
                'sql': 'text/x-sql',
                'sh': 'text/x-shellscript'
              };
              anthropicMimeType = mimeMap[ext || ''] || fa.mimeType;
            }
            
            // Anthropic-supported MIME types (more restrictive than we thought)
            const supportedTypes = [
              // Documents (only PDF supported for document type)
              'application/pdf',
              
              // Text formats (all treated as text/plain for document processing)
              'text/plain',
              'text/csv',
              'text/html',
              'text/markdown',
              'application/xml',
              'application/json',
              'text/yaml',
              
              // Images
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'image/bmp',
              'image/tiff',
              'image/svg+xml',
              
              // Code/Programming files (treated as text)
              'text/javascript',
              'text/typescript',
              'text/x-python',
              'text/x-java-source',
              'text/x-c++src',
              'text/x-csrc',
              'text/x-chdr',
              'text/css',
              'text/x-php',
              'text/x-ruby',
              'text/x-go',
              'text/x-rust',
              'text/x-sql',
              'text/x-shellscript'
            ];
            
            // Special handling for Office documents - convert to text/plain
            const officeDocumentTypes = [
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'application/rtf'
            ];
            
            if (officeDocumentTypes.includes(anthropicMimeType)) {
              // console.log(`📄 Office document detected: ${anthropicMimeType} → converting to text/plain for Anthropic compatibility`);
              anthropicMimeType = 'text/plain';
              
              // Convert office document to text representation
              try {
                if (fa.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                  // For DOCX files, extract text content
                  const binaryData = Buffer.from(fa.fileData, 'base64');
                  const extractedText = extractTextFromDocx(binaryData, fa.fileName);
                  fa.fileData = Buffer.from(extractedText, 'utf8').toString('base64');
                  // console.log(`📝 Extracted text from DOCX: ${extractedText.length} characters`);
                } else {
                  // For other office documents, send descriptive message
                  const fileInfo = `This is a ${fa.fileName} file (${fa.mimeType}). The file has been attached as a ${fa.mimeType} document. Please note that text extraction is not available for this format - only PDF and DOCX files can be fully processed. You may ask the user to provide key information from this document.`;
                  fa.fileData = Buffer.from(fileInfo, 'utf8').toString('base64');
                  // console.log(`📝 Converted office document to descriptive text for Anthropic`);
                }
              } catch (error) {
                console.error(`❌ Error processing office document:`, error);
                const fallbackInfo = `This is a ${fa.fileName} file (${fa.mimeType}) that could not be processed. Please ask the user to provide the text content or key information from this document.`;
                fa.fileData = Buffer.from(fallbackInfo, 'utf8').toString('base64');
              }
            }
            
            if (!supportedTypes.includes(anthropicMimeType)) {
              console.warn(`⚠️ Unsupported MIME type for Anthropic: ${anthropicMimeType}`);
              // Only fallback to text/plain for non-image types
              if (!anthropicMimeType.startsWith('image/')) {
                console.warn(`📄 Falling back to text/plain for non-image type`);
                anthropicMimeType = 'text/plain';
              } else {
                console.warn(`🖼️ Keeping image MIME type even if not in supported list`);
              }
            }
            
            // console.log(`🔄 Normalized MIME type: ${anthropicMimeType}`);
            
            // Use different content types based on MIME type
            if (anthropicMimeType.startsWith('image/')) {
              // Images use the image content type
              anthropicContent.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: anthropicMimeType,
                  data: fa.fileData
                }
              });
              // console.log(`🖼️ Added as image attachment`);
            } else if (anthropicMimeType === 'application/pdf') {
              // Only PDFs can use document content type
              anthropicContent.push({
                type: "document",
                source: {
                  type: "base64",
                  media_type: anthropicMimeType,
                  data: fa.fileData
                }
              });
              // console.log(`📄 Added as PDF document attachment`);
            } else {
              // All other files (including converted DOCX) are sent as text content
              const textContent = Buffer.from(fa.fileData, 'base64').toString('utf8');
              anthropicContent.push({
                type: "text",
                text: textContent
              });
              // console.log(`📝 Added as text content (${textContent.length} characters)`);
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
      const textParts = msg.content.filter((p) => p.type === "text") as Array<{ type: "text"; text: string }>;
      const toolCalls = msg.content.filter((p) => p.type === "tool-call") as Array<{ type: "tool-call"; toolCallId: string; toolName: string; args: any }>;
      const toolResults = msg.content.filter((p) => p.type === "tool-result") as Array<{ type: "tool-result"; toolCallId: string; result: any }>;

      if (textParts.length > 0 || toolCalls.length > 0) {
        lc.push(
          new AIMessage({
            content: textParts.map((p) => p.text).join("\n\n"),
            tool_calls: toolCalls.map((c) => ({ name: c.toolName, args: c.args, id: c.toolCallId })),
          })
        );
      }

      for (const tr of toolResults) {
        lc.push(new ToolMessage({ content: typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result), tool_call_id: tr.toolCallId }));
      }
    }
  }

  return lc;
}

const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer clearly. Do not repeat the user's message verbatim. When tools return web search results, synthesize a concise summary in 3-5 bullet points and cite the top sources with their titles and URLs. Prefer specific articles over generic search pages. If results are too generic, try refining queries (add site names, time windows, or entity names) rather than apologizing.";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = req.body as { messages: any[] };
    // Normalize: fold message.attachments into content as file-attachment parts
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

        // Debug: Log normalized messages to see what we're working with
    // console.log('🔍 Normalized messages:', JSON.stringify(normalizedMessages, null, 2));
    
    // Pre-download files from S3 and prepare them as base64 attachments for Anthropic
    const token = req.headers.authorization?.replace('Bearer ', '');
    // console.log('🔑 Auth token present:', !!token);
    const messagesWithFileData: AssistantUiMessage[] = await (async () => {
      if (!Array.isArray(normalizedMessages)) return normalizedMessages;
      const out: AssistantUiMessage[] = [];
      for (const m of normalizedMessages) {
        const parts = Array.isArray(m?.content) ? [...m.content] : [];
        for (let i = 0; i < parts.length; i++) {
          const p: any = parts[i];
          if (p?.type === 'file-attachment' && p?.fileId) {
            if (p?.fileData) {
              // console.log(`✅ File already downloaded on frontend: ${p.fileName} (${p.fileData.length} chars)`);
            } else if (token) {
              // console.log(`🔄 Attempting to download file: ${p.fileName} (ID: ${p.fileId})`);
              try {
                // Use the same download endpoint as the frontend file viewers
                const apiUrl = 'http://www.api.dev.banbury.io';
                const downloadUrl = `${apiUrl}/files/download_s3_file/${encodeURIComponent(p.fileId)}/`;
                // console.log(`📡 Download URL: ${downloadUrl}`);
                
                const resp = await fetch(downloadUrl, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                
                // console.log(`📥 Download response status: ${resp.status} ${resp.statusText}`);
                
                if (resp.ok) {
                  const arrayBuffer = await resp.arrayBuffer();
                  const contentType = resp.headers.get('content-type') || 'application/octet-stream';
                  
                  // console.log(`✅ File downloaded successfully: ${arrayBuffer.byteLength} bytes, type: ${contentType}`);

                  // Convert to base64 for Anthropic attachment
                  const base64Data = Buffer.from(arrayBuffer).toString('base64');
                  parts[i] = {
                    ...p,
                    fileData: base64Data,
                    mimeType: contentType
                  } as any;
                  
                  // console.log(`🔒 File converted to base64: ${base64Data.length} characters`);
                } else {
                  console.error(`❌ Failed to download file: ${resp.status} ${resp.statusText}`);
                  const errorText = await resp.text();
                  console.error(`❌ Error response: ${errorText}`);
                }
              } catch (error) {
                console.error(`💥 Exception downloading file:`, error);
                // If download fails, skip this attachment
                parts.splice(i, 1);
                i--; // Adjust index since we removed an item
              }
            }
          }
        }
        out.push({ ...m, content: parts } as AssistantUiMessage);
      }
      return out;
    })();

    const lcMessages = toLangChainMessages(messagesWithFileData);
    const lastUser = [...lcMessages].reverse().find((m: any) => m._getType && m._getType() === "human") as any;

    // Iterative tool loop (max 5 steps)
    const parts: AssistantUiMessagePart[] = [];
    const messages: any[] = [new SystemMessage(SYSTEM_PROMPT), ...lcMessages];
    const maxSteps = 5;
    const summaryLines: string[] = [];

    for (let step = 0; step < maxSteps; step++) {
      const ai: any = await modelWithTools.invoke(messages);
      const toolCalls = (ai?.tool_calls || ai?.additional_kwargs?.tool_calls) || [];

      if (!toolCalls.length) {
        let finalText = typeof ai.content === "string"
          ? ai.content
          : Array.isArray(ai.content)
            ? ai.content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("\n\n")
            : "";

        const lastUserText = typeof lastUser?.content === "string" ? lastUser.content : Array.isArray(lastUser?.content) ? lastUser?.content?.join("\n\n") : "";
        if (finalText && lastUserText && finalText.trim() === lastUserText.trim()) {
          const ai2 = await anthropicModel.invoke([new SystemMessage(SYSTEM_PROMPT + " Never repeat the user's message verbatim; produce a helpful answer."), ...lcMessages]);
          const text2 = typeof (ai2 as any).content === "string"
            ? (ai2 as any).content
            : Array.isArray((ai2 as any).content)
              ? (ai2 as any).content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("\n\n")
              : "";
          if (text2 && text2.trim() !== lastUserText.trim()) {
            finalText = text2;
          } else {
            finalText = "I understand. How can I help further? Provide more context or a specific goal, and I’ll get started.";
          }
        }

        if (finalText) parts.push({ type: "text", text: finalText });
        break;
      }

      // Run tools, append tool-call parts with results, and continue loop
      const toolMessages: any[] = [];
      for (const tc of toolCalls) {
        if (tc.name === "web_search") {
          const toolResult = await webSearch.invoke(tc.args);
          toolMessages.push(new ToolMessage({ content: toolResult, tool_call_id: tc.id }));
          parts.push({
            type: "tool-call",
            toolCallId: tc.id,
            toolName: tc.name,
            args: tc.args,
            argsText: JSON.stringify(tc.args, null, 2),
            result: toolResult,
          } as any);

          // Collect lines for final summarization
          try {
            const parsed = JSON.parse(typeof toolResult === "string" ? toolResult : String(toolResult));
            const query = parsed?.query;
            const results = Array.isArray(parsed?.results) ? parsed.results : [];
            for (const r of results) {
              if (r?.title && r?.url) {
                summaryLines.push(`- ${r.title} (${r.url})${r?.snippet ? ` — ${r.snippet}` : ""}`);
              }
            }
            if (query && results.length === 0) {
              summaryLines.push(`- No direct articles found for "${query}"; consider opening the search page.`);
            }
          } catch {
            /* ignore parse failure */
          }
        } else {
          parts.push({ type: "tool-call", toolCallId: tc.id, toolName: tc.name, args: tc.args, argsText: JSON.stringify(tc.args, null, 2) } as any);
        }
      }

      messages.push(ai as any, ...toolMessages);
    }

    // If we never produced a final text, synthesize one from collected tool results
    const hasFinalText = parts.some((p) => p.type === "text");
    if (!hasFinalText) {
      const lastUserText = typeof lastUser?.content === "string" ? lastUser.content : Array.isArray(lastUser?.content) ? lastUser?.content?.join("\n\n") : "";
      const prompt = summaryLines.length
        ? `Summarize the latest based on these sources in 3-5 concise bullets with short citations:\n${summaryLines.join("\n")}\n\nQuestion: ${lastUserText}`
        : `Provide a short, helpful answer to the user's question: ${lastUserText}`;

      const aiFinal: any = await anthropicModel.invoke([new SystemMessage(SYSTEM_PROMPT), new HumanMessage(prompt)]);
      const finalText = typeof aiFinal.content === "string"
        ? aiFinal.content
        : Array.isArray(aiFinal.content)
          ? aiFinal.content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("\n\n")
          : "";
      if (finalText) parts.push({ type: "text", text: finalText });
    }

    res.status(200).json({ content: parts, status: { type: "complete", reason: "stop" } });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}


