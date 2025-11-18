import { CONFIG } from '../config/config';

/**
 * Frontend client for memory management operations
 */
export class MemoryClient {
  private apiBase: string;
  private authToken: string | null;

  constructor() {
    this.apiBase = CONFIG.url;
    this.authToken = null;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Check memory service health
   */
  async checkHealth(): Promise<{ status: string; memory_enabled: boolean }> {
    const response = await fetch(`${this.apiBase}/api/memory?action=health`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get memory service status
   */
  async getStatus(): Promise<any> {
    const response = await fetch(`${this.apiBase}/api/memory?action=status`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Search memories
   */
  async searchMemories(
    query: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    },
    options: {
      scope?: 'nodes' | 'edges';
      reranker?: 'cross_encoder' | 'rrf' | 'mmr' | 'episode_mentions';
      maxResults?: number;
    } = {}
  ): Promise<any> {
    const response = await fetch(`${this.apiBase}/api/memory`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        operation: 'search',
        query,
        scope: options.scope || 'nodes',
        reranker: options.reranker || 'cross_encoder',
        maxResults: options.maxResults || 10,
        ...userInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory search failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Store memory
   */
  async storeMemory(
    content: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    },
    options: {
      dataType?: 'text' | 'json' | 'message';
      overflowStrategy?: 'truncate' | 'split' | 'fail';
    } = {}
  ): Promise<any> {
    const response = await fetch(`${this.apiBase}/api/memory`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        operation: 'store',
        content,
        dataType: options.dataType || 'text',
        overflowStrategy: options.overflowStrategy || 'split',
        ...userInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory storage failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get memory context
   */
  async getMemoryContext(
    sessionId: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    },
    options: {
      limit?: number;
      messages?: any[];
    } = {}
  ): Promise<any> {
    const response = await fetch(`${this.apiBase}/api/memory`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        operation: 'context',
        sessionId,
        limit: options.limit || 10,
        messages: options.messages || [],
        ...userInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory context retrieval failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Store user preference
   */
  async storeUserPreference(
    preference: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
    }
  ): Promise<any> {
    return await this.storeMemory(
      `User preference: ${preference}`,
      userInfo,
      { dataType: 'text' }
    );
  }

  /**
   * Store conversation context
   */
  async storeConversationContext(
    context: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
    }
  ): Promise<any> {
    return await this.storeMemory(
      `Conversation context: ${context}`,
      userInfo,
      { dataType: 'text' }
    );
  }

  /**
   * Search for user preferences
   */
  async searchUserPreferences(
    query: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
    }
  ): Promise<any> {
    return await this.searchMemories(
      `user preferences ${query}`,
      userInfo,
      { scope: 'nodes' }
    );
  }

  /**
   * Search for conversation history
   */
  async searchConversationHistory(
    query: string,
    userInfo: {
      userId: string;
      workspaceId: string;
      email: string;
    }
  ): Promise<any> {
    return await this.searchMemories(
      `conversation history ${query}`,
      userInfo,
      { scope: 'edges' }
    );
  }
}

/**
 * Create a memory client instance
 */
export function createMemoryClient(): MemoryClient {
  return new MemoryClient();
}

/**
 * Memory utility functions
 */
export const memoryUtils = {
  /**
   * Generate a session ID
   */
  generateSessionId: (userId: string): string => {
    return `session_${userId}_${Date.now()}`;
  },

  /**
   * Format memory search results for display
   */
  formatSearchResults: (results: any): string => {
    if (!results || results.status !== 'success') {
      return 'No results found.';
    }

    return results.formatted_results || 'Search completed successfully.';
  },

  /**
   * Extract facts from search results
   */
  extractFacts: (results: any): string[] => {
    if (!results?.results?.facts) return [];
    return results.results.facts.map((fact: any) => fact.fact);
  },

  /**
   * Extract entities from search results
   */
  extractEntities: (results: any): any[] => {
    if (!results?.results?.entities) return [];
    return results.results.entities;
  },

  /**
   * Check if memory service is available
   */
  isMemoryAvailable: async (client: MemoryClient): Promise<boolean> => {
    try {
      const health = await client.checkHealth();
      return health.memory_enabled;
    } catch {
      return false;
    }
  },
};

/**
 * React hook for memory operations
 */
export function useMemory() {
  const client = createMemoryClient();

  return {
    client,
    checkHealth: () => client.checkHealth(),
    getStatus: () => client.getStatus(),
    searchMemories: client.searchMemories.bind(client),
    storeMemory: client.storeMemory.bind(client),
    getMemoryContext: client.getMemoryContext.bind(client),
    storeUserPreference: client.storeUserPreference.bind(client),
    storeConversationContext: client.storeConversationContext.bind(client),
    searchUserPreferences: client.searchUserPreferences.bind(client),
    searchConversationHistory: client.searchConversationHistory.bind(client),
    utils: memoryUtils,
  };
}

// Default export
export default MemoryClient;
