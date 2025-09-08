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

// Tavily web search input parameters
interface TavilySearchInput {
  query: string;
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  topic?: string;
  timeRange?: "day" | "week" | "month" | "year";
  includeDomains?: string[];
  excludeDomains?: string[];
}

// Web search result shape
interface WebSearchResult { title: string; url: string; snippet: string }

// Create tools following athena-intelligence patterns
const webSearchTool = tool(
  async (input: TavilySearchInput) => {

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

    // Merge defaults from server context (if provided) with input
    const defaultOptions = (getServerContextValue<any>("webSearchDefaults") || {}) as Partial<TavilySearchInput>;
    const merged = { ...defaultOptions, ...input } as TavilySearchInput;

    // Prefer Tavily if available for high-quality, content-rich results
    const results: WebSearchResult[] = [];
    const maxResults = Math.max(1, Math.min(Number(merged?.maxResults ?? 5), 10));
    const tavilyKey = process.env.TAVILY_API_KEY || "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";
    if (tavilyKey) {
      try {
        const tavilyResp = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${tavilyKey}` },
          body: JSON.stringify({
            query: input.query,
            search_depth: merged.searchDepth || "advanced",
            include_answer: merged.includeAnswer ?? true,
            include_raw_content: merged.includeRawContent ?? true,
            include_images: merged.includeImages ?? false,
            include_image_descriptions: merged.includeImageDescriptions ?? false,
            topic: merged.topic || "general",
            time_range: merged.timeRange,
            include_domains: Array.isArray(merged.includeDomains) && merged.includeDomains.length ? merged.includeDomains : undefined,
            exclude_domains: Array.isArray(merged.excludeDomains) && merged.excludeDomains.length ? merged.excludeDomains : undefined,
            max_results: maxResults,
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
            if (results.length >= maxResults) break;
          }
        }
      } catch {}
    }

    // Fallback to DuckDuckGo + enrichment if Tavily is unavailable or returned nothing
    if (results.length === 0) {
      try {
        const mod: any = await import("duck-duck-scrape");
        const search = mod.search || mod.default?.search || mod;
        const ddg: any = await search(input.query, { maxResults: Math.min(maxResults * 2, 20) });
        const items: any[] = Array.isArray(ddg?.results) ? ddg.results : Array.isArray(ddg) ? ddg : [];
        for (const r of items) {
          const url = normalizeUrl(r.url || r.link || r.href);
          if (!url) continue;
          const title = (r.title || r.name || r.text || "Result").toString();
          const snippet = (r.description || r.snippet || r.text || "").toString();
          results.push({ title, url, snippet });
          if (results.length >= maxResults) break;
        }
      } catch {}
    }

    // Enrich results by fetching page content
    const enrichPromises: Array<Promise<WebSearchResult>> = results.map(async (r) => {
      const html = await fetchWithTimeout(r.url, 4500);
      if (!html) return r;
      const title = extractTitle(html) || r.title;
      const desc = extractDescription(html) || r.snippet || "";
      return { title, url: r.url, snippet: desc } as WebSearchResult;
    });
    const enriched = await Promise.all(enrichPromises).catch(() => results);

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
    schema: z.object({
      query: z.string(),
      searchDepth: z.enum(["basic", "advanced"]).optional(),
      maxResults: z.number().int().min(1).max(10).optional(),
      includeAnswer: z.boolean().optional(),
      includeRawContent: z.boolean().optional(),
      includeImages: z.boolean().optional(),
      includeImageDescriptions: z.boolean().optional(),
      topic: z.string().optional(),
      timeRange: z.enum(["day", "week", "month", "year"]).optional(),
      includeDomains: z.array(z.string()).optional(),
      excludeDomains: z.array(z.string()).optional(),
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

// DOCX editing tool to apply AI-driven document operations
const docxAiTool = tool(
  async (input: {
    action: string;
    documentName?: string;
    operations?: Array<
      | { type: 'insertText'; position: number; text: string }
      | { type: 'replaceText'; startPosition: number; endPosition: number; text: string }
      | { type: 'insertParagraph'; position: number; text: string; style?: string }
      | { type: 'replaceParagraph'; paragraphIndex: number; text: string; style?: string }
      | { type: 'insertHeading'; position: number; text: string; level: number }
      | { type: 'replaceHeading'; headingIndex: number; text: string; level?: number }
      | { type: 'insertList'; position: number; items: string[]; listType: 'bulleted' | 'numbered' }
      | { type: 'insertTable'; position: number; rows: string[][]; hasHeaders?: boolean }
      | { type: 'formatText'; startPosition: number; endPosition: number; formatting: { bold?: boolean; italic?: boolean; underline?: boolean; fontSize?: number; color?: string } }
      | { type: 'insertImage'; position: number; imageUrl: string; alt?: string; width?: number; height?: number }
      | { type: 'setPageSettings'; margins?: { top: number; bottom: number; left: number; right: number }; orientation?: 'portrait' | 'landscape' }
    >;
    htmlContent?: string;
    note?: string;
  }) => {
    // Return payload for the frontend DOCX editor to apply
    return {
      action: input.action,
      documentName: input.documentName,
      operations: input.operations || [],
      htmlContent: input.htmlContent,
      note: input.note,
    };
  },
  {
    name: 'docx_ai',
    description:
      'Use this tool to deliver AI-generated DOCX document edits. Provide either a list of operations (preferred) or full htmlContent to replace the document.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Add heading', 'Format text', 'Insert table', 'Restructure document')"),
      documentName: z.string().optional().describe('Optional document name for context'),
      operations: z
        .array(
          z.union([
            z.object({ type: z.literal('insertText'), position: z.number(), text: z.string() }),
            z.object({ type: z.literal('replaceText'), startPosition: z.number(), endPosition: z.number(), text: z.string() }),
            z.object({ type: z.literal('insertParagraph'), position: z.number(), text: z.string(), style: z.string().optional() }),
            z.object({ type: z.literal('replaceParagraph'), paragraphIndex: z.number(), text: z.string(), style: z.string().optional() }),
            z.object({ type: z.literal('insertHeading'), position: z.number(), text: z.string(), level: z.number() }),
            z.object({ type: z.literal('replaceHeading'), headingIndex: z.number(), text: z.string(), level: z.number().optional() }),
            z.object({ type: z.literal('insertList'), position: z.number(), items: z.array(z.string()), listType: z.enum(['bulleted', 'numbered']) }),
            z.object({ type: z.literal('insertTable'), position: z.number(), rows: z.array(z.array(z.string())), hasHeaders: z.boolean().optional() }),
            z.object({ 
              type: z.literal('formatText'), 
              startPosition: z.number(), 
              endPosition: z.number(), 
              formatting: z.object({
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                underline: z.boolean().optional(),
                fontSize: z.number().optional(),
                color: z.string().optional()
              })
            }),
            z.object({ type: z.literal('insertImage'), position: z.number(), imageUrl: z.string(), alt: z.string().optional(), width: z.number().optional(), height: z.number().optional() }),
            z.object({ 
              type: z.literal('setPageSettings'), 
              margins: z.object({ top: z.number(), bottom: z.number(), left: z.number(), right: z.number() }).optional(),
              orientation: z.enum(['portrait', 'landscape']).optional()
            }),
          ])
        )
        .optional()
        .describe('List of document operations to apply'),
      htmlContent: z.string().optional().describe('Optional full HTML content to replace the current document'),
      note: z.string().optional().describe('Optional notes/instructions for the user'),
    }),
  }
);

// Image generation tool using OpenAI Images API, then upload to S3 via Banbury API
const generateImageTool = tool(
  async (input: { prompt: string; size?: '256x256' | '512x512' | '1024x1024'; folder?: string; fileBaseName?: string }) => {
    const openaiKey = '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'
    if (!openaiKey) {
      return JSON.stringify({ ok: false, error: 'OPENAI_API_KEY not configured' });
    }

    const token = getServerContextValue<string>('authToken');
    if (!token) {
      return JSON.stringify({ ok: false, error: 'Missing auth token in server context' });
    }

    try {
      const prompt = (input?.prompt || '').toString().trim();
      if (!prompt) return JSON.stringify({ ok: false, error: 'Missing prompt' });
      const size = input?.size || '1024x1024';
      const folder = (input?.folder || 'images').replace(/^\/+|\/+$/g, '');
      const baseName = (input?.fileBaseName || 'Generated Image').toString().trim();

      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, response_format: 'b64_json' }),
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        return JSON.stringify({ ok: false, error: `Provider error: ${text || resp.statusText}` });
      }
      const data: any = await resp.json();
      const b64 = data?.data?.[0]?.b64_json as string | undefined;
      if (!b64) return JSON.stringify({ ok: false, error: 'No image returned by provider' });

      const apiBase = CONFIG.url;
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
        headers: { Authorization: `Bearer ${token}` } as any,
        body: form as any,
      });
      if (!uploadResp.ok) {
        const text = await uploadResp.text().catch(() => '');
        return JSON.stringify({ ok: false, error: `Upload failed: ${text || uploadResp.statusText}` });
      }
      const uploaded: any = await uploadResp.json();

      return JSON.stringify({
        ok: true,
        file_info: uploaded?.file_info || { file_name: fileName, file_path: filePath },
        provider: 'openai',
        size,
        message: 'Image generated and uploaded successfully',
      });
    } catch (e: any) {
      return JSON.stringify({ ok: false, error: e?.message || 'Failed to generate image' });
    }
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a prompt and save it to the user\'s cloud storage.',
    schema: z.object({
      prompt: z.string().describe('Image description prompt'),
      size: z.enum(['256x256', '512x512', '1024x1024']).optional(),
      folder: z.string().optional().describe('Target folder (default: images)'),
      fileBaseName: z.string().optional().describe('Base filename (default: Generated Image)'),
    }),
  }
);

// Memory management tools (integrated with Zep Cloud and Mem0)
const createMemoryTool = tool(
  async (input: { content: string; dataType?: string; overflowStrategy?: string; sessionId?: string }) => {
    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");

    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    console.log(`Storing memory: ${input.content}`);
    
    // Get user information from context (in a real implementation, this would come from auth)
    const userInfo = {
      userId: "user123", // This should come from auth context
      workspaceId: "workspace123", // This should come from auth context
      email: "user@example.com", // This should come from auth context
      firstName: "User",
      lastName: "Example"
    };
    
    const chosenSessionId = input.sessionId || `assistant_ui`;

    const response = await fetch(`${apiBase}/conversations/memory/enhanced/store/`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: input.content,
        type: input.dataType || "text",
        session_id: chosenSessionId,
        use_zep: true
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const backendError = data?.error || data?.message || JSON.stringify(data || {});
      throw new Error(`Failed to store memory: HTTP ${response.status}${backendError ? ` - ${backendError}` : ''}`);
    }

    // Surface Zep diagnostics if present
    // Accept success shape from Django and surface diagnostics
    if (data?.success) {
      if (data?.zep?.stored_memory) {
        return `Memory stored successfully in Zep and Mongo. session_id: ${chosenSessionId}`;
      }
      const diag = data?.zep ? JSON.stringify(data.zep, null, 2) : 'no zep diagnostics available';
      return `Memory stored in Mongo (Zep disabled or failed). session_id: ${chosenSessionId}. Diagnostics: ${diag}`;
    }

    throw new Error(`Failed to store memory: ${data?.error || data?.message || 'Unknown error'}`);
  },
  {
    name: "store_memory",
    description: "Store important information in the user's memory for future reference. Use this to remember user preferences, important facts, or key information from conversations.",
    schema: z.object({
      content: z.string().describe("The information to store in memory"),
      dataType: z.string().optional().describe("Type of data being stored (text, json, message)"),
      overflowStrategy: z.string().optional().describe("How to handle data that exceeds size limits (truncate, split, fail)")
    })
  }
);

const searchMemoryTool = tool(
  async (input: { query: string; scope?: string; reranker?: string; maxResults?: number; sessionId?: string }) => {
    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");

    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    console.log(`Searching memories with query: ${input.query}`);
    
    // Get user information from context (in a real implementation, this would come from auth)
    const userInfo = {
      userId: "user123", // This should come from auth context
      workspaceId: "workspace123", // This should come from auth context
      email: "user@example.com", // This should come from auth context
      firstName: "User",
      lastName: "Example"
    };
    
    const chosenSessionId = input.sessionId || `assistant_ui`;

    const params = new URLSearchParams({
      query: input.query,
      scope: input.scope || "nodes",
      reranker: input.reranker || "cross_encoder",
      limit: String(input.maxResults || 10),
      use_zep: "true",
      session_id: chosenSessionId
    });
    
    const response = await fetch(`${apiBase}/conversations/memory/enhanced/search/?${params}`, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) message += ` - ${data.error}`;
      } catch {}
      throw new Error(`Failed to search memories: ${message}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Combine MongoDB and Zep results
      let response = "Memory search results (Zep):\n\n";
      if (typeof data.used_strategy !== 'undefined') {
        response += `Strategy: ${data.used_strategy}${data.used_user_id ? `, user: ${data.used_user_id}` : ''}\n\n`;
      }
      
      // Mongo results suppressed when use_zep=true
      
      if (data.zep_facts && data.zep_facts.length > 0) {
        response += "Zep Facts:\n";
        data.zep_facts.forEach((fact: any, index: number) => {
          response += `${index + 1}. ${fact.fact} (confidence: ${fact.confidence.toFixed(2)})\n`;
        });
        response += "\n";
      }
      
      if (data.zep_entities && data.zep_entities.length > 0) {
        response += "Zep Entities:\n";
        data.zep_entities.forEach((entity: any, index: number) => {
          response += `${index + 1}. ${entity.name} (${entity.type})\n`;
          response += `   Summary: ${entity.summary}\n`;
        });
      }
      
      if (data.count === 0) {
        return "No relevant memories found for the given query.";
      }
      
      return response;
    } else {
      throw new Error(`Failed to search memories: ${data.error || 'Unknown error'}`);
    }
  },
  {
    name: "search_memory",
    description: "Search through the user's memories from previous conversations and interactions. Use this to find relevant information about the user's preferences, past conversations, or stored knowledge.",
    schema: z.object({
      query: z.string().describe("Simple, concise search query to find relevant memories"),
      scope: z.string().optional().describe("Scope of the search: 'nodes' for entities/concepts, 'edges' for relationships/facts"),
      reranker: z.string().optional().describe("Method to rerank results for better relevance (cross_encoder, rrf, mmr, episode_mentions)"),
      maxResults: z.number().optional().describe("Maximum number of results to return (default: 10)")
    })
  }
);

// Initialize the Anthropic model
const anthropicModel = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  apiKey: process.env.ANTHROPIC_API_KEY || "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",
  temperature: 0.2,
});

// Function to get current date/time context
function getCurrentDateTimeContext(): string {
  const now = new Date();
  
  // Format current date and time
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  };
  
  const currentDate = now.toLocaleDateString('en-US', dateOptions);
  const currentTime = now.toLocaleTimeString('en-US', timeOptions);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isoString = now.toISOString();
  
  return `Current date and time: ${currentDate} at ${currentTime} (${timezone}). ISO timestamp: ${isoString}`;
}

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

    // Local helpers to normalize and format plain text into HTML when appropriate
    const escapeHtml = (raw: string): string =>
      raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const isLikelyHtml = (raw: string): boolean => /<\s*([a-zA-Z]+)(\s|>|\/)/.test(raw) || /<html[\s>]/i.test(raw);

    const normalizeNewlines = (raw: string): string => raw.replace(/\r\n?/g, '\n');

    const plainTextToHtml = (raw: string): string => {
      const text = normalizeNewlines(raw).trim();
      if (!text) return '';
      const paragraphs = text.split(/\n{2,}/);
      const htmlParagraphs = paragraphs.map((para) => {
        const escaped = escapeHtml(para);
        const withBreaks = escaped.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      });
      return htmlParagraphs.join('\n');
    };

    // Basic Markdown support for common structures: headings, lists, links, inline code, bold/italics, blockquotes, code fences
    const applyInlineMarkdown = (text: string): string => {
      // code span
      let s = text.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`);
      // bold
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // italics (simple heuristic, avoids interfering with bold already handled)
      s = s.replace(/(^|\W)\*([^*]+)\*(?=$|\W)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`);
      // links [text](url)
      s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, p1, p2) => `<a href="${escapeHtml(p2)}">${escapeHtml(p1)}</a>`);
      return s;
    };

    const looksLikeMarkdown = (raw: string): boolean => {
      const t = normalizeNewlines(raw);
      return /^(#{1,6})\s+/.test(t) || /\n[-*]\s+/.test(t) || /\n\d+\.\s+/.test(t) || /\*\*[^*]+\*\*/.test(t) || /^>\s+/.test(t) || /^---$/m.test(t) || /```[\s\S]*?```/.test(t);
    };

    const markdownToHtml = (raw: string): string => {
      const text = normalizeNewlines(raw);
      // Extract fenced code blocks first to avoid processing inside
      const codeBlocks: string[] = [];
      let withoutFences = text.replace(/```([\s\S]*?)```/g, (_m, p1) => {
        const idx = codeBlocks.length;
        codeBlocks.push(`<pre><code>${escapeHtml(p1.trim())}</code></pre>`);
        return `@@CODEBLOCK_${idx}@@`;
      });

      const lines = withoutFences.split('\n');
      const htmlParts: string[] = [];
      let inUl = false;
      let inOl = false;
      let inBlockquote = false;
      let paraBuffer: string[] = [];

      const flushPara = () => {
        if (paraBuffer.length) {
          const p = applyInlineMarkdown(escapeHtml(paraBuffer.join('\n'))).replace(/\n/g, '<br>');
          htmlParts.push(`<p>${p}</p>`);
          paraBuffer = [];
        }
      };
      const closeLists = () => {
        if (inUl) { htmlParts.push('</ul>'); inUl = false; }
        if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      };
      const closeBlockquote = () => {
        if (inBlockquote) { htmlParts.push('</blockquote>'); inBlockquote = false; }
      };

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
          flushPara();
          closeLists();
          closeBlockquote();
          continue;
        }

        // Horizontal rule
        if (/^-{3,}$/.test(line)) {
          flushPara();
          closeLists();
          closeBlockquote();
          htmlParts.push('<hr>');
          continue;
        }

        // Headings
        const h = line.match(/^(#{1,6})\s+(.+)$/);
        if (h) {
          flushPara();
          closeLists();
          closeBlockquote();
          const level = Math.min(h[1].length, 6);
          const content = applyInlineMarkdown(escapeHtml(h[2].trim()));
          htmlParts.push(`<h${level}>${content}</h${level}>`);
          continue;
        }

        // Blockquote
        const bq = line.match(/^>\s?(.*)$/);
        if (bq) {
          flushPara();
          closeLists();
          if (!inBlockquote) { htmlParts.push('<blockquote>'); inBlockquote = true; }
          const content = applyInlineMarkdown(escapeHtml(bq[1]));
          htmlParts.push(`<p>${content}</p>`);
          continue;
        }

        // Ordered list
        const ol = line.match(/^\d+\.\s+(.*)$/);
        if (ol) {
          flushPara();
          closeBlockquote();
          if (inUl) { htmlParts.push('</ul>'); inUl = false; }
          if (!inOl) { htmlParts.push('<ol>'); inOl = true; }
          const content = applyInlineMarkdown(escapeHtml(ol[1]));
          htmlParts.push(`<li>${content}</li>`);
          continue;
        }

        // Unordered list
        const ul = line.match(/^[-*]\s+(.*)$/);
        if (ul) {
          flushPara();
          closeBlockquote();
          if (inOl) { htmlParts.push('</ol>'); inOl = false; }
          if (!inUl) { htmlParts.push('<ul>'); inUl = true; }
          const content = applyInlineMarkdown(escapeHtml(ul[1]));
          htmlParts.push(`<li>${content}</li>`);
          continue;
        }

        // Default: accumulate paragraph lines
        paraBuffer.push(line);
      }

      flushPara();
      closeLists();
      closeBlockquote();

      let html = htmlParts.join('\n');
      // Restore code blocks
      html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (_m, p1) => codeBlocks[Number(p1)] || '');
      return html;
    };

    const wrapHtml = (title: string, bodyHtml: string) => (
      `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>${title}</title>\n    <style>body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }</style>\n</head>\n<body>\n${bodyHtml}\n</body>\n</html>`
    );

    switch (ext) {
      case 'docx': {
        const title = input.fileName;
        let prepared: string;
        if (isLikelyHtml(bodyContent)) {
          prepared = bodyContent;
        } else if (looksLikeMarkdown(bodyContent)) {
          prepared = markdownToHtml(bodyContent);
        } else {
          prepared = plainTextToHtml(bodyContent);
        }
        bodyContent = wrapHtml(title, prepared);
        resolvedType = 'application/vnd.banbury.docx-html';
        break;
      }
      case 'html':
      case 'htm': {
        const hasHtmlTag = /<html[\s>]/i.test(bodyContent);
        if (hasHtmlTag) {
          bodyContent = bodyContent;
        } else {
          let prepared: string;
          if (isLikelyHtml(bodyContent)) {
            prepared = bodyContent;
          } else if (looksLikeMarkdown(bodyContent)) {
            prepared = markdownToHtml(bodyContent);
          } else {
            prepared = plainTextToHtml(bodyContent);
          }
          bodyContent = wrapHtml(input.fileName, prepared);
        }
        resolvedType = 'text/html';
        break;
      }
      case 'csv': {
        resolvedType = 'text/csv';
        break;
      }
      case 'xlsx': {
        console.log('[create_file] XLSX case - input content type:', typeof bodyContent);
        console.log('[create_file] XLSX case - input content length:', bodyContent?.length);
        console.log('[create_file] XLSX case - input content sample:', bodyContent?.substring ? bodyContent.substring(0, 100) : 'Not a string');
        
        // For XLSX files, convert plain text content to proper XLSX format using ExcelJS
        const ExcelJSImport = await import('exceljs');
        const ExcelJS = (ExcelJSImport as any).default || ExcelJSImport;
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        
        // Parse the content as CSV-like data or create simple data structure
        let data: any[][];
        try {
          // Try to parse as CSV first
          const lines = bodyContent.trim().split('\n');
          data = lines.map(line => {
            // Simple CSV parsing - split by comma and handle quoted values
            const cells = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' && (i === 0 || line[i-1] === ',')) {
                inQuotes = true;
              } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
                inQuotes = false;
              } else if (char === ',' && !inQuotes) {
                cells.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            cells.push(current.trim());
            return cells;
          });
          
          // If it doesn't look like CSV data (less than 2 rows or very uneven columns), create a simple structure
          if (data.length < 2 || data.some(row => row.length === 1 && !data[0].includes(','))) {
            data = [
              ['Content'],
              [bodyContent]
            ];
          }
        } catch {
          // Fallback: create simple single-cell data
          data = [
            ['Content'],
            [bodyContent]
          ];
        }
        
        // Add the data to the worksheet
        data.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            const excelCell = worksheet.getCell(rowIndex + 1, colIndex + 1);
            excelCell.value = cell || '';
          });
        });
        
        // Auto-fit columns
        worksheet.columns.forEach((column: any) => {
          if (column && column.eachCell) {
            let maxLength = 0;
            column.eachCell({ includeEmpty: false }, (cell: any) => {
              const columnLength = cell.value ? String(cell.value).length : 0;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            column.width = Math.min(maxLength + 2, 50); // Set max width to 50
          }
        });

        // Generate XLSX buffer
        const buffer = await workbook.xlsx.writeBuffer();
        console.log('[create_file] XLSX buffer created, size:', buffer.byteLength);
        
        // Create blob directly here since we have binary data
        const xlsxBlob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        console.log('[create_file] XLSX blob created, size:', xlsxBlob.size, 'type:', xlsxBlob.type);
        
        // We'll handle this case specially after the switch
        bodyContent = xlsxBlob;
        resolvedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
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

    // If bodyContent is already a Blob (e.g., for XLSX), use it directly
    const fileBlob = bodyContent instanceof Blob 
      ? bodyContent 
      : new Blob([bodyContent], { type: resolvedType });
    
    console.log('[create_file] Final blob size:', fileBlob.size, 'type:', fileBlob.type, 'fileName:', input.fileName);
    
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
    description: 'Create a new file in the user\'s cloud workspace. Prefer Microsoft Word (.docx) for documents. Provide file name, full path including the file name, and the file content. For documents (reports, proposals, notes), default to .docx unless the user explicitly asks for another format.',
    schema: z.object({
      fileName: z.string().describe("The new file name. Prefer '.docx' for documents (e.g., 'notes.docx')"),
      filePath: z.string().describe("Full path including the file name. Prefer '.docx' for documents (e.g., 'projects/alpha/notes.docx')"),
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

// (Browserbase-only session cache removed; Stagehand is the sole browser automation path)

// Global toggle helper: "Browser" tool (controls both Browserbase and Stagehand)
function isBrowserToolEnabled(): boolean {
  const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { browser?: boolean };
  // Default OFF unless explicitly enabled
  return prefs.browser === true;
}

// Browserbase-only tools removed in favor of Stagehand exclusively

// Browserbase-only tools removed in favor of Stagehand exclusively

// Stagehand tools
let currentStagehandSessionId: string | null = null;

function getStagehandSessionId(): string | null {
  return currentStagehandSessionId;
}

function setStagehandSessionId(id: string | null) {
  currentStagehandSessionId = id;
}

const stagehandCreateSessionTool = tool(
  async (input: { startUrl?: string; modelName?: string }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." });
    }
    try {
      if (typeof window !== 'undefined') {
        return JSON.stringify({ success: false, error: 'Stagehand can only be created server-side' });
      }
      const { createStagehandSession } = await import('../../pages/api/stagehand/_manager');
      const created = await createStagehandSession({ startUrl: input.startUrl, modelName: input.modelName });
      setStagehandSessionId(created.id);
      
      return JSON.stringify({ 
        success: true, 
        sessionId: created.id, 
        viewerUrl: created.viewerUrl,
        title: created.title || `Web Browser`
      });
    } catch (e: any) {
      return JSON.stringify({ success: false, error: e?.message || 'Failed to create Stagehand session' });
    }
  },
  {
    name: 'stagehand_create_session',
    description: 'Create a Stagehand session backed by Browserbase',
    schema: z.object({
      startUrl: z.string().optional(),
      modelName: z.string().optional()
    })
  }
);

const stagehandGotoTool = tool(
  async (input: { url: string }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." });
    }
    const sessionId = getStagehandSessionId();
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' });
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand navigation must run server-side' });
    }
    const { getStagehandSession } = await import('../../pages/api/stagehand/_manager');
    const instance = getStagehandSession(sessionId);
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' });
    await instance.page.goto(input.url);
    const title = await instance.page.title();
    const url = instance.page.url();
    return JSON.stringify({ success: true, title, url });
  },
  {
    name: 'stagehand_goto',
    description: 'Navigate the Stagehand-controlled browser to a URL',
    schema: z.object({ url: z.string() })
  }
);

const stagehandObserveTool = tool(
  async (input: { instruction: string }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." });
    }
    const sessionId = getStagehandSessionId();
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' });
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand observe must run server-side' });
    }
    const { getStagehandSession } = await import('../../pages/api/stagehand/_manager');
    const instance = getStagehandSession(sessionId);
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' });
    const suggestions = await instance.page.observe(input.instruction);
    return JSON.stringify({ success: true, suggestions });
  },
  {
    name: 'stagehand_observe',
    description: 'Ask Stagehand to suggest actions for an instruction',
    schema: z.object({ instruction: z.string() })
  }
);

const stagehandActTool = tool(
  async (input: { suggestion: any }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." });
    }
    const sessionId = getStagehandSessionId();
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' });
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand act must run server-side' });
    }
    const { getStagehandSession } = await import('../../pages/api/stagehand/_manager');
    const instance = getStagehandSession(sessionId);
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' });
    await instance.page.act(input.suggestion);
    const title = await instance.page.title();
    const url = instance.page.url();
    return JSON.stringify({ success: true, title, url });
  },
  {
    name: 'stagehand_act',
    description: 'Perform a Stagehand suggestion',
    schema: z.object({ suggestion: z.any() })
  }
);

const stagehandExtractTool = tool(
  async (input: { instruction: string; schema: Record<string, string> }) => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." });
    }
    const sessionId = getStagehandSessionId();
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' });
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand extract must run server-side' });
    }
    const { getStagehandSession } = await import('../../pages/api/stagehand/_manager');
    const instance = getStagehandSession(sessionId);
    if (!instance) return JSON.stringify({ success: false, error: 'Session not found' });
    const built = z.object(Object.fromEntries(Object.keys(input.schema || {}).map((k) => [k, z.string()])) as Record<string, z.ZodTypeAny>);
    const result = await instance.page.extract({ instruction: input.instruction, schema: built });
    return JSON.stringify({ success: true, result });
  },
  {
    name: 'stagehand_extract',
    description: 'Extract structured data via Stagehand using a simple field map',
    schema: z.object({ instruction: z.string(), schema: z.record(z.string()) })
  }
);

const stagehandCloseTool = tool(
  async () => {
    if (!isBrowserToolEnabled()) {
      return JSON.stringify({ success: false, error: "Browser access is disabled. Enable the Browser tool to use Stagehand." });
    }
    const sessionId = getStagehandSessionId();
    if (!sessionId) return JSON.stringify({ success: false, error: 'No active Stagehand session' });
    if (typeof window !== 'undefined') {
      return JSON.stringify({ success: false, error: 'Stagehand close must run server-side' });
    }
    const { closeStagehandSession } = await import('../../pages/api/stagehand/_manager');
    const ok = await closeStagehandSession(sessionId);
    if (ok) setStagehandSessionId(null);
    return JSON.stringify({ success: ok });
  },
  {
    name: 'stagehand_close',
    description: 'Close the Stagehand session',
    schema: z.object({})
  }
);

// Tool to get current date/time information
const getCurrentDateTimeTool = tool(
  async () => {
    const now = new Date();
    
    // Format current date and time
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    
    const currentDate = now.toLocaleDateString('en-US', dateOptions);
    const currentTime = now.toLocaleTimeString('en-US', timeOptions);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isoString = now.toISOString();
    
    return JSON.stringify({
      currentDate,
      currentTime,
      timezone,
      isoString,
      formatted: `${currentDate} at ${currentTime} (${timezone})`,
      unixTimestamp: Math.floor(now.getTime() / 1000),
      year: now.getFullYear(),
      month: now.getMonth() + 1, // 1-based month
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayOfWeek: now.getDay(), // 0 = Sunday, 1 = Monday, etc.
      dayOfYear: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    });
  },
  {
    name: "get_current_datetime",
    description: "Get the current date and time information including formatted strings, timestamps, and individual components.",
    schema: z.object({})
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

// Google Calendar tools (proxy to Banbury API). Respects user toolPreferences via server context
const calendarListEventsTool = tool(
  async (input: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    pageToken?: string;
    query?: string;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
  }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean };
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const params = new URLSearchParams();
    params.set('calendarId', input.calendarId || 'primary');
    if (input.timeMin) params.set('timeMin', input.timeMin);
    if (input.timeMax) params.set('timeMax', input.timeMax);
    if (typeof input.maxResults === 'number') params.set('maxResults', String(input.maxResults));
    if (input.pageToken) params.set('pageToken', input.pageToken);
    if (input.query) params.set('q', input.query);
    if (typeof input.singleEvents !== 'undefined') params.set('singleEvents', String(input.singleEvents));
    if (input.orderBy) params.set('orderBy', input.orderBy);

    const listUrl = `${apiBase}/authentication/calendar/events/?${params.toString()}`;
    const resp = await fetch(listUrl, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json();
    return JSON.stringify({ success: true, ...data });
  },
  {
    name: 'calendar_list_events',
    description: 'List Google Calendar events with optional time range and query filtering',
    schema: z.object({
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')"),
      timeMin: z.string().optional().describe('RFC3339 start time'),
      timeMax: z.string().optional().describe('RFC3339 end time'),
      maxResults: z.number().optional().describe('Maximum events to return'),
      pageToken: z.string().optional().describe('Pagination token'),
      query: z.string().optional().describe('Free-text search query'),
      singleEvents: z.boolean().optional().describe('Expand recurring events into instances'),
      orderBy: z.enum(['startTime','updated']).optional().describe('Sort order')
    })
  }
);

const calendarGetEventTool = tool(
  async (input: { eventId: string; calendarId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean };
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const url = `${apiBase}/authentication/calendar/events/${encodeURIComponent(input.eventId)}/?calendarId=${encodeURIComponent(input.calendarId || 'primary')}`;
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json();
    return JSON.stringify({ success: true, event: data });
  },
  {
    name: 'calendar_get_event',
    description: 'Get a specific Google Calendar event by ID',
    schema: z.object({
      eventId: z.string().describe('The event ID'),
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')")
    })
  }
);

const calendarCreateEventTool = tool(
  async (input: { calendarId?: string; event: Record<string, any> }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean };
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const url = `${apiBase}/authentication/calendar/events/`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: input.calendarId || 'primary', event: input.event })
    });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json();
    return JSON.stringify({ success: true, event: data });
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new Google Calendar event',
    schema: z.object({
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')"),
      event: z.record(z.any()).describe('Event payload matching Google Calendar API events.insert body')
    })
  }
);

const calendarUpdateEventTool = tool(
  async (input: { eventId: string; calendarId?: string; event: Record<string, any> }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean };
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const url = `${apiBase}/authentication/calendar/events/${encodeURIComponent(input.eventId)}/`;
    const resp = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ calendarId: input.calendarId || 'primary', event: input.event })
    });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json();
    return JSON.stringify({ success: true, event: data });
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing Google Calendar event',
    schema: z.object({
      eventId: z.string().describe('The event ID to update'),
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')"),
      event: z.record(z.any()).describe('Partial event payload to update')
    })
  }
);

const calendarDeleteEventTool = tool(
  async (input: { eventId: string; calendarId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { calendar?: boolean };
    if (prefs.calendar === false) {
      return JSON.stringify({ success: false, error: "Calendar access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const url = `${apiBase}/authentication/calendar/events/${encodeURIComponent(input.eventId)}/?calendarId=${encodeURIComponent(input.calendarId || 'primary')}`;
    const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json().catch(() => ({}));
    return JSON.stringify({ success: true, result: data });
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete a Google Calendar event by ID',
    schema: z.object({
      eventId: z.string().describe('The event ID to delete'),
      calendarId: z.string().optional().describe("Calendar identifier (default 'primary')")
    })
  }
);

// X API tools (proxy to Banbury API). Respects user toolPreferences via server context
const xApiGetUserInfoTool = tool(
  async (input: { username?: string; userId?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean };
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const params = new URLSearchParams();
    if (input.username) params.append('username', input.username);
    if (input.userId) params.append('user_id', input.userId);

    const url = `${apiBase}/authentication/x_api/user_info/?${params.toString()}`;
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json().catch(() => ({}));
    return JSON.stringify({ success: true, result: data });
  },
  {
    name: "x_api_get_user_info",
    description: "Get X (Twitter) user information by username or user ID",
    schema: z.object({
      username: z.string().optional().describe("X username (without @)"),
      userId: z.string().optional().describe("X user ID"),
    }),
  }
);

const xApiGetUserTweetsTool = tool(
  async (input: { username?: string; userId?: string; maxResults?: number; excludeRetweets?: boolean; excludeReplies?: boolean; useAppBearer?: boolean }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean };
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const maxResults = Math.min(Number(input?.maxResults || 10), 100); // Cap at 100
    const params = new URLSearchParams({
      max_results: String(maxResults),
      exclude_retweets: String(input?.excludeRetweets || false),
      exclude_replies: String(input?.excludeReplies || false)
    });
    if (input.username) params.append('username', input.username);
    if (input.userId) params.append('user_id', input.userId);
    if (typeof input.useAppBearer === 'undefined' || input.useAppBearer === true) params.append('use_app_bearer', 'true');

    const url = `${apiBase}/authentication/x_api/user_tweets/?${params.toString()}`;
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json().catch(() => ({}));
    return JSON.stringify({ success: true, result: data });
  },
  {
    name: "x_api_get_user_tweets",
    description: "Get recent tweets from an X (Twitter) user by username or user ID",
    schema: z.object({
      username: z.string().optional().describe("X username (without @)"),
      userId: z.string().optional().describe("X user ID"),
      maxResults: z.number().optional().describe("Maximum number of tweets to return (default 10, max 100)"),
      excludeRetweets: z.boolean().optional().describe("Exclude retweets from results (default false)"),
      excludeReplies: z.boolean().optional().describe("Exclude replies from results (default false)"),
      useAppBearer: z.boolean().optional().describe("Force app bearer for arbitrary public accounts (default true)"),
    }),
  }
);

const xApiSearchTweetsTool = tool(
  async (input: { query: string; maxResults?: number; language?: string; resultType?: string }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean };
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const maxResults = Math.min(Number(input?.maxResults || 10), 100); // Cap at 100
    const params = new URLSearchParams({
      query: input.query,
      max_results: String(maxResults),
      language: input?.language || 'en',
      result_type: input?.resultType || 'recent'
    });

    const url = `${apiBase}/authentication/x_api/search_tweets/?${params.toString()}`;
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json().catch(() => ({}));
    return JSON.stringify({ success: true, result: data });
  },
  {
    name: "x_api_search_tweets",
    description: "Search for tweets using X (Twitter) search API",
    schema: z.object({
      query: z.string().describe("Search query for tweets"),
      maxResults: z.number().optional().describe("Maximum number of tweets to return (default 10, max 100)"),
      language: z.string().optional().describe("Language code for search (default 'en')"),
      resultType: z.string().optional().describe("Result type: 'recent', 'popular', or 'mixed' (default 'recent')"),
    }),
  }
);

const xApiGetTrendingTopicsTool = tool(
  async (input: { woeid?: number; count?: number }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean };
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const count = Math.min(Number(input?.count || 10), 50); // Cap at 50
    const params = new URLSearchParams({
      count: String(count)
    });
    if (input.woeid) params.append('woeid', String(input.woeid));

    const url = `${apiBase}/authentication/x_api/trending_topics/?${params.toString()}`;
    const resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json().catch(() => ({}));
    return JSON.stringify({ success: true, result: data });
  },
  {
    name: "x_api_get_trending_topics",
    description: "Get trending topics on X (Twitter) for a specific location",
    schema: z.object({
      woeid: z.number().optional().describe("Where On Earth ID for location (default: worldwide)"),
      count: z.number().optional().describe("Number of trending topics to return (default 10, max 50)"),
    }),
  }
);

const xApiPostTweetTool = tool(
  async (input: { text: string; replyToTweetId?: string; mediaIds?: string[] }) => {
    const prefs = (getServerContextValue<any>("toolPreferences") || {}) as { x_api?: boolean };
    if (prefs.x_api === false) {
      return JSON.stringify({ success: false, error: "X API access is disabled by user preference" });
    }

    const apiBase = CONFIG.url;
    const token = getServerContextValue<string>("authToken");
    if (!token) {
      throw new Error("Missing auth token in server context");
    }

    const payload: any = { text: input.text };
    if (input.replyToTweetId) payload.reply_to_tweet_id = input.replyToTweetId;
    if (input.mediaIds && input.mediaIds.length > 0) payload.media_ids = input.mediaIds;

    const url = `${apiBase}/authentication/x_api/post_tweet/`;
    const resp = await fetch(url, { 
      method: 'POST', 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      return JSON.stringify({ success: false, error: `HTTP ${resp.status}: ${resp.statusText}` });
    }
    const data = await resp.json().catch(() => ({}));
    return JSON.stringify({ success: true, result: data });
  },
  {
    name: "x_api_post_tweet",
    description: "Post a new tweet to X (Twitter) using your connected account",
    schema: z.object({
      text: z.string().describe("Tweet text content (max 280 characters)"),
      replyToTweetId: z.string().optional().describe("Tweet ID to reply to"),
      mediaIds: z.array(z.string()).optional().describe("Array of media IDs to attach to the tweet"),
    }),
  }
);

// Bind tools to the model and also prepare tools array for React agent
const tools = [
  webSearchTool,
  sheetAiTool,
  docxAiTool,
  generateImageTool,
  createMemoryTool,
  searchMemoryTool,
  createFileTool,
  downloadFromUrlTool,
  searchFilesTool,
  getCurrentDateTimeTool,
  gmailGetRecentTool,
  gmailSearchTool,
  gmailGetMessageTool,
  gmailSendMessageTool,
  calendarListEventsTool,
  calendarGetEventTool,
  calendarCreateEventTool,
  calendarUpdateEventTool,
  calendarDeleteEventTool,
  xApiGetUserInfoTool,
  xApiGetUserTweetsTool,
  xApiSearchTweetsTool,
  xApiGetTrendingTopicsTool,
  xApiPostTweetTool,
  stagehandCreateSessionTool,
  stagehandGotoTool,
  stagehandObserveTool,
  stagehandActTool,
  stagehandExtractTool,
  stagehandCloseTool,
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
      // Get date/time context from server context if available, otherwise generate it
      let dateTimeContext = getServerContextValue<any>("dateTimeContext");
      if (!dateTimeContext) {
        dateTimeContext = getCurrentDateTimeContext();
      } else {
        dateTimeContext = `Current date and time: ${dateTimeContext.formatted}. ISO timestamp: ${dateTimeContext.isoString}`;
      }
      
      const systemMessage = new SystemMessage(
        "You are a helpful AI assistant with advanced capabilities. " +
        "You have access to web search, memory management, spreadsheet editing, DOCX document editing, file creation, file downloading, file search, datetime tools, X (Twitter) API, and browser automation. " +
        "When helping with spreadsheet editing tasks (cleaning, transformations, formulas, row/column edits), use the sheet_ai tool to deliver structured operations. " +
        "When helping with DOCX document editing tasks (adding content, formatting text, inserting tables/lists/images, restructuring), use the docx_ai tool to deliver structured document operations. The docx_ai tool supports operations like insertText, replaceText, insertParagraph, insertHeading, insertList, insertTable, formatText, insertImage, and setPageSettings. " +
        "To create a new file in the user's cloud workspace, use the create_file tool with file name, full path (including the file name), and content. When the user asks to create a document, default to Microsoft Word (.docx) for the fileName and filePath unless they explicitly ask for another format. " +
        "To download a file from a URL and save it to the user's cloud workspace, use the download_from_url tool with the URL and optionally a custom file name and path. " +
        "To search for files in the user's cloud storage, use the search_files tool with a search query to find files by name. " +
        "Store important information in memory for future reference using the store_memory tool. " +
        "Search your memories when relevant using the search_memory tool. " +
        "Use the get_current_datetime tool when you need to know the current date and time for scheduling, planning, or time-sensitive tasks. " +
        "For X (Twitter) API access, use the following tools (disabled by default): " +
        "- x_api_get_user_info: Get user information by username or user ID " +
        "- x_api_get_user_tweets: Get recent tweets from a user " +
        "- x_api_search_tweets: Search for tweets using keywords " +
        "- x_api_get_trending_topics: Get trending topics for a location " +
        "- x_api_post_tweet: Post a new tweet " +
        "Only use X API tools if the X API feature is enabled. " +
        "For web browsing and automation, use Stagehand (disabled by default). " +
        "Only use Stagehand tools if the Browser feature is enabled. " +
        "Stagehand tools: " +
        "- stagehand_create_session: Start a Stagehand session on Browserbase (opens in center panel) " +
        "- stagehand_goto: Navigate to a URL " +
        "- stagehand_observe: Get suggested actions for an instruction " +
        "- stagehand_act: Execute a selected suggestion " +
        "- stagehand_extract: Extract structured data using a simple schema " +
        "- stagehand_close: Close the Stagehand session " +
        "When the user asks you to browse the web or search online, first ensure the Browser feature is enabled; otherwise do not use any Stagehand tools. If enabled, use stagehand_create_session to open a browser in the center panel. " +
        "Provide clear, accurate, and helpful responses with proper citations when using web search. " +
        "\n\n" + dateTimeContext
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
        case "sheet_ai":
          result = JSON.stringify(await sheetAiTool.invoke(toolCall.args));
          break;
        case "docx_ai":
          result = JSON.stringify(await docxAiTool.invoke(toolCall.args));
          break;
        case "generate_image":
          result = await generateImageTool.invoke(toolCall.args);
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
        case "get_current_datetime":
          result = await getCurrentDateTimeTool.invoke(toolCall.args);
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
        case "calendar_list_events":
          result = await calendarListEventsTool.invoke(toolCall.args);
          break;
        case "calendar_get_event":
          result = await calendarGetEventTool.invoke(toolCall.args);
          break;
        case "calendar_create_event":
          result = await calendarCreateEventTool.invoke(toolCall.args);
          break;
        case "calendar_update_event":
          result = await calendarUpdateEventTool.invoke(toolCall.args);
          break;
        case "calendar_delete_event":
          result = await calendarDeleteEventTool.invoke(toolCall.args);
          break;
        case "x_api_get_user_info":
          result = await xApiGetUserInfoTool.invoke(toolCall.args);
          break;
        case "x_api_get_user_tweets":
          result = await xApiGetUserTweetsTool.invoke(toolCall.args);
          break;
        case "x_api_search_tweets":
          result = await xApiSearchTweetsTool.invoke(toolCall.args);
          break;
        case "x_api_get_trending_topics":
          result = await xApiGetTrendingTopicsTool.invoke(toolCall.args);
          break;
        case "x_api_post_tweet":
          result = await xApiPostTweetTool.invoke(toolCall.args);
          break;
        // Browserbase-only tools removed
        case "stagehand_create_session":
          result = await stagehandCreateSessionTool.invoke(toolCall.args);
          break;
        case "stagehand_goto":
          result = await stagehandGotoTool.invoke(toolCall.args);
          break;
        case "stagehand_observe":
          result = await stagehandObserveTool.invoke(toolCall.args);
          break;
        case "stagehand_act":
          result = await stagehandActTool.invoke(toolCall.args);
          break;
        case "stagehand_extract":
          result = await stagehandExtractTool.invoke(toolCall.args);
          break;
        case "stagehand_close":
          result = await stagehandCloseTool.invoke(toolCall.args);
          break;
        default:
          result = `Unknown tool: ${toolCall.name}`;
      }
      
      toolMessages.push(new ToolMessage({
        content: result,
        tool_call_id: toolCall.id || "",
        additional_kwargs: {
          tool_name: toolCall.name
        }
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
  const hasToolCalls =
    !!lastMessage &&
    typeof (lastMessage as any) === 'object' &&
    'tool_calls' in (lastMessage as any) &&
    Array.isArray((lastMessage as any).tool_calls) &&
    (lastMessage as any).tool_calls.length > 0;
  if (hasToolCalls) {
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

export { webSearchTool, createMemoryTool, searchMemoryTool, getCurrentDateTimeTool };
