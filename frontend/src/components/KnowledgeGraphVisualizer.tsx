import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { zoom, zoomIdentity } from 'd3-zoom';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';

interface KnowledgeEntity {
  id: string;
  name: string;
  type: string;
  summary: string;
  score?: number;
  created_at?: string;
  graph_id?: string;
  labels?: string[];
  attributes: Record<string, any>;
  source?: string;
}

interface KnowledgeFact {
  fact: string;
  confidence: number;
  source: string;
  score?: number;
  created_at?: string;
  graph_id?: string;
  labels?: string[];
  attributes?: Record<string, any>;
  domain?: string;
  expertise_level?: string;
}

interface KnowledgeUser {
  id: string;
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  session_count: number;
  metadata: Record<string, any>;
}

interface KnowledgeGraphData {
  entities: KnowledgeEntity[];
  facts: KnowledgeFact[];
  users?: KnowledgeUser[];
  total_entities: number;
  total_facts: number;
  total_users?: number;
  timestamp: string;
}

interface GraphNode {
  id: string;
  name: string;
  type: 'entity' | 'fact' | 'user';
  data: KnowledgeEntity | KnowledgeFact | KnowledgeUser;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface KnowledgeGraphVisualizerProps {
  data: KnowledgeGraphData;
  onNodeClick?: (node: KnowledgeEntity | KnowledgeFact | KnowledgeUser) => void;
  selectedNode?: KnowledgeEntity | KnowledgeFact | KnowledgeUser | null;
  loading?: boolean;
}

const KnowledgeGraphVisualizer: React.FC<KnowledgeGraphVisualizerProps> = ({
  data,
  onNodeClick,
  selectedNode,
  loading = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Convert knowledge graph data to D3 format
  const processGraphData = (): { nodes: GraphNode[]; links: GraphLink[] } => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add entities as nodes
    data.entities.forEach((entity) => {
      nodes.push({
        id: entity.id,
        name: entity.name,
        type: 'entity',
        data: entity
      });
    });

    // Add facts as nodes
    data.facts.forEach((fact, index) => {
      const factId = `fact-${index}`;
      nodes.push({
        id: factId,
        name: fact.fact.substring(0, 30) + (fact.fact.length > 30 ? '...' : ''),
        type: 'fact',
        data: fact
      });

      // Create meaningful links between facts and entities
      // Connect facts to entities that are mentioned in the fact content
      data.entities.forEach((entity) => {
        const factContent = fact.fact.toLowerCase();
        const entityName = entity.name.toLowerCase();
        
        if (factContent.includes(entityName)) {
          links.push({
            source: entity.id,
            target: factId,
            type: 'fact-entity'
          });
        }
      });
    });

    // Add users as nodes
    if (data.users) {
      data.users.forEach((user) => {
        const userName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.email || user.id;
        
        nodes.push({
          id: user.id,
          name: userName,
          type: 'user',
          data: user
        });

        // Create links between users and entities they might be related to
        // Connect users to entities that contain their name or email
        data.entities.forEach((entity) => {
          const entityName = entity.name.toLowerCase();
          const userNameLower = userName.toLowerCase();
          const userEmail = user.email?.toLowerCase() || '';
          
          if (entityName.includes(userNameLower) || 
              entityName.includes(userEmail) ||
              entityName.includes(user.id.toLowerCase())) {
            links.push({
              source: user.id,
              target: entity.id,
              type: 'user-entity'
            });
          }
        });

        // Create links between users and facts that mention them
        data.facts.forEach((fact, index) => {
          const factContent = fact.fact.toLowerCase();
          const userNameLower = userName.toLowerCase();
          const userEmail = user.email?.toLowerCase() || '';
          
          if (factContent.includes(userNameLower) || 
              factContent.includes(userEmail) ||
              factContent.includes(user.id.toLowerCase())) {
            const factId = `fact-${index}`;
            links.push({
              source: user.id,
              target: factId,
              type: 'user-fact'
            });
          }
        });
      });
    }

    // Create some entity-to-entity links based on type similarity
    const entityTypes = new Map<string, string[]>();
    data.entities.forEach((entity) => {
      if (!entityTypes.has(entity.type)) {
        entityTypes.set(entity.type, []);
      }
      entityTypes.get(entity.type)!.push(entity.id);
    });

    entityTypes.forEach((entityIds, type) => {
      if (entityIds.length > 1) {
        // Connect entities of the same type
        for (let i = 0; i < entityIds.length - 1; i++) {
          links.push({
            source: entityIds[i],
            target: entityIds[i + 1],
            type: 'same-type'
          });
        }
      }
    });

    return { nodes, links };
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || loading) return;

    const { nodes, links } = processGraphData();
    if (nodes.length === 0) return;

    // Clear previous visualization
    select(svgRef.current).selectAll('*').remove();

    const svg = select(svgRef.current);
    const g = svg.append('g');

    // Set up zoom behavior
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Store zoomBehavior reference for reset button
    (window as any).zoomBehavior = zoomBehavior;

    // Set up force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(20));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.4);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add circles for nodes
    node.append('circle')
      .attr('r', (d) => {
        if (d.type === 'entity') return 8;
        if (d.type === 'user') return 6;
        return 5; // fact
      })
      .attr('fill', (d) => {
        if (selectedNode && d.data === selectedNode) {
          return '#000000'; // Selected node
        }
        if (d.type === 'entity') return '#10B981'; // Green for entities
        if (d.type === 'user') return '#3B82F6'; // Blue for users
        return '#F59E0B'; // Yellow for facts
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer');

    // Add labels for nodes
    node.append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => {
        if (d.type === 'entity') return 18;
        if (d.type === 'user') return 16;
        return 14; // fact
      })
      .attr('fill', '#E5E7EB')
      .attr('font-size', '10px')
      .attr('font-weight', '400')
      .style('pointer-events', 'none');

    // Add click handlers
    node.on('click', (event, d) => {
      event.stopPropagation(); // Prevent background click
      if (onNodeClick) {
        onNodeClick(d.data);
      }
    });

    // Add background click handler to deselect
    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        if (onNodeClick) {
          onNodeClick(null as any);
        }
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x!)
        .attr('y1', (d) => (d.source as GraphNode).y!)
        .attr('x2', (d) => (d.target as GraphNode).x!)
        .attr('y2', (d) => (d.target as GraphNode).y!);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [data, selectedNode, loading, dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-zinc-400 text-sm">Loading graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: '#000000' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-zinc-900/90 backdrop-blur-sm rounded-md p-2 text-white text-xs border border-zinc-700">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Entities</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>Users</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <span>Facts</span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => {
            if (svgRef.current && (window as any).zoomBehavior) {
              const svg = select(svgRef.current);
              svg.transition().duration(750).call(
                (window as any).zoomBehavior.transform as any,
                zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(1)
              );
            }
          }}
          className="bg-zinc-900/90 backdrop-blur-sm hover:bg-zinc-800/90 text-zinc-300 hover:text-white px-2 py-1 rounded text-xs transition-colors border border-zinc-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default KnowledgeGraphVisualizer;
