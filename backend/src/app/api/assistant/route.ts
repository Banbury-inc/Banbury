import { NextRequest } from "next/server";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { 
  gmailSearch, 
  gmailGetRecent, 
  gmailGetUnread, 
  gmailGetEmail, 
  gmailSendEmail, 
  gmailGetFromSender,
  gmailGetSignature,
  gmailSendEmailWithSignature
} from "../../../lib/gmail-tools";

type AssistantUiMessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: any; argsText?: string }
  | { type: "tool-result"; toolCallId: string; result: any };

type AssistantUiMessage = {
  role: "system" | "user" | "assistant";
  content: AssistantUiMessagePart[];
};

const webSearch = tool(
  async (input: { query: string }) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(input.query)}&format=json&no_html=1&skip_disambig=1`;
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await resp.json();
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    if (data.Abstract && data.AbstractURL) {
      results.push({ title: data.Heading || data.AbstractSource || "DuckDuckGo Result", url: data.AbstractURL, snippet: data.Abstract });
    }
    if (Array.isArray(data.Results)) {
      data.Results.slice(0, 3).forEach((r: any) => {
        if (r.Text && r.FirstURL) results.push({ title: r.Text, url: r.FirstURL, snippet: r.Text });
      });
    }
    if (Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 2).forEach((t: any) => {
        if (t.Text && t.FirstURL) results.push({ title: t.Text.split(" - ")[0] || "Related Topic", url: t.FirstURL, snippet: t.Text });
      });
    }

    if (results.length === 0) {
      results.push({
        title: `Search Results for "${input.query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(input.query)}`,
        snippet: `Click to view search results for "${input.query}" on DuckDuckGo.`,
      });
    }

    return JSON.stringify({ results: results.slice(0, 5), query: input.query });
  },
  {
    name: "web_search",
    description: "Search the web for real-time information.",
    schema: z.object({ query: z.string() }),
  }
);

const anthropicModel = new ChatAnthropic({
  model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
  apiKey: process.env.ANTHROPIC_API_KEY,
  temperature: 0.2,
});

function toLangChainMessages(messages: AssistantUiMessage[]): BaseMessage[] {
  const lc: BaseMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      const text = msg.content.filter((p) => p.type === "text").map((p: any) => p.text).join("\n\n");
      if (text) lc.push(new SystemMessage(text));
      continue;
    }

    if (msg.role === "user") {
      const text = msg.content.filter((p) => p.type === "text").map((p: any) => p.text).join("\n\n");
      if (text) lc.push(new HumanMessage(text));
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

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const last = state.messages[state.messages.length - 1] as AIMessage | undefined;
  const pendingToolCalls = (last?.additional_kwargs as any)?.tool_calls || (last as any)?.tool_calls;
  return Array.isArray(pendingToolCalls) && pendingToolCalls.length > 0 ? "tools" : "__end__";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { messages: AssistantUiMessage[]; toolPreferences?: any };

    // Get tool preferences from the request, defaulting to all enabled
    const toolPreferences = body.toolPreferences || { gmail: true };
    
    // Dynamically build tools array based on preferences
    const availableTools = [webSearch];
    
    // Add Gmail tools if enabled
    if (toolPreferences.gmail !== false) {
      availableTools.push(
        gmailSearch,
        gmailGetRecent,
        gmailGetUnread,
        gmailGetEmail,
        gmailSendEmail,
        gmailGetFromSender,
        gmailGetSignature,
        gmailSendEmailWithSignature
      );
    }
    
    // Create model and tools node with dynamic tools
    const modelWithTools = anthropicModel.bindTools(availableTools);
    const toolsNode = new ToolNode(availableTools);
    
    // Create graph with dynamic tools
    const graph = new StateGraph(MessagesAnnotation)
      .addNode("agent", async (state: typeof MessagesAnnotation.State) => {
        const ai = await modelWithTools.invoke(state.messages);
        return { messages: [ai] };
      })
      .addNode("tools", toolsNode)
      .addEdge("tools", "agent")
      .addConditionalEdges("agent", shouldContinue, { tools: "tools", __end__: "__end__" });

    const app = graph.compile();

    const lcMessages = toLangChainMessages(body.messages);
    const result = await app.invoke({ messages: lcMessages });
    const messages = (result as any).messages as BaseMessage[];
    const last = messages[messages.length - 1] as AIMessage | undefined;

    const toolCallingAi = [...messages].reverse().find((m) => m._getType() === "ai" && ((m as any).tool_calls?.length || (m as any).additional_kwargs?.tool_calls?.length));
    const toolCalls = ((toolCallingAi as any)?.tool_calls || (toolCallingAi as any)?.additional_kwargs?.tool_calls) || [];

    const parts: AssistantUiMessagePart[] = [];
    for (const tc of toolCalls) {
      parts.push({ type: "tool-call", toolCallId: tc.id, toolName: tc.name, args: tc.args, argsText: JSON.stringify(tc.args, null, 2) });
      const toolMsg = messages.find((m) => m._getType() === "tool" && (m as any).tool_call_id === tc.id) as ToolMessage | undefined;
      if (toolMsg) parts.push({ type: "tool-result", toolCallId: tc.id, result: toolMsg.content });
    }

    const finalText = typeof last?.content === "string" ? last.content : Array.isArray(last?.content) ? last?.content?.map((c: any) => (typeof c === "string" ? c : c?.text || "")).join("\n\n") : "";
    if (finalText) parts.push({ type: "text", text: finalText });

    return new Response(JSON.stringify({ content: parts, status: { type: "complete", reason: "stop" } }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "unknown error" }), { status: 500 });
  }
}


