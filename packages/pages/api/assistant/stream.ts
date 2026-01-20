import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

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


function isGoogleImageModel(model: string): boolean {
  return model.startsWith('gemini') || model === 'gemini-2.5-flash-image';
}

async function generateImageWithGoogle(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Google API error: ${err || response.statusText}`);
  }

  const data = await response.json() as any;
  
  const candidate = data.candidates?.[0];
  const content = candidate?.content;
  const parts = content?.parts || [];
  
  const imagePart = parts.find((part: any) => part.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error('No image returned by Google API');
  }

  return imagePart.inlineData.data;
}

async function generateImageWithOpenAI(prompt: string, model: string, size: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const resp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, prompt, n: 1, size, response_format: 'b64_json' }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI API error: ${text || resp.statusText}`);
  }

  const data: any = await resp.json();
  const b64 = data?.data?.[0]?.b64_json as string | undefined;
  if (!b64) {
    throw new Error('No image returned by OpenAI API');
  }

  return b64;
}

const generateImage: any = tool(
  async (input: { prompt: string; size?: '256x256' | '512x512' | '1024x1024'; folder?: string; fileBaseName?: string }, runtime?: any) => {
    try {
      const prompt = (input?.prompt || '').toString().trim();
      if (!prompt) return JSON.stringify({ ok: false, error: 'Missing prompt' });
      const size = input?.size || '1024x1024';
      const folder = (input?.folder || 'images').replace(/^\/+|\/+$/g, '');
      const baseName = (input?.fileBaseName || 'Generated Image').toString().trim();

      const toolPreferences = (runtime as any)?.req?.body?.toolPreferences || {};
      const imageModel = toolPreferences.image_generation_model || 'dall-e-3';

      let b64: string;
      if (isGoogleImageModel(imageModel)) {
        b64 = await generateImageWithGoogle(prompt, imageModel);
      } else {
        b64 = await generateImageWithOpenAI(prompt, imageModel, size);
      }

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

      const result = {
        ok: true,
        file_info: {
          file_name: fileName,
          file_path: filePath,
          folder,
          size_bytes: buffer.length,
        },
        provider: isGoogleImageModel(imageModel) ? 'google' : 'openai',
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


type ModelProvider = "anthropic" | "openai" | "google";

function getDefaultModelForProvider(provider: ModelProvider): string {
  if (provider === "openai") return "gpt-4o-mini";
  if (provider === "google") return "gemini-2.0-flash-exp";
  return "claude-sonnet-4-20250514";
}

function createChatModel(provider: ModelProvider, modelId?: string) {
  let actualModelId = modelId || getDefaultModelForProvider(provider)
  
  // Map deprecated or unsupported Google model names to supported ones
  if (provider === "google") {
    const modelMappings: Record<string, string> = {
      "gemini-pro": "gemini-2.0-flash-exp", // Map deprecated gemini-pro to gemini-2.0-flash-exp
      "gemini-1.5-pro": "gemini-2.0-flash-exp", // Map gemini-1.5-pro to gemini-2.0-flash-exp (not available in v1beta)
      "gemini-1.5-flash": "gemini-2.0-flash-exp", // Map gemini-1.5-flash to gemini-2.0-flash-exp (not available in v1beta)
    }
    actualModelId = modelMappings[actualModelId] || actualModelId
  }
  
  if (provider === "openai") {
    return new ChatOpenAI({
      model: actualModelId,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    });
  }

  if (provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: actualModelId,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.2,
    });
  }

  return new ChatAnthropic({
    model: actualModelId,
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.2,
    invocationKwargs: { top_p: undefined }, // Override to prevent -1 being sent to newer models
  });
}

function resolveModelProvider(provider?: string): ModelProvider {
  if (provider === "openai") return "openai";
  if (provider === "google") return "google";
  return "anthropic";
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
      
      // Create provider-compatible message with attachments
      if (fileAttachments.length > 0) {
        if (provider === "anthropic" || provider === "google") {
        const multimodalContent: any[] = [];
        
        // Add text content first
        if (userContent) {
          multimodalContent.push({ type: "text", text: userContent });
        }
        
        // Add file attachments in provider-compatible format
        for (const fa of fileAttachments) {
          if (fa.fileData && fa.mimeType) {
            
            // Normalize MIME type for provider compatibility
            let mimeType = fa.mimeType;
            const fileExtension = fa.fileName?.split('.').pop()?.toLowerCase();
            
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
              mimeType = mimeMap[ext || ''] || fa.mimeType;
            }
            
            // Supported MIME types for multimodal providers
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
            
            if (officeDocumentTypes.includes(mimeType)) {
              try {
                const buffer = Buffer.from(fa.fileData, 'base64');
                mimeType = 'text/plain';
                const textContent = extractTextFromDocx(buffer, fa.fileName);
                multimodalContent.push({
                  type: "text",
                  text: textContent
                });
                continue;
              } catch (error) {
                mimeType = 'application/octet-stream';
              }
            }
            
            if (!supportedTypes.includes(mimeType) && mimeType !== 'application/pdf') {
              try {
                const buffer = Buffer.from(fa.fileData, 'base64');
                const textContent = buffer.toString('utf8');
                mimeType = 'text/plain';
                multimodalContent.push({
                  type: "text",
                  text: textContent
                });
                continue;
              } catch (error) {
                console.error(`⚠️ Failed to convert unsupported attachment to text:`, error);
              }
            }
            
            // Choose the correct attachment type for multimodal providers
            if (mimeType.startsWith('image/')) {
              multimodalContent.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: fa.fileData
                }
              });
            } else if (mimeType === 'application/pdf') {
              // PDFs can use document content type
              multimodalContent.push({
                type: "document",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: fa.fileData
                }
              });
            } else {
              // All other files (including converted DOCX) are sent as text content
              const textContent = Buffer.from(fa.fileData, 'base64').toString('utf8');
              multimodalContent.push({
                type: "text",
                text: textContent
              });
            }
          }
        }
        
        lc.push(new HumanMessage({ content: multimodalContent }));
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
            } else if (token) {
              try {
                const apiUrl = 'https://www.api.dev.banbury.io';
                const downloadUrl = `${apiUrl}/files/download_s3_file/${encodeURIComponent(p.fileId)}/`;
                
                const resp = await fetch(downloadUrl, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                
                if (resp.ok) {
                  const arrayBuffer = await resp.arrayBuffer();
                  const contentType = resp.headers.get('content-type') || 'application/octet-stream';
                  
                  const base64Data = Buffer.from(arrayBuffer).toString('base64');
                  parts[i] = { 
                    ...p, 
                    fileData: base64Data,
                    mimeType: contentType 
                  } as any;
                } else {
                  console.error(`❌ Failed to download file: ${resp.status} ${resp.statusText}`);
                  const errorText = await resp.text();
                  console.error(`❌ Error response: ${errorText}`);
                }
              } catch (error) {
                console.error(`💥 Exception downloading file:`, error);
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

    const readFile: any = tool(
      async (input: { fileId: string; fileName: string; filePath: string }) => {
        try {
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
    const model = createChatModel(prefs.model_provider, prefs.model_id);
    const modelWithTools = model.bindTools(enabledTools.map((t: any) => ({
      ...t,
      // @ts-ignore pass through req for tools that need it
      call: (args: any) => (t as any).invoke(args, { req }),
    })) as any);

    send({ type: "message-start", role: "assistant" });

    const maxSteps = 100;
    for (let step = 0; step < maxSteps; step++) {
      const ai: any = await modelWithTools.invoke(messages);
      const toolCalls = (ai?.tool_calls || ai?.additional_kwargs?.tool_calls) || [];
      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
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

      messages.push(ai as AIMessage, ...toolMsgs);
    }

    send({ type: "message-end", status: { type: "complete", reason: "stop" } });
    send({ type: "done" });
    res.end();
    res.end();
  } catch (e: any) {
    let errorMessage = e?.message || "unknown error";
    
    if (typeof e?.message === 'string' && e.message.includes('image exceeds 5 MB maximum')) {
      try {
        const match = e.message.match(/"message":"([^"]+)"/);
        if (match && match[1]) {
          errorMessage = match[1].replace(/\\"/g, '"');
        }
      } catch (parseError) {
        errorMessage = "File size exceeds 5 MB maximum limit";
      }
    } else if (typeof e?.message === 'string' && e.message.includes('400')) {
      try {
        const errorMatch = e.message.match(/"error":\s*{[^}]*"message":"([^"]+)"/);
        if (errorMatch && errorMatch[1]) {
          errorMessage = errorMatch[1].replace(/\\"/g, '"');
        }
      } catch (parseError) {
      }
    }

    send({ type: "error", error: errorMessage });
    res.end();
  }
}


