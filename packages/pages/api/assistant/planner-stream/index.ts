import type { NextApiRequest, NextApiResponse } from "next"
import { SystemMessage, HumanMessage } from "@langchain/core/messages"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { randomUUID } from "crypto"
import { PLANNER_SYSTEM_PROMPT, API_CONFIG } from "./constants"
import { getAnthropicChatModelOptions } from "../langgraph-stream/agent/modelOptions"

export const config = API_CONFIG

interface PlannerRequestBody {
  goal: string
  context?: string
  toolPreferences?: {
    model_provider?: "anthropic" | "openai" | "google"
    model_id?: string
  }
}

interface PlanTodo {
  id: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed"
  depends?: string[]
}

interface Plan {
  id: string
  title: string
  overview: string
  todos: PlanTodo[]
  notes: string
  status: "draft" | "executing" | "completed"
  createdAt: string
  rawMarkdown: string
}

function getModel(provider: string, modelId?: string) {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        model: modelId || "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.3,
      })
    case "google":
      return new ChatGoogleGenerativeAI({
        model: modelId || "gemini-2.0-flash",
        apiKey: process.env.GOOGLE_AI_API_KEY,
        temperature: 0.3,
      })
    default: {
      const model = modelId || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"
      return new ChatAnthropic({
        model,
        apiKey: process.env.ANTHROPIC_API_KEY,
        ...getAnthropicChatModelOptions(model, 0.3),
      })
    }
  }
}

function parsePlanMarkdown(markdown: string): Omit<Plan, "rawMarkdown"> {
  const planId = randomUUID()
  const todos: PlanTodo[] = []
  let title = "Untitled Plan"
  let overview = ""
  let notes = ""

  // Extract title from # heading
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  if (titleMatch) title = titleMatch[1].trim()

  // Extract overview section
  const overviewMatch = markdown.match(/##\s+Overview\s*\n([\s\S]*?)(?=##|$)/i)
  if (overviewMatch) overview = overviewMatch[1].trim()

  // Extract todos - match lines like: - [ ] id:xxx | description or - [ ] description
  const todoRegex = /^-\s*\[([x\s])\]\s*(?:id:(\S+)\s*\|\s*)?(.+)$/gm
  let match
  let todoIndex = 0
  while ((match = todoRegex.exec(markdown)) !== null) {
    const isCompleted = match[1].toLowerCase() === "x"
    const id = match[2] || `todo-${todoIndex}`
    const description = match[3].trim()
    
    // Check for depends: annotation
    const dependsMatch = description.match(/\(depends:\s*([^)]+)\)/)
    const depends = dependsMatch 
      ? dependsMatch[1].split(",").map(d => d.trim())
      : undefined
    const cleanDescription = description.replace(/\s*\(depends:[^)]+\)/, "").trim()

    todos.push({
      id,
      description: cleanDescription,
      status: isCompleted ? "completed" : "pending",
      depends,
    })
    todoIndex++
  }

  // Extract notes section
  const notesMatch = markdown.match(/##\s+Notes\s*\n([\s\S]*?)(?=##|$)/i)
  if (notesMatch) notes = notesMatch[1].trim()

  return {
    id: planId,
    title,
    overview,
    todos,
    notes,
    status: "draft",
    createdAt: new Date().toISOString(),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    res.status(405).end()
    return
  }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")

  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    const body = req.body as PlannerRequestBody
    const { goal, context, toolPreferences } = body

    if (!goal || typeof goal !== "string" || !goal.trim()) {
      send({ type: "error", error: "Goal is required" })
      res.end()
      return
    }

    // Get the model based on preferences
    const provider = toolPreferences?.model_provider || "anthropic"
    const modelId = toolPreferences?.model_id
    const model = getModel(provider, modelId)

    // Build the user message
    let userContent = `Please create a detailed implementation plan for the following goal:\n\n${goal}`
    if (context) {
      userContent += `\n\nAdditional context:\n${context}`
    }

    // Add date/time context
    const now = new Date()
    const dateTimeContext = `\n\nCurrent date and time: ${now.toLocaleString()}. ISO timestamp: ${now.toISOString()}`
    
    const systemMessage = new SystemMessage(PLANNER_SYSTEM_PROMPT + dateTimeContext)
    const humanMessage = new HumanMessage(userContent)

    send({ type: "message-start", role: "assistant" })

    // Stream the response
    let fullContent = ""
    
    try {
      const stream = await model.stream([systemMessage, humanMessage])
      
      for await (const chunk of stream) {
        const content = typeof chunk.content === "string" 
          ? chunk.content 
          : Array.isArray(chunk.content) 
            ? chunk.content.map((c: any) => typeof c === "string" ? c : c?.text || "").join("")
            : ""
        
        if (content) {
          fullContent += content
          send({ type: "text-delta", text: content })
        }
      }
    } catch (streamError) {
      console.error("Streaming error:", streamError)
      send({ type: "error", error: streamError instanceof Error ? streamError.message : "Streaming failed" })
      res.end()
      return
    }

    // Parse the generated plan
    const parsedPlan = parsePlanMarkdown(fullContent)
    const plan: Plan = {
      ...parsedPlan,
      rawMarkdown: fullContent,
    }

    // Send the structured plan
    send({ type: "plan-complete", plan })
    send({ type: "message-end", status: { type: "complete", reason: "stop" } })
    send({ type: "done" })
    
    res.end()

  } catch (e: any) {
    console.error("Planner error:", e)
    send({ type: "error", error: e?.message || "Unknown error occurred" })
    res.end()
  }
}
