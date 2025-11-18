import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
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
  | { type: "tool-call"; toolCallId: string; toolName: string; args: any; argsText?: string; result?: any }
  | { type: "file-attachment"; fileId: string; fileName: string; filePath: string; fileData?: string; mimeType?: string };

type AssistantUiMessage = {
  role: "system" | "user" | "assistant";
  content: AssistantUiMessagePart[];
};

const tiptapAI: any = tool(
  async (input: { action: string; content: string; selection?: { from: number; to: number; text: string }; targetText?: string; actionType: string; language?: string }) => {
    // This tool formats AI-generated content for Tiptap editor integration
    return {
      action: input.action,
      content: input.content,
      selection: input.selection,
      targetText: input.targetText,
      actionType: input.actionType,
      language: input.language
    };
  },
  {
    name: "tiptap_ai",
    description: "Use this tool to deliver AI-generated content that should be applied to the Tiptap document editor. This tool formats responses for direct integration with the editor.",
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Rewrite', 'Grammar correction', 'Translation')"),
      content: z.string().describe("The AI-generated HTML content to be applied to the editor"),
      selection: z.object({
        from: z.number(),
        to: z.number(),
        text: z.string()
      }).optional().describe("The original text selection that was modified"),
      targetText: z.string().optional().describe("The original text that was being modified"),
      actionType: z.enum(['rewrite', 'correct', 'expand', 'translate', 'summarize', 'outline', 'insert']).describe("The type of action performed"),
      language: z.string().optional().describe("Target language for translation actions")
    }) as any
  }
) as any;

const webSearch: any = tool(
  async (input: { query: string }) => {
    type Result = { title: string; url: string; snippet: string };

    const normalizeUrl = (raw: string | undefined): string | null => {
      if (!raw) return null;
      try {
        const u = new URL(raw);
        return u.toString();
      } catch {
        return null;
      }
    };

    const fetchWithTimeout = async (url: string, ms: number): Promise<string | null> => {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), ms);
      try {
        const resp = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Mozilla/5.0" } });
        if (!resp.ok) return null;
        const text = await resp.text();
        return text || null;
      } catch {
        return null;
      } finally {
        clearTimeout(to);
      }
    };

    const extractMeta = (html: string, name: string): string | null => {
      const rx = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
      const m = html.match(rx);
      return m?.[1] || null;
    };

    const extractTitle = (html: string): string | null => {
      const og = extractMeta(html, "og:title");
      if (og) return og;
      const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return m?.[1] || null;
    };

    const extractDescription = (html: string): string | null => {
      const ogd = extractMeta(html, "og:description") || extractMeta(html, "twitter:description") || extractMeta(html, "description");
      if (ogd) return ogd;
      const p = html.match(/<p[^>]*>(.*?)<\/p>/i);
      if (p?.[1]) return p[1].replace(/<[^>]+>/g, "").trim();
      return null;
    };

    // Prefer Tavily if available for high-quality, content-rich results
    const results: Result[] = [];
    const tavilyKey = process.env.TAVILY_API_KEY || "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";
    if (tavilyKey) {
      try {
        const tavilyResp = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${tavilyKey}` },
          body: JSON.stringify({
            query: input.query,
            search_depth: "advanced",
            include_answer: true,
            include_raw_content: true,
            max_results: 6,
          }),
        });
        if (tavilyResp.ok) {
          const data: any = await tavilyResp.json();
          const items: any[] = Array.isArray(data?.results) ? data.results : [];
          for (const r of items) {
            const url = normalizeUrl(r?.url);
            const title = (r?.title || "Result").toString();
            const snippet = (r?.content || r?.raw_content || "").toString().slice(0, 500);
            if (url) results.push({ title, url, snippet });
            if (results.length >= 5) break;
          }
        }
      } catch {}
    }

    // Fallback to DuckDuckGo + enrichment if Tavily is unavailable or returned nothing
    if (results.length === 0) {
      try {
        const mod: any = await import("duck-duck-scrape");
        const search = mod.search || mod.default?.search || mod;
        const ddg: any = await search(input.query, { maxResults: 8 });
        const items: any[] = Array.isArray(ddg?.results) ? ddg.results : Array.isArray(ddg) ? ddg : [];
        for (const r of items) {
          const url = normalizeUrl(r.url || r.link || r.href);
          if (!url) continue;
          const title = (r.title || r.name || r.text || "Result").toString();
          const snippet = (r.description || r.snippet || r.text || "").toString();
          results.push({ title, url, snippet });
          if (results.length >= 5) break;
        }
      } catch {}
    }

    // Enrich results by fetching page content
    const enrichPromises = results.map(async (r) => {
      const html = await fetchWithTimeout(r.url, 4500);
      if (!html) return r;
      const title = extractTitle(html) || r.title;
      const desc = extractDescription(html) || r.snippet || "";
      return { title, url: r.url, snippet: desc } as Result;
    });
    const enrichedSettled = await Promise.allSettled(enrichPromises);
    const enriched = enrichedSettled
      .map((p) => (p.status === "fulfilled" ? p.value : null))
      .filter((x): x is Result => !!x);

    if (enriched.length === 0) {
      const fallbackUrl = `https://duckduckgo.com/?q=${encodeURIComponent(input.query)}`;
      return JSON.stringify({
        results: [
          { title: `Search Results for "${input.query}"`, url: fallbackUrl, snippet: `Click to view search results for "${input.query}" on DuckDuckGo.` },
        ],
        query: input.query,
      });
    }

    return JSON.stringify({ results: enriched, query: input.query });
  },
  { name: "web_search", description: "Search the web and read page content for summaries", schema: z.object({ query: z.string() }) } as any
);


// Image generation tool: lets the model generate images and upload them to S3
const generateImage: any = tool(
  async (input: { prompt: string; size?: '256x256' | '512x512' | '1024x1024'; folder?: string; fileBaseName?: string }, runtime?: any) => {
    const openaiKey = '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';
    if (!openaiKey) {
      return JSON.stringify({ ok: false, error: 'OPENAI_API_KEY not configured' });
    }

    try {
      const prompt = (input?.prompt || '').toString().trim();
      if (!prompt) return JSON.stringify({ ok: false, error: 'Missing prompt' });
      const size = input?.size || '1024x1024';
      const folder = (input?.folder || 'images').replace(/^\/+|\/+$/g, '');
      const baseName = (input?.fileBaseName || 'Generated Image').toString().trim();

      // 1) Call OpenAI images API
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, response_format: 'b64_json' }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        return JSON.stringify({ ok: false, error: `Provider error: ${text || resp.statusText}` });
      }

      const data: any = await resp.json();
      const b64 = data?.data?.[0]?.b64_json as string | undefined;
      if (!b64) return JSON.stringify({ ok: false, error: 'No image returned by provider' });

      // 2) Upload to S3 via backend API using the user's token
      // Token from original request headers
      const token = (runtime as any)?.req?.headers?.authorization?.replace('Bearer ', '') || '';
      if (!token) return JSON.stringify({ ok: false, error: 'Missing auth token for upload' });

      const apiBase = process.env.API_BASE_URL || 'https://www.api.dev.banbury.io';

      const buffer = Buffer.from(b64, 'base64');
      const blob = new Blob([buffer], { type: 'image/png' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${baseName} ${timestamp}.png`;
      const filePath = `${folder}/${fileName}`;

      const form = new FormData();
      form.append('file', blob, fileName);
      form.append('device_name', 'web-editor');
      form.append('file_path', filePath);
      form.append('file_parent', folder);

      const uploadResp = await fetch(`${apiBase}/files/upload_to_s3/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: form as any,
      });

      if (!uploadResp.ok) {
        const text = await uploadResp.text().catch(() => '');
        return JSON.stringify({ ok: false, error: `Upload failed: ${text || uploadResp.statusText}` });
      }

      const uploaded: any = await uploadResp.json();

      // Normalize a compact file_info for the UI to act on
      const result = {
        ok: true,
        file_info: {
          file_name: fileName,
          file_path: filePath,
          folder,
          size_bytes: buffer.length,
        },
        provider: 'openai',
        size,
      };

      return JSON.stringify(result);
    } catch (err: any) {
      return JSON.stringify({ ok: false, error: err?.message || 'Failed to generate image' });
    }
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a prompt and save it to cloud storage. Use when user asks to create or generate an image.',
    schema: z.object({
      prompt: z.string().describe('Image description prompt'),
      size: z.enum(['256x256', '512x512', '1024x1024']).optional(),
      folder: z.string().optional().describe('Target folder, default images'),
      fileBaseName: z.string().optional().describe('Base filename, default "Generated Image"'),
    }) as any
  }
) as any;


type ModelProvider = "anthropic" | "openai";

function getDefaultModelForProvider(provider: ModelProvider): string {
  return provider === "openai" ? "gpt-4o-mini" : "claude-sonnet-4-20250514"
}

function createChatModel(provider: ModelProvider, modelId?: string) {
  const actualModelId = modelId || getDefaultModelForProvider(provider)
  
  if (provider === "openai") {
    return new ChatOpenAI({
      model: actualModelId,
      apiKey: process.env.OPENAI_API_KEY || "sk-proj-ntgCoxcey7c4DJvLWiJouAnoYeemQMBAufuC7wnLJBkbZYpGOe6hiiMur0OP7jBCQ7TaoE-gheT3BlbkFJExrPcUxXXu-kvuFlxkqb8UyYV5KAQQHmVv6RcGxYDglV0T3HLIYGWOmzCJTVtN2ohiQmSHoAA",
      temperature: 0.2,
    });
  }

  return new ChatAnthropic({
    model: actualModelId,
    apiKey: process.env.ANTHROPIC_API_KEY || "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",
    temperature: 0.2,
  });
}

function resolveModelProvider(provider?: string): ModelProvider {
  return provider === "openai" ? "openai" : "anthropic";
}

function toLangChainMessages(messages: AssistantUiMessage[], provider: ModelProvider): any[] {
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
        if (provider === "anthropic") {
        const anthropicContent: any[] = [];
        
        // Add text content first
        if (userContent) {
          anthropicContent.push({ type: "text", text: userContent });
        }
        
        // Add file attachments in Anthropic format
        for (const fa of fileAttachments) {
          if (fa.fileData && fa.mimeType) {
            console.log(`📎 Processing attachment: ${fa.fileName}, Original MIME: ${fa.mimeType}`);
            
            // Normalize MIME type for Anthropic compatibility
            let anthropicMimeType = fa.mimeType;
            const fileExtension = fa.fileName?.split('.').pop()?.toLowerCase();
            console.log(`🔍 File extension: ${fileExtension}`);
            
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
              console.log(`📄 Converting ${fa.fileName} to plain text for Anthropic compatibility`);
              try {
                const buffer = Buffer.from(fa.fileData, 'base64');
                anthropicMimeType = 'text/plain';
                const textContent = extractTextFromDocx(buffer, fa.fileName);
                anthropicContent.push({
                  type: "text",
                  text: textContent
                });
                console.log(`✅ Added converted text content (${textContent.length} characters)`);
                continue;
              } catch (error) {
                console.error(`⚠️ Failed to convert ${fa.fileName}, falling back to base64 attachment:`, error);
                anthropicMimeType = 'application/octet-stream';
              }
            }
            
            if (!supportedTypes.includes(anthropicMimeType) && anthropicMimeType !== 'application/pdf') {
              console.warn(`⚠️ Unsupported MIME type for Anthropic attachments: ${anthropicMimeType}. Converting to plain text.`);
              try {
                const buffer = Buffer.from(fa.fileData, 'base64');
                const textContent = buffer.toString('utf8');
                anthropicMimeType = 'text/plain';
                anthropicContent.push({
                  type: "text",
                  text: textContent
                });
                console.log(`✅ Converted unsupported attachment to text (${textContent.length} characters)`);
                continue;
              } catch (error) {
                console.error(`⚠️ Failed to convert unsupported attachment to text:`, error);
              }
            }
            
            // Choose the correct attachment type for Anthropic
            if (anthropicMimeType.startsWith('image/')) {
              anthropicContent.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: anthropicMimeType,
                  data: fa.fileData
                }
              });
              console.log(`🖼️ Added as image attachment`);
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
              console.log(`📄 Added as PDF document attachment`);
            } else {
              // All other files (including converted DOCX) are sent as text content
              const textContent = Buffer.from(fa.fileData, 'base64').toString('utf8');
              anthropicContent.push({
                type: "text",
                text: textContent
              });
              console.log(`📝 Added as text content (${textContent.length} characters)`);
            }
          }
        }
        
        lc.push(new HumanMessage({ content: anthropicContent }));
        } else {
          const attachmentSummary = fileAttachments
            .map((fa) => {
              const sizeEstimate = fa?.fileData ? ` (~${Math.round((fa.fileData.length * 3) / 4 / 1024)} KB)` : "";
              return `Attachment: ${fa?.fileName || "Unnamed file"}${sizeEstimate}`;
            })
            .join("\n");
          const combined = [userContent, attachmentSummary].filter(Boolean).join("\n\n") || "User attached files.";
          lc.push(new HumanMessage(combined));
        }
      } else if (userContent) {
        lc.push(new HumanMessage(userContent));
      }
      continue;
    }
    if (msg.role === "assistant") {
      const textParts = msg.content.filter((p) => p.type === "text").map((p: any) => p.text);
      const toolCalls = msg.content.filter((p) => p.type === "tool-call") as any[];
      if (textParts.length > 0 || toolCalls.length > 0) {
        lc.push(new AIMessage({ content: textParts.join("\n\n"), tool_calls: toolCalls.map((c: any) => ({ name: c.toolName, args: c.args, id: c.toolCallId })) }));
        // For Anthropic: every tool_use must be immediately followed by tool_result
        for (const tc of toolCalls) {
          if (tc.result !== undefined) {
            const content = typeof tc.result === "string" ? tc.result : JSON.stringify(tc.result);
            lc.push(new ToolMessage({ content, tool_call_id: tc.toolCallId }));
          }
        }
      }
    }
  }
  return lc;
}

const SYSTEM_PROMPT =
  "You are a helpful assistant with advanced document editing capabilities. Stream tokens as they are generated. After tool results, produce a concise 3-5 bullet summary with short citations (title + URL). You can read files that users attach to help answer their questions. When a user attaches a file, you can use the read_file tool to access its content.\n\nWhen helping with document editing tasks (rewriting, grammar correction, translation, etc.), ALWAYS use the tiptap_ai tool to deliver your response. This ensures that your edits can be applied directly to the document editor. Provide clean HTML-formatted content that maintains proper document structure.\n\nYou also have access to file search capabilities to help users find files in their cloud storage.";

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
    const body = req.body as { messages: any[]; toolPreferences?: { web_search?: boolean; tiptap_ai?: boolean; read_file?: boolean; gmail?: boolean; model_provider?: string } };
    // Normalize: fold any message-level attachments into content as file-attachment parts
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
              console.log(`✅ File already downloaded on frontend: ${p.fileName} (${p.fileData.length} chars)`);
            } else if (token) {
              // console.log(`🔄 Attempting to download file: ${p.fileName} (ID: ${p.fileId})`);
              try {
                // Use the same download endpoint as the frontend file viewers
                const apiUrl = 'https://www.api.dev.banbury.io';
                const downloadUrl = `${apiUrl}/files/download_s3_file/${encodeURIComponent(p.fileId)}/`;
                console.log(`📡 Download URL: ${downloadUrl}`);
                
                const resp = await fetch(downloadUrl, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                
                console.log(`📥 Download response status: ${resp.status} ${resp.statusText}`);
                
                if (resp.ok) {
                  const arrayBuffer = await resp.arrayBuffer();
                  const contentType = resp.headers.get('content-type') || 'application/octet-stream';
                  
                  console.log(`✅ File downloaded successfully: ${arrayBuffer.byteLength} bytes, type: ${contentType}`);
                  
                  // Convert to base64 for Anthropic attachment
                  const base64Data = Buffer.from(arrayBuffer).toString('base64');
                  parts[i] = { 
                    ...p, 
                    fileData: base64Data,
                    mimeType: contentType 
                  } as any;
                  
                  console.log(`🔒 File converted to base64: ${base64Data.length} characters`);
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

    const providerRaw = (req.body as any)?.toolPreferences?.model_provider;
    const provider = resolveModelProvider(typeof providerRaw === "string" ? providerRaw : undefined);
    const incomingToolPrefs = ((body as any).toolPreferences ?? {}) as any;
    const lcMessages = toLangChainMessages(messagesWithFileData, provider);
    const prefs = {
      web_search: incomingToolPrefs.web_search !== false,
      tiptap_ai: incomingToolPrefs.tiptap_ai !== false,
      read_file: incomingToolPrefs.read_file !== false,
      gmail: incomingToolPrefs.gmail !== false,
      model_provider: provider,
    };
    const messages: any[] = [new SystemMessage(SYSTEM_PROMPT), ...lcMessages];

    // Create readFile tool with access to req
    const readFile: any = tool(
      async (input: { fileId: string; fileName: string; filePath: string }) => {
        try {
          // Get the file content from S3
          const token = req.headers.authorization?.replace('Bearer ', '');
          if (!token) {
            throw new Error('No authentication token provided');
          }

          const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/files/download/${input.fileId}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
          }

          const fileContent = await response.text();
          
          return JSON.stringify({
            fileName: input.fileName,
            filePath: input.filePath,
            content: fileContent,
            size: fileContent.length,
          });
        } catch (error) {
          return JSON.stringify({
            error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            fileName: input.fileName,
            filePath: input.filePath,
          });
        }
      },
      { name: "read_file", description: "Read the content of a file from S3 storage", schema: z.object({ 
        fileId: z.string(),
        fileName: z.string(),
        filePath: z.string()
      }) } as any
    );

    const enabledTools: any[] = [];
    if (prefs.web_search) enabledTools.push(webSearch);
    if (prefs.read_file) enabledTools.push(readFile);
    if (prefs.tiptap_ai) enabledTools.push(tiptapAI);
    enabledTools.push(generateImage);
    // Bind with access to req in tool runtime via custom wrapper
    const model = createChatModel(prefs.model_provider, prefs.model_id);
    const modelWithTools = model.bindTools(enabledTools.map((t: any) => ({
      ...t,
      // @ts-ignore pass through req for tools that need it
      call: (args: any) => (t as any).invoke(args, { req }),
    })) as any);

    // start assistant message
    send({ type: "message-start", role: "assistant" });

    // Agentic loop: request tools until done, then stream final answer
    const maxSteps = 100;
    for (let step = 0; step < maxSteps; step++) {
      const ai: any = await modelWithTools.invoke(messages);
      const toolCalls = (ai?.tool_calls || ai?.additional_kwargs?.tool_calls) || [];
      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        // No tools requested; emit the content from this assistant turn directly
        const textOut = typeof ai?.content === "string"
          ? ai.content
          : Array.isArray(ai?.content)
            ? ai.content.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("")
            : "";
        if (textOut) {
          send({ type: "text-delta", text: textOut });
        }
        send({ type: "message-end", status: { type: "complete", reason: "stop" } });
        send({ type: "done" });
        res.end();
        return;
      }

      // Execute requested tools and emit tool-call parts as they occur
      const toolMsgs: any[] = [];
      for (const tc of toolCalls) {
        if (tc.name === "web_search") {
          const toolResult = await webSearch.invoke(tc.args);
          send({
            type: "tool-call",
            part: {
              type: "tool-call",
              toolCallId: tc.id,
              toolName: tc.name,
              args: tc.args,
              argsText: JSON.stringify(tc.args, null, 2),
              result: toolResult,
            },
          });
          toolMsgs.push(new ToolMessage({ content: toolResult, tool_call_id: tc.id }));
        } else if (tc.name === "read_file") {
          const toolResult = await readFile.invoke(tc.args);
          send({
            type: "tool-call",
            part: {
              type: "tool-call",
              toolCallId: tc.id,
              toolName: tc.name,
              args: tc.args,
              argsText: JSON.stringify(tc.args, null, 2),
              result: toolResult,
            },
          });
          toolMsgs.push(new ToolMessage({ content: toolResult, tool_call_id: tc.id }));
        } else if (tc.name === "tiptap_ai") {
          const toolResult = await tiptapAI.invoke(tc.args);
          send({
            type: "tool-call",
            part: {
              type: "tool-call",
              toolCallId: tc.id,
              toolName: tc.name,
              args: tc.args,
              argsText: JSON.stringify(tc.args, null, 2),
              result: toolResult,
            },
          });
          toolMsgs.push(new ToolMessage({ content: JSON.stringify(toolResult), tool_call_id: tc.id }));
        } else if (tc.name === 'generate_image') {
          const toolResult = await generateImage.invoke(tc.args, { req });
          send({
            type: 'tool-call',
            part: {
              type: 'tool-call',
              toolCallId: tc.id,
              toolName: tc.name,
              args: tc.args,
              argsText: JSON.stringify(tc.args, null, 2),
              result: toolResult,
            },
          });
          toolMsgs.push(new ToolMessage({ content: toolResult, tool_call_id: tc.id }));
        } else {
          send({ type: "tool-call", part: { type: "tool-call", toolCallId: tc.id, toolName: tc.name, args: tc.args, argsText: JSON.stringify(tc.args, null, 2) } });
        }
      }

      // Add the AI planning turn and tool results to context for the next iteration
      messages.push(ai as AIMessage, ...toolMsgs);
    }

    // Safety: if loop exits without finalization, end gracefully
    send({ type: "message-end", status: { type: "complete", reason: "stop" } });
    send({ type: "done" });
    res.end();
    res.end();
  } catch (e: any) {
    // Parse the error to extract meaningful message for file size or other errors
    let errorMessage = e?.message || "unknown error";
    
    // Check if it's an Anthropic API error with structured error information
    if (typeof e?.message === 'string' && e.message.includes('image exceeds 5 MB maximum')) {
      // Extract the specific error message from the Anthropic response
      try {
        const match = e.message.match(/"message":"([^"]+)"/);
        if (match && match[1]) {
          errorMessage = match[1].replace(/\\"/g, '"');
        }
      } catch (parseError) {
        // Fallback to generic message if parsing fails
        errorMessage = "File size exceeds 5 MB maximum limit";
      }
    } else if (typeof e?.message === 'string' && e.message.includes('400')) {
      // Try to extract error from any 400 response
      try {
        const errorMatch = e.message.match(/"error":\s*{[^}]*"message":"([^"]+)"/);
        if (errorMatch && errorMatch[1]) {
          errorMessage = errorMatch[1].replace(/\\"/g, '"');
        }
      } catch (parseError) {
        // Keep original message if parsing fails
      }
    }

    send({ type: "error", error: errorMessage });
    res.end();
  }
}


