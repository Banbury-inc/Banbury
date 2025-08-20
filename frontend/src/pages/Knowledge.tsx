import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  RefreshCw,
  BookOpen,
  Network,
  Upload,
  Eye
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { NavSidebar } from '../components/nav-sidebar'
import { ApiService } from '../services/apiService'
import KnowledgeGraphVisualizer from '../components/KnowledgeGraphVisualizer'

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

const Knowledge = (): JSX.Element => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphData | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeEntity | KnowledgeFact | KnowledgeUser | null>(null)
  const [searchResults, setSearchResults] = useState<KnowledgeGraphData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKnowledgeGraph()
  }, [])

  const loadKnowledgeGraph = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await ApiService.getKnowledgeGraph()
      
      if (data.success && data.data) {
        setKnowledgeGraph(data.data)
      } else {
        throw new Error(data.error || 'Failed to load knowledge graph')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }



  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar onLogout={handleLogout} />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black">
      <NavSidebar onLogout={handleLogout} />
      <div className="flex-1 ml-16 flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Knowledge Graph Visualization */}
          <div className="flex-1">
            <div className="bg-zinc-900 h-full overflow-hidden">
              {error && (
                <div className="absolute top-4 left-4 right-4 z-10 p-3 bg-red-900/20 border border-red-800 text-red-300 rounded-lg">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-zinc-400 text-sm">Loading knowledge graph...</p>
                  </div>
                </div>
              ) : searchResults ? (
                // Search Results View
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="text-sm font-medium text-white">
                      Search Results
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-zinc-600 hover:bg-zinc-800 text-xs h-7 px-2"
                      onClick={() => {
                        setSearchResults(null)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View All
                    </Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <KnowledgeGraphVisualizer
                      data={searchResults}
                      onNodeClick={setSelectedNode}
                      selectedNode={selectedNode}
                      loading={false}
                    />
                  </div>
                </div>
              ) : knowledgeGraph ? (
                // Full Knowledge Graph View
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="text-sm font-medium text-white">Knowledge Graph</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-zinc-600 hover:bg-zinc-800 text-xs h-7 px-2"
                        onClick={loadKnowledgeGraph}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-zinc-600 hover:bg-zinc-800 text-xs h-7 px-2"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Import
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative">
                    <KnowledgeGraphVisualizer
                      data={knowledgeGraph}
                      onNodeClick={setSelectedNode}
                      selectedNode={selectedNode}
                      loading={loading}
                    />
                  </div>
                </div>
              ) : (
                // Empty State
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Network className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-white mb-2">Knowledge Graph</h3>
                    <p className="text-zinc-400 text-sm mb-3">
                      No knowledge graph data available. Start by adding some entities or facts.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-zinc-600 hover:bg-zinc-800 text-xs h-7 px-2"
                        onClick={loadKnowledgeGraph}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Node Details */}
          <div className="w-80 border-l border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Node Details</h3>
            {selectedNode ? (
              <div className="space-y-4">
                {'name' in selectedNode ? (
                  // Entity node
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                      <p className="text-white">{selectedNode.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
                      <p className="text-white">{selectedNode.type}</p>
                    </div>
                    {selectedNode.score !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Score</label>
                        <p className="text-white">{(selectedNode.score * 100).toFixed(2)}%</p>
                      </div>
                    )}
                    {selectedNode.labels && selectedNode.labels.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Labels</label>
                        <div className="flex flex-wrap gap-1">
                          {selectedNode.labels.map((label, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Summary</label>
                      <p className="text-white text-sm">{selectedNode.summary}</p>
                    </div>
                    {selectedNode.created_at && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Created</label>
                        <p className="text-white text-sm">{new Date(selectedNode.created_at).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedNode.source && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Source</label>
                        <p className="text-white text-sm">{selectedNode.source}</p>
                      </div>
                    )}
                    {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Attributes</label>
                        <div className="text-white text-sm">
                          {Object.entries(selectedNode.attributes).map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <span className="text-zinc-400">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : 'fact' in selectedNode ? (
                  // Fact node
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Fact</label>
                      <p className="text-white">{selectedNode.fact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Confidence</label>
                      <p className="text-white">{(selectedNode.confidence * 100).toFixed(1)}%</p>
                    </div>
                    {selectedNode.score !== undefined && selectedNode.score !== selectedNode.confidence && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Score</label>
                        <p className="text-white">{(selectedNode.score * 100).toFixed(2)}%</p>
                      </div>
                    )}
                    {selectedNode.labels && selectedNode.labels.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Labels</label>
                        <div className="flex flex-wrap gap-1">
                          {selectedNode.labels.map((label, index) => (
                            <span key={index} className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedNode.domain && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Domain</label>
                        <p className="text-white text-sm">{selectedNode.domain}</p>
                      </div>
                    )}
                    {selectedNode.expertise_level && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Expertise Level</label>
                        <p className="text-white text-sm capitalize">{selectedNode.expertise_level}</p>
                      </div>
                    )}
                    {selectedNode.created_at && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Created</label>
                        <p className="text-white text-sm">{new Date(selectedNode.created_at).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Source</label>
                      <p className="text-white text-sm">{selectedNode.source}</p>
                    </div>
                    {selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Attributes</label>
                        <div className="text-white text-sm">
                          {Object.entries(selectedNode.attributes).map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <span className="text-zinc-400">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // User node
                  <>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                      <p className="text-white">
                        {selectedNode.first_name && selectedNode.last_name 
                          ? `${selectedNode.first_name} ${selectedNode.last_name}`
                          : selectedNode.email || selectedNode.id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                      <p className="text-white">{selectedNode.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">User ID</label>
                      <p className="text-white">{selectedNode.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Session Count</label>
                      <p className="text-white">{selectedNode.session_count}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Created</label>
                      <p className="text-white">{new Date(selectedNode.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Updated</label>
                      <p className="text-white">{new Date(selectedNode.updated_at).toLocaleDateString()}</p>
                    </div>
                    {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Metadata</label>
                        <div className="text-white text-sm">
                          {Object.entries(selectedNode.metadata).map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <span className="text-zinc-400">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-zinc-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                <p>Select a node to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Knowledge
