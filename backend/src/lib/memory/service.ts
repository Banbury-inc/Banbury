import { AsyncZep, Session, User, EntityNode, AddMemoryResponse, SearchFilters } from 'zep-cloud';
import { BaseMessage } from '@langchain/core/messages';
import { 
  MemoryConfig, 
  UserMemory, 
  MemorySession, 
  MemoryMessage, 
  MemorySearchResult, 
  MemoryContext,
  SearchScope,
  RerankerType,
  OverflowStrategy,
  Company,
  Person
} from './types';

const ZEP_MAX_DATA_SIZE_CHARACTERS = 10000; // 10k characters

export class MemoryService {
  private zepClient: AsyncZep;
  private config: MemoryConfig;

  constructor(config: MemoryConfig) {
    this.config = config;
    this.zepClient = new AsyncZep({
      apiKey: config.zepApiKey,
    });
  }

  /**
   * Set up the ontology for the memory service
   */
  async setOntology(): Promise<void> {
    try {
      await this.zepClient.graph.setEntityTypes({
        entities: {
          Company: {
            name: 'Company',
            description: 'A business organization',
            attributes: {
              name: { type: 'string', description: 'Company name' },
              industry: { type: 'string', description: 'Industry sector' },
              size: { type: 'string', description: 'Company size' },
              website: { type: 'string', description: 'Company website' },
              description: { type: 'string', description: 'Company description' },
            },
          },
          Person: {
            name: 'Person',
            description: 'An individual person',
            attributes: {
              name: { type: 'string', description: 'Person name' },
              role: { type: 'string', description: 'Job role or title' },
              company: { type: 'string', description: 'Associated company' },
              email: { type: 'string', description: 'Email address' },
              phone: { type: 'string', description: 'Phone number' },
              expertise: { type: 'array', description: 'Areas of expertise' },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error setting ontology:', error);
      throw error;
    }
  }

  /**
   * Generate a Zep user ID from user and workspace information
   */
  generateZepUserId(user: UserMemory): string {
    return `${user.workspaceId}_${user.userId}`;
  }

  /**
   * Add a user to the memory system
   */
  async addUser(user: UserMemory): Promise<User> {
    try {
      const zepUserId = this.generateZepUserId(user);
      console.log(`Generated Zep user ID: ${zepUserId}`);

      const zepUser = await this.zepClient.user.add({
        user_id: zepUserId,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      });

      return zepUser;
    } catch (error) {
      console.error('Error creating Zep user:', error);
      throw error;
    }
  }

  /**
   * Safely add a user to the memory system (create if doesn't exist, update if exists)
   */
  async safeAddUser(user: UserMemory): Promise<User> {
    const zepUserId = this.generateZepUserId(user);

    try {
      // First try to get the existing user
      try {
        const currentUser = await this.zepClient.user.get({ user_id: zepUserId });
        
        // Update user details
        const updatedUser = await this.zepClient.user.update({
          user_id: zepUserId,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
        });
        
        console.log(`Updated Zep user details: ${updatedUser}`);
        return updatedUser;
      } catch (error: any) {
        if (error.message?.includes('not found')) {
          // User doesn't exist, create new one
          console.log(`Zep user not found, creating new user: ${user.firstName} ${user.lastName}`);
          return await this.addUser(user);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in safeAddUser:', error);
      throw error;
    }
  }

  /**
   * Add a session to the user's memory
   */
  async addSession(user: UserMemory, sessionId: string): Promise<Session> {
    return await this.zepClient.memory.addSession({
      user_id: this.generateZepUserId(user),
      session_id: sessionId,
    });
  }

  /**
   * Safely add a session to the user's memory (create if doesn't exist)
   */
  async safeAddSession(user: UserMemory, sessionId: string): Promise<Session> {
    try {
      const currentSession = await this.zepClient.memory.getSession({
        session_id: sessionId,
      });
      return currentSession;
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return await this.addSession(user, sessionId);
      }
      throw error;
    }
  }

  /**
   * Convert LangChain BaseMessage to Zep message format
   */
  private langchainBaseMessageToZepMessage(message: BaseMessage): any {
    const content = message.content;
    if (typeof content !== 'string') {
      console.warn('Non-string message content, skipping:', content);
      return null;
    }

    return {
      role: message._getType() === 'human' ? 'user' : 'assistant',
      content: content,
      metadata: {
        timestamp: new Date().toISOString(),
        message_type: message._getType(),
      },
    };
  }

  /**
   * Generate a query from messages for memory search
   */
  private getQueryFromMessages(messages: any[]): string {
    if (!messages.length) return '';
    
    // Use the last user message as the query
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'user');
    
    return lastUserMessage?.content || messages[messages.length - 1]?.content || '';
  }

  /**
   * Add memories to the user's memory store
   */
  async addMemories(
    user: UserMemory,
    sessionId: string,
    messages: BaseMessage[]
  ): Promise<AddMemoryResponse | null> {
    try {
      // Ensure Zep user exists before proceeding
      await this.safeAddUser(user);
      console.log('Zep user verified/created successfully');

      const zepMessages = messages
        .map(message => this.langchainBaseMessageToZepMessage(message))
        .filter(message => message !== null);

      if (!zepMessages.length) {
        console.log('No messages to add to memory');
        return null;
      }

      console.log(`Converted ${messages.length} messages to Zep format`);

      const query = this.getQueryFromMessages(zepMessages);
      console.log(`Generated query from messages: ${query.substring(0, 100)}...`);

      const response = await this.zepClient.memory.add({
        session_id: sessionId,
        messages: zepMessages,
      });

      console.log('Memory added successfully');
      return response;
    } catch (error) {
      console.error('Error adding memories:', error);
      return null;
    }
  }

  /**
   * Add memory and get relevant context
   */
  async addMemoryAndGetContext(
    user: UserMemory,
    sessionId: string,
    messages: BaseMessage[],
    memoryCollectorEnabled: boolean = false,
    memoryInjectionEnabled: boolean = false,
    limit: number = 10
  ): Promise<string | null> {
    console.log(`Processing memory for user: ${user.userId}, session: ${sessionId}`);

    try {
      // Ensure Zep user exists before proceeding
      await this.safeAddUser(user);
      console.log('Zep user verified/created successfully');

      const zepMessages = messages
        .map(message => this.langchainBaseMessageToZepMessage(message))
        .filter(message => message !== null);

      if (!zepMessages.length) {
        console.log('No messages to add to memory');
        return null;
      }

      console.log(`Converted ${messages.length} messages to Zep format`);

      const query = this.getQueryFromMessages(zepMessages);
      console.log(`Generated query from messages: ${query.substring(0, 100)}...`);

      // Add new memories if collector is enabled
      if (memoryCollectorEnabled) {
        console.log('Memory collector enabled - adding new memories');
        await this.zepClient.memory.add({
          session_id: sessionId,
          messages: zepMessages,
          return_context: false,
        });
      }

      // Retrieve relevant memories if injection is enabled
      if (memoryInjectionEnabled) {
        const truncatedQuery = query.substring(0, 255);
        console.log(`Memory injection enabled - searching with query: ${truncatedQuery}`);

        const zepUserId = this.generateZepUserId(user);
        console.log(`Searching memory for user: ${zepUserId}`);

        // Run both searches concurrently
        const [returnedContextFacts, returnedContextEntities] = await Promise.all([
          this.zepClient.graph.search({
            user_id: zepUserId,
            query: truncatedQuery,
            limit: limit,
            scope: 'edges',
            reranker: 'cross_encoder',
          }),
          this.zepClient.graph.search({
            user_id: zepUserId,
            query: truncatedQuery,
            limit: limit,
            scope: 'nodes',
            reranker: 'cross_encoder',
          }),
        ]);

        console.log(
          `Search results - facts: ${!!(returnedContextFacts && returnedContextFacts.edges)}, entities: ${!!(returnedContextEntities && returnedContextEntities.nodes)}`
        );

        // Only return if we have facts or entities
        if ((returnedContextFacts && returnedContextFacts.edges) || 
            (returnedContextEntities && returnedContextEntities.nodes)) {
          
          let customContextString = "Below are memories from past conversations with this user. You can use the below memories to help answer the user's question:\n";

          customContextString += "<FACTS>\n";
          if (returnedContextFacts && returnedContextFacts.edges) {
            console.log(`Found ${returnedContextFacts.edges.length} facts`);
            for (const edge of returnedContextFacts.edges) {
              customContextString += `- ${edge.fact}\n`;
            }
          }
          customContextString += "</FACTS>\n";

          customContextString += "<ENTITIES>\n";
          if (returnedContextEntities && returnedContextEntities.nodes) {
            console.log(`Found ${returnedContextEntities.nodes.length} entities`);
            for (const node of returnedContextEntities.nodes) {
              const entityNode = node as EntityNode;
              customContextString += `Entity ID: ${entityNode.uuid_}\nName: ${entityNode.name}\nLabels: ${entityNode.labels}\nSummary: ${entityNode.summary}\n`;
              if (entityNode.attributes) {
                customContextString += `Attributes:\n${this.formatAttributes(entityNode.attributes)}\n`;
              }
              customContextString += "\n\n";
            }
          }
          customContextString += "</ENTITIES>\n";

          return customContextString.trim() || null;
        } else {
          console.log('No relevant memories found');
          return null;
        }
      } else {
        console.log('Memory collection and injection disabled');
        return null;
      }
    } catch (error) {
      console.error('Error in addMemoryAndGetContext:', error);
      return null;
    }
  }

  /**
   * Format attributes for display
   */
  private formatAttributes(attrs: Record<string, any>): string {
    if (!attrs) return '';
    
    return Object.entries(attrs)
      .map(([key, value]) => `  - ${key}: ${value}`)
      .join('\n');
  }

  /**
   * Search memories with custom parameters
   */
  async searchMemories(
    user: UserMemory,
    query: string,
    scope: SearchScope = 'nodes',
    reranker: RerankerType = 'cross_encoder',
    maxResults: number = 10
  ): Promise<MemorySearchResult> {
    try {
      const zepUserId = this.generateZepUserId(user);
      
      const searchResult = await this.zepClient.graph.search({
        user_id: zepUserId,
        query: query.substring(0, 255), // Truncate to 255 characters
        scope: scope,
        limit: maxResults,
        reranker: reranker,
      });

      return this.formatMemoryResults(searchResult);
    } catch (error) {
      console.error('Error searching memories:', error);
      return { facts: [], entities: [] };
    }
  }

  /**
   * Format memory search results
   */
  private formatMemoryResults(searchResult: any): MemorySearchResult {
    const result: MemorySearchResult = { facts: [], entities: [] };

    if (searchResult.edges) {
      for (const edge of searchResult.edges) {
        result.facts.push({
          fact: edge.fact,
          confidence: edge.score || 0,
          source: edge.source || 'memory',
        });
      }
    }

    if (searchResult.nodes) {
      for (const node of searchResult.nodes) {
        const entityNode = node as EntityNode;
        result.entities.push({
          id: entityNode.uuid_,
          name: entityNode.name,
          type: entityNode.labels?.[0] || 'entity',
          summary: entityNode.summary,
          attributes: entityNode.attributes,
        });
      }
    }

    return result;
  }

  /**
   * Add business data to the user's knowledge graph
   */
  async addBusinessDataToGraph(
    user: UserMemory,
    data: string,
    dataType: 'text' | 'json' | 'message' = 'text',
    overflowStrategy: OverflowStrategy = 'split'
  ): Promise<any> {
    try {
      const zepUserId = this.generateZepUserId(user);
      
      // Ensure user exists
      await this.safeAddUser(user);

      if (data.length > ZEP_MAX_DATA_SIZE_CHARACTERS) {
        if (overflowStrategy === 'fail') {
          throw new Error(`Data exceeds maximum size of ${ZEP_MAX_DATA_SIZE_CHARACTERS} characters`);
        } else if (overflowStrategy === 'truncate') {
          data = data.substring(0, ZEP_MAX_DATA_SIZE_CHARACTERS);
        } else if (overflowStrategy === 'split') {
          // Split data into chunks
          const chunks = this.splitDataIntoChunks(data, ZEP_MAX_DATA_SIZE_CHARACTERS);
          const responses = [];
          
          for (const chunk of chunks) {
            const response = await this.zepClient.graph.add({
              user_id: zepUserId,
              data: chunk,
              data_type: dataType,
            });
            responses.push(response);
          }
          
          return responses;
        }
      }

      return await this.zepClient.graph.add({
        user_id: zepUserId,
        data: data,
        data_type: dataType,
      });
    } catch (error) {
      console.error('Error adding business data to graph:', error);
      throw error;
    }
  }

  /**
   * Split data into chunks for overflow handling
   */
  private splitDataIntoChunks(data: string, maxSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const sentences = data.split(/[.!?]+/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + sentence + '.';
      if (testChunk.length <= maxSize) {
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
  }
}
