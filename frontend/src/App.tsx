import React, { useState, useCallback } from 'react';
import GraphView from './GraphView';
import SearchBar from './SearchBar';
import NodePanel from './NodePanel';
import ImpactReport from './ImpactReport';

const API_BASE = '/graph/api';

export interface GraphNode {
  id: string;
  label: string;
  kind: string;
  file_path: string;
  language?: string;
  pagerank?: number;
  community_id?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  weight?: number;
}

export interface SearchResult {
  query: string;
  seeds: string[];
  nodes: {
    node_id: string;
    label: string;
    kind: string;
    file_path: string;
    score: number;
    source: string;
    start_line?: number;
    end_line?: number;
    signature?: string;
  }[];
  edges: { source: string; target: string; relation: string }[];
}

export type ViewMode = 'graph' | 'impact' | 'search';

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [impactData, setImpactData] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial stats
  React.useEffect(() => {
    apiFetch('/stats').then(data => {
      if (data) setStats(data);
    });
  }, [apiFetch]);

  // Load full graph on mount
  React.useEffect(() => {
    apiFetch('/export?format=d3').then(data => {
      if (data && data.nodes) {
        setGraphData(data);
      }
    });
  }, [apiFetch]);

  const handleSearch = async (query: string) => {
    const result = await apiFetch('/search', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: 15 }),
    });
    if (result) {
      setSearchResults(result);
      setViewMode('search');
      // Convert search results to graph data
      const nodes = result.nodes.map((n: any) => ({
        id: n.node_id,
        label: n.label,
        kind: n.kind,
        file_path: n.file_path,
      }));
      // Fix edge references to use node IDs as they appear in search results
      setGraphData(prev => prev || { nodes, edges: result.edges || [] });
    }
  };

  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleImpactAnalysis = async (nodeId: string) => {
    const result = await apiFetch('/impact', {
      method: 'POST',
      body: JSON.stringify({ node_id: nodeId, max_depth: 3, direction: 'both' }),
    });
    if (result) {
      setImpactData(result);
      setViewMode('impact');
    }
  };

  const handleExportPNG = () => {
    const cytoscapeContainer = document.querySelector('.cytoscape-container');
    if (cytoscapeContainer) {
      const canvas = cytoscapeContainer.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'reqflow-graph.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#1a1a2e', color: '#fff', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>ReqFlow</h1>
          <span style={{ color: '#888', fontSize: 13 }}>依赖图可视化</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 320, background: '#f5f5f5', borderRight: '1px solid #ddd',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Stats */}
          {stats && (
            <div style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
              <h3 style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>图统计</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <StatBox label="节点" value={stats.node_count} color="#4361ee" />
                <StatBox label="边" value={stats.edge_count} color="#f72585" />
                <StatBox label="社区" value={stats.communities} color="#7209b7" />
                <StatBox label="语言" value={Object.keys(stats.languages || {}).length} color="#3a0ca3" />
              </div>
            </div>
          )}

          {/* View mode selector */}
          <div style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
            <button onClick={() => setViewMode('graph')}
              style={btnStyle(viewMode === 'graph')}>全景图</button>
            <button onClick={() => setViewMode('impact')}
              style={btnStyle(viewMode === 'impact')}>影响分析</button>
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {viewMode === 'impact' && impactData && (
              <ImpactReport data={impactData} />
            )}
            {viewMode === 'search' && searchResults && (
              <div>
                <h4 style={{ marginBottom: 8 }}>搜索结果: "{searchResults.query}"</h4>
                {searchResults.nodes.filter(n => n.source === 'seed').map(n => (
                  <div key={n.node_id}
                    onClick={() => handleNodeSelect({
                      id: n.node_id, label: n.label, kind: n.kind, file_path: n.file_path
                    })}
                    style={{ padding: 8, borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600 }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{n.kind} · {n.file_path}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>score: {n.score.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedNode && viewMode === 'graph' && (
              <NodePanel
                node={selectedNode}
                onImpact={() => handleImpactAnalysis(selectedNode.id)}
              />
            )}
          </div>

          {/* Export button */}
          <div style={{ padding: 12, borderTop: '1px solid #ddd' }}>
            <button onClick={handleExportPNG}
              style={{ width: '100%', padding: '8px 16px', background: '#4361ee', color: '#fff',
                border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
              导出 PNG
            </button>
          </div>
        </aside>

        {/* Main graph area */}
        <main style={{ flex: 1, position: 'relative' }}>
          {loading && <div style={{
            position: 'absolute', top: 12, right: 12, background: '#4361ee', color: '#fff',
            padding: '6px 12px', borderRadius: 4, fontSize: 12, zIndex: 100,
          }}>加载中...</div>}
          {error && <div style={{
            position: 'absolute', top: 12, left: 12, background: '#e63946', color: '#fff',
            padding: '6px 12px', borderRadius: 4, fontSize: 12, zIndex: 100,
          }}>{error}</div>}
          {graphData && (
            <GraphView
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeSelect={handleNodeSelect}
              highlightNodeId={selectedNode?.id}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{
    background: '#fff', borderRadius: 8, padding: '12px 16px',
    borderLeft: `3px solid ${color}`,
  }}>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
  </div>
);

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer',
  fontSize: 13, fontWeight: active ? 600 : 400,
  background: active ? '#4361ee' : '#e0e0e0',
  color: active ? '#fff' : '#333',
  marginRight: 8,
});

export default App;
