// LangGraph configuration following athena-intelligence patterns
export interface LangGraphConfig {
  // Model configuration
  model: string;
  temperature: number;
  maxTokens?: number;
  
  // Workflow configuration
  recursionLimit: number;
  streamMode: "values" | "updates" | "debug";
  
  // Tool configuration
  enabledTools: string[];
  parallelFunctionCalling: boolean;
  backendParallelFunctionCalling: boolean;
  frontendParallelFunctionCalling: boolean;
  
  // Memory configuration
  memoryCollectorEnabled: boolean;
  memoryInjectionEnabled: boolean;
  maxPastMessagesForSubagents: number;
  
  // Message configuration
  messageTrimming: boolean;
  maxMessagesInContext: number;
  
  // Session configuration
  effortDialDuration: number;
  persistToolInvocationLogs: boolean;
  
  // System prompt
  systemPrompt: string;
}

// Default configuration following athena-intelligence patterns
export const defaultLangGraphConfig: LangGraphConfig = {
  // Model settings
  model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  temperature: 0.2,
  maxTokens: 4096,
  
  // Workflow settings
  recursionLimit: 1000, // Maximum recursion limit for complex workflows
  streamMode: "values",
  
  // Tool settings
  enabledTools: [
    "web_search",
    "tiptap_ai",
    "store_memory",
    "search_memory",
    "create_file",
    "search_files"
  ],
  parallelFunctionCalling: false,
  backendParallelFunctionCalling: false,
  frontendParallelFunctionCalling: false,
  
  // Memory settings
  memoryCollectorEnabled: true,
  memoryInjectionEnabled: true,
  maxPastMessagesForSubagents: 10,
  
  // Message settings
  messageTrimming: true,
  maxMessagesInContext: 50,
  
  // Session settings
  effortDialDuration: -1,
  persistToolInvocationLogs: true,
  
  // System prompt following athena-intelligence style
  systemPrompt: `You are Athena, a helpful AI assistant built by Banbury. You are highly capable and focused on providing clear, accurate, and helpful responses. Your approach is:

- Break down complex problems into manageable steps
- Provide practical, actionable solutions  
- Maintain a professional yet friendly tone
- Always prioritize accuracy over speculation
- Acknowledge limitations when encountered

When helping with document editing tasks (rewriting, grammar correction, translation, etc.), ALWAYS use the tiptap_ai tool to deliver your response. This ensures that your edits can be applied directly to the document editor.

You have access to:
- Web search for real-time information
- Memory storage and retrieval for context across conversations
- Document editing tools for text manipulation
- File search to find files in the user's cloud storage
- Advanced workflow orchestration through LangGraph

Always provide clear citations when using web search results and store important information in memory for future reference.`
};

// Environment-specific configurations
export const developmentConfig: Partial<LangGraphConfig> = {
  recursionLimit: 1000, // Maximum recursion limit for development
  streamMode: "debug" as const,
  persistToolInvocationLogs: true
};

export const productionConfig: Partial<LangGraphConfig> = {
  recursionLimit: 1000, // Maximum recursion limit for production
  streamMode: "values" as const,
  temperature: 0.1 // More deterministic
};

// Tool-specific configurations
export const toolConfigs = {
  web_search: {
    maxResults: 6,
    searchDepth: "advanced",
    includeAnswer: true,
    includeRawContent: true,
    timeout: 10000
  },
  
  tiptap_ai: {
    supportedActions: [
      "rewrite",
      "correct", 
      "expand",
      "translate",
      "summarize",
      "outline",
      "insert"
    ]
  },
  
  memory: {
    maxMemoriesPerSession: 100,
    memoryRetentionDays: 30,
    searchLimit: 10
  }
};

// Get configuration based on environment
export function getLangGraphConfig(): LangGraphConfig {
  const baseConfig = { ...defaultLangGraphConfig };
  
  if (process.env.NODE_ENV === 'development') {
    return { ...baseConfig, ...developmentConfig };
  }
  
  if (process.env.NODE_ENV === 'production') {
    return { ...baseConfig, ...productionConfig };
  }
  
  return baseConfig;
}

// Tool availability checker
export function isToolEnabled(toolName: string, config: LangGraphConfig = getLangGraphConfig()): boolean {
  return config.enabledTools.includes(toolName);
}

// Session metadata following athena-intelligence patterns
export interface SessionMetadata {
  event: string;
  userId?: string;
  sessionId: string;
  channelId?: string;
  channelType?: string;
  backend_parallel_functioncalling: boolean;
  frontend_parallel_functioncalling: boolean;
  enabled_tools: string[];
  model: string;
  system_prompt: string;
  temperature: number;
  memory_collector_enabled: boolean;
  memory_injection_enabled: boolean;
  max_past_messages_for_subagents: number;
  effort_dial_duration: number;
  message_trimming: boolean;
  persistToolInvocationLogs: boolean;
}

export function createSessionMetadata(
  sessionId: string,
  userId?: string,
  overrides: Partial<SessionMetadata> = {}
): SessionMetadata {
  const config = getLangGraphConfig();
  
  return {
    event: "web_chat",
    userId,
    sessionId,
    channelType: "web",
    backend_parallel_functioncalling: config.backendParallelFunctionCalling,
    frontend_parallel_functioncalling: config.frontendParallelFunctionCalling,
    enabled_tools: config.enabledTools,
    model: config.model,
    system_prompt: config.systemPrompt,
    temperature: config.temperature,
    memory_collector_enabled: config.memoryCollectorEnabled,
    memory_injection_enabled: config.memoryInjectionEnabled,
    max_past_messages_for_subagents: config.maxPastMessagesForSubagents,
    effort_dial_duration: config.effortDialDuration,
    message_trimming: config.messageTrimming,
    persistToolInvocationLogs: config.persistToolInvocationLogs,
    ...overrides
  };
}
