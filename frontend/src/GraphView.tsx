import React, { useEffect, useRef } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { GraphNode, GraphEdge } from './App';

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect: (node: GraphNode) => void;
  highlightNodeId?: string | null;
}

const KIND_COLORS: Record<string, string> = {
  function: '#4361ee',
  class: '#f72585',
  method: '#7209b7',
  module: '#3a0ca3',
  variable: '#4cc9f0',
  interface: '#4895ef',
  import: '#bfd7ff',
  document: '#06d6a0',
  section: '#118ab2',
  directory: '#adb5bd',
  default: '#6c757d',
};

const GraphView: React.FC<GraphViewProps> = ({ nodes, edges, onNodeSelect, highlightNodeId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map(n => ({
          data: {
            id: n.id,
            label: n.label,
            kind: n.kind,
            file_path: n.file_path,
          },
          classes: n.kind || 'default',
        })),
        ...edges.map(e => ({
          data: {
            id: `${e.source}-${e.target}-${e.relation}`,
            source: e.source,
            target: e.target,
            label: e.relation,
          },
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (el: any) => KIND_COLORS[el.data('kind')] || KIND_COLORS.default,
            label: 'data(label)',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'ellipsis',
            'text-max-width': '120px',
            width: (el: any) => {
              const label = el.data('label') || '';
              return Math.max(30, Math.min(80, label.length * 6));
            },
            height: 30,
            'border-width': 0,
            color: '#333',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#f72585',
            'border-width': 3,
          },
        },
        {
          selector: '.highlighted',
          style: {
            'border-color': '#f72585',
            'border-width': 3,
            'background-opacity': 1,
          },
        },
        {
          selector: '.neighbor',
          style: {
            'background-opacity': 0.7,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        gravity: 0.25,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      minZoom: 0.1,
      maxZoom: 5,
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data();
      onNodeSelect({
        id: nodeData.id,
        label: nodeData.label,
        kind: nodeData.kind,
        file_path: nodeData.file_path || '',
      });
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges, onNodeSelect]);

  // Highlight selected node
  useEffect(() => {
    if (!cyRef.current || !highlightNodeId) return;
    const cy = cyRef.current;

    cy.elements().removeClass('highlighted neighbor');
    const target = cy.getElementById(highlightNodeId);
    if (target.length) {
      target.addClass('highlighted');
      target.neighborhood().addClass('neighbor');
      cy.animate({
        center: { eles: target },
        zoom: 1.2,
        duration: 300,
      });
    }
  }, [highlightNodeId]);

  // Fit on initial load
  useEffect(() => {
    if (cyRef.current && nodes.length > 0) {
      setTimeout(() => {
        cyRef.current?.fit(undefined, 50);
      }, 600);
    }
  }, [nodes.length]);

  return (
    <div
      ref={containerRef}
      className="cytoscape-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default GraphView;
