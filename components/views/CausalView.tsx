
import React, { useState } from 'react';
import CausalGraphPanel from '../CausalGraphPanel';
import { AnalysisState, CausalGraphStats } from '../../types';
import { Network, Sliders, Eye, GitBranch, FileText, Brain, Activity, Hexagon, Search, AlertTriangle, Layers } from 'lucide-react';

interface CausalViewProps {
  analysisState: AnalysisState;
}

const CausalView: React.FC<CausalViewProps> = ({ analysisState }) => {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.2);
  const [sensitivityMode, setSensitivityMode] = useState(false);

  // Computed Stats (Mocked based on data presence for demo)
  const nodeCount = analysisState.graph.nodes.length;
  const edgeCount = analysisState.graph.edges.length;
  const latentCount = analysisState.graph.nodes.filter(n => n.type === 'latent').length;
  
  const graphStats: CausalGraphStats = {
      dagValidity: nodeCount > 0 ? 1.0 : 0,
      edgeStability: edgeCount > 0 ? 0.82 : 0,
      observabilityCoverage: nodeCount > 0 ? (nodeCount - latentCount) / nodeCount : 0,
      latentRatio: nodeCount > 0 ? latentCount / nodeCount : 0
  };

  const latentNodes = analysisState.graph.nodes.filter(n => n.type === 'latent');

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden text-slate-200">
        
        {/* HEADER */}
        <div className="shrink-0 h-12 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md">
            <div>
                <h2 className="text-sm font-bold text-slate-200 tracking-widest flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-500" />
                    STRUCTURAL CAUSAL MODEL (SCM)
                </h2>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    VIDEO-GROUNDED CAUSAL INFERENCE • TAB 6
                </div>
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded border border-slate-700">
                     <span className="text-[9px] text-slate-500 uppercase font-bold">Nodes</span>
                     <span className="text-xs font-mono">{nodeCount}</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded border border-slate-700">
                     <span className="text-[9px] text-slate-500 uppercase font-bold">Edges</span>
                     <span className="text-xs font-mono">{edgeCount}</span>
                 </div>
            </div>
        </div>

        <div className="flex-grow flex min-h-0">
            
            {/* LEFT: GRAPH CANVAS (Panel 1) & OVERLAYS (Panel 2, 4, 6) */}
            <div className="w-[65%] border-r border-slate-800 relative bg-black flex flex-col">
                <div className="flex-grow relative">
                    <CausalGraphPanel 
                        nodes={analysisState.graph.nodes} 
                        edges={analysisState.graph.edges} 
                        confidenceThreshold={confidenceThreshold}
                        sensitivityMode={sensitivityMode}
                    />

                    {/* PANEL 2: EDGE CONFIDENCE SLIDERS */}
                    <div className="absolute top-4 right-4 w-48 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-xl z-20">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                            <Sliders className="w-3 h-3 text-cyan-400" />
                            <span className="text-[10px] font-bold text-slate-300">EDGE CONFIDENCE</span>
                        </div>
                        <div>
                            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                                <span>Filter Weak Links</span>
                                <span className="font-mono text-cyan-400">{(confidenceThreshold * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                        </div>
                    </div>

                    {/* PANEL 6: GRAPH DIFF / SENSITIVITY TOGGLE */}
                    <div className="absolute top-4 left-4 z-20">
                        <button 
                            onClick={() => setSensitivityMode(!sensitivityMode)}
                            className={`flex items-center gap-2 px-3 py-2 rounded border shadow-lg transition-all ${
                                sensitivityMode 
                                ? 'bg-red-900/80 border-red-500 text-red-100' 
                                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Layers className="w-3 h-3" />
                            <span className="text-[10px] font-bold">
                                {sensitivityMode ? 'SENSITIVITY MODE: ON' : 'TEST STRUCTURAL SENSITIVITY'}
                            </span>
                        </button>
                    </div>

                    {/* PANEL 4: GRAPH HEALTH METRICS */}
                    <div className="absolute bottom-4 right-4 z-20">
                        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-2 flex gap-4 shadow-xl">
                            <div className="text-center group relative cursor-help">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">DAG Validity</div>
                                <div className="flex items-center justify-center gap-1 text-emerald-500 font-bold text-xs">
                                    <GitBranch className="w-3 h-3" /> {(graphStats.dagValidity * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="w-px bg-slate-700"></div>
                            <div className="text-center">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Stability</div>
                                <div className="flex items-center justify-center gap-1 text-cyan-500 font-bold text-xs">
                                    <Activity className="w-3 h-3" /> {(graphStats.edgeStability * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="w-px bg-slate-700"></div>
                            <div className="text-center">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Evidence</div>
                                <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-xs">
                                    <Eye className="w-3 h-3" /> {(graphStats.observabilityCoverage * 100).toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: EXPLORER & REPORT (Panel 5 & Summary) */}
            <div className="w-[35%] bg-slate-950 flex flex-col min-h-0 border-l border-slate-800">
                
                {/* PANEL 5: LATENT VARIABLE EXPLORER */}
                <div className="h-1/2 flex flex-col border-b border-slate-800">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            <Hexagon className="w-3 h-3 text-amber-500" />
                            LATENT VARIABLE EXPLORER
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Inferred causes not directly visible in footage.
                        </p>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-3">
                        {latentNodes.length === 0 ? (
                            <div className="text-xs text-slate-500 italic p-3 bg-slate-900 rounded border border-slate-800 flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                Graph fully observable. No latent variables inferred.
                            </div>
                        ) : (
                            latentNodes.map(node => (
                                <div key={node.id} className="bg-amber-900/10 border border-amber-900/30 rounded p-3 group hover:border-amber-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-3 h-3 text-amber-400" />
                                            <span className="text-xs font-bold text-amber-100">{node.label}</span>
                                        </div>
                                        <span className="px-1.5 py-0.5 rounded bg-amber-900/30 text-[9px] font-mono text-amber-500 uppercase border border-amber-900/50">Inferred</span>
                                    </div>
                                    <div className="text-[10px] text-amber-200/70 leading-relaxed mb-2">
                                        {node.description}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-900/20">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        <span className="text-[9px] text-amber-500 font-bold">Evidence: {node.observability < 0.3 ? 'Weak Inference' : 'Strong Context'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SUMMARY PANEL: EXECUTIVE REPORT */}
                <div className="h-1/2 flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                         <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            <FileText className="w-3 h-3 text-cyan-500" />
                            CAUSAL EXECUTIVE REPORT
                        </h3>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-inner">
                            <div className="text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                                {analysisState.causalReport || "Generative causal analysis pending..."}
                            </div>
                        </div>
                        <div className="mt-3 text-[9px] text-slate-500 text-center flex items-center justify-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                             Strictly grounded in graph topology
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </div>
  );
};

export default CausalView;
