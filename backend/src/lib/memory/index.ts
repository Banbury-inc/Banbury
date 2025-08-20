// Core memory types and interfaces
export * from './types';

// Memory service and configuration
export { MemoryService } from './service';
export * from './config';

// Memory tools for LangGraph integration
export * from './toolkit';

// Memory utilities and helpers
export { 
  asyncAddMemory, 
  asyncSearchMemory,
  getMemoryTools,
  createMemorySearchTool,
  createMemoryStorageTool,
  createMemoryContextTool
} from './toolkit';

// Memory configuration utilities
export {
  memoryConfig,
  validateMemoryConfig,
  isMemoryEnabled,
  getMemoryConfig,
  memoryFeatures,
  memoryErrors,
  memorySuccess
} from './config';

/**
 * Initialize memory service with configuration
 */
export function createMemoryService() {
  const config = memoryConfig;
  
  if (!isMemoryEnabled()) {
    console.warn('Memory features are not enabled. Please configure ZEP_API_KEY or MEM0_API_KEY.');
    return null;
  }
  
  return new MemoryService(config);
}

/**
 * Get memory tools for LangGraph integration
 */
export function getMemoryToolsForLangGraph() {
  const memoryService = createMemoryService();
  
  if (!memoryService) {
    console.warn('Memory service not available. Returning empty tools array.');
    return [];
  }
  
  return getMemoryTools(memoryService);
}

/**
 * Memory management utilities
 */
export const memoryUtils = {
  /**
   * Generate a session ID for memory operations
   */
  generateSessionId: (userId: string, timestamp?: number): string => {
    const ts = timestamp || Date.now();
    return `session_${userId}_${ts}`;
  },

  /**
   * Generate a memory ID for storage operations
   */
  generateMemoryId: (userId: string, content: string): string => {
    const hash = content.substring(0, 8).replace(/[^a-zA-Z0-9]/g, '');
    return `memory_${userId}_${hash}_${Date.now()}`;
  },

  /**
   * Truncate content to fit memory limits
   */
  truncateContent: (content: string, maxLength: number = 10000): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  },

  /**
   * Split content into chunks for storage
   */
  splitContentIntoChunks: (content: string, maxChunkSize: number = 10000): string[] => {
    if (content.length <= maxChunkSize) return [content];
    
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + sentence + '.';
      if (testChunk.length <= maxChunkSize) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentence + '.';
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  },

  /**
   * Format memory search results for display
   */
  formatMemoryResults: (results: any): string => {
    if (!results || (results.facts?.length === 0 && results.entities?.length === 0)) {
      return 'No relevant memories found.';
    }

    let formatted = 'Memory search results:\n\n';
    
    if (results.facts?.length > 0) {
      formatted += 'FACTS:\n';
      results.facts.forEach((fact: any, index: number) => {
        formatted += `${index + 1}. ${fact.fact}\n`;
        if (fact.confidence) {
          formatted += `   Confidence: ${(fact.confidence * 100).toFixed(1)}%\n`;
        }
      });
      formatted += '\n';
    }

    if (results.entities?.length > 0) {
      formatted += 'ENTITIES:\n';
      results.entities.forEach((entity: any, index: number) => {
        formatted += `${index + 1}. ${entity.name} (${entity.type})\n`;
        if (entity.summary) {
          formatted += `   Summary: ${entity.summary}\n`;
        }
        if (entity.attributes) {
          formatted += `   Attributes: ${JSON.stringify(entity.attributes)}\n`;
        }
      });
    }

    return formatted;
  },

  /**
   * Validate memory configuration
   */
  validateConfig: (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!memoryConfig.zepApiKey) {
      errors.push('ZEP_API_KEY is not configured');
    }
    
    if (!memoryConfig.mem0ApiKey) {
      errors.push('MEM0_API_KEY is not configured (optional)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Default export for convenience
export default {
  MemoryService,
  createMemoryService,
  getMemoryToolsForLangGraph,
  memoryUtils,
  memoryConfig,
  memoryFeatures,
  isMemoryEnabled,
  validateMemoryConfig
};
