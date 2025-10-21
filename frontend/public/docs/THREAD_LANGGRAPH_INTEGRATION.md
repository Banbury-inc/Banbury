# Thread Component LangGraph Integration

This guide shows how to activate and use LangGraph in your existing Thread component.

## ✅ **What's Been Added**

### **1. LangGraph Toggle in Tools Menu**
- Added "LangGraph Mode" option in the tools dropdown (wrench icon)
- Visual indicator shows when LangGraph is active
- Enhanced tool descriptions when in LangGraph mode

### **2. Dynamic API Switching**
- Automatically switches between `/api/assistant/stream` and `/api/assistant/langgraph-stream`
- Preserves all existing functionality when LangGraph is disabled
- Seamless transition between modes

### **3. Visual Indicators**
- "LG" badge in composer when LangGraph mode is active
- Enhanced welcome message with LangGraph capabilities
- Tool descriptions show enhanced features in LangGraph mode

## 🚀 **How to Activate**

### **Method 1: UI Toggle (Recommended)**
1. Click the **wrench icon** (🔧) in the message composer
2. Check **"LangGraph Mode"** in the dropdown
3. The interface will immediately switch to LangGraph-powered responses

### **Method 2: Programmatically**
```typescript
// Set in localStorage
const toolPreferences = {
  web_search: true,
  tiptap_ai: true,
  read_file: true,
  langgraph_mode: true  // Enable LangGraph
};
localStorage.setItem("toolPreferences", JSON.stringify(toolPreferences));
```

## 📱 **Usage Examples**

### **Basic Integration**
Your existing Thread component works exactly the same:

```tsx
import { Thread } from '../components/thread';

function MyApp() {
  return (
    <Thread 
      userInfo={{ username: "john_doe", email: "john@example.com" }}
      selectedFile={null}
    />
  );
}
```

### **With AssistantProvider (Optional)**
For more control over the runtime:

```tsx
import { Thread } from '../components/thread';
import { AssistantProvider } from '../components/AssistantProvider';

function MyApp() {
  return (
    <AssistantProvider userInfo={{ username: "john_doe" }}>
      <Thread 
        userInfo={{ username: "john_doe", email: "john@example.com" }}
        selectedFile={null}
      />
    </AssistantProvider>
  );
}
```

## 🎯 **Testing LangGraph Features**

### **1. Memory Management**
```
User: "Remember that I prefer Python for data analysis"
Assistant: [Stores in memory using LangGraph's memory tools]

User: "What do you remember about my preferences?"
Assistant: [Retrieves from memory] "You prefer Python for data analysis..."
```

### **2. Multi-Step Workflows**
```
User: "Search for the latest AI news and create a summary document"
Assistant: [Uses web search tool → processes results → uses tiptap_ai tool to format]
```

### **3. Enhanced Web Search**
```
User: "What's happening with quantum computing this week?"
Assistant: [Uses Tavily + content enrichment → provides detailed summary with citations]
```

### **4. Document Editing**
```
User: "Rewrite this text to be more professional: Hey there, what's up?"
Assistant: [Uses tiptap_ai tool → provides formatted HTML for direct editor integration]
```

## 🔧 **Configuration**

### **Tool Preferences**
When LangGraph mode is active, tool preferences are enhanced:

- **Web Search**: Enhanced with content enrichment and Tavily integration
- **TipTap AI**: Document editing workflows with better context
- **Read File**: Advanced file processing with better extraction
- **Memory**: Always enabled for persistent conversation context

### **Visual Indicators**
- **"LG" Badge**: Shows in composer when LangGraph is active
- **Blue Lightning Icon**: Indicates LangGraph mode in welcome screen
- **Enhanced Descriptions**: Tool dropdown shows upgraded capabilities

## 🔄 **Switching Between Modes**

### **From Standard to LangGraph**
1. Open tools menu (wrench icon)
2. Enable "LangGraph Mode"
3. Interface updates immediately
4. Next messages use LangGraph workflow

### **From LangGraph to Standard**
1. Open tools menu
2. Disable "LangGraph Mode"  
3. Interface reverts to standard mode
4. Next messages use original API

### **Settings Persistence**
- Tool preferences are saved to localStorage
- Mode selection persists across browser sessions
- Can be reset by clearing browser data

## 📊 **Feature Comparison**

| Feature | Standard Mode | LangGraph Mode |
|---------|---------------|----------------|
| **Web Search** | DuckDuckGo only | Tavily + DuckDuckGo + content enrichment |
| **Memory** | None | Persistent conversation memory |
| **Multi-step Tasks** | Single tool calls | Orchestrated workflows |
| **Document Editing** | Basic TipTap integration | Advanced workflow-based editing |
| **Tool Coordination** | Independent tools | Coordinated tool sequences |
| **Context Awareness** | Per-message | Cross-conversation with memory |

## 🛠 **API Endpoints**

### **Standard Mode**
- Endpoint: `/api/assistant/stream`
- Simple tool calling
- Stateless responses

### **LangGraph Mode**  
- Endpoint: `/api/assistant/langgraph-stream`
- Workflow orchestration
- Stateful with memory
- Enhanced streaming with tool progress

## 🔍 **Debugging**

### **Check Current Mode**
```javascript
// In browser console
const prefs = JSON.parse(localStorage.getItem("toolPreferences") || "{}");
console.log("LangGraph Mode:", prefs.langgraph_mode);
```

### **Monitor API Calls**
- Standard mode calls: `/api/assistant/stream`
- LangGraph mode calls: `/api/assistant/langgraph-stream`

### **Tool Execution Visibility**
LangGraph mode shows real-time tool execution in the chat interface:
- 🔧 Tool started
- ⏳ Tool executing  
- ✅ Tool completed with results

## 💡 **Best Practices**

### **When to Use LangGraph Mode**
- ✅ Complex multi-step tasks
- ✅ Need conversation memory
- ✅ Advanced web research
- ✅ Document creation workflows
- ✅ Data analysis tasks

### **When to Use Standard Mode**
- ✅ Simple Q&A
- ✅ Quick responses needed
- ✅ Basic file processing
- ✅ Minimal latency required

### **Performance Tips**
- LangGraph mode has slightly higher latency due to workflow orchestration
- Memory and tool coordination provide better results for complex tasks
- Standard mode is faster for simple requests

## 🚨 **Troubleshooting**

### **Mode Not Switching**
1. Check browser console for errors
2. Verify localStorage permissions
3. Clear localStorage and retry: `localStorage.clear()`

### **LangGraph API Errors**
1. Check that `/api/assistant/langgraph-stream` endpoint exists
2. Verify environment variables (ANTHROPIC_API_KEY, etc.)
3. Check browser network tab for 404/500 errors

### **Tool Preferences Not Saving**
1. Check localStorage permissions
2. Verify JSON format in localStorage
3. Try incognito mode to test

## 🎉 **You're Ready!**

The LangGraph integration is now fully active in your Thread component. Users can toggle between modes seamlessly, and you get all the advanced workflow capabilities of athena-intelligence right in your existing interface.

Try asking complex questions or multi-step tasks to see the difference! 🚀
