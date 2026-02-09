
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CausalNode, CausalEdge } from '../types';
import { explainCausalEdge } from '../services/geminiService';
import { Loader2 } from 'lucide-react';

interface CausalGraphPanelProps {
  nodes: CausalNode[];
  edges: CausalEdge[];
  confidenceThreshold?: number; // Filter edges
  sensitivityMode?: boolean; // Highlight unstable edges
}

const CausalGraphPanel: React.FC<CausalGraphPanelProps> = ({ nodes, edges, confidenceThreshold = 0, sensitivityMode = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // 1. Create a Set of valid node IDs to validate edges against
    const nodeIds = new Set(nodes.map(n => n.id));

    // 2. Filter edges:
    //    - Must meet confidence threshold
    //    - Source AND Target must exist in the node list (prevents D3 crashes)
    const validEdges = edges.filter(e => {
        const sourceId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const targetId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        return e.confidence >= confidenceThreshold && nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    // In sensitivity mode, we might include weaker edges but style them differently, 
    // but for now let's respect the slider as a hard filter for "Visible" graph, 
    // and use sensitivityMode to style the visible ones.
    
    // Deep copy to prevent mutation issues with React strict mode / D3
    const simulationNodes = nodes.map(n => ({ ...n })) as (d3.SimulationNodeDatum & CausalNode)[];
    const simulationEdges = validEdges.map(e => ({ ...e })) as (d3.SimulationLinkDatum<d3.SimulationNodeDatum> & CausalEdge)[];

    // Force Simulation
    const simulation = d3.forceSimulation(simulationNodes)
      .force("link", d3.forceLink(simulationEdges).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));

    // Define Arrow Marker
    svg.append("defs").selectAll("marker")
      .data(["end", "unstable"])
      .enter().append("marker")
      .attr("id", (d) => d === "unstable" ? "arrow-unstable" : "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 26) // Offset to not overlap node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", (d) => d === "unstable" ? "#ef4444" : "#64748b");

    // Edges
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(simulationEdges)
      .enter().append("line")
      .attr("stroke-width", (d: any) => Math.max(1.5, d.confidence * 4))
      .attr("stroke", (d: any) => {
          if (sensitivityMode && d.confidence < 0.6) return "#ef4444"; // Red for unstable
          return d.type === 'causal' ? "#0ea5e9" : "#94a3b8";
      })
      .attr("stroke-opacity", (d: any) => {
          if (sensitivityMode && d.confidence < 0.6) return 0.8;
          return Math.max(0.4, d.confidence);
      })
      .attr("stroke-dasharray", (d: any) => {
          if (sensitivityMode && d.confidence < 0.6) return "4,2"; // Dashed for unstable
          return d.type === 'correlative' ? "2,2" : "0";
      })
      .attr("marker-end", (d: any) => (sensitivityMode && d.confidence < 0.6) ? "url(#arrow-unstable)" : "url(#arrow)")
      .attr("cursor", "pointer")
      .on("mouseover", (event, d: any) => {
          setTooltip({
              x: event.pageX,
              y: event.pageY,
              content: (
                <div>
                   <div className="font-bold text-cyan-400 mb-1">Causal Link</div>
                   <div>{d.source.id} → {d.target.id}</div>
                   <div className="text-[10px] text-slate-400 mt-1">Confidence: {(d.confidence * 100).toFixed(0)}%</div>
                   {d.confidence < 0.6 && <div className="text-[10px] text-red-400 font-bold uppercase mt-1">⚠️ Low Stability Edge</div>}
                   <div className="text-[9px] text-slate-500 italic mt-1">Click for AI Explanation</div>
                </div>
              )
          });
      })
      .on("click", async (event, d: any) => {
          setLoadingExplanation(true);
          setTooltip({
              x: event.pageX,
              y: event.pageY,
              content: <div className="flex items-center gap-2 text-cyan-400"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing Causal Logic...</div>
          });
          const explanation = await explainCausalEdge(d as CausalEdge);
          setLoadingExplanation(false);
          setTooltip({
              x: event.pageX,
              y: event.pageY,
              content: (
                <div className="max-w-[200px]">
                   <div className="font-bold text-cyan-400 mb-1">Causal Logic</div>
                   <div className="leading-tight">{explanation}</div>
                </div>
              )
          });
      })
      .on("mouseout", () => {
          if (!loadingExplanation) setTooltip(null);
      });

    // Node Group
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(simulationNodes)
      .enter().append("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("mouseover", (event, d: any) => {
           setTooltip({
               x: event.pageX,
               y: event.pageY,
               content: (
                   <div className="max-w-[200px]">
                       <div className="font-bold text-slate-200 mb-1">{d.label}</div>
                       <div className="flex gap-2 mb-2">
                           <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${
                               d.type === 'observable' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' :
                               d.type === 'derived' ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' :
                               'bg-amber-900/30 border-amber-500 text-amber-400'
                           }`}>{d.type}</span>
                           <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] uppercase text-slate-400">{d.category}</span>
                       </div>
                       
                       <div className="space-y-1 bg-slate-950 p-2 rounded border border-slate-800 mb-2">
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Evidence:</span>
                                <span className="text-emerald-400">{d.type === 'latent' ? 'Inferred' : 'Direct'}</span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400">
                                <span>Observability:</span>
                                <span className="font-mono">{(d.observability * 100).toFixed(0)}%</span>
                            </div>
                       </div>

                       <div className="text-[10px] text-slate-400 leading-tight italic border-l-2 border-slate-700 pl-2">
                           {d.description || "No description."}
                       </div>
                   </div>
               )
           });
      })
      .on("mouseout", () => setTooltip(null));

    // Node Shapes
    const symbolGenerator = d3.symbol().size(400);
    
    // HEXAGON PATH GENERATOR (Not standard in D3)
    const hexagonPath = "M 0 -12 L 10.4 -6 L 10.4 6 L 0 12 L -10.4 6 L -10.4 -6 Z";

    node.append("path")
      .attr("d", (d: any) => {
          if (d.type === 'derived') return symbolGenerator.type(d3.symbolSquare)();
          if (d.type === 'latent') return hexagonPath;
          return symbolGenerator.type(d3.symbolCircle)();
      })
      .attr("fill", (d: any) => {
          if (d.category === 'behavioural') return "#8b5cf6"; // Purple
          if (d.category === 'environmental') return "#64748b"; // Slate
          return "#0ea5e9"; // Blue (Physical)
      })
      .attr("stroke", (d: any) => {
          if (sensitivityMode && d.observability < 0.5) return "#ef4444";
          return d.type === 'latent' ? "#f59e0b" : "#fff";
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d: any) => d.type === 'latent' ? "2,1" : "0");

    // Observability Ring (if observable)
    node.filter((d: any) => d.type === 'observable')
      .append("circle")
      .attr("r", 16)
      .attr("fill", "none")
      .attr("stroke", (d: any) => d.observability > 0.8 ? "#10b981" : "#ef4444")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8)
      .attr("stroke-dasharray", "3,2");

    // Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 0)
      .attr("y", 28)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => { simulation.stop(); };
  }, [nodes, edges, confidenceThreshold, sensitivityMode]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 rounded-lg relative overflow-hidden cursor-crosshair">
      <div className="absolute top-3 left-3 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
        {sensitivityMode ? <span className="text-red-500 animate-pulse">SENSITIVITY MODE ACTIVE</span> : "Structural Causal Model (DAG)"}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur border border-slate-800 p-2 rounded text-[9px] text-slate-400 space-y-1 pointer-events-none">
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500"></div> Physical</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Behavioural</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500"></div> Environmental</div>
           <div className="h-px bg-slate-700 my-1"></div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 border border-white rounded-full"></div> Observable (Circle)</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 border border-white"></div> Derived (Square)</div>
           <div className="flex items-center gap-2"><div className="w-2 h-2 border border-amber-500 rotate-45"></div> Latent (Hexagon)</div>
      </div>

      <svg ref={svgRef} className="w-full h-full"></svg>
      
      {tooltip && (
        <div 
            className="fixed z-50 bg-slate-900 border border-slate-600 p-3 rounded text-xs text-white shadow-2xl pointer-events-none max-w-xs"
            style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
            {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default CausalGraphPanel;
