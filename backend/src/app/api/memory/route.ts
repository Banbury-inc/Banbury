import { NextRequest, NextResponse } from 'next/server';
import { 
  createMemoryService, 
  memoryUtils, 
  memoryFeatures,
  isMemoryEnabled,
  validateMemoryConfig 
} from '@/lib/memory';

/**
 * GET /api/memory - Health check and memory status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        return await handleHealthCheck();
      case 'status':
        return await handleStatusCheck();
      case 'config':
        return await handleConfigCheck();
      default:
        return NextResponse.json({
          status: 'ok',
          message: 'Memory API is running',
          endpoints: [
            'GET /api/memory?action=health',
            'GET /api/memory?action=status',
            'GET /api/memory?action=config',
            'POST /api/memory/search',
            'POST /api/memory/store',
            'POST /api/memory/context'
          ]
        });
    }
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memory - Memory operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, ...data } = body;

    switch (operation) {
      case 'search':
        return await handleMemorySearch(data);
      case 'store':
        return await handleMemoryStore(data);
      case 'context':
        return await handleMemoryContext(data);
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: search, store, context' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle health check
 */
async function handleHealthCheck() {
  const memoryService = createMemoryService();
  const isHealthy = memoryService !== null;

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    memory_enabled: isMemoryEnabled(),
    timestamp: new Date().toISOString(),
    service_available: isHealthy
  });
}

/**
 * Handle status check
 */
async function handleStatusCheck() {
  const config = validateMemoryConfig();
  const features = memoryFeatures;

  return NextResponse.json({
    status: 'ok',
    memory_enabled: isMemoryEnabled(),
    features: {
      zep_memory: features.enableZepMemory,
      mem0_memory: features.enableMem0Memory,
      memory_search: features.enableMemorySearch,
      memory_storage: features.enableMemoryStorage,
      memory_context: features.enableMemoryContext,
    },
    settings: {
      default_memory_limit: features.defaultMemoryLimit,
      default_search_scope: features.defaultSearchScope,
      default_reranker: features.defaultReranker,
      session_timeout_hours: features.sessionTimeoutHours,
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle configuration check
 */
async function handleConfigCheck() {
  const validation = memoryUtils.validateConfig();

  return NextResponse.json({
    status: validation.isValid ? 'configured' : 'misconfigured',
    validation: validation,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle memory search
 */
async function handleMemorySearch(data: any) {
  const { query, scope = 'nodes', reranker = 'cross_encoder', maxResults = 10, userId, workspaceId, email } = data;

  if (!query) {
    return NextResponse.json(
      { error: 'Query is required' },
      { status: 400 }
    );
  }

  if (!userId || !workspaceId || !email) {
    return NextResponse.json(
      { error: 'userId, workspaceId, and email are required' },
      { status: 400 }
    );
  }

  const memoryService = createMemoryService();
  if (!memoryService) {
    return NextResponse.json(
      { error: 'Memory service not available' },
      { status: 503 }
    );
  }

  try {
    const user = {
      userId,
      workspaceId,
      email,
      firstName: data.firstName,
      lastName: data.lastName
    };

    const result = await memoryService.searchMemories(
      user,
      query,
      scope,
      reranker,
      maxResults
    );

    return NextResponse.json({
      status: 'success',
      query,
      results: result,
      formatted_results: memoryUtils.formatMemoryResults(result),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory search error:', error);
    return NextResponse.json(
      { error: 'Memory search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle memory storage
 */
async function handleMemoryStore(data: any) {
  const { content, dataType = 'text', overflowStrategy = 'split', userId, workspaceId, email } = data;

  if (!content) {
    return NextResponse.json(
      { error: 'Content is required' },
      { status: 400 }
    );
  }

  if (!userId || !workspaceId || !email) {
    return NextResponse.json(
      { error: 'userId, workspaceId, and email are required' },
      { status: 400 }
    );
  }

  const memoryService = createMemoryService();
  if (!memoryService) {
    return NextResponse.json(
      { error: 'Memory service not available' },
      { status: 503 }
    );
  }

  try {
    const user = {
      userId,
      workspaceId,
      email,
      firstName: data.firstName,
      lastName: data.lastName
    };

    const result = await memoryService.addBusinessDataToGraph(
      user,
      content,
      dataType,
      overflowStrategy
    );

    return NextResponse.json({
      status: 'success',
      message: 'Data stored successfully',
      content_length: content.length,
      data_type: dataType,
      overflow_strategy: overflowStrategy,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory storage error:', error);
    return NextResponse.json(
      { error: 'Memory storage failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle memory context retrieval
 */
async function handleMemoryContext(data: any) {
  const { sessionId, limit = 10, userId, workspaceId, email, messages = [] } = data;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  if (!userId || !workspaceId || !email) {
    return NextResponse.json(
      { error: 'userId, workspaceId, and email are required' },
      { status: 400 }
    );
  }

  const memoryService = createMemoryService();
  if (!memoryService) {
    return NextResponse.json(
      { error: 'Memory service not available' },
      { status: 503 }
    );
  }

  try {
    const user = {
      userId,
      workspaceId,
      email,
      firstName: data.firstName,
      lastName: data.lastName
    };

    const context = await memoryService.addMemoryAndGetContext(
      user,
      sessionId,
      messages,
      false, // memoryCollectorEnabled
      true,  // memoryInjectionEnabled
      limit
    );

    return NextResponse.json({
      status: 'success',
      session_id: sessionId,
      context: context || 'No relevant context found',
      has_context: !!context,
      limit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Memory context error:', error);
    return NextResponse.json(
      { error: 'Memory context retrieval failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
