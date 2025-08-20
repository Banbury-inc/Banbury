# Memory Management System

This document describes the memory management system implemented in the Banbury Website, based on the athena-intelligence architecture.

## Overview

The memory management system provides long-term memory capabilities for AI assistants, allowing them to remember user preferences, past conversations, and important information across sessions. It uses Zep Cloud for primary memory storage and Mem0 as a secondary memory system.

## Architecture

### Core Components

1. **Memory Service** (`src/lib/memory/service.ts`)
   - Primary interface for memory operations
   - Handles Zep Cloud integration
   - Manages user sessions and memory storage

2. **Memory Types** (`src/lib/memory/types.ts`)
   - TypeScript interfaces and schemas
   - Entity definitions (Person, Company)
   - Memory operation types

3. **Memory Toolkit** (`src/lib/memory/toolkit.ts`)
   - LangGraph tool integrations
   - Memory search and storage tools
   - Context retrieval tools

4. **Memory Configuration** (`src/lib/memory/config.ts`)
   - Environment configuration
   - Feature flags and settings
   - Error and success messages

5. **Memory API** (`src/app/api/memory/route.ts`)
   - REST API endpoints
   - Health checks and status
   - Memory operations

## Features

### Memory Storage
- **Entity Recognition**: Automatic extraction of people, companies, and concepts
- **Fact Storage**: Structured storage of facts and relationships
- **Context Preservation**: Maintaining conversation context across sessions
- **Overflow Handling**: Smart handling of large data with truncate/split/fail strategies

### Memory Retrieval
- **Semantic Search**: Context-aware memory search
- **Multiple Rerankers**: Cross-encoder, RRF, MMR, episode mentions
- **Scope-based Search**: Node search for entities, edge search for relationships
- **Confidence Scoring**: Relevance scoring for search results

### Knowledge Graph
- **Entity Types**: Person and Company entities with attributes
- **Relationship Mapping**: Connections between entities
- **Graph Search**: Traversal and querying of knowledge graph
- **Ontology Management**: Structured entity definitions

## Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Zep Cloud API Key (Required for primary memory features)
ZEP_API_KEY=your_zep_api_key_here

# Mem0 API Key (Optional for secondary memory features)
MEM0_API_KEY=your_mem0_api_key_here
```

### Installation

The memory management system is already integrated into the Banbury Website. The required dependencies are:

```json
{
  "zep-cloud": "^2.8.0",
  "mem0ai": "^0.1.32"
}
```

## Usage

### API Endpoints

#### Health Check
```bash
GET /api/memory?action=health
```

#### Status Check
```bash
GET /api/memory?action=status
```

#### Configuration Check
```bash
GET /api/memory?action=config
```

#### Memory Search
```bash
POST /api/memory
{
  "operation": "search",
  "query": "user preferences",
  "scope": "nodes",
  "reranker": "cross_encoder",
  "maxResults": 10,
  "userId": "user123",
  "workspaceId": "workspace123",
  "email": "user@example.com"
}
```

#### Memory Storage
```bash
POST /api/memory
{
  "operation": "store",
  "content": "User prefers dark mode and Python programming",
  "dataType": "text",
  "overflowStrategy": "split",
  "userId": "user123",
  "workspaceId": "workspace123",
  "email": "user@example.com"
}
```

#### Memory Context Retrieval
```bash
POST /api/memory
{
  "operation": "context",
  "sessionId": "session_123",
  "limit": 10,
  "userId": "user123",
  "workspaceId": "workspace123",
  "email": "user@example.com",
  "messages": []
}
```

### LangGraph Integration

The memory system provides three main tools for LangGraph agents:

1. **store_memory**: Store important information in memory
2. **search_memory**: Search through stored memories
3. **get_memory_context**: Retrieve relevant context for conversations

Example usage in agent:

```typescript
import { getMemoryToolsForLangGraph } from '@/lib/memory';

// Add memory tools to your agent
const memoryTools = getMemoryToolsForLangGraph();
const tools = [...otherTools, ...memoryTools];
```

### Direct Service Usage

```typescript
import { createMemoryService, memoryUtils } from '@/lib/memory';

// Create memory service
const memoryService = createMemoryService();

if (memoryService) {
  // Store memory
  const user = {
    userId: "user123",
    workspaceId: "workspace123",
    email: "user@example.com"
  };
  
  await memoryService.addBusinessDataToGraph(
    user,
    "User prefers Python for data analysis",
    "text",
    "split"
  );
  
  // Search memories
  const results = await memoryService.searchMemories(
    user,
    "Python preferences",
    "nodes",
    "cross_encoder",
    10
  );
}
```

## Configuration

### Memory Features

The system supports various feature flags that can be configured:

```typescript
import { memoryFeatures } from '@/lib/memory';

// Enable/disable specific features
memoryFeatures.enableZepMemory = true;
memoryFeatures.enableMem0Memory = false;
memoryFeatures.enableMemorySearch = true;
memoryFeatures.enableMemoryStorage = true;
memoryFeatures.enableMemoryContext = true;
```

### Memory Settings

```typescript
// Default settings
memoryFeatures.defaultMemoryLimit = 10;
memoryFeatures.defaultSearchScope = 'nodes';
memoryFeatures.defaultReranker = 'cross_encoder';
memoryFeatures.sessionTimeoutHours = 24;
```

## Entity Types

### Person Entity
```typescript
{
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  expertise?: string[];
}
```

### Company Entity
```typescript
{
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
}
```

## Search Capabilities

### Search Scopes
- **nodes**: Search for entities and concepts
- **edges**: Search for relationships and facts

### Rerankers
- **cross_encoder**: High-accuracy transformer-based ranking
- **rrf**: Reciprocal Rank Fusion for robust results
- **mmr**: Maximal Marginal Relevance for diversity
- **episode_mentions**: Recurring topic prioritization

## Error Handling

The system provides comprehensive error handling:

```typescript
import { memoryErrors } from '@/lib/memory';

// Common error messages
memoryErrors.ZEP_NOT_CONFIGURED;
memoryErrors.USER_NOT_FOUND;
memoryErrors.SESSION_NOT_FOUND;
memoryErrors.DATA_TOO_LARGE;
memoryErrors.SEARCH_FAILED;
```

## Performance Considerations

### Memory Limits
- **Default max data size**: 10,000 characters
- **Development limit**: 5,000 characters
- **Production limit**: 15,000 characters
- **Test limit**: 1,000 characters

### Overflow Strategies
- **truncate**: Cut off data at the limit
- **split**: Divide data into chunks
- **fail**: Throw error if data exceeds limit

### Caching
- Session-based caching for frequently accessed memories
- Result caching for search operations
- User profile caching

## Security

### Authentication
- All API endpoints require authentication
- User isolation through workspace IDs
- Session-based access control

### Data Privacy
- User data is isolated by workspace
- No cross-user memory access
- Secure API key management

## Monitoring

### Health Checks
- Service availability monitoring
- Configuration validation
- Feature flag status

### Metrics
- Memory storage operations
- Search performance
- Error rates and types
- User engagement metrics

## Troubleshooting

### Common Issues

1. **Memory service not available**
   - Check ZEP_API_KEY environment variable
   - Verify Zep Cloud service status
   - Check network connectivity

2. **Search returns no results**
   - Verify user has stored memories
   - Check search query relevance
   - Adjust search scope or reranker

3. **Data too large errors**
   - Use overflow strategy "split"
   - Reduce content size
   - Increase memory limits in configuration

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG_MEMORY=true
```

This will provide detailed logging of memory operations.

## Future Enhancements

### Planned Features
- **Multi-modal Memory**: Support for images and documents
- **Memory Analytics**: Usage insights and optimization
- **Advanced Search**: Natural language query processing
- **Memory Sharing**: Controlled sharing between users
- **Memory Export**: Data export and backup capabilities

### Integration Opportunities
- **Calendar Integration**: Meeting and event memory
- **Email Integration**: Communication history
- **Document Integration**: File content memory
- **Workflow Integration**: Process and task memory

## Contributing

When contributing to the memory management system:

1. Follow the existing code structure
2. Add comprehensive TypeScript types
3. Include error handling for all operations
4. Add tests for new functionality
5. Update documentation for new features

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review API documentation
3. Check Zep Cloud documentation
4. Contact the development team

---

This memory management system provides a robust foundation for AI assistants to maintain context and provide personalized experiences across conversations and sessions.
