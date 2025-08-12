# LangGraph Integration Guide

This document explains how to use the new LangGraph-powered assistant integration in the Banbury Website, following patterns from athena-intelligence.

## Overview

The LangGraph integration provides:
- **Workflow Orchestration**: Complex multi-step reasoning and tool use
- **Memory Management**: Persistent conversation memory across sessions
- **Advanced Tool Integration**: Web search, document editing, and custom tools
- **Streaming Responses**: Real-time updates with tool execution visibility

## Files Created

### Core LangGraph Implementation
- `src/lib/langraph/agent.ts` - Main LangGraph workflow definition
- `src/lib/langraph/utils.ts` - Utility functions for session and memory management
- `src/lib/langraph/config.ts` - Configuration following athena-intelligence patterns

### API Integration
- `pages/api/assistant/langgraph-stream.ts` - New streaming API endpoint using LangGraph
- `src/hooks/useLangGraphAssistant.ts` - React hook for frontend integration

### Testing
- `pages/test-langgraph.tsx` - Test page to try the LangGraph integration

## Quick Start

### 1. Test the Integration

Visit `/test-langgraph` to try the new LangGraph-powered assistant:

```bash
# Navigate to the test page
http://localhost:3000/test-langgraph
```

### 2. Using the React Hook

```typescript
import { useLangGraphAssistant } from '../src/hooks/useLangGraphAssistant';

function MyComponent() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation
  } = useLangGraphAssistant();

  const handleSend = async () => {
    await sendMessage("What's the latest news about AI?");
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{/* render message */}</div>
      ))}
      <button onClick={handleSend} disabled={isLoading}>
        Send Message
      </button>
    </div>
  );
}
```

### 3. Direct API Usage

```typescript
const response = await fetch('/api/assistant/langgraph-stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [
      { role: "user", content: [{ type: "text", text: "Hello!" }] }
    ],
    threadId: "optional-thread-id",
    toolPreferences: {
      web_search: true,
      tiptap_ai: true,
      memory: true
    }
  })
});
```

## Features

### 1. Web Search
The assistant can search the web for real-time information:
```
"What's the latest news about quantum computing?"
```

### 2. Memory Management
Store and retrieve information across conversations:
```
"Remember that I prefer Python for data analysis"
"What do you remember about my programming preferences?"
```

### 3. Document Editing
Integrated with Tiptap editor for document manipulation:
```
"Rewrite this text to be more formal: Hey there, how's it going?"
```

### 4. Multi-step Reasoning
Complex tasks that require multiple tools:
```
"Search for information about the latest AI developments, remember the key points, and then create a summary document"
```

## Configuration

### Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=your-anthropic-key
TAVILY_API_KEY=your-tavily-key  # Optional, for enhanced web search

# Optional
ANTHROPIC_MODEL=claude-sonnet-4-20250514
NODE_ENV=development
```

### Customizing Tool Availability
Edit `src/lib/langraph/config.ts`:

```typescript
export const defaultLangGraphConfig = {
  enabledTools: [
    "web_search",      // Web search capability
    "tiptap_ai",       // Document editing
    "store_memory",    // Memory storage
    "search_memory"    // Memory retrieval
  ],
  // ... other settings
};
```

### Adjusting System Prompt
Modify the `systemPrompt` in the config to change the assistant's behavior:

```typescript
systemPrompt: `You are Athena, a helpful AI assistant...`
```

## Integration with Existing Code

### Option 1: Replace Existing Assistant
Update your existing assistant components to use the new hook:

```typescript
// Before
import { useAssistant } from 'old-hook';

// After  
import { useLangGraphAssistant } from '../src/hooks/useLangGraphAssistant';
```

### Option 2: Feature Flag
Add a feature flag to switch between implementations:

```typescript
const USE_LANGGRAPH = process.env.REACT_APP_USE_LANGGRAPH === 'true';

const assistant = USE_LANGGRAPH 
  ? useLangGraphAssistant()
  : useOriginalAssistant();
```

### Option 3: Side-by-Side
Keep both implementations and let users choose:

```typescript
const [useAdvanced, setUseAdvanced] = useState(false);

return (
  <div>
    <toggle onChange={setUseAdvanced}>Advanced Mode (LangGraph)</toggle>
    {useAdvanced ? <LangGraphChat /> : <OriginalChat />}
  </div>
);
```

## Tool Development

### Adding Custom Tools
Create new tools following the LangChain pattern:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const myCustomTool = tool(
  async (input: { param: string }) => {
    // Tool implementation
    return "Tool result";
  },
  {
    name: "my_custom_tool",
    description: "Description of what this tool does",
    schema: z.object({
      param: z.string().describe("Parameter description")
    })
  }
);

// Add to tools array in agent.ts
const tools = [webSearchTool, tiptapAiTool, myCustomTool];
```

### Memory Patterns
Store structured information in memory:

```typescript
// Store user preferences
await createMemoryTool.invoke({
  content: "User prefers dark mode UI",
  type: "preference",
  sessionId: threadId
});

// Store factual information
await createMemoryTool.invoke({
  content: "Company meeting scheduled for Friday 2PM",
  type: "schedule",
  sessionId: threadId
});
```

## Monitoring and Debugging

### Stream Events
The LangGraph integration provides detailed streaming events:

- `message-start` - Assistant begins responding
- `text-delta` - Incremental text updates
- `tool-call` - Tool execution started
- `tool-result` - Tool execution completed
- `message-end` - Response finished
- `error` - Error occurred

### Debug Mode
Enable debug mode in development:

```typescript
// In config.ts
export const developmentConfig = {
  streamMode: "debug",
  recursionLimit: 15
};
```

### Tool Execution Visibility
The UI shows which tools are currently running:

```typescript
const { toolsInProgress } = useLangGraphAssistant();

return (
  <div>
    {toolsInProgress.length > 0 && (
      <div>Running tools: {toolsInProgress.join(', ')}</div>
    )}
  </div>
);
```

## Performance Considerations

### Memory Management
- Sessions automatically clean up after 24 hours
- Memory is limited to 100 items per session
- Use typed memory for better retrieval

### Tool Optimization
- Web search includes content enrichment but has timeouts
- Document processing handles large files with chunking
- Memory search uses simple keyword matching (can be enhanced)

### Streaming
- Uses Server-Sent Events for real-time updates
- Includes abort functionality for stopping generation
- Tool results are streamed as they complete

## Migration Path

1. **Test Phase**: Use the test page to verify functionality
2. **Parallel Deployment**: Run both systems side-by-side
3. **Gradual Migration**: Feature-flag specific components
4. **Full Migration**: Replace original implementation
5. **Cleanup**: Remove old assistant code

## Troubleshooting

### Common Issues

**API Key Errors**:
```
Error: Anthropic API key not found
```
Solution: Set `ANTHROPIC_API_KEY` environment variable

**Tool Execution Timeouts**:
```
Tool execution timed out
```
Solution: Increase timeout in tool configs or check network connectivity

**Memory Not Persisting**:
```
No relevant memories found
```
Solution: Ensure `sessionId` is consistent across requests

**File Upload Issues**:
```
File processing failed
```
Solution: Check file size limits and supported formats

### Debug Commands

```bash
# Check API endpoint
curl -X POST http://localhost:3000/api/assistant/langgraph-stream \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":[{"type":"text","text":"Hello"}]}]}'

# Check environment variables
echo $ANTHROPIC_API_KEY | cut -c1-10
```

## Next Steps

1. **Custom Tools**: Add domain-specific tools for your use case
2. **Enhanced Memory**: Implement vector search for better memory retrieval
3. **Multi-Modal**: Add support for more file types and media
4. **Analytics**: Add logging and metrics for tool usage
5. **Deployment**: Set up production environment with proper scaling

## Support

For questions or issues with the LangGraph integration:
1. Check the test page for basic functionality
2. Review the configuration in `config.ts`
3. Look at console logs for detailed error messages
4. Compare with the athena-intelligence implementation patterns

The integration follows the exact same patterns as athena-intelligence, so their documentation and approaches should be directly applicable to this implementation.
