import { NextRequest, NextResponse } from 'next/server';
import { createMemoryService } from '@/lib/memory';
import { verifyAuthToken } from '@/lib/auth';

/**
 * GET /api/knowledge - Get knowledge graph data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'graph';
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const memoryService = createMemoryService();
    if (!memoryService) {
      return NextResponse.json(
        { error: 'Memory service not available' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'graph':
        return await handleGetKnowledgeGraph(memoryService, user, limit);
      case 'search':
        return await handleSearchKnowledgeGraph(memoryService, user, query, limit);
      case 'entities':
        return await handleGetEntities(memoryService, user, limit);
      case 'facts':
        return await handleGetFacts(memoryService, user, limit);
      default:
        return NextResponse.json({
          status: 'ok',
          message: 'Knowledge Graph API is running',
          endpoints: [
            'GET /api/knowledge?action=graph',
            'GET /api/knowledge?action=search&query=<search_term>',
            'GET /api/knowledge?action=entities',
            'GET /api/knowledge?action=facts'
          ]
        });
    }
  } catch (error) {
    console.error('Knowledge Graph API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge - Add knowledge to the graph
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, ...data } = body;

    const memoryService = createMemoryService();
    if (!memoryService) {
      return NextResponse.json(
        { error: 'Memory service not available' },
        { status: 503 }
      );
    }

    switch (operation) {
      case 'add_entity':
        return await handleAddEntity(memoryService, user, data);
      case 'add_fact':
        return await handleAddFact(memoryService, user, data);
      case 'add_document':
        return await handleAddDocument(memoryService, user, data);
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: add_entity, add_fact, add_document' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Knowledge Graph API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle getting the full knowledge graph
 */
async function handleGetKnowledgeGraph(memoryService: any, user: any, limit: number) {
  try {
    // Get both entities and facts
    const [entitiesResult, factsResult] = await Promise.all([
      memoryService.searchMemories(user, '', 'nodes', 'cross_encoder', limit),
      memoryService.searchMemories(user, '', 'edges', 'cross_encoder', limit)
    ]);

    return NextResponse.json({
      status: 'success',
      data: {
        entities: entitiesResult.entities || [],
        facts: factsResult.facts || [],
        total_entities: entitiesResult.entities?.length || 0,
        total_facts: factsResult.facts?.length || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting knowledge graph:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve knowledge graph' },
      { status: 500 }
    );
  }
}

/**
 * Handle searching the knowledge graph
 */
async function handleSearchKnowledgeGraph(memoryService: any, user: any, query: string, limit: number) {
  try {
    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter is required for search' },
        { status: 400 }
      );
    }

    // Search both entities and facts
    const [entitiesResult, factsResult] = await Promise.all([
      memoryService.searchMemories(user, query, 'nodes', 'cross_encoder', limit),
      memoryService.searchMemories(user, query, 'edges', 'cross_encoder', limit)
    ]);

    return NextResponse.json({
      status: 'success',
      query,
      data: {
        entities: entitiesResult.entities || [],
        facts: factsResult.facts || [],
        total_entities: entitiesResult.entities?.length || 0,
        total_facts: factsResult.facts?.length || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error searching knowledge graph:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge graph' },
      { status: 500 }
    );
  }
}

/**
 * Handle getting entities only
 */
async function handleGetEntities(memoryService: any, user: any, limit: number) {
  try {
    const result = await memoryService.searchMemories(user, '', 'nodes', 'cross_encoder', limit);

    return NextResponse.json({
      status: 'success',
      data: {
        entities: result.entities || [],
        total_entities: result.entities?.length || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting entities:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve entities' },
      { status: 500 }
    );
  }
}

/**
 * Handle getting facts only
 */
async function handleGetFacts(memoryService: any, user: any, limit: number) {
  try {
    const result = await memoryService.searchMemories(user, '', 'edges', 'cross_encoder', limit);

    return NextResponse.json({
      status: 'success',
      data: {
        facts: result.facts || [],
        total_facts: result.facts?.length || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting facts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve facts' },
      { status: 500 }
    );
  }
}

/**
 * Handle adding an entity to the knowledge graph
 */
async function handleAddEntity(memoryService: any, user: any, data: any) {
  try {
    const { name, labels, attributes, summary } = data;

    if (!name || !labels) {
      return NextResponse.json(
        { error: 'Entity name and labels are required' },
        { status: 400 }
      );
    }

    // Add entity to the graph
    const entityData = {
      name,
      labels: Array.isArray(labels) ? labels : [labels],
      attributes: attributes || {},
      summary: summary || ''
    };

    const result = await memoryService.addToGraph(user, JSON.stringify(entityData));

    return NextResponse.json({
      status: 'success',
      message: 'Entity added successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding entity:', error);
    return NextResponse.json(
      { error: 'Failed to add entity' },
      { status: 500 }
    );
  }
}

/**
 * Handle adding a fact to the knowledge graph
 */
async function handleAddFact(memoryService: any, user: any, data: any) {
  try {
    const { fact, source } = data;

    if (!fact) {
      return NextResponse.json(
        { error: 'Fact content is required' },
        { status: 400 }
      );
    }

    // Add fact to the graph
    const factData = {
      fact,
      source: source || 'user_input',
      timestamp: new Date().toISOString()
    };

    const result = await memoryService.addToGraph(user, JSON.stringify(factData));

    return NextResponse.json({
      status: 'success',
      message: 'Fact added successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding fact:', error);
    return NextResponse.json(
      { error: 'Failed to add fact' },
      { status: 500 }
    );
  }
}

/**
 * Handle adding a document to the knowledge graph
 */
async function handleAddDocument(memoryService: any, user: any, data: any) {
  try {
    const { content, title, source } = data;

    if (!content) {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    // Add document to the graph
    const documentData = {
      content,
      title: title || 'Untitled Document',
      source: source || 'user_upload',
      timestamp: new Date().toISOString()
    };

    const result = await memoryService.addToGraph(user, JSON.stringify(documentData));

    return NextResponse.json({
      status: 'success',
      message: 'Document added successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return NextResponse.json(
      { error: 'Failed to add document' },
      { status: 500 }
    );
  }
}
