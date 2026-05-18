import React from 'react';
import { GraphNode } from './App';

interface NodePanelProps {
  node: GraphNode;
  onImpact: () => void;
}

const NodePanel: React.FC<NodePanelProps> = ({ node, onImpact }) => {
  return (
    <div>
      <h4 style={{ fontSize: 14, marginBottom: 8 }}>节点详情</h4>
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <DetailRow label="名称" value={node.label} />
        <DetailRow label="类型" value={node.kind} />
        <DetailRow label="文件" value={node.file_path} />
        {node.language && <DetailRow label="语言" value={node.language} />}
        {node.pagerank !== undefined && (
          <DetailRow label="PageRank" value={node.pagerank.toFixed(4)} />
        )}
      </div>

      <h4 style={{ fontSize: 14, marginBottom: 8 }}>操作</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={onImpact} style={{
          padding: '8px 16px', background: '#e63946', color: '#fff',
          border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, textAlign: 'center',
        }}>
          🔍 影响分析 (Blast Radius)
        </button>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, wordBreak: 'break-all' }}>{value}</div>
  </div>
);

export default NodePanel;
