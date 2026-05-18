import React from 'react';

interface ImpactReportProps {
  data: any;
}

const ImpactReport: React.FC<ImpactReportProps> = ({ data }) => {
  if (!data || data.error) {
    return <div style={{ color: '#e63946' }}>{data?.error || '无数据'}</div>;
  }

  const { affected_nodes, affected_edges, total_affected, max_depth, direction } = data;

  return (
    <div>
      <h4 style={{ fontSize: 14, marginBottom: 8 }}>影响分析报告</h4>

      <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#e63946' }}>
          {total_affected}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>受影响节点</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <h5 style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>分析参数</h5>
        <div style={{ fontSize: 12 }}>
          <div>起始节点: <code>{data.start_node}</code></div>
          <div>最大深度: {max_depth}</div>
          <div>方向: {direction === 'both' ? '双向' : direction === 'forward' ? '下游' : '上游'}</div>
          <div>边数: {affected_edges?.length || 0}</div>
        </div>
      </div>

      {data.critical_paths && data.critical_paths.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <h5 style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>关键传播路径</h5>
          {data.critical_paths.map((path: string[], i: number) => (
            <div key={i} style={{ fontSize: 11, marginBottom: 6, fontFamily: 'monospace' }}>
              {path.join(' → ')}
            </div>
          ))}
        </div>
      )}

      <h5 style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>受影响节点列表</h5>
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {(affected_nodes || []).slice(0, 50).map((n: any) => (
          <div key={n.id} style={{
            padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: 12,
          }}>
            <div style={{ fontWeight: 600 }}>{n.label}</div>
            <div style={{ color: '#666' }}>
              {n.kind} · 深度 {n.depth} · PR {n.pagerank?.toFixed(3)}
            </div>
            <div style={{ color: '#999', fontSize: 11 }}>{n.file_path}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImpactReport;
