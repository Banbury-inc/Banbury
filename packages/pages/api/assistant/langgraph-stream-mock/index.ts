import type { NextApiRequest, NextApiResponse } from "next"

// ===== MOCK CONFIGURATION =====
const MOCK_CONFIG = {
  // Toggle which mock response to return
  USE_SIMPLE_RESPONSE: false,        // Simple text-only response
  USE_TOOL_CALL_RESPONSE: false,     // Response with tool execution
  USE_ERROR_RESPONSE: false,         // Response that simulates an error
  USE_TODO_RESPONSE: true,          // Response with todo list
  USE_POWERPOINT_RESPONSE: false,    // Response for creating PowerPoint presentation
  USE_DOCUMENT_RESPONSE: false,       // Response for creating a new document
}
// ==============================

export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
  maxDuration: 300,
}

// Helper to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    res.status(405).end()
    return
  }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("X-Accel-Buffering", "no")
  
  // Handle client disconnect
  req.on("close", () => {
    if (!res.writableEnded) {
      res.end()
    }
  })

  const send = (event: any) => {
    if (!res.writableEnded) {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      } catch (writeError) {
        console.error("Mock stream write error:", writeError)
      }
    }
  }

  try {
    // Send agent type
    send({ 
      type: "agent-type", 
      agentType: "general",
      agentLabel: "General Agent (Mock)",
      description: "Mock response - no LLM called"
    })
    await delay(100)

    // Route to appropriate mock response based on config
    if (MOCK_CONFIG.USE_ERROR_RESPONSE) {
      await sendErrorResponse(send)
    } else if (MOCK_CONFIG.USE_DOCUMENT_RESPONSE) {
      await sendDocumentResponse(send)
    } else if (MOCK_CONFIG.USE_POWERPOINT_RESPONSE) {
      await sendPowerpointResponse(send)
    } else if (MOCK_CONFIG.USE_TOOL_CALL_RESPONSE) {
      await sendToolCallResponse(send)
    } else if (MOCK_CONFIG.USE_TODO_RESPONSE) {
      await sendTodoResponse(send, req.body?.threadId)
    } else {
      await sendSimpleResponse(send)
    }

    // Send completion
    send({ type: "message-end", status: { type: "complete", reason: "stop" } })
    
    // Send summary
    const toolsUsed = MOCK_CONFIG.USE_TOOL_CALL_RESPONSE 
      ? ["search_memory"] 
      : MOCK_CONFIG.USE_POWERPOINT_RESPONSE 
      ? ["pptx_create_presentation"] 
      : MOCK_CONFIG.USE_DOCUMENT_RESPONSE
      ? ["tiptap_ai"]
      : []
    
    const totalSteps = MOCK_CONFIG.USE_POWERPOINT_RESPONSE || MOCK_CONFIG.USE_DOCUMENT_RESPONSE ? 3 : 1
    
    send({
      type: "summary",
      totalSteps,
      toolsUsed,
      completionTime: Date.now()
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Mock endpoint error"
    send({ type: "error", error: errorMessage })
  } finally {
    res.end()
  }
}

// ===== MOCK RESPONSE FUNCTIONS =====

async function sendSimpleResponse(send: (event: any) => void) {
  send({ type: "thinking", message: "Processing step 1..." })
  send({ type: "step-progression", step: 1, totalSteps: 1 })
  await delay(200)

  const mockResponse = "This is a mock response from the langgraph-stream-mock endpoint. No LLM API was called. You can customize this message to test different scenarios."
  await streamText(mockResponse, send)
}

async function sendToolCallResponse(send: (event: any) => void) {
  send({ type: "thinking", message: "Processing step 1..." })
  send({ type: "step-progression", step: 1, totalSteps: 2 })
  await delay(200)

  const initialText = "Let me search for that information."
  await streamText(initialText, send)
  await delay(200)

  const toolCallId = `mock-tool-${Date.now()}`
  
  send({ type: "thinking", message: "Processing step 2..." })
  send({ type: "step-progression", step: 2, totalSteps: 2 })
  await delay(100)

  send({
    type: "tool-call-start",
    part: {
      type: "tool-call",
      toolCallId,
      toolName: "search_memory",
      args: { query: "test query" },
      argsText: JSON.stringify({ query: "test query" }, null, 2),
    },
  })
  
  send({ type: "tool-status", tool: "search_memory", message: "Searching memory..." })
  await delay(500)

  send({
    type: "tool-result",
    part: {
      type: "tool-result",
      toolCallId,
      toolName: "search_memory",
      result: "Mock search result: Found 3 relevant memories",
    },
  })
  
  send({ type: "tool-completion", tool: "search_memory", message: "Memory search completed" })
  await delay(200)

  const followUpText = " Based on the search results, I found 3 relevant items in memory."
  await streamText(followUpText, send)
}

async function sendTodoResponse(send: (event: any) => void, threadId?: string) {
  send({ type: "thinking", message: "Processing step 1..." })
  send({ type: "step-progression", step: 1, totalSteps: 1 })
  await delay(200)

  const text = "I've created a task list for you. Here are the items I'll work on:"
  await streamText(text, send)
  await delay(300)

  // Send todo list
  if (threadId) {
    send({
      type: "todo-list-init",
      threadId,
      todos: [
        { 
          id: "mock-todo-1", 
          description: "Review documentation", 
          status: "in_progress",
          source: "agent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "mock-todo-2", 
          description: "Update configuration", 
          status: "pending",
          source: "agent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { 
          id: "mock-todo-3", 
          description: "Run tests", 
          status: "pending",
          source: "agent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      activeTodoId: "mock-todo-1"
    })
  }
  
  await delay(200)
  const followUp = " I'll start working on these tasks now."
  await streamText(followUp, send)
}

async function sendErrorResponse(send: (event: any) => void) {
  send({ type: "thinking", message: "Processing step 1..." })
  send({ type: "step-progression", step: 1, totalSteps: 1 })
  await delay(200)

  const errorText = "Simulating an error response for testing purposes."
  await streamText(errorText, send)
  await delay(300)

  throw new Error("Mock error: This is a simulated error for testing error handling")
}

async function sendDocumentResponse(send: (event: any) => void) {
  // Step 1: Planning the document
  send({ type: "thinking", message: "Planning document structure..." })
  send({ type: "step-progression", step: 1, totalSteps: 3 })
  await delay(200)

  const planningText = "I'll create a new document for you. Let me structure the content and formatting."
  await streamText(planningText, send)
  await delay(300)

  // Step 2: Create the document using tiptap_ai
  const toolCallId = `mock-tiptap-${Date.now()}`
  
  send({ type: "thinking", message: "Creating document..." })
  send({ type: "step-progression", step: 2, totalSteps: 3 })
  await delay(200)

  send({
    type: "tool-call-start",
    part: {
      type: "tool-call",
      toolCallId,
      toolName: "tiptap_ai",
      args: { 
        documentId: "mock-doc-123",
        action: "create",
        content: {
          title: "New Document",
          sections: [
            { heading: "Introduction", content: "Welcome to this document" },
            { heading: "Main Content", content: "Key information and details" },
            { heading: "Conclusion", content: "Summary and final thoughts" }
          ]
        }
      },
      argsText: JSON.stringify({ 
        documentId: "mock-doc-123",
        action: "create",
        content: {
          title: "New Document",
          sections: [
            { heading: "Introduction", content: "Welcome to this document" },
            { heading: "Main Content", content: "Key information and details" },
            { heading: "Conclusion", content: "Summary and final thoughts" }
          ]
        }
      }, null, 2),
    },
  })
  
  send({ type: "tool-status", tool: "tiptap_ai", message: "Processing document content..." })
  await delay(1200) // Simulate document processing

  send({
    type: "tool-result",
    part: {
      type: "tool-result",
      toolCallId,
      toolName: "tiptap_ai",
      result: JSON.stringify({
        success: true,
        documentId: "mock-doc-123",
        title: "New Document",
        sections_created: 3,
        word_count: 156,
        characters: 892
      }),
    },
  })
  
  send({ type: "tool-completion", tool: "tiptap_ai", message: "Document processing completed" })
  await delay(300)

  // Step 3: Confirmation
  send({ type: "thinking", message: "Finalizing document..." })
  send({ type: "step-progression", step: 3, totalSteps: 3 })
  await delay(200)

  const confirmationText = " I've successfully created a new document with 3 sections: Introduction, Main Content, and Conclusion. The document is ready for you to view and edit."
  await streamText(confirmationText, send)
}

async function sendPowerpointResponse(send: (event: any) => void) {
  // Step 1: Planning the presentation
  send({ type: "thinking", message: "Planning presentation structure..." })
  send({ type: "step-progression", step: 1, totalSteps: 3 })
  await delay(200)

  const planningText = "I'll create a PowerPoint presentation for you. Let me start by creating the presentation."
  await streamText(planningText, send)
  await delay(300)

  // Step 2: Create the presentation using pptx_create_presentation
  const toolCallId = `mock-create-pptx-${Date.now()}`
  const mockPresentationId = `pptx-${Date.now()}`
  const mockFileId = `file-${Date.now()}`
  
  send({ type: "thinking", message: "Creating presentation..." })
  send({ type: "step-progression", step: 2, totalSteps: 3 })
  await delay(200)

  send({
    type: "tool-call-start",
    part: {
      type: "tool-call",
      toolCallId,
      toolName: "pptx_create_presentation",
      args: { 
        presentationName: "New Presentation"
      },
      argsText: JSON.stringify({ 
        presentationName: "New Presentation"
      }, null, 2),
    },
  })
  
  send({ type: "tool-status", tool: "pptx_create_presentation", message: "Creating presentation file..." })
  await delay(1500) // Longer delay to simulate file creation and upload

  send({
    type: "tool-result",
    part: {
      type: "tool-result",
      toolCallId,
      toolName: "pptx_create_presentation",
      result: JSON.stringify({
        success: true,
        message: 'Successfully created presentation "New Presentation"',
        presentationId: mockPresentationId,
        presentationName: "New Presentation.pptx",
        fileUrl: "https://mock-s3-url.com/presentations/New%20Presentation.pptx",
        fileId: mockFileId,
        fileInfo: {
          file_name: "New Presentation.pptx",
          file_path: "presentations/New Presentation.pptx",
          file_size: 46285,
          date_uploaded: new Date().toISOString()
        }
      }),
    },
  })
  
  send({ type: "tool-completion", tool: "pptx_create_presentation", message: "Presentation created successfully" })
  await delay(300)

  // Step 3: Confirmation
  send({ type: "thinking", message: "Finalizing presentation..." })
  send({ type: "step-progression", step: 3, totalSteps: 3 })
  await delay(200)

  const confirmationText = " I've successfully created a PowerPoint presentation. The presentation starts with one blank slide and is now open in the viewer. You can add more slides and content as needed."
  await streamText(confirmationText, send)
}

async function streamText(text: string, send: (event: any) => void) {
  const words = text.split(' ')
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const space = i < words.length - 1 ? ' ' : ''
    const chunk = word + space
    
    send({ type: "text-delta", text: chunk })
    await delay(30) // Simulate typing speed
  }
}
