import { z } from 'zod';

// Entity Types for Knowledge Graph
export const CompanySchema = z.object({
  name: z.string(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

export const PersonSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  expertise: z.array(z.string()).optional(),
});

export type Company = z.infer<typeof CompanySchema>;
export type Person = z.infer<typeof PersonSchema>;

// Memory Service Types
export interface MemoryConfig {
  zepApiKey: string;
  mem0ApiKey: string;
  maxDataSizeCharacters: number;
}

export interface UserMemory {
  userId: string;
  workspaceId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface MemorySession {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
}

export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MemorySearchResult {
  facts: Array<{
    fact: string;
    confidence: number;
    source: string;
  }>;
  entities: Array<{
    id: string;
    name: string;
    type: string;
    summary: string;
    attributes?: Record<string, any>;
  }>;
}

export interface MemoryContext {
  facts: string[];
  entities: string[];
  summary: string;
}

// Search Parameters
export type SearchScope = 'nodes' | 'edges';
export type RerankerType = 'cross_encoder' | 'rrf' | 'mmr' | 'episode_mentions';
export type OverflowStrategy = 'truncate' | 'split' | 'fail';

// Project Configuration
export interface ProjectConfig {
  projectId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UserProjectMapping {
  userId: string;
  projects: string[];
  defaultProject: string;
}
