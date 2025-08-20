import { MemoryConfig } from './types';

/**
 * Memory configuration with environment variables
 */
export const memoryConfig: MemoryConfig = {
  zepApiKey: process.env.ZEP_API_KEY || '',
  mem0ApiKey: process.env.MEM0_API_KEY || '',
  maxDataSizeCharacters: 10000, // 10k characters
};

/**
 * Validate memory configuration
 */
export function validateMemoryConfig(): void {
  if (!memoryConfig.zepApiKey) {
    console.warn('ZEP_API_KEY not found in environment variables. Memory features will be limited.');
  }
  
  if (!memoryConfig.mem0ApiKey) {
    console.warn('MEM0_API_KEY not found in environment variables. Mem0 features will be disabled.');
  }
}

/**
 * Check if memory features are available
 */
export function isMemoryEnabled(): boolean {
  return !!(memoryConfig.zepApiKey || memoryConfig.mem0ApiKey);
}

/**
 * Get memory configuration for a specific environment
 */
export function getMemoryConfig(environment: 'development' | 'production' | 'test' = 'development'): MemoryConfig {
  const baseConfig = { ...memoryConfig };
  
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        maxDataSizeCharacters: 5000, // Smaller limit for development
      };
    case 'production':
      return {
        ...baseConfig,
        maxDataSizeCharacters: 15000, // Larger limit for production
      };
    case 'test':
      return {
        ...baseConfig,
        maxDataSizeCharacters: 1000, // Very small limit for testing
      };
    default:
      return baseConfig;
  }
}

/**
 * Memory feature flags
 */
export const memoryFeatures = {
  // Enable/disable specific memory features
  enableZepMemory: !!memoryConfig.zepApiKey,
  enableMem0Memory: !!memoryConfig.mem0ApiKey,
  enableMemorySearch: !!memoryConfig.zepApiKey,
  enableMemoryStorage: !!memoryConfig.zepApiKey,
  enableMemoryContext: !!memoryConfig.zepApiKey,
  
  // Memory settings
  defaultMemoryLimit: 10,
  defaultSearchScope: 'nodes' as const,
  defaultReranker: 'cross_encoder' as const,
  defaultOverflowStrategy: 'split' as const,
  
  // Session settings
  sessionTimeoutHours: 24,
  maxSessionsPerUser: 100,
  
  // Graph settings
  enableEntityExtraction: true,
  enableFactStorage: true,
  enableRelationshipMapping: true,
};

/**
 * Memory error messages
 */
export const memoryErrors = {
  ZEP_NOT_CONFIGURED: 'Zep Cloud is not configured. Please set ZEP_API_KEY environment variable.',
  MEM0_NOT_CONFIGURED: 'Mem0 is not configured. Please set MEM0_API_KEY environment variable.',
  USER_NOT_FOUND: 'User not found in memory system.',
  SESSION_NOT_FOUND: 'Session not found in memory system.',
  DATA_TOO_LARGE: 'Data exceeds maximum size limit.',
  SEARCH_FAILED: 'Memory search failed.',
  STORAGE_FAILED: 'Memory storage failed.',
  CONTEXT_RETRIEVAL_FAILED: 'Memory context retrieval failed.',
};

/**
 * Memory success messages
 */
export const memorySuccess = {
  USER_CREATED: 'User created successfully in memory system.',
  USER_UPDATED: 'User updated successfully in memory system.',
  SESSION_CREATED: 'Session created successfully.',
  MEMORY_ADDED: 'Memory added successfully.',
  MEMORY_SEARCHED: 'Memory search completed successfully.',
  CONTEXT_RETRIEVED: 'Memory context retrieved successfully.',
  DATA_STORED: 'Data stored successfully in knowledge graph.',
};
