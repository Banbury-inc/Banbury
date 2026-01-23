import { Page, Locator, expect } from "@playwright/test"

/**
 * Page Object Model for the Workspaces page
 */
export class WorkspacesPage {
  readonly page: Page
  readonly messageInput: Locator
  readonly sendButton: Locator
  readonly assistantMessages: Locator
  readonly userMessages: Locator
  readonly streamingStatus: Locator
  readonly agentTypeBadge: Locator
  readonly thinkingIndicator: Locator
  readonly stepProgression: Locator
  readonly toolCalls: Locator
  readonly todoList: Locator

  constructor(page: Page) {
    this.page = page
    this.messageInput = page.locator('textarea[aria-label="Message input"]')
    this.sendButton = page.locator('button[aria-label="Send message"]')
    this.assistantMessages = page.locator('[data-role="assistant"]')
    this.userMessages = page.locator('[data-role="user"]')
    this.streamingStatus = page.locator('[data-role="streaming-status"]').or(
      page.locator('text=/Processing|Thinking|Searching/')
    )
    this.agentTypeBadge = page.locator('text=/General Agent|Planning Agent|Ask Agent|Document Agent/')
    this.thinkingIndicator = page.locator('text=/Processing|Thinking/')
    this.stepProgression = page.locator('text=/step|Step/')
    this.toolCalls = page.locator('[data-role="tool-call"]').or(
      page.locator('text=/web_search|tool/i')
    )
    this.todoList = page.locator('[data-role="todo-list"]').or(
      page.locator('text=/Step|Todo|Task/i')
    )
  }

  /**
   * Navigate to the workspaces page
   */
  async navigateTo() {
    await this.page.goto("/workspaces")
    // Wait for page to load
    await this.page.waitForLoadState("networkidle")
  }

  /**
   * Open AI assistant panel (if not already open)
   */
  async openAiAssistant() {
    // Check if assistant panel is already visible
    const isVisible = await this.messageInput.isVisible().catch(() => false)
    if (!isVisible) {
      // Try to find and click a button to open AI panel
      // This may vary based on UI - adjust selector as needed
      const openAiButton = this.page.locator('button:has-text("AI")').or(
        this.page.locator('[aria-label*="AI"]')
      )
      if (await openAiButton.isVisible()) {
        await openAiButton.click()
      }
    }
    // Wait for message input to be visible
    await this.messageInput.waitFor({ state: "visible", timeout: 5000 })
  }

  /**
   * Type and send a message
   */
  async sendMessage(text: string) {
    // Fill the message input
    await this.messageInput.fill(text)
    
    
    // Get current message count before sending
    const messagesBefore = await this.userMessages.count()
    
    // Click the send button
    await this.sendButton.click()
    
    // Wait for the user message to appear in the UI
    await this.page.waitForFunction(
      (count) => {
        const userMessages = document.querySelectorAll('[data-role="user"]')
        return userMessages.length > count
      },
      messagesBefore,
      { timeout: 5000 }
    )
  }

  /**
   * Wait for streaming to complete
   */
  async waitForStreamingComplete(timeout = 30000) {
    // Wait for "done" event - check if streaming status disappears or message-end appears
    await this.page.waitForFunction(
      () => {
        // Check if there's no active streaming indicator
        const statusElements = document.querySelectorAll('[data-role="streaming-status"]')
        const hasStreaming = Array.from(statusElements).some(el => {
          const text = el.textContent || ""
          return text.includes("Processing") || text.includes("Thinking") || text.includes("Searching")
        })
        return !hasStreaming
      },
      { timeout }
    )
  }

  /**
   * Get the last assistant message
   */
  async getLastMessage(): Promise<string> {
    const messages = await this.assistantMessages.all()
    if (messages.length === 0) {
      return ""
    }
    const lastMessage = messages[messages.length - 1]
    return await lastMessage.textContent() || ""
  }

  /**
   * Get all assistant messages
   */
  async getAllMessages(): Promise<string[]> {
    const messages = await this.assistantMessages.all()
    const textContents = await Promise.all(messages.map(msg => msg.textContent()))
    return textContents.map(text => text || "")
  }

  /**
   * Get tool call elements
   */
  async getToolCalls(): Promise<Locator[]> {
    return await this.toolCalls.all()
  }

  /**
   * Check if a tool call with specific name exists
   */
  async hasToolCall(toolName: string): Promise<boolean> {
    const toolCall = this.page.locator(`text=/${toolName}/i`)
    return await toolCall.isVisible().catch(() => false)
  }

  /**
   * Get todo list items
   */
  async getTodoList(): Promise<Locator[]> {
    // Try multiple selectors for todo list
    const todoSelectors = [
      '[data-role="todo-list"] [data-role="todo-item"]',
      '[data-role="todo-item"]',
      'text=/Step \\d+/',
    ]
    
    for (const selector of todoSelectors) {
      const todos = this.page.locator(selector)
      const count = await todos.count()
      if (count > 0) {
        return await todos.all()
      }
    }
    
    return []
  }

  /**
   * Get current streaming status
   */
  async getStreamingStatus(): Promise<string> {
    const status = await this.streamingStatus.first().textContent().catch(() => "")
    return status || ""
  }

  /**
   * Check if agent type badge is visible
   */
  async hasAgentTypeBadge(): Promise<boolean> {
    return await this.agentTypeBadge.isVisible().catch(() => false)
  }

  /**
   * Get agent type from badge
   */
  async getAgentType(): Promise<string> {
    const badge = await this.agentTypeBadge.first().textContent().catch(() => "")
    return badge || ""
  }

  /**
   * Check if thinking indicator is visible
   */
  async hasThinkingIndicator(): Promise<boolean> {
    return await this.thinkingIndicator.isVisible().catch(() => false)
  }

  /**
   * Get step progression text
   */
  async getStepProgression(): Promise<string> {
    const stepText = await this.stepProgression.first().textContent().catch(() => "")
    return stepText || ""
  }

  /**
   * Wait for text to appear in assistant messages
   */
  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForSelector(`[data-role="assistant"]:has-text("${text}")`, { timeout })
  }

  /**
   * Wait for tool call to appear
   */
  async waitForToolCall(toolName: string, timeout = 10000) {
    await this.page.waitForSelector(`text=/${toolName}/i`, { timeout })
  }

  /**
   * Wait for error message
   */
  async waitForError(timeout = 10000) {
    await this.page.waitForSelector('text=/Error|error/i', { timeout })
  }

  /**
   * Set authentication token in localStorage
   */
  async setAuthToken(token: string) {
    await this.page.addInitScript((t) => {
      localStorage.setItem("authToken", t)
    }, token)
  }

  /**
   * Set username in localStorage
   */
  async setUsername(username: string) {
    await this.page.addInitScript((u) => {
      localStorage.setItem("username", u)
    }, username)
  }

  /**
   * Inject mock langgraph-stream directly without any API call or button click
   * This completely bypasses the send flow and directly injects messages and events
   */
  async injectMockStreamDirect(scenario: "text-streaming" | "tool-call" | "thinking" | "error" | "multiple-events", userMessageText = "Test message") {
    const events = this.getMockStreamEvents(scenario)
    
    // Get initial message count
    const messagesBefore = await this.assistantMessages.count()
    
    // Inject everything directly into the page
    await this.page.evaluate(async ({ events, userMessageText }) => {
      // Helper to create text content for messages
      const createTextContent = (text: string) => ({ type: "text" as const, text })
      
      // Helper to wait
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      
      // Access the window object to store test data
      const w = window as any
      
      // Initialize mock message tracking
      if (!w.__mockMessages) {
        w.__mockMessages = []
      }
      
      // Add user message to mock messages
      const userMessage = {
        role: "user",
        content: [createTextContent(userMessageText)]
      }
      w.__mockMessages.push(userMessage)
      
      // Add a placeholder assistant message
      const assistantMessage = {
        role: "assistant",
        content: [] as any[]
      }
      w.__mockMessages.push(assistantMessage)
      
      // Create containers if they don't exist
      let chatContainer = document.querySelector('[data-test-chat-container]') as HTMLElement
      if (!chatContainer) {
        chatContainer = document.createElement('div')
        chatContainer.setAttribute('data-test-chat-container', 'true')
        // Make container visible but positioned off-screen for testing
        chatContainer.style.position = 'absolute'
        chatContainer.style.left = '-9999px'
        chatContainer.style.top = '0'
        document.body.appendChild(chatContainer)
      }
      
      // Add user message to DOM
      const userDiv = document.createElement('div')
      userDiv.setAttribute('data-role', 'user')
      userDiv.textContent = userMessageText
      chatContainer.appendChild(userDiv)
      
      // Add assistant message container
      const assistantDiv = document.createElement('div')
      assistantDiv.setAttribute('data-role', 'assistant')
      assistantDiv.textContent = ''
      chatContainer.appendChild(assistantDiv)
      
      // Process stream events
      for (const event of events) {
        if (event.type === 'text-delta' && event.text) {
          // Add text to assistant message
          assistantMessage.content.push(createTextContent(event.text))
          assistantDiv.textContent += event.text
        } else if (event.type === 'tool-call-start' && event.part) {
          // Add tool call to assistant message
          assistantMessage.content.push(event.part)
        } else if (event.type === 'tool-result' && event.part) {
          // Update tool call with result
          const toolCall = assistantMessage.content.find(
            (c: any) => c.type === 'tool-call' && c.toolCallId === event.part.toolCallId
          )
          if (toolCall) {
            toolCall.result = event.part.result
          }
        }
        
        // Small delay to simulate streaming
        await wait(10)
      }
      
    }, { events, userMessageText })
    
    // Wait for assistant message to appear
    await this.page.waitForFunction(
      (count) => {
        const messages = document.querySelectorAll('[data-role="assistant"]')
        return messages.length > count
      },
      messagesBefore,
      { timeout: 5000 }
    )
  }

  /**
   * Generate mock stream events for different scenarios
   */
  private getMockStreamEvents(scenario: string): any[] {
    switch (scenario) {
      case "text-streaming":
        return this.getTextStreamingEvents()
      case "tool-call":
        return this.getToolCallEvents()
      case "thinking":
        return this.getThinkingEvents()
      case "error":
        return this.getErrorEvents()
      case "multiple-events":
        return this.getMultipleEvents()
      default:
        return this.getTextStreamingEvents()
    }
  }

  private getTextStreamingEvents(): any[] {
    const fullText = "This is a test response that streams incrementally."
    const words = fullText.split(" ")
    
    const events: any[] = [
      { type: "message-start", role: "assistant" }
    ]
    
    // Add incremental text-delta events
    for (let i = 0; i < words.length; i++) {
      events.push({
        type: "text-delta",
        text: i === 0 ? words[i] : " " + words[i]
      })
    }
    
    events.push({ type: "message-end" })
    events.push({ type: "done" })
    
    return events
  }

  private getToolCallEvents(): any[] {
    return [
      { type: "message-start", role: "assistant" },
      { type: "text-delta", text: "Let me search for that information." },
      {
        type: "tool-call-start",
        part: {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "web_search",
          args: { query: "test query" }
        }
      },
      {
        type: "tool-status",
        tool: "web_search",
        message: "Searching..."
      },
      {
        type: "tool-result",
        part: {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "web_search",
          args: { query: "test query" },
          result: JSON.stringify({
            results: [
              { title: "Test Result", url: "https://example.com", snippet: "Test snippet" }
            ]
          })
        }
      },
      { type: "text-delta", text: " Based on my search, here's what I found: Test snippet" },
      { type: "message-end" },
      { type: "done" }
    ]
  }

  private getThinkingEvents(): any[] {
    const events: any[] = [
      { type: "message-start", role: "assistant" }
    ]
    
    // Add step progression events
    for (let step = 1; step <= 5; step++) {
      events.push({
        type: "step-progression",
        step,
        totalSteps: 5,
        message: `Processing step ${step}`
      })
      events.push({
        type: "thinking",
        message: `Analyzing step ${step}...`
      })
    }
    
    events.push({ type: "text-delta", text: "I've completed my analysis." })
    events.push({ type: "message-end" })
    events.push({ type: "done" })
    
    return events
  }

  private getErrorEvents(): any[] {
    return [
      { type: "message-start", role: "assistant" },
      { type: "error", error: "Mock Anthropic API error: Rate limit exceeded" },
      { type: "done" }
    ]
  }

  private getMultipleEvents(): any[] {
    return [
      { type: "message-start", role: "assistant" },
      { type: "thinking", message: "Analyzing request..." },
      { type: "step-progression", step: 1, totalSteps: 3 },
      { type: "text-delta", text: "Let me help you with that. " },
      {
        type: "tool-call-start",
        part: {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "web_search",
          args: { query: "example" }
        }
      },
      {
        type: "tool-result",
        part: {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "web_search",
          args: { query: "example" },
          result: JSON.stringify({ results: [] })
        }
      },
      { type: "text-delta", text: "Based on my search, here's the answer." },
      { type: "message-end" },
      { type: "done" }
    ]
  }
}
