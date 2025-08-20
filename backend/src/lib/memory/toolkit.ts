import { tool } from '@langchain/core/tools';
import { MemoryService } from './service';
import { UserMemory, SearchScope, RerankerType, OverflowStrategy } from './types';

// Project ID mappings for Mem0
const PROJECT_IDS: Record<string, string> = {
  "default-project": "proj_default",
  "banbury-main": "proj_banbury_main",
  "banbury-dev": "proj_banbury_dev",
  "user-personal": "proj_user_personal",
};

// User configurations for Mem0
const USER_CONFIGS: Record<string, {
  apiKey: string;
  orgName: string;
  projects: string[];
}> = {
  "default@banbury.com": {
    apiKey: process.env.MEM0_API_KEY || "",
    orgName: "banbury-org",
    projects: ["banbury-main", "user-personal"]
  },
};

/**
 * Get project IDs from project names
 */
function getProjectIds(projectNames: string[]): string[] {
  return projectNames
    .map(name => PROJECT_IDS[name])
    .filter(id => id !== undefined);
}

/**
 * Get memory client for a user
 */
function getMemoryClient(userEmail: string): any {
  if (!USER_CONFIGS[userEmail]) {
    throw new Error(`No memory configuration found for user: ${userEmail}`);
  }
  
  const config = USER_CONFIGS[userEmail];
  // Note: In a real implementation, you would import and use the Mem0 client here
  // For now, we'll return a mock client
  return {
    apiKey: config.apiKey,
    orgName: config.orgName,
    projects: config.projects,
  };
}

/**
 * Add memory to the user's memory store
 */
export async function asyncAddMemory(
  userEmail: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const client = getMemoryClient(userEmail);
    
    // In a real implementation, you would use the Mem0 client to add memory
    // For now, we'll return a success message
    console.log(`Adding ${messages.length} messages to memory for user: ${userEmail}`);
    
    return `Successfully added ${messages.length} messages to memory for user ${userEmail}`;
  } catch (error) {
    console.error('Error adding memory:', error);
    return `Error adding memory: ${error}`;
  }
}

/**
 * Search memory for the user
 */
export async function asyncSearchMemory(
  userEmail: string,
  query: string
): Promise<string> {
  try {
    const client = getMemoryClient(userEmail);
    
    // In a real implementation, you would use the Mem0 client to search memory
    // For now, we'll return a mock result
    console.log(`Searching memory for user: ${userEmail} with query: ${query}`);
    
    return `Memory search results for "${query}": No relevant memories found.`;
  } catch (error) {
    console.error('Error searching memory:', error);
    return `Error searching memory: ${error}`;
  }
}

/**
 * Create memory search tool for LangGraph
 */
export function createMemorySearchTool(memoryService: MemoryService) {
  return tool({
    name: "search_memory",
    description: "Search through the user's memories from previous conversations and interactions. Use this to find relevant information about the user's preferences, past conversations, or stored knowledge.",
    schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Simple, concise search query to find relevant memories."
        },
        scope: {
          type: "string",
          enum: ["nodes", "edges"],
          description: "Scope of the search: 'nodes' for entities/concepts, 'edges' for relationships/facts"
        },
        reranker: {
          type: "string",
          enum: ["cross_encoder", "rrf", "mmr", "episode_mentions"],
          description: "Method to rerank results for better relevance"
        },
        maxResults: {
          type: "number",
          description: "Maximum number of results to return (default: 10)"
        }
      },
      required: ["query"]
    },
    func: async ({ query, scope = "nodes", reranker = "cross_encoder", maxResults = 10 }, runManager) => {
      try {
        // In a real implementation, you would get the user from the context
        const mockUser: UserMemory = {
          userId: "user123",
          workspaceId: "workspace123",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example"
        };

        const result = await memoryService.searchMemories(
          mockUser,
          query,
          scope as SearchScope,
          reranker as RerankerType,
          maxResults
        );

        if (result.facts.length === 0 && result.entities.length === 0) {
          return "No relevant memories found for the given query.";
        }

        let response = "Memory search results:\n\n";
        
        if (result.facts.length > 0) {
          response += "FACTS:\n";
          result.facts.forEach((fact, index) => {
            response += `${index + 1}. ${fact.fact} (confidence: ${fact.confidence.toFixed(2)})\n`;
          });
          response += "\n";
        }

        if (result.entities.length > 0) {
          response += "ENTITIES:\n";
          result.entities.forEach((entity, index) => {
            response += `${index + 1}. ${entity.name} (${entity.type})\n`;
            response += `   Summary: ${entity.summary}\n`;
            if (entity.attributes) {
              response += `   Attributes: ${JSON.stringify(entity.attributes)}\n`;
            }
            response += "\n";
          });
        }

        return response;
      } catch (error) {
        console.error('Error in memory search tool:', error);
        return `Error searching memory: ${error}`;
      }
    }
  });
}

/**
 * Create memory storage tool for LangGraph
 */
export function createMemoryStorageTool(memoryService: MemoryService) {
  return tool({
    name: "store_memory",
    description: "Store important information in the user's memory for future reference. Use this to remember user preferences, important facts, or key information from conversations.",
    schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The information to store in memory"
        },
        dataType: {
          type: "string",
          enum: ["text", "json", "message"],
          description: "Type of data being stored"
        },
        overflowStrategy: {
          type: "string",
          enum: ["truncate", "split", "fail"],
          description: "How to handle data that exceeds size limits"
        }
      },
      required: ["content"]
    },
    func: async ({ content, dataType = "text", overflowStrategy = "split" }, runManager) => {
      try {
        // In a real implementation, you would get the user from the context
        const mockUser: UserMemory = {
          userId: "user123",
          workspaceId: "workspace123",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example"
        };

        const result = await memoryService.addBusinessDataToGraph(
          mockUser,
          content,
          dataType as "text" | "json" | "message",
          overflowStrategy as OverflowStrategy
        );

        return `Successfully stored information in memory. Content length: ${content.length} characters.`;
      } catch (error) {
        console.error('Error in memory storage tool:', error);
        return `Error storing memory: ${error}`;
      }
    }
  });
}

/**
 * Create memory context retrieval tool for LangGraph
 */
export function createMemoryContextTool(memoryService: MemoryService) {
  return tool({
    name: "get_memory_context",
    description: "Retrieve relevant context from the user's memory based on the current conversation. This helps provide personalized and contextual responses.",
    schema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Current session ID for context retrieval"
        },
        limit: {
          type: "number",
          description: "Maximum number of memory items to retrieve (default: 10)"
        }
      },
      required: ["sessionId"]
    },
    func: async ({ sessionId, limit = 10 }, runManager) => {
      try {
        // In a real implementation, you would get the user and messages from the context
        const mockUser: UserMemory = {
          userId: "user123",
          workspaceId: "workspace123",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example"
        };

        // Mock messages - in real implementation, these would come from the conversation context
        const mockMessages: any[] = [
          { _getType: () => 'human', content: 'Hello, how are you?' }
        ];

        const context = await memoryService.addMemoryAndGetContext(
          mockUser,
          sessionId,
          mockMessages,
          false, // memoryCollectorEnabled
          true,  // memoryInjectionEnabled
          limit
        );

        if (!context) {
          return "No relevant memory context found for the current conversation.";
        }

        return `Memory context retrieved:\n\n${context}`;
      } catch (error) {
        console.error('Error in memory context tool:', error);
        return `Error retrieving memory context: ${error}`;
      }
    }
  });
}

/**
 * Get all memory tools for LangGraph
 */
export function getMemoryTools(memoryService: MemoryService) {
  return [
    createMemorySearchTool(memoryService),
    createMemoryStorageTool(memoryService),
    createMemoryContextTool(memoryService),
  ];
}
