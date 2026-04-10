import React, { useEffect, useRef, useState } from 'react';

interface CapitalFlowVisualizerProps {
  simplified?: boolean;
}

interface FlowNode {
  id: string;
  name: string;
  value: number;
  layer: string;
  x?: number;
  y?: number;
}

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

const CapitalFlowVisualizer: React.FC<CapitalFlowVisualizerProps> = ({ simplified = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<FlowNode | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const nodes: FlowNode[] = [
    { id: 'investors', name: 'Investors', value: 50000, layer: 'investor' },
    { id: 'bonds', name: 'Regenerative Bonds', value: 20000, layer: 'mabc' },
    { id: 'yield_tokens', name: 'Yield Tokens', value: 7500, layer: 'mabc' },
    { id: 'carbon_tokens', name: 'Carbon Tokens', value: 15000, layer: 'mabc' },
    { id: 'ecosystem', name: 'Ecosystem Credits', value: 7500, layer: 'mabc' },
    { id: 'safelychain', name: 'SafelyChain', value: 49250, layer: 'safelychain' },
    { id: 'agrix', name: 'AGRIX', value: 45310, layer: 'agrix' },
    { id: 'farms', name: 'Coffee Farms', value: 41770, layer: 'farm' },
    { id: 'consumers', name: 'Consumers/Corporates', value: 74350, layer: 'consumer' },
  ];

  const links: FlowLink[] = [
    { source: 'investors', target: 'bonds', value: 20000 },
    { source: 'investors', target: 'yield_tokens', value: 7500 },
    { source: 'investors', target: 'carbon_tokens', value: 15000 },
    { source: 'investors', target: 'ecosystem', value: 7500 },
    { source: 'bonds', target: 'safelychain', value: 19700 },
    { source: 'yield_tokens', target: 'safelychain', value: 7387 },
    { source: 'carbon_tokens', target: 'safelychain', value: 14775 },
    { source: 'ecosystem', target: 'safelychain', value: 7387 },
    { source: 'safelychain', target: 'agrix', value: 45310 },
    { source: 'agrix', target: 'farms', value: 41770 },
    { source: 'farms', target: 'consumers', value: 74350 },
  ];

  const layerColors: Record<string, string> = {
    investor: '#1565c0',
    mabc: '#2e7d32',
    safelychain: '#ff6f00',
    agrix: '#6a1b9a',
    farm: '#c62828',
    consumer: '#00838f',
  };

  const formatValue = (value: number): string => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value}M`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = simplified ? 300 : 500;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Calculate node positions
    const nodePositions: Record<string, { x: number; y: number }> = {};
    
    if (simplified) {
      nodePositions.investors = { x: width * 0.1, y: height * 0.3 };
      nodePositions.bonds = { x: width * 0.3, y: height * 0.15 };
      nodePositions.carbon_tokens = { x: width * 0.3, y: height * 0.45 };
      nodePositions.safelychain = { x: width * 0.5, y: height * 0.3 };
      nodePositions.agrix = { x: width * 0.7, y: height * 0.3 };
      nodePositions.farms = { x: width * 0.9, y: height * 0.3 };
    } else {
      nodePositions.investors = { x: width * 0.1, y: height * 0.5 };
      nodePositions.bonds = { x: width * 0.25, y: height * 0.2 };
      nodePositions.yield_tokens = { x: width * 0.25, y: height * 0.4 };
      nodePositions.carbon_tokens = { x: width * 0.25, y: height * 0.6 };
      nodePositions.ecosystem = { x: width * 0.25, y: height * 0.8 };
      nodePositions.safelychain = { x: width * 0.45, y: height * 0.5 };
      nodePositions.agrix = { x: width * 0.65, y: height * 0.5 };
      nodePositions.farms = { x: width * 0.8, y: height * 0.5 };
      nodePositions.consumers = { x: width * 0.95, y: height * 0.5 };
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw links
    links.forEach(link => {
      const sourcePos = nodePositions[link.source];
      const targetPos = nodePositions[link.target];
      
      if (!sourcePos || !targetPos) return;
      
      const isHighlighted = !selectedLayer || 
        nodes.find(n => n.id === link.source)?.layer === selectedLayer ||
        nodes.find(n => n.id === link.target)?.layer === selectedLayer;
      
      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      
      // Curved line
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2 - 20;
      ctx.quadraticCurveTo(midX, midY, targetPos.x, targetPos.y);
      
      ctx.strokeStyle = isHighlighted ? '#2e7d32' : '#e0e0e0';
      ctx.lineWidth = Math.max(2, link.value / 5000);
      ctx.stroke();

      // Draw value label
      ctx.fillStyle = '#666';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(formatValue(link.value), midX, midY - 5);
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions[node.id];
      if (!pos) return;
      
      const isHighlighted = !selectedLayer || node.layer === selectedLayer;
      const color = layerColors[node.layer];
      
      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, Math.max(30, node.value / 2000), 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted ? color : '#ccc';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Node label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, pos.x, pos.y - 8);
      
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(formatValue(node.value), pos.x, pos.y + 8);
    });

  }, [simplified, selectedLayer]);

  if (simplified) {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} />
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Capital Flow Visualization</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Object.entries(layerColors).map(([layer, color]) => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(selectedLayer === layer ? null : layer)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '16px',
                border: 'none',
                background: selectedLayer === layer ? color : '#f0f0f0',
                color: selectedLayer === layer ? '#fff' : '#666',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>
      
      <canvas ref={canvasRef} />
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Capital Multiplier Effect</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e7d32' }}>17.8x</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>MBT55 Bio-Layer</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6a1b9a' }}>1.4x</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>AGRIX Intelligence</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff6f00' }}>1.8x</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>SafelyChain</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1565c0' }}>2.1x</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>MABC Finance</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#c62828' }}>94.1x</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Total Multiplier</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapitalFlowVisualizer;
