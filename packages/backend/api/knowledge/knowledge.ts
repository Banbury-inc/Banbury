import { ApiService } from "../apiService";

export default class Calendar{
    constructor(api: ApiService) {}

  /**
   * Get the full knowledge graph data
   */
  static async getKnowledgeGraph(limit: number = 50, scope: string = 'both'): Promise<{
    success: boolean;
    data?: {
      entities: Array<{
        id: string;
        name: string;
        type: string;
        summary: string;
        attributes: Record<string, any>;
      }>;
      facts: Array<{
        fact: string;
        confidence: number;
        source: string;
      }>;
      total_entities: number;
      total_facts: number;
      timestamp: string;
    };
    error?: string;
  }> {
    try {
      const response = await ApiService.get<{
        success: boolean;
        data?: {
          entities: Array<{
            id: string;
            name: string;
            type: string;
            summary: string;
            attributes: Record<string, any>;
          }>;
          facts: Array<{
            fact: string;
            confidence: number;
            source: string;
          }>;
          total_entities: number;
          total_facts: number;
          timestamp: string;
        };
        error?: string;
      }>(`/conversations/knowledge/graph/?limit=${limit}&scope=${scope}`);
      return response;
    } catch (error) {
      ApiService.handleError(error, `Get knowledge graph with limit: ${limit}, scope: ${scope}`);
      throw error;
    }
  }

  /**
   * Search the knowledge graph
   */
  static async searchKnowledgeGraph(query: string, limit: number = 50, scope: string = 'both'): Promise<{
    success: boolean;
    data?: {
      entities: Array<{
        id: string;
        name: string;
        type: string;
        summary: string;
        attributes: Record<string, any>;
      }>;
      facts: Array<{
        fact: string;
        confidence: number;
        source: string;
      }>;
      total_entities: number;
      total_facts: number;
      timestamp: string;
    };
    error?: string;
    query?: string;
  }> {
    try {
      const response = await ApiService.get<{
        success: boolean;
        data?: {
          entities: Array<{
            id: string;
            name: string;
            type: string;
            summary: string;
            attributes: Record<string, any>;
          }>;
          facts: Array<{
            fact: string;
            confidence: number;
            source: string;
          }>;
          total_entities: number;
          total_facts: number;
          timestamp: string;
        };
        error?: string;
        query?: string;
      }>(`/conversations/knowledge/search/?query=${encodeURIComponent(query)}&limit=${limit}&scope=${scope}`);
      return response;
    } catch (error) {
      ApiService.handleError(error, `Search knowledge graph with query: ${query}`);
      throw error;
    }
  }

  /**
   * Add an entity to the knowledge graph
   */
  static async addEntityToGraph(entityData: {
    name: string;
    labels: string[];
    attributes?: Record<string, any>;
    summary?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean;
        message?: string;
        data?: any;
        error?: string;
      }>('/conversations/knowledge/entity/add/', entityData);
      return response;
    } catch (error) {
      ApiService.handleError(error, `Add entity to knowledge graph: ${entityData.name}`);
      throw error;
    }
  }

  /**
   * Add a fact to the knowledge graph
   */
  static async addFactToGraph(factData: {
    fact: string;
    source?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean;
        message?: string;
        data?: any;
        error?: string;
      }>('/conversations/knowledge/fact/add/', factData);
      return response;
    } catch (error) {
      ApiService.handleError(error, `Add fact to knowledge graph: ${factData.fact.substring(0, 50)}...`);
      throw error;
    }
  }

  /**
   * Add a document to the knowledge graph
   */
  static async addDocumentToGraph(documentData: {
    content: string;
    title?: string;
    source?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await ApiService.post<{
        success: boolean;
        message?: string;
        data?: any;
        error?: string;
      }>('/conversations/knowledge/document/add/', documentData);
      return response;
    } catch (error) {
      ApiService.handleError(error, `Add document to knowledge graph: ${documentData.title || 'Untitled'}`);
      throw error;
    }
  }
}
