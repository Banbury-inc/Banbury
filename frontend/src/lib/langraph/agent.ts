import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";


import { CONFIG } from "../../config/config";
import { getServerContextValue } from "../serverContext";

import type { BaseMessage } from "@langchain/core/messages";

// Define our agent state
interface AgentState {
  messages: BaseMessage[];
  step: number;
  error?: string;
}

// Create tools following athena-intelligence patterns
const webSearchTool = tool(
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
  { 
    name: "web_search", 
    description: "Search the web and read page content for summaries", 
    schema: z.object({ query: z.string() }) 
  }
);

const tiptapAiTool = tool(
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
    })
  }
);

// Spreadsheet editing tool to apply AI-driven spreadsheet operations
const sheetAiTool = tool(
  async (input: {
    action: string;
    sheetName?: string;
    operations?: Array<
      | { type: 'setCell'; row: number; col: number; value: string | number }
      | { type: 'setRange'; range: { startRow: number; startCol: number; endRow: number; endCol: number }; values: (string | number)[][] }
      | { type: 'insertRows'; index: number; count?: number }
      | { type: 'deleteRows'; index: number; count?: number }
      | { type: 'insertCols'; index: number; count?: number }
      | { type: 'deleteCols'; index: number; count?: number }
    >;
    csvContent?: string;
    note?: string;
  }) => {
    // Return payload for the frontend spreadsheet editor to apply
    return {
      action: input.action,
      sheetName: input.sheetName,
      operations: input.operations || [],
      csvContent: input.csvContent,
      note: input.note,
    };
  },
  {
    name: 'sheet_ai',
    description:
      'Use this tool to deliver AI-generated spreadsheet edits. Provide either a list of operations (preferred) or full csvContent to replace the sheet.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Clean data', 'Normalize columns', 'Apply formula')"),
      sheetName: z.string().optional().describe('Optional sheet name for multi-sheet contexts'),
      operations: z
        .array(
          z.union([
            z.object({ type: z.literal('setCell'), row: z.number(), col: z.number(), value: z.union([z.string(), z.number()]) }),
            z.object({
              type: z.literal('setRange'),
              range: z.object({ startRow: z.number(), startCol: z.number(), endRow: z.number(), endCol: z.number() }),
              values: z.array(z.array(z.union([z.string(), z.number()]))),
            }),
            z.object({ type: z.literal('insertRows'), index: z.number(), count: z.number().optional() }),
            z.object({ type: z.literal('deleteRows'), index: z.number(), count: z.number().optional() }),
            z.object({ type: z.literal('insertCols'), index: z.number(), count: z.number().optional() }),
            z.object({ type: z.literal('deleteCols'), index: z.number(), count: z.number().optional() }),
          ])
        )
        .optional()
        .describe('List of spreadsheet operations to apply'),
      csvContent: z.string().optional().describe('Optional full CSV content to replace the current sheet'),
      note: z.string().optional().describe('Optional notes/instructions for the user'),
    }),
  }
);

// Memory management tools (simplified version since langmem isn't available in NPM)
const memoryStore = new Map<string, Array<{ content: string; timestamp: number; type: string }>>();

const createMemoryTool = tool(
  async (input: { content: string; type?: string; sessionId?: string }) => {
    const sessionId = input.sessionId || "default";
    const memory = {
      content: input.content,
      timestamp: Date.now(),
      type: input.type || "general"
    };
    
    if (!memoryStore.has(sessionId)) {
      memoryStore.set(sessionId, []);
    }
    
    const memories = memoryStore.get(sessionId)!;
    memories.push(memory);
    
    // Keep only last 50 memories per session
    if (memories.length > 50) {
      memories.splice(0, memories.length - 50);
    }
    
    return `Memory stored: ${input.content}`;
  },
  {
    name: "store_memory",
    description: "Store information in memory for future reference",
    schema: z.object({
      content: z.string().describe("The content to remember"),
      type: z.string().optional().describe("Type of memory (e.g., 'preference', 'fact', 'context')"),
      sessionId: z.string().optional().describe("Session ID for memory isolation")
    })
  }
);

const searchMemoryTool = tool(
  async (input: { query: string; sessionId?: string; limit?: number }) => {
    const sessionId = input.sessionId || "default";
    const memories = memoryStore.get(sessionId) || [];
    const limit = input.limit || 10;
    
    // Simple keyword search
    const queryLower = input.query.toLowerCase();
    const relevantMemories = memories
      .filter(memory => memory.content.toLowerCase().includes(queryLower))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    if (relevantMemories.length === 0) {
      return "No relevant memories found.";
    }
    
    return JSON.stringify({
      memories: relevantMemories.map(m => ({
        content: m.content,
        type: m.type,
        timestamp: new Date(m.timestamp).toISOString()
      })),
      count: relevantMemories.length
    });
  },
  {
    name: "search_memory",
    description: "Search stored memories for relevant information",
    schema: z.object({
      query: z.string().describe("Search query for memories"),
      sessionId: z.string().optional().describe("Session ID for memory isolation"),
      limit: z.number().optional().describe("Maximum number of memories to return")
    })
  }
);

// Initialize the Anthropic model
const anthropicModel = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  apiKey: process.env.ANTHROPIC_API_KEY || "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",
  temperature: 0.2,
});

// Create file tool (inline) to avoid module resolution issues
const createFileTool = tool(
  async (input: { fileName: string; filePath: string; content: string; contentType?: string }) => {
    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");

    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const lowerName = (input.fileName || input.filePath).toLowerCase();
    const ext = lowerName.includes('.') ? lowerName.split('.').pop() || '' : '';
    let resolvedType = input.contentType || 'text/plain';
    let bodyContent = input.content;

    const wrapHtml = (title: string, bodyHtml: string) => (
      `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>${title}</title>\n    <style>body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }</style>\n</head>\n<body>\n${bodyHtml}\n</body>\n</html>`
    );

    switch (ext) {
      case 'docx': {
        const title = input.fileName;
        bodyContent = wrapHtml(title, bodyContent);
        resolvedType = 'application/vnd.banbury.docx-html';
        break;
      }
      case 'html':
      case 'htm': {
        const hasHtmlTag = /<html[\s>]/i.test(bodyContent);
        bodyContent = hasHtmlTag ? bodyContent : wrapHtml(input.fileName, bodyContent);
        resolvedType = 'text/html';
        break;
      }
      case 'csv': {
        resolvedType = 'text/csv';
        break;
      }
      case 'md': {
        resolvedType = 'text/markdown';
        break;
      }
      case 'json': {
        resolvedType = 'application/json';
        break;
      }
      case 'txt':
      default: {
        resolvedType = resolvedType || 'text/plain';
      }
    }

    const fileBlob = new Blob([bodyContent], { type: resolvedType });
    const formData = new FormData();
    formData.append('file', fileBlob, input.fileName);
    formData.append('device_name', 'web-editor');
    formData.append('file_path', input.filePath);
    formData.append('file_parent', input.filePath.split('/').slice(0, -1).join('/') || 'root');

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!resp.ok) {
      let message = `HTTP ${resp.status}`;
      try {
        const data = await resp.json();
        if (data?.error) message += ` - ${data.error}`;
      } catch {}
      throw new Error(`Failed to create file: ${message}`);
    }

    const data = await resp.json();
    return JSON.stringify({
      result: data?.result || 'success',
      file_url: data?.file_url,
      file_info: data?.file_info,
      message: data?.message || 'File created successfully',
    });
  },
  {
    name: 'create_file',
    description: 'Create a new file in the user\'s cloud workspace. Provide file name, full path including the file name, and the file content.',
    schema: z.object({
      fileName: z.string().describe("The new file name (e.g., 'notes.md')"),
      filePath: z.string().describe("Full path where the file should be stored, including the file name (e.g., 'projects/alpha/notes.md')"),
      content: z.string().describe('The file contents as text'),
      contentType: z.string().optional().describe("Optional MIME type, defaults by extension"),
    }),
  }
);

// Download from URL tool
const downloadFromUrlTool = tool(
  async (input: { url: string; fileName?: string; filePath?: string; fileParent?: string }) => {
    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");

    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    console.log(`Downloading file from URL: ${input.url}`);
    
    // Download the file from the URL
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`Failed to download file: HTTP ${response.status} ${response.statusText}`);
    }
    
    // Get file information
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength) : 0;
    
    // Determine file name
    let finalFileName = input.fileName;
    if (!finalFileName) {
      // Try to extract filename from URL
      const urlObj = new URL(input.url);
      const pathname = urlObj.pathname;
      if (pathname && pathname.includes('/')) {
        finalFileName = pathname.split('/').pop() || '';
        if (!finalFileName || !finalFileName.includes('.')) {
          // If no filename in URL, try to determine from content-type
          const extension = getExtensionFromMimeType(contentType);
          finalFileName = `downloaded_file${extension}`;
        }
      } else {
        // Fallback filename
        const extension = getExtensionFromMimeType(contentType);
        finalFileName = `downloaded_file${extension}`;
      }
    }
    
    // Convert response to blob
    const blob = await response.blob();
    
    // Upload the blob to S3
    const formData = new FormData();
    formData.append('file', blob, finalFileName);
    formData.append('device_name', 'web-editor');
    formData.append('file_path', input.filePath || 'uploads');
    formData.append('file_parent', input.fileParent || 'uploads');

    const resp = await fetch(`${apiBase}/files/upload_to_s3/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!resp.ok) {
      let message = `HTTP ${resp.status}`;
      try {
        const data = await resp.json();
        if (data?.error) message += ` - ${data.error}`;
      } catch {}
      throw new Error(`Failed to upload downloaded file: ${message}`);
    }

    const data = await resp.json();
    return JSON.stringify({
      result: data?.result || 'success',
      file_url: data?.file_url,
      file_info: {
        ...data?.file_info,
        source_url: input.url,
        file_size: fileSize
      },
      message: `File downloaded from URL and uploaded successfully`,
    });
  },
  {
    name: 'download_from_url',
    description: 'Download a file from a URL and upload it to the user\'s cloud workspace. Provide the URL and optionally a custom file name and path.',
    schema: z.object({
      url: z.string().describe("The URL of the file to download"),
      fileName: z.string().optional().describe("Optional custom file name (if not provided, will extract from URL)"),
      filePath: z.string().optional().describe("Optional file path where to store the file (default: 'uploads')"),
      fileParent: z.string().optional().describe("Optional parent directory (default: 'uploads')"),
    }),
  }
);

// File search tool
const searchFilesTool = tool(
  async (input: { query: string }) => {
    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");

    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    console.log(`Searching files with query: ${input.query}`);
    
    const response = await fetch(`${apiBase}/files/search_s3_files/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: input.query })
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) message += ` - ${data.error}`;
      } catch {}
      throw new Error(`Failed to search files: ${message}`);
    }

    const data = await response.json();
    
    if (data.result === 'success') {
      return JSON.stringify({
        success: true,
        files: data.files || [],
        total_results: data.total_results || 0,
        query: input.query,
        message: `Found ${data.total_results || 0} files matching "${input.query}"`
      });
    } else {
      return JSON.stringify({
        success: false,
        error: data.error || 'Search failed',
        query: input.query
      });
    }
  },
  {
    name: "search_files",
    description: "Search for files in the user's cloud storage by file name. Use this to find specific files or files containing certain keywords in their names.",
    schema: z.object({
      query: z.string().describe("The search query to match against file names (case-insensitive)")
    })
  }
);

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'text/plain': '.txt',
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'application/json': '.json',
    'application/xml': '.xml',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
  };
  
  return mimeToExt[mimeType] || '';
}

// Utility function to truncate Gmail message content to prevent token limit issues
const truncateGmailResponse = (messages: any[], maxTokensPerMessage: number = 2000, maxTotalMessages: number = 10) => {
  const truncatedMessages = messages.slice(0, maxTotalMessages).map(msg => {
    if (!msg || typeof msg !== 'object') return msg;
    
    const truncated = { ...msg };
    
    // Truncate body content if it exists and is too long
    if (truncated.body && typeof truncated.body === 'string') {
      const bodyLength = truncated.body.length;
      if (bodyLength > maxTokensPerMessage) {
        // Rough estimate: 1 token ≈ 4 characters
        const maxChars = maxTokensPerMessage * 4;
        truncated.body = truncated.body.substring(0, maxChars) + '... [truncated]';
        truncated.bodyTruncated = true;
        truncated.originalBodyLength = bodyLength;
      }
    }
    
    // Truncate snippet if it exists and is too long
    if (truncated.snippet && typeof truncated.snippet === 'string') {
      const snippetLength = truncated.snippet.length;
      if (snippetLength > 500) { // 500 chars for snippet
        truncated.snippet = truncated.snippet.substring(0, 500) + '... [truncated]';
        truncated.snippetTruncated = true;
      }
    }
    
    return truncated;
  });
  
  return {
    messages: truncatedMessages,
    totalCount: messages.length,
    truncated: messages.length > maxTotalMessages,
    maxMessagesReturned: maxTotalMessages,
    note: messages.length > maxTotalMessages ? 
      `Showing first ${maxTotalMessages} messages. Use gmail_get_message for full content of specific messages.` : 
      undefined
  };
};

// Helper function to extract only essential email data
const extractEssentialEmailData = (messageData: any, messageId: string, threadId?: string) => {
  // Extract headers from Gmail API response
  const headers = messageData.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  
  // Extract body content
  let body = '';
  if (messageData.payload?.body?.data) {
    body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
  } else if (messageData.payload?.parts) {
    const textPart = messageData.payload.parts.find((part: any) => part.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  }
  
  // Return only essential data
  return {
    id: messageId,
    threadId: threadId || messageData.threadId,
    subject: getHeader('subject') || '(No Subject)',
    from: getHeader('from') || 'Unknown',
    to: getHeader('to') || '',
    date: getHeader('date') || '',
    snippet: messageData.snippet || '',
    body: body
  };
};

// Gmail tools (proxy to Banbury API). Respects user toolPreferences via server context
const gmailGetRecentTool = tool(
  async (input: { maxResults?: number; labelIds?: string[] }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean };
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const maxResults = Math.min(Number(input?.maxResults || 20), 10); // Cap at 10 to prevent token limit issues
    const labelIds = (input?.labelIds && input.labelIds.length > 0 ? input.labelIds : ["INBOX"]).join(",");

    // First, get the list of message IDs
    const listUrl = `${apiBase}/authentication/gmail/list_messages/?labelIds=${encodeURIComponent(labelIds)}&maxResults=${encodeURIComponent(String(maxResults))}`;
    const listResp = await fetch(listUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (!listResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${listResp.status}: ${listResp.statusText}` });
    }
    const listData = await listResp.json();
    
    if (!listData.messages || !Array.isArray(listData.messages)) {
      return JSON.stringify({ success: false, error: "No messages found or invalid response format" });
    }

    // Extract message IDs and fetch full message content using batch endpoint
    const messageIds = listData.messages.slice(0, maxResults).map((msg: any) => msg.id);
    let successfulMessages: any[] = [];
    
    try {
      const batchUrl = `${apiBase}/authentication/gmail/messages/batch`;
      const batchResp = await fetch(batchUrl, { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      });
      
      if (batchResp.ok) {
        const batchData = await batchResp.json();
        successfulMessages = (batchData.messages || []).map((messageData: any) => 
          extractEssentialEmailData(messageData, messageData.id, messageData.threadId)
        );
      } else {
        // Fallback to individual requests if batch fails
        const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
          try {
            const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`;
            const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
            if (getResp.ok) {
              const messageData = await getResp.json();
              return extractEssentialEmailData(messageData, msg.id, msg.threadId);
            } else {
              return {
                id: msg.id,
                threadId: msg.threadId,
                error: `Failed to fetch message: ${getResp.status}`
              };
            }
          } catch (error) {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        });

        const messages = await Promise.allSettled(messagePromises);
        successfulMessages = messages
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value);
      }
    } catch (error) {
      // Fallback to individual requests if batch fails
      const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
        try {
          const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`;
          const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
          if (getResp.ok) {
            const messageData = await getResp.json();
            return extractEssentialEmailData(messageData, msg.id, msg.threadId);
          } else {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Failed to fetch message: ${getResp.status}`
            };
          }
        } catch (error) {
          return {
            id: msg.id,
            threadId: msg.threadId,
            error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      });

      const messages = await Promise.allSettled(messagePromises);
      successfulMessages = messages
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);
    }

    // Truncate the response to prevent token limit issues
    const truncatedResponse = truncateGmailResponse(successfulMessages);

    return JSON.stringify({ 
      success: true, 
      ...truncatedResponse,
      nextPageToken: listData.nextPageToken
    });
  },
  {
    name: "gmail_get_recent",
    description: "Get recent Gmail messages with content (subject, sender, body, timestamp, attachments) from the INBOX. Long messages are automatically truncated to prevent token limit issues.",
    schema: z.object({
      maxResults: z.number().optional().describe("Maximum number of results to return (default 20, max 10 to prevent token limits)"),
      labelIds: z.array(z.string()).optional().describe("Optional Gmail labelIds (default ['INBOX'])"),
    }),
  }
);

const gmailSearchTool = tool(
  async (input: { query: string; maxResults?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean };
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const maxResults = Math.min(Number(input?.maxResults || 20), 10); // Cap at 10 to prevent token limit issues
    // Backend supports Gmail-style q param if implemented; pass-through
    const listUrl = `${apiBase}/authentication/gmail/list_messages/?labelIds=${encodeURIComponent("INBOX")}&maxResults=${encodeURIComponent(String(maxResults))}&q=${encodeURIComponent(input.query)}`;
    const listResp = await fetch(listUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (!listResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${listResp.status}: ${listResp.statusText}` });
    }
    const listData = await listResp.json();
    
    if (!listData.messages || !Array.isArray(listData.messages)) {
      return JSON.stringify({ success: false, error: "No messages found or invalid response format" });
    }

    // Extract message IDs and fetch full message content using batch endpoint
    const messageIds = listData.messages.slice(0, maxResults).map((msg: any) => msg.id);
    let successfulMessages: any[] = [];
    
    try {
      const batchUrl = `${apiBase}/authentication/gmail/messages/batch`;
      const batchResp = await fetch(batchUrl, { 
        method: "POST", 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageIds })
      });
      
      if (batchResp.ok) {
        const batchData = await batchResp.json();
        successfulMessages = (batchData.messages || []).map((messageData: any) => 
          extractEssentialEmailData(messageData, messageData.id, messageData.threadId)
        );
      } else {
        // Fallback to individual requests if batch fails
        const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
          try {
            const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`;
            const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
            if (getResp.ok) {
              const messageData = await getResp.json();
              return extractEssentialEmailData(messageData, msg.id, msg.threadId);
            } else {
              return {
                id: msg.id,
                threadId: msg.threadId,
                error: `Failed to fetch message: ${getResp.status}`
              };
            }
          } catch (error) {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        });

        const messages = await Promise.allSettled(messagePromises);
        successfulMessages = messages
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value);
      }
    } catch (error) {
      // Fallback to individual requests if batch fails
      const messagePromises = listData.messages.slice(0, maxResults).map(async (msg: any) => {
        try {
          const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(msg.id)}/`;
          const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
          if (getResp.ok) {
            const messageData = await getResp.json();
            return extractEssentialEmailData(messageData, msg.id, msg.threadId);
          } else {
            return {
              id: msg.id,
              threadId: msg.threadId,
              error: `Failed to fetch message: ${getResp.status}`
            };
          }
        } catch (error) {
          return {
            id: msg.id,
            threadId: msg.threadId,
            error: `Error fetching message: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      });

      const messages = await Promise.allSettled(messagePromises);
      successfulMessages = messages
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);
    }

    // Truncate the response to prevent token limit issues
    const truncatedResponse = truncateGmailResponse(successfulMessages);

    return JSON.stringify({ 
      success: true, 
      ...truncatedResponse,
      query: input.query,
      nextPageToken: listData.nextPageToken
    });
  },
  {
    name: "gmail_search",
    description:
      "Search Gmail messages using Gmail search syntax. Examples: 'from:john@example.com', 'subject:meeting', 'is:unread', 'after:2024/01/01'. Returns message metadata and content.",
    schema: z.object({
      query: z.string().describe("Gmail search query, e.g., 'from:john@example.com is:unread'"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default 20, max 10 to prevent token limits)"),
    }),
  }
);

const gmailGetMessageTool = tool(
  async (input: { messageId: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean };
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const getUrl = `${apiBase}/authentication/gmail/messages/${encodeURIComponent(input.messageId)}/`;
    const getResp = await fetch(getUrl, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (!getResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${getResp.status}: ${getResp.statusText}` });
    }
    const messageData = await getResp.json();
    
    // Extract only essential data
    const essentialData = extractEssentialEmailData(messageData, input.messageId);
    
    // Truncate single message content if it's too long
    const truncatedMessage = truncateGmailResponse([essentialData], 5000, 1);
    
    return JSON.stringify({ 
      success: true, 
      message: truncatedMessage.messages[0],
      note: truncatedMessage.messages[0].bodyTruncated ? 
        "Message body was truncated due to length. Full content available in Gmail." : 
        undefined
    });
  },
  {
    name: "gmail_get_message",
    description: "Get a specific Gmail message by its ID with full content. Use this to get complete message details after finding messages with gmail_get_recent or gmail_search.",
    schema: z.object({
      messageId: z.string().describe("The Gmail message ID"),
    }),
  }
);

const gmailSendMessageTool = tool(
  async (input: { to: string; subject: string; body: string; cc?: string; bcc?: string; isDraft?: boolean }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { gmail?: boolean };
    if (prefs.gmail === false) {
      return JSON.stringify({ success: false, error: "Gmail access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const sendUrl = `${apiBase}/authentication/gmail/send_message/`;
    const sendResp = await fetch(sendUrl, { 
      method: "POST", 
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        body: input.body,
        cc: input.cc,
        bcc: input.bcc,
        isDraft: input.isDraft || false
      })
    });
    
    if (!sendResp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${sendResp.status}: ${sendResp.statusText}` });
    }
    const sendData = await sendResp.json();
    
    return JSON.stringify({ 
      success: true, 
      result: sendData,
      message: input.isDraft ? "Draft created successfully" : "Email sent successfully"
    });
  },
  {
    name: "gmail_send_message",
    description: "Send a new email or create a draft in Gmail",
    schema: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content (HTML supported)"),
      cc: z.string().optional().describe("CC recipient(s)"),
      bcc: z.string().optional().describe("BCC recipient(s)"),
      isDraft: z.boolean().optional().describe("Create as draft instead of sending (default: false)"),
    }),
  }
);

// Bind tools to the model and also prepare tools array for React agent
const tools = [
  webSearchTool,
  tiptapAiTool,
  sheetAiTool,
  createMemoryTool,
  searchMemoryTool,
  createFileTool,
  downloadFromUrlTool,
  searchFilesTool,
  gmailGetRecentTool,
  gmailSearchTool,
  gmailGetMessageTool,
  gmailSendMessageTool,
];
const modelWithTools = anthropicModel.bindTools(tools);

// React-style agent that handles tool-calling loops internally
export const reactAgent = createReactAgent({ llm: anthropicModel, tools });

// Define agent nodes following athena-intelligence patterns
async function agentNode(state: AgentState): Promise<AgentState> {
  try {
    // Only add system message if it's not already there
    let messages = state.messages;
    
    // Check if first message is already a system message
    const hasSystemMessage = messages.length > 0 && messages[0]._getType() === "system";
    
    if (!hasSystemMessage) {
      const systemMessage = new SystemMessage(
        "You are Athena, a helpful AI assistant with advanced capabilities. " +
        "You have access to web search, memory management, document editing, spreadsheet editing, file creation, file downloading, and file search tools. " +
        "When helping with document editing tasks, use the tiptap_ai tool to deliver your response. " +
        "When helping with spreadsheet editing tasks (cleaning, transformations, formulas, row/column edits), use the sheet_ai tool to deliver structured operations. " +
        "To create a new file in the user's cloud workspace, use the create_file tool with file name, full path (including the file name), and content. " +
        "To download a file from a URL and save it to the user's cloud workspace, use the download_from_url tool with the URL and optionally a custom file name and path. " +
        "To search for files in the user's cloud storage, use the search_files tool with a search query to find files by name. " +
        "Store important information in memory for future reference using the store_memory tool. " +
        "Search your memories when relevant using the search_memory tool. " +
        "Provide clear, accurate, and helpful responses with proper citations when using web search."
      );
      messages = [systemMessage, ...messages];
    }

    const response = await modelWithTools.invoke(messages);
    
    return {
      ...state,
      messages: [...state.messages, response],
      step: state.step + 1
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      step: state.step + 1
    };
  }
}

async function toolNode(state: AgentState): Promise<AgentState> {
  try {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    const toolCalls = lastMessage.tool_calls || [];
    
    if (toolCalls.length === 0) {
      return state;
    }

    const toolMessages: ToolMessage[] = [];
    
    for (const toolCall of toolCalls) {
      let result: string;
      
      switch (toolCall.name) {
        case "web_search":
          result = await webSearchTool.invoke(toolCall.args);
          break;
        case "tiptap_ai":
          result = JSON.stringify(await tiptapAiTool.invoke(toolCall.args));
          break;
          case "sheet_ai":
            result = JSON.stringify(await sheetAiTool.invoke(toolCall.args));
            break;
        case "store_memory":
          result = await createMemoryTool.invoke(toolCall.args);
          break;
        case "search_memory":
          result = await searchMemoryTool.invoke(toolCall.args);
          break;
        case "create_file":
          result = await createFileTool.invoke(toolCall.args);
          break;
        case "download_from_url":
          result = await downloadFromUrlTool.invoke(toolCall.args);
          break;
        case "search_files":
          result = await searchFilesTool.invoke(toolCall.args);
          break;
        case "gmail_get_recent":
          result = await gmailGetRecentTool.invoke(toolCall.args);
          break;
        case "gmail_search":
          result = await gmailSearchTool.invoke(toolCall.args);
          break;
        case "gmail_get_message":
          result = await gmailGetMessageTool.invoke(toolCall.args);
          break;
        case "gmail_send_message":
          result = await gmailSendMessageTool.invoke(toolCall.args);
          break;
        default:
          result = `Unknown tool: ${toolCall.name}`;
      }
      
      toolMessages.push(new ToolMessage({
        content: result,
        tool_call_id: toolCall.id || "",
      }));
    }
    
    return {
      ...state,
      messages: [...state.messages, ...toolMessages],
      step: state.step + 1
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Tool execution error",
      step: state.step + 1
    };
  }
}

// Define conditional edge logic
function shouldContinue(state: AgentState): string {
  if (state.error) {
    return END;
  }
  
  if (state.step > 10) {
    return END;
  }
  
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage && "tool_calls" in lastMessage && lastMessage.tool_calls?.length) {
    return "tools";
  }
  
  return END;
}

// Create the LangGraph workflow
const workflow = new StateGraph<AgentState>({
  channels: {
    messages: {
      reducer: (current: BaseMessage[], update: BaseMessage[]) => [...current, ...update],
      default: () => []
    },
    step: {
      reducer: (current: number, update: number) => update,
      default: () => 0
    },
    error: {
      reducer: (current: string | undefined, update: string | undefined) => update,
      default: () => undefined
    }
  }
})
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END
  })
  .addEdge("tools", "agent");

// Compile the graph
export const langGraphAgent = workflow.compile();

// Export utility functions
export function createInitialState(messages: BaseMessage[]): AgentState {
  return {
    messages,
    step: 0
  };
}

export { webSearchTool, tiptapAiTool, createMemoryTool, searchMemoryTool };
